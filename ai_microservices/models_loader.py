"""
Model loader for clause detection and risk analysis DistilBert models.
Loads both models at startup using transformers pipeline and caches them in memory.
"""

import torch
from transformers import pipeline
from sentence_transformers import CrossEncoder
from config import settings


# Global model references — populated at startup
clause_classifier = None
risk_classifier = None
comparison_classifier = None
reranker_model = None


def get_device():
    """Determine the best available device."""
    if torch.cuda.is_available():
        return 0  # GPU index for pipeline
    elif hasattr(torch.backends, "mps") and torch.backends.mps.is_available():
        return "mps"
    return -1  # CPU

def download_models_from_s3():
    """
    Downloads models from S3 if they don't exist locally.
    Uses AWS credentials from the backend .env file.
    """
    import os
    import boto3
    from pathlib import Path
    
    # Simple check to see if models exist
    if Path(settings.clause_model_dir).exists() and Path(settings.risk_model_dir).exists() and Path(settings.comparison_model_dir).exists():
        if (Path(settings.clause_model_dir) / "config.json").exists():
            print("Models found locally. Skipping S3 download.")
            return

    print("Models not found locally. Downloading from S3...")
    
    aws_access_key_id = settings.aws_access_key_id
    aws_secret_access_key = settings.aws_secret_access_key
    aws_region = settings.aws_region
    bucket_name = settings.aws_s3_bucket_name
    
    if not all([aws_access_key_id, aws_secret_access_key, aws_region, bucket_name]):
        print("Warning: Missing AWS credentials in config. Cannot download models from S3.")
        return
        
    try:
        s3 = boto3.client(
            's3',
            aws_access_key_id=aws_access_key_id,
            aws_secret_access_key=aws_secret_access_key,
            region_name=aws_region
        )
        
        paginator = s3.get_paginator('list_objects_v2')
        print(f"Connecting to bucket {bucket_name} in {aws_region}...")
        for page in paginator.paginate(Bucket=bucket_name, Prefix='models/'):
            for obj in page.get('Contents', []):
                key = obj['Key']
                local_path = Path(".") / key
                if key.endswith('/'):
                    continue
                local_path.parent.mkdir(parents=True, exist_ok=True)
                # Only download if file doesn't exist
                if not local_path.exists():
                    print(f"  Downloading {key}...")
                    s3.download_file(bucket_name, key, str(local_path))
        print("S3 models download complete.")
    except Exception as e:
        print(f"Error downloading models from S3: {e}")

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
        
    Reranker Model:
        cross-encoder/ms-marco-MiniLM-L-6-v2
    """
    global clause_classifier, risk_classifier, comparison_classifier, reranker_model

    # Download from S3 first
    download_models_from_s3()

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

    # 4. Reranker Model
    print("Loading Reranker model: cross-encoder/ms-marco-MiniLM-L-6-v2")
    reranker_model = CrossEncoder('cross-encoder/ms-marco-MiniLM-L-6-v2', max_length=512, device=device_name.lower())
    print("  ✓ Reranker model loaded")

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


def get_reranker_model():
    """Get the loaded CrossEncoder reranker model."""
    if reranker_model is None:
        raise RuntimeError("Reranker model not loaded. Call load_models() first.")
    return reranker_model
