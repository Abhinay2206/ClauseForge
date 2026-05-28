"""
Support desk LLaMA helpers.
"""

import json
import re
from groq import Groq

from config import settings

SUPPORT_MODEL = "meta-llama/llama-4-scout-17b-16e-instruct"


def _client():
    return Groq(api_key=settings.groq_api_key) if settings.groq_api_key else None


def _extract_json(text: str) -> dict:
    clean = text.strip().replace("```json", "").replace("```", "").strip()
    try:
        return json.loads(clean)
    except json.JSONDecodeError:
        match = re.search(r"\{.*\}", clean, re.DOTALL)
        if match:
            return json.loads(match.group(0))
        raise


def categorize_support_ticket(description: str) -> dict:
    """Classify and summarize a support ticket using the backend LLaMA provider."""
    groq_client = _client()
    if not groq_client:
        return {
            "category": "general_inquiry",
            "priority": "normal",
            "aiSummary": "LLaMA support analysis is unavailable because GROQ_API_KEY is not configured.",
        }

    prompt = f"""
You are an expert IT/SaaS support triage assistant for ClauseForge, a legal-tech platform.

Analyze this support ticket:
{description}

Return ONLY valid JSON with exactly these keys:
- category: one of billing, technical_support, ai_analysis_issues, document_processing_issues, compliance_support, account_recovery, feature_requests, bug_reports, general_inquiry
- priority: one of low, normal, high, urgent
- aiSummary: one concise sentence explaining the issue
"""

    try:
        completion = groq_client.chat.completions.create(
            model=SUPPORT_MODEL,
            messages=[{"role": "user", "content": prompt}],
            temperature=0.1,
            max_tokens=300,
        )
        parsed = _extract_json(completion.choices[0].message.content or "{}")
        return {
            "category": parsed.get("category") or "general_inquiry",
            "priority": parsed.get("priority") or "normal",
            "aiSummary": parsed.get("aiSummary") or "Summary not generated.",
        }
    except Exception as e:
        print(f"Support ticket categorization error: {e}")
        return {
            "category": "general_inquiry",
            "priority": "normal",
            "aiSummary": "LLaMA support analysis failed.",
        }


def draft_support_reply(history: str) -> str:
    """Draft a concise support reply using the backend LLaMA provider."""
    groq_client = _client()
    if not groq_client:
        return "LLaMA support assistant is unavailable because GROQ_API_KEY is not configured."

    prompt = f"""
You are a professional support agent for ClauseForge, a legal-tech SaaS platform.

Draft a concise, helpful reply to the user based on this ticket history.
Use a calm support tone. Do not invent resolution details. If the issue is still being investigated, say the team is checking it and ask for any useful details such as document names, time of failure, or screenshots.
Do not include placeholders.

Ticket history:
{history}

Reply:
"""

    try:
        completion = groq_client.chat.completions.create(
            model=SUPPORT_MODEL,
            messages=[{"role": "user", "content": prompt}],
            temperature=0.2,
            max_tokens=450,
        )
        return (completion.choices[0].message.content or "").strip()
    except Exception as e:
        print(f"Support reply draft error: {e}")
        return "Failed to generate a LLaMA draft. Please try again later."
