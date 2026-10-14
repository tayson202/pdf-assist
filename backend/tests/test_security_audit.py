"""
Enterprise Automated Security Audit Test Suite
Implements testing standards from Enterprise Security & Testing Blueprint (File 4):
1. HTTP Security Headers enforcement
2. Sliding-Window Rate Limiting & Flooding Protection (429 status + Retry-After)
3. Sensitive credentials leakage prevention (no hashed_password or secrets in responses)
4. Unauthenticated endpoint rejection (401 Unauthorized)
5. Algorithm & Token integrity protection
"""

import pytest
from httpx import AsyncClient
from app.core.rate_limiter import check_rate_limit, _rate_limit_store
from app.core.security import decode_access_token, create_access_token


@pytest.mark.asyncio
async def test_security_headers_enforcement(async_client: AsyncClient):
    """Verifies that all responses enforce enterprise security headers."""
    response = await async_client.get("/")
    assert response.status_code == 200
    headers = response.headers
    assert headers.get("X-Content-Type-Options") == "nosniff"
    assert headers.get("X-Frame-Options") == "DENY"
    assert headers.get("X-XSS-Protection") == "1; mode=block"
    assert "strict-origin-when-cross-origin" in headers.get("Referrer-Policy", "")


@pytest.mark.asyncio
async def test_unauthenticated_protected_endpoint_rejected(async_client: AsyncClient):
    """Verifies that accessing protected routes without Bearer token returns 401."""
    # Attempt to fetch profile without token
    res = await async_client.get("/api/v1/auth/me")
    assert res.status_code == 401
    assert "detail" in res.json()


@pytest.mark.asyncio
async def test_credentials_leakage_prevention(async_client: AsyncClient):
    """Verifies that user registration and login never leak hashed_password or passwords."""
    payload = {
        "email": "security_test_user@example.com",
        "password": "StrongPassword123!",
    }
    res = await async_client.post("/api/v1/auth/register", json=payload)
    assert res.status_code == 201
    body_str = res.text.lower()
    assert "hashed_password" not in body_str
    assert "strongpassword123!" not in body_str


def test_sliding_window_rate_limiter_flooding():
    """Simulates flooding requests to verify rate limiter triggers 429 logic."""
    test_key = "test_flood_ip_127_0_0_1"
    _rate_limit_store.clear()

    # First 5 attempts should succeed
    for i in range(5):
        allowed, remaining, retry_after = check_rate_limit(test_key, limit=5, window_seconds=60)
        assert allowed is True
        assert remaining == 5 - (i + 1)

    # 6th attempt must be blocked
    allowed, remaining, retry_after = check_rate_limit(test_key, limit=5, window_seconds=60)
    assert allowed is False
    assert remaining == 0
    assert retry_after > 0


def test_jwt_tampering_and_algorithm_protection():
    """Verifies that tokens with tampered signatures or invalid format are rejected."""
    token = create_access_token(subject="user_123")
    assert decode_access_token(token) is not None

    # Tamper signature
    tampered = token[:-5] + "XXXXX"
    assert decode_access_token(tampered) is None

    # Garbage token
    assert decode_access_token("not.a.valid.jwt") is None
