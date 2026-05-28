"""
Centralized configuration for the AI Microservice.
Loads settings from .env file via pydantic-settings.
"""

from pydantic_settings import BaseSettings
from pathlib import Path


class Settings(BaseSettings):
    # ChromaDB
    chroma_host: str = "api.trychroma.com"
    chroma_port: int = 443
    chroma_ssl: bool = True
    chroma_api_key: str = ""
    chroma_tenant: str = ""
    chroma_database: str = "lexai"
    chroma_collection: str = "clause_forge_documents"

    # Model paths
    model_dir: str = "./models"
    clause_model_dir: str = "./models/clause_detector"
    risk_model_dir: str = "./models/risk_analysis"
    comparison_model_dir: str = "./models/contract_comparison_model"

    # API Keys
    groq_api_key: str = ""
    gemini_api_key: str = ""

    # Server
    host: str = "0.0.0.0"
    port: int = 8000

    # Inference
    confidence_threshold: float = 0.3
    max_length: int = 256

    # AWS S3 for Models
    aws_region: str = ""
    aws_s3_bucket_name: str = ""
    aws_access_key_id: str = ""
    aws_secret_access_key: str = ""

    class Config:
        env_file = Path(__file__).parent / ".env"
        env_file_encoding = "utf-8"
        extra = "ignore"


settings = Settings()
