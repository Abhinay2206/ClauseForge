"""
Pydantic schemas for request/response models.
"""

from pydantic import BaseModel, Field


class AnalyzeRequest(BaseModel):
    """Request body for the /api/analyze endpoint."""
    document_id: str = Field(..., description="MongoDB document ID to analyze")


class DetectedClause(BaseModel):
    """A single detected clause with type and risk classification."""
    id: str = Field(..., description="Unique clause identifier")
    text: str = Field(..., description="Full text of the detected clause chunk")
    type: str = Field(..., description="Clause type from model (e.g. 'Confidentiality', 'Terminations')")
    risk_level: str = Field(..., description="Risk level: 'low', 'medium', or 'high'")
    confidence: float = Field(..., description="Clause type detection confidence (0-1)")
    risk_confidence: float = Field(..., description="Risk level detection confidence (0-1)")
    explanation: str = Field(..., description="Auto-generated explanation of the clause risk")
    start_index: int = Field(default=0, description="Start character index in source text")
    end_index: int = Field(default=0, description="End character index in source text")


class TokenUsage(BaseModel):
    """LLM token usage tracking."""
    prompt_tokens: int = 0
    completion_tokens: int = 0
    total_tokens: int = 0

class AnalyzeResponse(BaseModel):
    """Full analysis response for a document."""
    document_id: str
    overall_risk_score: int = Field(..., ge=0, le=100, description="Overall risk score 0-100")
    risk_level: str = Field(..., description="Overall risk level: 'low', 'medium', or 'high'")
    clauses: list[DetectedClause] = Field(default_factory=list)
    summary: str = Field(..., description="AI-generated analysis summary")
    total_chunks: int = Field(..., description="Total chunks processed from ChromaDB")
    usage: TokenUsage | None = None


class HealthResponse(BaseModel):
    """Health check response."""
    status: str = "ok"
    models_loaded: bool = False
    chroma_connected: bool = False
    clause_model_classes: int = 0
    risk_model_classes: int = 0

class CompareRequest(BaseModel):
    """Request body for comparing two documents' clauses."""
    clauses_a: list[DetectedClause] = Field(..., description="Clauses from Document A")
    clauses_b: list[DetectedClause] = Field(..., description="Clauses from Document B")

class ClauseComparison(BaseModel):
    """Result of comparing two clauses."""
    clause_type: str = Field(..., description="The type of clause compared")
    text_a: str = Field(..., description="Text from Document A")
    text_b: str = Field(..., description="Text from Document B")
    relationship: str = Field(..., description="'similar', 'conflicting', or 'unrelated'")
    confidence: float = Field(..., description="Confidence score")
    explanation: str = Field(..., description="Groq LLaMA generated explanation")

class CompareResponse(BaseModel):
    """Response for document comparison."""
    comparisons: list[ClauseComparison] = Field(default_factory=list)
    summary: str = Field(..., description="Overall summary of the differences")
    usage: TokenUsage | None = None

class CompareTextRequest(BaseModel):
    """Request body for generating a summary for standard text diff."""
    diff_text: str = Field(..., description="String representation of the text diff")

class CompareTextResponse(BaseModel):
    """Response containing the summary of standard text diff."""
    summary: str = Field(..., description="Groq LLaMA generated summary of the diff")
    usage: TokenUsage | None = None

class ExplainClauseRequest(BaseModel):
    """Request body for explaining a specific clause."""
    text: str = Field(..., description="The clause text")
    type: str = Field(..., description="The clause type")
    risk_level: str = Field(..., description="The detected risk level")

class ExplainClauseResponse(BaseModel):
    """Response containing the AI explanation."""
    explanation: str = Field(..., description="Groq LLaMA generated explanation")
    usage: TokenUsage | None = None

class ExplainDocumentRequest(BaseModel):
    """Request body for generating a full document AI report."""
    clauses: list[DetectedClause] = Field(..., description="All detected clauses in the document")
    risk_score: int = Field(..., description="Overall risk score")
    risk_level: str = Field(..., description="Overall risk level")

class ExplainDocumentResponse(BaseModel):
    """Response containing the full document AI report."""
    report: str = Field(..., description="Groq LLaMA generated comprehensive report")
    usage: TokenUsage | None = None

class NegotiationSuggestion(BaseModel):
    """A suggested redline/edit for a clause."""
    original_text: str = Field(..., description="The original text of the clause")
    suggested_text: str = Field(..., description="The suggested revised text")
    reasoning: str = Field(..., description="Explanation of why the change is beneficial")

class NegotiationRequest(BaseModel):
    """Request body for generating negotiation suggestions."""
    clauses: list[DetectedClause] = Field(..., description="High/Medium risk clauses to negotiate")

class NegotiationResponse(BaseModel):
    """Response containing negotiation suggestions."""
    suggestions: list[NegotiationSuggestion] = Field(default_factory=list)
    usage: TokenUsage | None = None

class ActionItem(BaseModel):
    """An actionable workflow task extracted from a document."""
    task: str = Field(..., description="The task to perform (e.g., 'Pay vendor')")
    deadline: str = Field(..., description="The deadline or trigger (e.g., 'Within 15 days')")
    description: str = Field(..., description="More context about the task")

class ActionItemsRequest(BaseModel):
    """Request body for generating action items."""
    clauses: list[DetectedClause] = Field(..., description="All detected clauses in the document")

class ActionItemsResponse(BaseModel):
    """Response containing a list of action items."""
    action_items: list[ActionItem] = Field(default_factory=list)
    usage: TokenUsage | None = None

class SupportCategorizeRequest(BaseModel):
    """Request body for support ticket triage."""
    description: str = Field(..., description="Support ticket description")

class SupportCategorizeResponse(BaseModel):
    """Support ticket triage response."""
    category: str = Field(..., description="Ticket category")
    priority: str = Field(..., description="Ticket priority")
    aiSummary: str = Field(..., description="LLaMA-generated support summary")

class SupportDraftRequest(BaseModel):
    """Request body for drafting a support reply."""
    history: str = Field(..., description="Ticket conversation history")

class SupportDraftResponse(BaseModel):
    """Support reply draft response."""
    draft: str = Field(..., description="LLaMA-generated reply draft")
