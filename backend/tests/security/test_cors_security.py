"""
CORS security test suite.
Tests that CORS configuration is properly restricted.
"""
import pytest
from fastapi.testclient import TestClient
from app.main import app

client = TestClient(app)

def test_cors_allowed_origins():
    """Test CORS allows only configured origins."""
    # Test with allowed origin
    response = client.options(
        "/api/v1/auth/login",
        headers={"Origin": "http://localhost:3000"}
    )
    assert response.status_code in [200, 204]

def test_cors_disallowed_origins():
    """Test CORS blocks disallowed origins."""
    # Test with disallowed origin
    response = client.options(
        "/api/v1/auth/login",
        headers={"Origin": "http://malicious-site.com"}
    )
    # Should not have CORS headers
    assert "access-control-allow-origin" not in response.headers

def test_cors_allowed_methods():
    """Test CORS allows only specific methods."""
    response = client.options(
        "/api/v1/auth/login",
        headers={
            "Origin": "http://localhost:3000",
            "Access-Control-Request-Method": "GET"
        }
    )
    allowed_methods = response.headers.get("access-control-allow-methods", "")
    assert "GET" in allowed_methods
    assert "POST" in allowed_methods
    assert "PUT" in allowed_methods
    assert "DELETE" in allowed_methods
    assert "OPTIONS" in allowed_methods

def test_cors_disallowed_methods():
    """Test CORS blocks disallowed methods."""
    response = client.options(
        "/api/v1/auth/login",
        headers={
            "Origin": "http://localhost:3000",
            "Access-Control-Request-Method": "PATCH"
        }
    )
    # PATCH is not in allowed methods, should be rejected
    assert response.status_code in [400, 405]

def test_cors_allowed_headers():
    """Test CORS allows only specific headers."""
    response = client.options(
        "/api/v1/auth/login",
        headers={
            "Origin": "http://localhost:3000",
            "Access-Control-Request-Headers": "Authorization, Content-Type"
        }
    )
    allowed_headers = response.headers.get("access-control-allow-headers", "")
    assert "authorization" in allowed_headers.lower()
    assert "content-type" in allowed_headers.lower()

def test_cors_disallowed_headers():
    """Test CORS blocks disallowed headers."""
    response = client.options(
        "/api/v1/auth/login",
        headers={
            "Origin": "http://localhost:3000",
            "Access-Control-Request-Headers": "X-Malicious-Header"
        }
    )
    # Should not allow custom headers
    assert response.status_code in [400, 405]