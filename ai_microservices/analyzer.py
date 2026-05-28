"""
Core analysis engine.

For each document:
1. Fetch all chunks from ChromaDB using metadata filter (no RAG search)
2. Run each chunk through the clause detector model → clause type + confidence
3. Run each chunk through the risk analysis model → risk level + confidence
4. Filter low-confidence detections
5. Generate explanations based on clause type + risk level
6. Calculate overall risk score and level
7. Build structured response
"""

import uuid
from models_loader import get_clause_classifier, get_risk_classifier
from chroma_client import get_document_chunks
from schemas import AnalyzeResponse, DetectedClause
from config import settings
from groq import Groq


# ──────────────────────────────────────────────────────────
# Explanation templates per clause type + risk level
# ──────────────────────────────────────────────────────────

CLAUSE_EXPLANATIONS = {
    "Confidentiality": {
        "high": "This confidentiality clause has unusually broad scope or extended duration that could significantly restrict business operations. Review the term length and scope of covered information.",
        "medium": "Standard confidentiality obligations are present. Verify the duration and ensure appropriate carve-outs for publicly available information.",
        "low": "This confidentiality clause follows standard industry practices with reasonable scope and duration.",
    },
    "Terminations": {
        "high": "This termination clause contains one-sided termination rights, immediate termination without cure period, or punitive early termination penalties. Negotiate for mutual rights and reasonable notice periods.",
        "medium": "Termination provisions are present with moderate conditions. Consider whether notice periods and cure rights are adequate.",
        "low": "Standard termination clause with balanced rights for both parties.",
    },
    "Payments": {
        "high": "Payment terms contain aggressive late fees, non-refundable clauses, or payment acceleration provisions that create significant financial exposure.",
        "medium": "Payment terms require attention — verify interest rates comply with local usury laws and ensure payment schedules are workable.",
        "low": "Payment terms are standard and follow industry norms.",
    },
    "Indemnifications": {
        "high": "Broad indemnification obligations with uncapped liability or one-sided indemnity requirements. This creates significant financial exposure. Negotiate for mutual indemnification and liability caps.",
        "medium": "Indemnification clause is present with some protective limits. Verify the scope of covered claims and any liability caps.",
        "low": "Indemnification follows standard practices with reasonable mutual obligations.",
    },
    "Governing Laws": {
        "high": "The governing law jurisdiction may be unfavorable or create significant legal complexity for dispute resolution.",
        "medium": "Governing law clause specifies a particular jurisdiction. Verify this aligns with your operational presence and legal strategy.",
        "low": "Standard governing law provision with a common business-friendly jurisdiction.",
    },
    "Intellectual Property": {
        "high": "Blanket IP assignment without pre-existing IP carve-outs or work-for-hire provisions that transfer all created works. Consider retaining rights to pre-existing IP and general know-how.",
        "medium": "IP ownership clause requires careful review. Ensure pre-existing IP is protected and licensing terms are clear.",
        "low": "IP provisions are balanced with clear ownership and licensing terms.",
    },
    "Arbitration": {
        "high": "Mandatory binding arbitration with restrictive procedural rules that may limit legal remedies and appeal rights.",
        "medium": "Arbitration clause is present. Review the arbitral institution rules and location for fairness.",
        "low": "Standard arbitration provision with balanced procedural protections.",
    },
    "Warranties": {
        "high": "Warranty disclaimers are overly broad ('as-is' without exceptions) or warranty obligations are extensive with unlimited liability for breach.",
        "medium": "Warranty provisions need review — verify the scope and duration of warranties align with the nature of the deliverables.",
        "low": "Standard warranty provisions with reasonable scope and duration.",
    },
    "Assigns": {
        "high": "Assignment restrictions are one-sided, allowing one party to freely assign while restricting the other, potentially trapping you in an unfavorable arrangement.",
        "medium": "Assignment requires consent. Verify whether consent can be unreasonably withheld.",
        "low": "Standard anti-assignment clause with mutual restrictions.",
    },
    "Amendments": {
        "high": "Amendment provisions allow unilateral changes without adequate notice, creating uncertainty about future obligations.",
        "medium": "Amendments require written agreement. Ensure the process is clearly defined.",
        "low": "Standard amendment clause requiring mutual written consent.",
    },
    "Notices": {
        "high": "Notice provisions have unusually short response deadlines or impractical delivery requirements.",
        "medium": "Notice clause is standard but verify the addresses and acceptable delivery methods.",
        "low": "Standard notice provision with reasonable delivery methods and timeframes.",
    },
    "Representations": {
        "high": "Broad representations that may expose you to significant liability if any prove inaccurate. Review each representation for accuracy and survival period.",
        "medium": "Representations are present and require careful verification of factual accuracy before signing.",
        "low": "Standard representations with reasonable scope.",
    },
    "Compliance With Laws": {
        "high": "Compliance obligations are unusually broad or create joint liability for regulatory violations of the other party.",
        "medium": "Standard compliance clause. Verify the scope of applicable laws and regulations.",
        "low": "Standard compliance with laws provision.",
    },
}

