"""
Model loader for clause detection and risk analysis DistilBert models.
Loads both models at startup using transformers pipeline and caches them in memory.
"""

import torch
from transformers import pipeline
from config import settings


# Global model references — populated at startup
clause_classifier = None
risk_classifier = None
comparison_classifier = None


def get_device():
    """Determine the best available device."""
    if torch.cuda.is_available():
        return 0  # GPU index for pipeline
    elif hasattr(torch.backends, "mps") and torch.backends.mps.is_available():
        return "mps"
    return -1  # CPU


def load_models():
    """
    Load both DistilBert models into memory.
    Called once at FastAPI startup.

    Clause Detector (13 classes):
        Confidentiality, Terminations, Payments, Indemnifications,
        Governing Laws, Intellectual Property, Arbitration, Warranties,
        Assigns, Amendments, Notices, Representations, Compliance With Laws

    Risk Analyzer (3 classes):
        low, medium, high

    Comparison Model (3 classes):
        similar, conflicting, unrelated
    """
    global clause_classifier, risk_classifier, comparison_classifier

    device = get_device()
    device_name = "CUDA" if device == 0 else ("MPS" if device == "mps" else "CPU")
    print(f"Loading models on device: {device_name}")

    # 1. Clause Detection Model
    print(f"Loading clause detector from: {settings.clause_model_dir}")
    clause_classifier = pipeline(
        "text-classification",
        model=settings.clause_model_dir,
        tokenizer=settings.clause_model_dir,
        device=device,
        truncation=True,
        max_length=settings.max_length,
        top_k=None,  # Return all class scores
    )
    print(f"  ✓ Clause detector loaded — {len(clause_classifier.model.config.id2label)} classes")

    # 2. Risk Analysis Model
    print(f"Loading risk analyzer from: {settings.risk_model_dir}")
    risk_classifier = pipeline(
        "text-classification",
        model=settings.risk_model_dir,
        tokenizer=settings.risk_model_dir,
        device=device,
        truncation=True,
        max_length=settings.max_length,
    )
    print(f"  ✓ Risk analyzer loaded — {len(risk_classifier.model.config.id2label)} classes")

    # 3. Contract Comparison Model
    print(f"Loading comparison model from: {settings.comparison_model_dir}")
    # The comparison model needs sentence pairs. We'll use the 'text-classification'
    # pipeline, and pass the text_a, text_b directly when predicting.
    comparison_classifier = pipeline(
        "text-classification",
        model=settings.comparison_model_dir,
        tokenizer=settings.comparison_model_dir,
        device=device,
        truncation=True,
        max_length=512,  # Uses 512 for comparison
    )
    print(f"  ✓ Comparison model loaded — {len(comparison_classifier.model.config.id2label)} classes")

    print("All models loaded successfully.\n")


def get_clause_classifier():
    """Get the loaded clause detection pipeline."""
    if clause_classifier is None:
        raise RuntimeError("Clause classifier not loaded. Call load_models() first.")
    return clause_classifier


def get_risk_classifier():
    """Get the loaded risk analysis pipeline."""
    if risk_classifier is None:
        raise RuntimeError("Risk classifier not loaded. Call load_models() first.")
    return risk_classifier


def get_comparison_classifier():
    """Get the loaded contract comparison pipeline."""
    if comparison_classifier is None:
        raise RuntimeError("Comparison classifier not loaded. Call load_models() first.")
    return comparison_classifier
