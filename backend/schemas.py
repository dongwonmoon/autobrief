from pydantic import BaseModel, Field
from typing import List

# --- Pydantic 모델 ---
class MindmapNode(BaseModel):
    topic: str = Field(description="마인드맵 노드의 주제")
    children: List['MindmapNode'] = Field(default_factory=list, description="하위 노드 목록")

class DocumentAnalysis(BaseModel):
    title: str = Field(description="문서의 핵심 제목")
    summary: str = Field(description="문서 전체 내용을 압축한 3~5줄 요약")
    mindmap_nodes: List[MindmapNode] = Field(description="문서의 계층 구조를 나타내는 마인드맵 노드 목록")
    key_concepts: List[str] = Field(description="문서의 핵심 개념 또는 키워드 5가지")
    suggested_questions: List[str] = Field(description="문서 내용 기반으로 사용자가 궁금해할 만한 예상 질문 3가지")

class QueryRequest(BaseModel):
    question: str

class QueryResponse(BaseModel):
    answer: str