# Fallback explanation for unknown clause types
DEFAULT_EXPLANATIONS = {
    "high": "This clause contains terms that present significant legal or financial risk. Immediate legal review is recommended.",
    "medium": "This clause contains provisions that warrant careful review and possible negotiation before signing.",
    "low": "This clause follows standard contractual practices with minimal risk.",
}


def _get_explanation(clause_type: str, risk_level: str) -> str:
    """Get a contextual explanation for a clause type and risk level."""
    type_explanations = CLAUSE_EXPLANATIONS.get(clause_type, DEFAULT_EXPLANATIONS)
    return type_explanations.get(risk_level, DEFAULT_EXPLANATIONS.get(risk_level, ""))


def _calculate_overall_risk(clauses: list[DetectedClause]) -> tuple[int, str]:
    """
    Calculate overall risk score (0-100) and risk level from individual clauses.

    Scoring:
        - Each 'high' clause contributes more weight
        - Score is a weighted average considering both risk level and confidence
    """
    if not clauses:
        return 0, "low"

    risk_weights = {"low": 10, "medium": 50, "high": 90}
    total_weight = 0
    total_score = 0

    for clause in clauses:
        weight = clause.confidence * clause.risk_confidence
        risk_value = risk_weights.get(clause.risk_level, 50)
        total_score += risk_value * weight
        total_weight += weight

    if total_weight == 0:
        return 0, "low"

    score = int(total_score / total_weight)

    # Boost score if many high-risk clauses
    high_count = sum(1 for c in clauses if c.risk_level == "high")
    high_ratio = high_count / len(clauses) if clauses else 0
    score = min(100, int(score + (high_ratio * 20)))

    # Determine level
    if score >= 65:
        level = "high"
    elif score >= 35:
        level = "medium"
    else:
        level = "low"

    return score, level


def _generate_summary(clauses: list[DetectedClause], risk_score: int, risk_level: str) -> str:
    """Generate a human-readable summary of the analysis results using Groq Llama 3."""
    if not clauses:
        return "No significant clauses were detected in this document."

    groq_client = Groq(api_key=settings.groq_api_key) if settings.groq_api_key else None
    
    if not groq_client:
        return f"Analysis identified {len(clauses)} significant clauses with an overall risk score of {risk_score}/100 ({risk_level} risk). (Groq API key not configured)"

    # Prepare a condensed representation of clauses for the prompt
    clause_summaries = []
    for c in clauses:
        clause_summaries.append(f"- {c.type} (Risk: {c.risk_level})")
    
    prompt = (
        f"You are a legal expert summarizing a contract analysis.\n"
        f"Overall Risk Score: {risk_score}/100 ({risk_level} risk)\n"
        f"Detected Clauses:\n" + "\n".join(clause_summaries) + "\n\n"
        f"Write a concise 2-3 sentence executive summary of the document's risks and key terms. Do not use bullet points or formatting, just plain text."
    )

    try:
        chat_completion = groq_client.chat.completions.create(
            messages=[{"role": "user", "content": prompt}],
            model="meta-llama/llama-4-scout-17b-16e-instruct",
            temperature=0.3,
            max_tokens=150,
        )
        return chat_completion.choices[0].message.content.strip()
    except Exception as e:
        print(f"Error generating summary with Groq: {e}")
        return f"Analysis identified {len(clauses)} significant clauses with an overall risk score of {risk_score}/100 ({risk_level} risk)."

