"""
Authentication Integration Tests
"""

import pytest
from httpx import AsyncClient


@pytest.mark.asyncio
async def test_register_user_success(async_client: AsyncClient):
    payload = {
        "email": "newuser@example.com",
        "password": "Password123!",
    }
    response = await async_client.post("/api/v1/auth/register", json=payload)
    assert response.status_code == 201
    data = response.json()
    assert data["email"] == "newuser@example.com"
    assert "id" in data
    assert "created_at" in data
    assert "password" not in data
    assert "hashed_password" not in data


@pytest.mark.asyncio
async def test_register_duplicate_email(async_client: AsyncClient):
    payload = {
        "email": "duplicate@example.com",
        "password": "Password123!",
    }
    # First registration
    r1 = await async_client.post("/api/v1/auth/register", json=payload)
    assert r1.status_code == 201

    # Second registration with same email
    r2 = await async_client.post("/api/v1/auth/register", json=payload)
    assert r2.status_code == 400
    assert "already exists" in r2.json()["detail"]


@pytest.mark.asyncio
async def test_login_success(async_client: AsyncClient):
    # Register user
    reg_payload = {"email": "login@example.com", "password": "SecurePassword123!"}
    await async_client.post("/api/v1/auth/register", json=reg_payload)

    # Login
    login_payload = {"email": "login@example.com", "password": "SecurePassword123!"}
    response = await async_client.post("/api/v1/auth/login", json=login_payload)
    assert response.status_code == 200
    data = response.json()
    assert "access_token" in data
    assert data["token_type"] == "bearer"
    assert data["expires_in"] > 0


@pytest.mark.asyncio
async def test_login_invalid_credentials(async_client: AsyncClient):
    reg_payload = {"email": "loginfail@example.com", "password": "CorrectPassword123!"}
    await async_client.post("/api/v1/auth/register", json=reg_payload)

    login_payload = {"email": "loginfail@example.com", "password": "WrongPassword!"}
    response = await async_client.post("/api/v1/auth/login", json=login_payload)
    assert response.status_code == 401
    assert "Incorrect email or password" in response.json()["detail"]


@pytest.mark.asyncio
async def test_get_current_user_profile(async_client: AsyncClient):
    # Register & Login
    email = "profile@example.com"
    password = "ProfilePassword123!"
    await async_client.post("/api/v1/auth/register", json={"email": email, "password": password})
    
    login_res = await async_client.post("/api/v1/auth/login", json={"email": email, "password": password})
    token = login_res.json()["access_token"]

    # Access /me with token
    headers = {"Authorization": f"Bearer {token}"}
    me_res = await async_client.get("/api/v1/auth/me", headers=headers)
    assert me_res.status_code == 200
    data = me_res.json()
    assert data["email"] == email


@pytest.mark.asyncio
async def test_unauthorized_access(async_client: AsyncClient):
    # Missing token
    r1 = await async_client.get("/api/v1/auth/me")
    assert r1.status_code == 401

    # Invalid token
    headers = {"Authorization": "Bearer invalid.jwt.token"}
    r2 = await async_client.get("/api/v1/auth/me", headers=headers)
    assert r2.status_code == 401
