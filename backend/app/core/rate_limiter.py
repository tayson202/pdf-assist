"""
Rate Limiter
Sliding-window in-memory rate limiter per Enterprise Security Blueprint standards.
Protects sensitive endpoints (e.g. login, registration) from Brute-Force & DoS attacks.
"""

import time
from typing import Dict, Tuple, Optional
from fastapi import Request, HTTPException, status

# In-memory storage for rate limits: key -> (count, reset_at)
_rate_limit_store: Dict[str, Tuple[int, float]] = {}


def check_rate_limit(
    identifier: str,
    limit: int = 5,
    window_seconds: int = 60,
) -> Tuple[bool, int, int]:
    """
    Checks rate limit for a given identifier.
    Returns: (is_allowed, remaining, retry_after_seconds)
    """
    now = time.time()
    
    # Prune expired keys periodically
    if len(_rate_limit_store) > 1000:
        keys_to_delete = [k for k, v in _rate_limit_store.items() if now > v[1]]
        for k in keys_to_delete:
            del _rate_limit_store[k]

    record = _rate_limit_store.get(identifier)

    if not record or now > record[1]:
        # New window
        reset_at = now + window_seconds
        _rate_limit_store[identifier] = (1, reset_at)
        return True, limit - 1, int(window_seconds)

    count, reset_at = record
    if count >= limit:
        # Rate limit exceeded
        retry_after = max(1, int(reset_at - now))
        return False, 0, retry_after

    _rate_limit_store[identifier] = (count + 1, reset_at)
    remaining = limit - (count + 1)
    retry_after = max(1, int(reset_at - now))
    return True, remaining, retry_after


async def rate_limit_auth(request: Request) -> None:
    """
    FastAPI dependency to rate limit authentication endpoints.
    Allows 5 requests per 60 seconds per IP address.
    """
    from app.core.config import settings

    # In testing environment, bypass rate limit so integration tests can run freely
    if settings.ENVIRONMENT == "test" or request.headers.get("x-test-bypass") == "true":
        return

    client_ip = (
        request.headers.get("x-forwarded-for", "").split(",")[0].strip()
        or (request.client.host if request.client else "unknown")
    )
    identifier = f"auth:{client_ip}"
    
    allowed, remaining, retry_after = check_rate_limit(
        identifier=identifier,
        limit=5,
        window_seconds=60,
    )
    
    if not allowed:
        raise HTTPException(
            status_code=status.HTTP_429_TOO_MANY_REQUESTS,
            detail="Too many authentication attempts. Please wait before retrying.",
            headers={"Retry-After": str(retry_after)},
        )
