"""
Health Check & Lifecycle Integration Tests
"""

import pytest
from httpx import AsyncClient


@pytest.mark.asyncio
async def test_root_endpoint(async_client: AsyncClient):
    """Verify root endpoint returns application metadata."""
    response = await async_client.get("/")
    assert response.status_code == 200
    data = response.json()
    assert "app" in data
    assert "docs" in data
    assert "health" in data


@pytest.mark.asyncio
async def test_ping_endpoint(async_client: AsyncClient):
    """Verify lightweight liveness probe responds with pong."""
    response = await async_client.get("/api/v1/ping")
    assert response.status_code == 200
    assert response.json() == {"status": "pong"}


@pytest.mark.asyncio
async def test_health_endpoint(async_client: AsyncClient):
    """Verify full health check endpoint returns proper schema structure."""
    response = await async_client.get("/api/v1/health")
    assert response.status_code == 200
    data = response.json()
    assert "status" in data
    assert "app_name" in data
    assert "environment" in data
    assert "database_connected" in data
    assert "timestamp" in data
    assert isinstance(data["database_connected"], bool)


@pytest.mark.asyncio
async def test_openapi_schema_generated(async_client: AsyncClient):
    """Verify OpenAPI specification is compiled and accessible."""
    response = await async_client.get("/api/v1/openapi.json")
    assert response.status_code == 200
    schema = response.json()
    assert "openapi" in schema
    assert "paths" in schema
    assert "/api/v1/health" in schema["paths"]
    assert "/api/v1/ping" in schema["paths"]
