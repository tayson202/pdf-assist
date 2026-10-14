"""
Application Configuration
Pydantic v2 settings management with environment variable overrides.
"""

from typing import List, Union
from pydantic import AnyHttpUrl, field_validator
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    # Application & Environment
    ENVIRONMENT: str = "development"
    DEBUG: bool = True
    APP_NAME: str = "AI PDF Assistant API"
    API_V1_STR: str = "/api/v1"
    SECRET_KEY: str = "change-this-to-a-super-secret-random-key-in-production-min-32-chars"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60 * 24  # 24 hours

    # CORS Configuration
    CORS_ORIGINS: List[Union[str, AnyHttpUrl]] = [
        "http://localhost",
        "http://localhost:3000",
        "http://localhost:8000",
        "http://localhost:8080",
        "http://127.0.0.1",
        "http://10.0.2.2",  # Android emulator localhost alias
    ]

    @field_validator("CORS_ORIGINS", mode="before")
    @classmethod
    def assemble_cors_origins(cls, v: Union[str, List[str]]) -> List[str]:
        if isinstance(v, str) and not v.startswith("["):
            return [i.strip() for i in v.split(",")]
        elif isinstance(v, list):
            return v
        return []

    # Database Settings
    POSTGRES_SERVER: str = "localhost"
    POSTGRES_PORT: int = 5432
    POSTGRES_USER: str = "postgres"
    POSTGRES_PASSWORD: str = "postgres"
    POSTGRES_DB: str = "pdf_assist_db"
    
    # Async database connection URL
    DATABASE_URL: str = "postgresql+asyncpg://postgres:postgres@localhost:5432/pdf_assist_db"
    
    # Test database URL fallback for lightweight isolated tests
    TEST_DATABASE_URL: str = "sqlite+aiosqlite:///:memory:"

    # Object Storage (Local, S3 / MinIO, or Supabase)
    STORAGE_BACKEND: str = "supabase"  # "local", "s3", or "supabase"
    LOCAL_STORAGE_PATH: str = "./data/storage"
    S3_ENDPOINT_URL: str = "http://localhost:9000"
    S3_ACCESS_KEY_ID: str = "minioadmin"
    S3_SECRET_ACCESS_KEY: str = "minioadmin"
    S3_BUCKET_NAME: str = "pdf-assist-documents"
    S3_REGION: str = "us-east-1"
    
    # Supabase Native Storage
    SUPABASE_URL: str = "https://tjpvtfxlunlzglucjyih.supabase.co"
    SUPABASE_SERVICE_ROLE_KEY: str = "your-supabase-service-role-key"
    SUPABASE_BUCKET_NAME: str = "files assist"

    # AI & Embeddings Configuration
    OPENAI_API_KEY: str = "sk-placeholder-for-dev"
    OPENAI_MODEL: str = "gpt-4o-mini"
    OPENAI_EMBEDDING_MODEL: str = "text-embedding-3-small"
    EMBEDDING_DIMENSION: int = 1536

    # RAG Hyperparameters
    CHUNK_SIZE_TOKENS: int = 500
    CHUNK_OVERLAP_TOKENS: int = 100
    RETRIEVAL_TOP_K: int = 5
    SIMILARITY_THRESHOLD: float = 0.65

    # Document Upload Limits
    MAX_UPLOAD_SIZE_MB: int = 25
    MAX_PAGE_COUNT: int = 250

    # Redis Broker URL
    REDIS_URL: str = "redis://localhost:6379/0"

    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        case_sensitive=True,
        extra="ignore"
    )


settings = Settings()
