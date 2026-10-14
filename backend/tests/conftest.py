"""
Pytest Test Fixtures
Configures in-memory database and async HTTP test client.
"""

import pytest
import pytest_asyncio
from httpx import AsyncClient, ASGITransport
from sqlalchemy.ext.asyncio import create_async_engine, async_sessionmaker, AsyncSession
from sqlalchemy.pool import StaticPool
from sqlalchemy import JSON, String
from sqlalchemy.dialects.postgresql import JSONB, UUID as PG_UUID
from pgvector.sqlalchemy import Vector
from app.core.database import Base, get_db
from app.core.config import settings
from app.main import app

# Ensure environment is set to test
settings.ENVIRONMENT = "test"
settings.STORAGE_BACKEND = "local"
settings.LOCAL_STORAGE_PATH = "./storage_test"

# In-memory test SQLite URL
TEST_DB_URL = "sqlite+aiosqlite:///:memory:"

test_engine = create_async_engine(
    TEST_DB_URL,
    connect_args={"check_same_thread": False},
    poolclass=StaticPool,
)

TestingSessionLocal = async_sessionmaker(
    bind=test_engine,
    class_=AsyncSession,
    expire_on_commit=False,
    autocommit=False,
    autoflush=False,
)


@pytest_asyncio.fixture(scope="function")
async def db_session():
    """Provides a clean in-memory database session for each test."""
    # SQLite compatibility for PostgreSQL types: compile JSONB as JSON, Vector as String/JSON
    from sqlalchemy.ext.compiler import compiles
    
    @compiles(JSONB, "sqlite")
    def compile_jsonb_sqlite(type_, compiler, **kw):
        return "JSON"

    @compiles(PG_UUID, "sqlite")
    def compile_uuid_sqlite(type_, compiler, **kw):
        return "CHAR(36)"

    @compiles(Vector, "sqlite")
    def compile_vector_sqlite(type_, compiler, **kw):
        return "TEXT"

    async with test_engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)

    async with TestingSessionLocal() as session:
        yield session

    async with test_engine.begin() as conn:
        await conn.run_sync(Base.metadata.drop_all)


@pytest_asyncio.fixture(scope="function")
async def async_client(db_session: AsyncSession):
    """
    Asynchronous HTTP test client with overridden database dependency.
    """
    async def override_get_db():
        yield db_session

    app.dependency_overrides[get_db] = override_get_db

    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as client:
        yield client

    app.dependency_overrides.clear()
