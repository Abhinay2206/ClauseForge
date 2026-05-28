"""
FastAPI application for AI Clause Detection & Risk Analysis.

Endpoints:
    POST /api/analyze  — Analyze a document's clauses and risk levels
    GET  /health       — Health check with model/connection status
"""

from contextlib import asynccontextmanager
from fastapi import FastAPI, HTTPException, Request
from fastapi.middleware.cors import CORSMiddleware
from sse_starlette.sse import EventSourceResponse

from config import settings
from models_loader import load_models, get_clause_classifier, get_risk_classifier
from chroma_client import init_chroma
from analyzer import analyze_document, compare_documents, explain_clause_with_llm, explain_document_with_llm
from schemas import AnalyzeRequest, AnalyzeResponse, HealthResponse, CompareRequest, CompareResponse, ExplainClauseRequest, ExplainClauseResponse, ExplainDocumentRequest, ExplainDocumentResponse
from chat_agent import chat_agent_instance


# ──────────────────────────────────────────────────────────
# Lifespan: load models + connect ChromaDB at startup
# ──────────────────────────────────────────────────────────

@asynccontextmanager
async def lifespan(app: FastAPI):
    """Startup: load ML models and connect to ChromaDB."""
    print("=" * 60)
    print("  ClauseForge AI Microservice — Starting Up")
    print("=" * 60)

    # Load DistilBert models
    load_models()

    # Connect to ChromaDB
    init_chroma()

    print("=" * 60)
    print("  Ready to accept requests")
    print("=" * 60)

    yield

    # Shutdown
    print("AI Microservice shutting down...")


# ──────────────────────────────────────────────────────────
# App
# ──────────────────────────────────────────────────────────

app = FastAPI(
    title="ClauseForge AI Microservice",
    description="AI-powered clause detection and risk analysis for legal documents",
    version="1.0.0",
    lifespan=lifespan,
)

# CORS — allow backend to call this service
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:3000",   # Backend
        "http://localhost:5173",   # Frontend (Vite dev)
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# ──────────────────────────────────────────────────────────
# Endpoints
# ──────────────────────────────────────────────────────────

@app.post("/api/analyze", response_model=AnalyzeResponse)
async def analyze(request: AnalyzeRequest):
    """
    Analyze a document for clause types and risk levels.

    Flow:
    1. Fetch all document chunks from ChromaDB (metadata filter, not RAG search)
    2. Run each chunk through clause detector → clause type + confidence
    3. Run each chunk through risk analyzer → risk level + confidence
    4. Calculate overall risk score and generate summary

    Args:
        request: Contains document_id (MongoDB ObjectId as string)

    Returns:
        Full analysis with detected clauses, risk scores, and AI summary
    """
    try:
        result = analyze_document(request.document_id)
        return result
    except Exception as e:
        print(f"Analysis error for document {request.document_id}: {e}")
        raise HTTPException(
            status_code=500,
            detail=f"Analysis failed: {str(e)}"
        )


@app.post("/api/compare", response_model=CompareResponse)
async def compare(request: CompareRequest):
    """
    Compare clauses from two documents and explain differences using LLaMA.
    """
    try:
        result = compare_documents(request)
        return result
    except Exception as e:
        print(f"Comparison error: {e}")
        raise HTTPException(
            status_code=500,
            detail=f"Comparison failed: {str(e)}"
        )


@app.post("/api/explain_clause", response_model=ExplainClauseResponse)
async def explain_clause(request: ExplainClauseRequest):
    """
    Generate a simple clear explanation of a clause using LLaMA 3.
    """
    try:
        explanation = explain_clause_with_llm(request.text, request.type, request.risk_level)
        return ExplainClauseResponse(explanation=explanation)
    except Exception as e:
        print(f"Explanation error: {e}")
        raise HTTPException(
            status_code=500,
            detail=f"Explanation failed: {str(e)}"
        )


@app.post("/api/explain_document", response_model=ExplainDocumentResponse)
async def explain_document(request: ExplainDocumentRequest):
    """
    Generate a full document AI report.
    """
    try:
        report = explain_document_with_llm(request.clauses, request.risk_score, request.risk_level)
        return ExplainDocumentResponse(report=report)
    except Exception as e:
        print(f"Document explanation error: {e}")
        raise HTTPException(
            status_code=500,
            detail=f"Document explanation failed: {str(e)}"
        )


@app.post("/api/chat/stream")
async def chat_stream(request: Request):
    """
    Stream chat responses using Hybrid RAG and Agent logic.
    """
    try:
        data = await request.json()
        messages = data.get("messages", [])
        document_ids = data.get("document_ids", [])
        
        return EventSourceResponse(
            chat_agent_instance.process_chat_stream(messages, document_ids)
        )
    except Exception as e:
        print(f"Chat stream error: {e}")
        raise HTTPException(
            status_code=500,
            detail=f"Chat stream failed: {str(e)}"
        )


@app.get("/health", response_model=HealthResponse)
async def health_check():
    """Health check endpoint with model and connection status."""
    models_loaded = False
    chroma_connected = False
    clause_classes = 0
    risk_classes = 0

    try:
        clf = get_clause_classifier()
        risk = get_risk_classifier()
        models_loaded = True
        clause_classes = len(clf.model.config.id2label)
        risk_classes = len(risk.model.config.id2label)
    except RuntimeError:
        pass

    try:
        from chroma_client import _collection
        chroma_connected = _collection is not None
    except Exception:
        pass

    return HealthResponse(
        status="ok" if models_loaded and chroma_connected else "degraded",
        models_loaded=models_loaded,
        chroma_connected=chroma_connected,
        clause_model_classes=clause_classes,
        risk_model_classes=risk_classes,
    )


# ──────────────────────────────────────────────────────────
# Run with: uvicorn main:app --reload --port 8000
# ──────────────────────────────────────────────────────────

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(
        "main:app",
        host=settings.host,
        port=settings.port,
        reload=True,
    )
