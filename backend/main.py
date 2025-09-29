import os
import uvicorn
from fastapi import FastAPI, UploadFile, File
from fastapi.middleware.cors import CORSMiddleware
from typing import List
from dotenv import load_dotenv

from services import KnowledgeBase
from schemas import DocumentAnalysis, QueryRequest, QueryResponse

load_dotenv()

# --- FastAPI 앱 및 CORS 설정 ---
app = FastAPI(title="Auto-brief V3 API")
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

kb = KnowledgeBase()


import tempfile

@app.post("/upload")
async def upload_document(files: List[UploadFile] = File(...)):
    for file in files:
        with tempfile.NamedTemporaryFile(delete=False, suffix=".pdf") as temp_file:
            temp_file.write(await file.read())
            temp_file_path = temp_file.name
        
        try:
            kb.add_document(temp_file_path, file.filename)
        finally:
            if os.path.exists(temp_file_path):
                os.remove(temp_file_path)
                
    return {"message": f"{len(files)}개 파일 처리 완료"}


@app.get("/documents", response_model=List[str])
async def get_document_list():
    return list(kb.documents.keys())


@app.get("/documents/{filename}", response_model=DocumentAnalysis)
async def get_single_document_analysis(filename: str):
    return kb.get_document_analysis(filename)


@app.post("/query", response_model=QueryResponse)
async def handle_query(request: QueryRequest):
    answer = kb.query(request.question)
    return {"answer": answer}


if __name__ == "__main__":
    uvicorn.run(app, host="0.0.0.0", port=8000)
