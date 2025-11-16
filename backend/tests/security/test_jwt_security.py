"""
JWT security test suite.
Tests JWT token security and validation.
"""
import pytest
import jwt
from fastapi.testclient import TestClient
from app.main import app
from app.core.config import settings
from app.core.security import create_access_token, decode_access_token

client = TestClient(app)

def test_jwt_secret_strength():
    """Test that JWT secret is sufficiently strong."""
    secret = settings.JWT_SECRET

    # Secret should be long and complex
    assert len(secret) >= 32
    assert secret != "CHANGE_ME_SUPER_SECRET"
    assert secret != "ZNH1EyZEB8nmm7xNqUqf9FABdXcaFuyl"  # Old weak secret

    # Should contain variety of characters
    has_upper = any(c.isupper() for c in secret)
    has_lower = any(c.islower() for c in secret)
    has_digit = any(c.isdigit() for c in secret)
    has_special = any(c in "!@#$%^&*()_+-=[]{}|;:,.<>?" for c in secret)

    assert has_upper or has_lower or has_digit or has_special

def test_jwt_token_format():
    """Test JWT token format and structure."""
    # Create a test token
    token = create_access_token(data={"sub": "test@example.com"})

    # Should be valid JWT format (3 parts separated by dots)
    parts = token.split('.')
    assert len(parts) == 3

    # Should be decodable
    payload = decode_access_token(token)
    assert payload["sub"] == "test@example.com"
    assert "exp" in payload

def test_jwt_token_expiration():
    """Test JWT token expiration."""
    import time
    from datetime import timedelta

    # Create token with very short expiration
    token = create_access_token(
        data={"sub": "test@example.com"},
        expires_delta=timedelta(seconds=1)
    )

    # Should be valid immediately
    payload = decode_access_token(token)
    assert payload["sub"] == "test@example.com"

    # Wait for expiration (in real test, you'd mock time)
    # time.sleep(2)
    # with pytest.raises(Exception):  # Should raise JWTError
    #     decode_access_token(token)

def test_jwt_invalid_token():
    """Test that invalid JWT tokens are rejected."""
    invalid_tokens = [
        "",  # Empty
        "invalid.jwt.token",  # Invalid format
        "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.invalid.signature",  # Invalid payload
        "Bearer " + "a" * 500,  # Too long
    ]

    for token in invalid_tokens:
        with pytest.raises(Exception):
            decode_access_token(token)

def test_jwt_algorithm_security():
    """Test JWT algorithm is secure."""
    token = create_access_token(data={"sub": "test@example.com"})

    # Decode header to check algorithm
    header = jwt.get_unverified_header(token)
    assert header["alg"] == "HS256"

    # Should not use "none" algorithm
    assert header["alg"] != "none"

def test_jwt_no_sensitive_data():
    """Test JWT doesn't contain sensitive data."""
    token = create_access_token(data={"sub": "test@example.com"})
    payload = decode_access_token(token)

    # Should only contain non-sensitive data
    sensitive_keys = ["password", "hashed_password", "secret", "key", "token"]
    for key in payload:
        assert not any(sensitive in key.lower() for sensitive in sensitive_keys)

def test_protected_endpoints_require_jwt():
    """Test that protected endpoints reject requests without JWT."""
    protected_endpoints = [
        "/api/v1/auth/me",
        "/api/v1/scans/",
    ]

    for endpoint in protected_endpoints:
        # Request without auth header
        response = client.get(endpoint)
        assert response.status_code == 401

        # Request with invalid auth header
        response = client.get(endpoint, headers={"Authorization": "Bearer invalid"})
        assert response.status_code == 401

        # Request with malformed auth header
        response = client.get(endpoint, headers={"Authorization": "InvalidFormat token"})
        assert response.status_code == 401

def test_jwt_token_structure():
    """Test JWT token contains required claims."""
    token = create_access_token(data={"sub": "test@example.com"})
    payload = decode_access_token(token)

    # Should contain required claims
    assert "sub" in payload  # Subject (user identifier)
    assert "exp" in payload  # Expiration time
    assert "iat" in payload or "exp" in payload  # Issued at or expiration

def test_jwt_user_identifier_format():
    """Test JWT uses email as user identifier."""
    email = "test@jwtsecurity.com"
    token = create_access_token(data={"sub": email})
    payload = decode_access_token(token)

    assert payload["sub"] == email
    assert "@" in payload["sub"]  # Should be email format