def explain_clause_with_llm(text: str, clause_type: str, risk_level: str) -> str:
    """Generate a simple clear explanation of a clause using Groq Llama 3."""
    groq_client = Groq(api_key=settings.groq_api_key) if settings.groq_api_key else None
    
    if not groq_client:
        return "Explanation unavailable (Groq API key not set)."

    prompt = (
        f"You are a legal expert explaining contract clauses to a layperson.\n"
        f"Clause Type: {clause_type}\n"
        f"Risk Level: {risk_level}\n"
        f"Clause Text: {text}\n\n"
        f"Provide a simple, clear, 2-3 sentence explanation of what this clause means and why it matters. Avoid legal jargon."
    )

    try:
        chat_completion = groq_client.chat.completions.create(
            messages=[{"role": "user", "content": prompt}],
            model="meta-llama/llama-4-scout-17b-16e-instruct",
            temperature=0.3,
            max_tokens=150,
        )
        return chat_completion.choices[0].message.content.strip()
    except Exception as e:
        print(f"Error generating explanation with Groq: {e}")
        return "Failed to generate explanation. Please try again."


def explain_document_with_llm(clauses: list[DetectedClause], risk_score: int, risk_level: str) -> str:
    """Generate a comprehensive document report using Groq Llama 3."""
    groq_client = Groq(api_key=settings.groq_api_key) if settings.groq_api_key else None
    
    if not groq_client:
        return "Explanation unavailable (Groq API key not set)."

    clause_summaries = []
    for c in clauses:
        clause_summaries.append(f"- [{c.type}] (Risk: {c.risk_level})\n  Text: {c.text}")

    prompt = (
        f"You are a legal expert preparing a comprehensive, easy-to-understand report for a client regarding their contract.\n"
        f"Overall Risk Score: {risk_score}/100 ({risk_level} risk)\n\n"
        f"Detected Clauses:\n" + "\n".join(clause_summaries) + "\n\n"
        f"Write a detailed report containing:\n"
        f"1. An Executive Summary explaining the overall risk and purpose of the document.\n"
        f"2. A breakdown of the key clauses, explaining what they mean in simple terms and why the client should care (highlighting any high or medium risks).\n"
        f"3. Final recommendations.\n"
        f"Format the output cleanly in Markdown."
    )

    try:
        chat_completion = groq_client.chat.completions.create(
            messages=[{"role": "user", "content": prompt}],
            model="meta-llama/llama-4-scout-17b-16e-instruct",
            temperature=0.3,
            max_tokens=2048,
        )
        return chat_completion.choices[0].message.content.strip()
    except Exception as e:
        print(f"Error generating document explanation with Groq: {e}")
        return "Failed to generate comprehensive explanation. Please try again."


