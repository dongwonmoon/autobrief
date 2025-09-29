import os
from typing import Dict, List

from fastapi import HTTPException
from langchain_community.document_loaders import PyPDFLoader
from langchain_community.embeddings import OllamaEmbeddings
from langchain_community.vectorstores import FAISS
from langchain_core.output_parsers import JsonOutputParser, StrOutputParser
from langchain_core.prompts import PromptTemplate
from langchain_core.runnables import RunnableBranch, RunnablePassthrough
from langchain_google_genai import ChatGoogleGenerativeAI
from langchain_text_splitters import RecursiveCharacterTextSplitter

from schemas import DocumentAnalysis


class KnowledgeBase:
    def __init__(self):
        self.llm = ChatGoogleGenerativeAI(
            model="gemini-2.5-flash",
            temperature=0.1,
            api_key=os.getenv("GEMINI_API_KEY"),
        )
        self.embeddings = OllamaEmbeddings(model="nomic-embed-text")
        self.text_splitter = RecursiveCharacterTextSplitter(
            chunk_size=1000, chunk_overlap=200
        )
        self.documents: Dict[str, DocumentAnalysis] = {}
        self.vectorstore: FAISS = None
        self.query_chain = None

    def add_document(self, file_path: str, filename: str):
        if filename in self.documents:
            raise HTTPException(
                status_code=400, detail=f"'{filename}' 파일은 이미 존재합니다."
            )

        loader = PyPDFLoader(file_path)
        pages = loader.load()
        full_text = "\n\n".join(p.page_content for p in pages)

        parser = JsonOutputParser(pydantic_object=DocumentAnalysis)
        prompt = PromptTemplate(
            template="""You are an expert analyst. Analyze the document provided and extract key information into a structured JSON object.
Ensure your response strictly follows the provided JSON schema. The language for the output should be Korean.

{format_instructions}

DOCUMENT_CONTENT:
{document_content}
""",
            input_variables=["document_content"],
            partial_variables={"format_instructions": parser.get_format_instructions()},
        )
        analysis_chain = prompt | self.llm | parser

        print(f"'{filename}' 통합 분석 시작... (API 호출)")
        analysis_result = analysis_chain.invoke({"document_content": full_text})
        self.documents[filename] = DocumentAnalysis.model_validate(analysis_result)

        docs = self.text_splitter.split_documents(pages)
        for doc in docs:
            doc.metadata["source"] = filename

        if self.vectorstore is None:
            self.vectorstore = FAISS.from_documents(docs, self.embeddings)
        else:
            new_vectorstore = FAISS.from_documents(docs, self.embeddings)
            self.vectorstore.merge_from(new_vectorstore)

        self._create_query_chains()
        print(f"'{filename}' 처리 완료.")

    def _create_query_chains(self):
        retriever = self.vectorstore.as_retriever(search_kwargs={"k": 5})
        rag_prompt = PromptTemplate.from_template(
            "Answer the question in Korean based only on the following context, citing the source document:\n\nContext:\n{context}\n\nQuestion: {question}"
        )
        rag_chain = (
            {"context": retriever, "question": RunnablePassthrough()}
            | rag_prompt
            | self.llm
            | StrOutputParser()
        )

        general_prompt = PromptTemplate.from_template(
            "Answer the following question in Korean, as a friendly AI assistant:\n\nQuestion: {question}"
        )
        general_chain = general_prompt | self.llm | StrOutputParser()

        router_prompt = PromptTemplate.from_template(
            '''Given the user's question, determine if it is related to the uploaded documents ('document_query') or if it is a general conversation ('general_conversation').
            Respond with only 'document_query' or 'general_conversation'.

            User Question: {question}''',
        )
        router_chain = router_prompt | self.llm | StrOutputParser()

        branch = RunnableBranch(
            (lambda x: "document_query" in x["topic"], rag_chain),
            general_chain,
        )

        self.query_chain = ({"topic": router_chain, "question": lambda x: x} | branch)

    def get_document_analysis(self, filename: str):
        if filename not in self.documents:
            raise HTTPException(status_code=404, detail="문서를 찾을 수 없습니다.")
        return self.documents[filename]

    def query(self, question: str):
        if not self.query_chain:
            raise HTTPException(status_code=400, detail="업로드된 문서가 없습니다.")
        return self.query_chain.invoke(question)
