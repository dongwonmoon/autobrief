# Auto-Brief: AI 기반 문서 자동 분석 및 요약 시스템

Auto-Brief는 복잡한 PDF 문서를 AI를 활용하여 자동으로 분석하고, 핵심 내용을 시각적으로 정리해주는 웹 애플리케이션입니다. 사용자는 문서를 업로드하는 것만으로 제목, 요약, 마인드맵, 핵심 개념, 예상 질문 등을 빠르게 확인할 수 있으며, 문서 내용에 대해 자유롭게 질문하고 답변을 얻을 수 있습니다.

## ✨ 주요 기능

- **PDF 문서 업로드**: 여러 개의 PDF 파일을 동시에 업로드할 수 있습니다.
- **자동 문서 분석**: AI가 문서의 핵심 내용을 분석하여 다음과 같은 정보를 추출합니다.
  - **핵심 제목**: 문서의 주제를 가장 잘 나타내는 제목
  - **3-5줄 요약**: 문서 전체 내용을 압축한 요약
  - **계층적 마인드맵**: 문서의 구조를 한눈에 파악할 수 있는 마인드맵
  - **핵심 개념**: 문서를 이해하는 데 필요한 5가지 주요 키워드
  - **예상 질문**: 사용자가 궁금해할 만한 3가지 질문
- **문서 기반 질의응답 (RAG)**: 업로드된 문서 내용을 기반으로 사용자의 질문에 답변합니다.
- **직관적인 웹 인터페이스**: 분석된 결과를 손쉽게 확인하고 상호작용할 수 있는 UI를 제공합니다.

## 🛠️ 기술 스택

### Backend

- **Python 3.11+**
- **FastAPI**: 고성능 API 서버 구축
- **LangChain**: LLM 애플리케이션 개발 프레임워크
- **Google Gemini 1.5 Flash**: 문서 분석 및 질의응답을 위한 LLM
- **Ollama (nomic-embed-text)**: 텍스트 임베딩 모델
- **FAISS**: 효율적인 유사도 검색을 위한 벡터 저장소
- **Pydantic**: API 데이터 유효성 검사

### Frontend

- **HTML**
- **CSS**
- **JavaScript**

## 📂 프로젝트 구조

```
auto-brief/
├── backend/
│   ├── main.py           # FastAPI 엔드포인트
│   ├── services.py       # 문서 처리 및 RAG 로직 (KnowledgeBase)
│   ├── schemas.py        # Pydantic 데이터 모델
│   ├── requirements.txt  # Python 의존성
│   └── .env              # 환경 변수 파일
├── frontend/
│   ├── index.html        # 메인 페이지
│   ├── script.js         # 프론트엔드 로직
│   └── style.css         # 스타일시트
└── README.md             # 프로젝트 소개
```

## 🚀 설치 및 실행 방법

### 1. 사전 준비

- **Python 3.11** 이상 설치
- **Ollama** 설치 및 `nomic-embed-text` 모델 다운로드
  ```bash
  ollama pull nomic-embed-text
  ```
- **Google Gemini API 키** 발급

### 2. Backend 실행

1.  **저장소 복제 및 `backend` 디렉토리로 이동**
    ```bash
    git clone https://github.com/your-username/auto-brief.git
    cd auto-brief/backend
    ```

2.  **가상 환경 생성 및 활성화**
    ```bash
    python -m venv venv
    source venv/bin/activate  # Windows: venv\Scripts\activate
    ```

3.  **의존성 설치**
    ```bash
    pip install -r requirements.txt
    ```

4.  **.env 파일 생성**
    `backend` 디렉토리에 `.env` 파일을 생성하고 발급받은 Gemini API 키를 추가합니다.
    ```
    GEMINI_API_KEY="YOUR_GEMINI_API_KEY"
    ```

5.  **Ollama 서버 실행**
    별도의 터미널에서 Ollama 서버를 실행합니다.
    ```bash
    ollama serve
    ```

6.  **FastAPI 서버 실행**
    ```bash
    uvicorn main:app --reload
    ```
    서버는 `http://127.0.0.1:8000`에서 실행됩니다.

### 3. Frontend 실행

- 웹 브라우저에서 `frontend/index.html` 파일을 엽니다.

## 📖 API 엔드포인트

- `POST /upload`: PDF 파일을 업로드하고 분석을 시작합니다.
- `GET /documents`: 업로드된 모든 문서의 목록을 반환합니다.
- `GET /documents/{filename}`: 특정 문서의 상세 분석 결과를 반환합니다.
- `POST /query`: 문서 내용 또는 일반적인 주제에 대해 질문하고 답변을 받습니다.