def analyze_document(document_id: str) -> AnalyzeResponse:
    """
    Main analysis function.

    1. Fetch chunks from ChromaDB (direct metadata filter, no RAG)
    2. Classify each chunk for clause type and risk level
    3. Build structured response with explanations
    """
    # 1. Fetch all chunks from ChromaDB
    chunks = get_document_chunks(document_id)

    if not chunks:
        return AnalyzeResponse(
            document_id=document_id,
            overall_risk_score=0,
            risk_level="low",
            clauses=[],
            summary="No document chunks found in the vector store for this document. The document may still be processing.",
            total_chunks=0,
        )

    print(f"Analyzing {len(chunks)} chunks for document {document_id}")

    # 2. Get model pipelines
    clause_clf = get_clause_classifier()
    risk_clf = get_risk_classifier()

    # 3. Process each chunk
    detected_clauses: list[DetectedClause] = []
    char_offset = 0

    for i, chunk in enumerate(chunks):
        text = chunk["text"]
        if not text or not text.strip():
            continue

        # Run clause detection (top_k=None → all class scores)
        clause_results = clause_clf(text)

        # clause_results is a list of lists when top_k=None
        # Get the top prediction
        if isinstance(clause_results[0], list):
            clause_scores = clause_results[0]
        else:
            clause_scores = clause_results

        # Sort by score descending to get top prediction
        clause_scores_sorted = sorted(clause_scores, key=lambda x: x["score"], reverse=True)
        top_clause = clause_scores_sorted[0]

        clause_type = top_clause["label"]
        clause_confidence = top_clause["score"]

        # Run risk analysis
        risk_result = risk_clf(text)[0]
        risk_level = risk_result["label"]
        risk_confidence = risk_result["score"]

        # Filter by confidence threshold
        if clause_confidence < settings.confidence_threshold:
            char_offset += len(text)
            continue

        # Generate explanation
        explanation = _get_explanation(clause_type, risk_level)

        # Build detected clause
        detected_clause = DetectedClause(
            id=f"clause-{uuid.uuid4().hex[:8]}",
            text=text,
            type=clause_type,
            risk_level=risk_level,
            confidence=round(clause_confidence, 4),
            risk_confidence=round(risk_confidence, 4),
            explanation=explanation,
            start_index=char_offset,
            end_index=char_offset + len(text),
        )
        detected_clauses.append(detected_clause)
        char_offset += len(text)

    # 4. Calculate overall risk
    risk_score, overall_risk_level = _calculate_overall_risk(detected_clauses)

    # 5. Generate summary
    summary = _generate_summary(detected_clauses, risk_score, overall_risk_level)

    print(f"  ✓ {len(detected_clauses)} clauses detected, risk score: {risk_score} ({overall_risk_level})")

    return AnalyzeResponse(
        document_id=document_id,
        overall_risk_score=risk_score,
        risk_level=overall_risk_level,
        clauses=detected_clauses,
        summary=summary,
        total_chunks=len(chunks),
    )

from schemas import CompareRequest, CompareResponse, ClauseComparison
from models_loader import get_comparison_classifier
import time

def compare_documents(req: CompareRequest) -> CompareResponse:
    """Compare clauses from two documents."""
    comparison_clf = get_comparison_classifier()
    groq_client = Groq(api_key=settings.groq_api_key) if settings.groq_api_key else None
    
    comparisons = []
    
    # Group clauses by type
    clauses_a_by_type = {}
    for c in req.clauses_a:
        clauses_a_by_type.setdefault(c.type, []).append(c)
        
    clauses_b_by_type = {}
    for c in req.clauses_b:
        clauses_b_by_type.setdefault(c.type, []).append(c)
        
    common_types = set(clauses_a_by_type.keys()).intersection(clauses_b_by_type.keys())
    
    for ctype in common_types:
        # Just compare the first one of each type for simplicity
        c_a = clauses_a_by_type[ctype][0]
        c_b = clauses_b_by_type[ctype][0]
        
        # 1. DistilBERT Comparison Model
        input_text = f"{c_a.text} [SEP] {c_b.text}"
        res = comparison_clf(input_text)[0]
        relationship = res["label"]
        confidence = res["score"]
        
        # 2. Groq LLaMA Explanation
        explanation = "No explanation generated (Groq API key not set)."
        if groq_client:
            prompt = (
                f"You are a legal expert analyzing a contract. "
                f"Clause A (Original): {c_a.text}\n"
                f"Clause B (Revised): {c_b.text}\n"
                f"The AI classified their relationship as '{relationship}'. "
                f"Write a concise 1-2 sentence explanation of the key difference and its practical implication."
            )
            try:
                chat_completion = groq_client.chat.completions.create(
                    messages=[{"role": "user", "content": prompt}],
                    model="meta-llama/llama-4-scout-17b-16e-instruct",
                    temperature=0.3,
                    max_tokens=150,
                )
                explanation = chat_completion.choices[0].message.content.strip()
            except Exception as e:
                explanation = f"Error generating explanation: {str(e)}"
                
        comparisons.append(ClauseComparison(
            clause_type=ctype,
            text_a=c_a.text,
            text_b=c_b.text,
            relationship=relationship,
            confidence=round(confidence, 4),
            explanation=explanation
        ))
        
    # Build summary
    summary = f"Compared {len(comparisons)} common clause types. "
    conflict_count = sum(1 for c in comparisons if c.relationship == 'conflicting')
    if conflict_count > 0:
        summary += f"Found {conflict_count} conflicting clauses requiring review."
    else:
        summary += "No significant conflicts found."
        
    return CompareResponse(
        comparisons=comparisons,
        summary=summary
    )
