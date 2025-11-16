"""
Security headers test suite.
Tests that all required security headers are properly set.
"""
import pytest
from httpx import AsyncClient
from app.main import app

@pytest.fixture
async def client():
    async with AsyncClient(app=app, base_url="http://test") as ac:
        yield ac

@pytest.mark.asyncio
async def test_security_headers_present(client):
    """Test that all required security headers are present."""
    response = await client.get("/health")

    # Check security headers
    assert response.headers.get("X-Content-Type-Options") == "nosniff"
    assert response.headers.get("X-Frame-Options") == "DENY"
    assert response.headers.get("X-XSS-Protection") == "1; mode=block"
    assert response.headers.get("Referrer-Policy") == "strict-origin-when-cross-origin"
    assert "Content-Security-Policy" in response.headers
    assert "Strict-Transport-Security" in response.headers

def test_csp_header_content():
    """Test Content Security Policy header content."""
    response = client.get("/health")
    csp = response.headers.get("Content-Security-Policy")

    # Verify CSP allows required resources
    assert "default-src 'self'" in csp
    assert "script-src 'self' 'unsafe-inline'" in csp
    assert "style-src 'self' 'unsafe-inline'" in csp
    assert "img-src 'self' data: blob:" in csp
    assert "font-src 'self'" in csp
    assert "connect-src 'self'" in csp

def test_hsts_header():
    """Test HSTS header configuration."""
    response = client.get("/health")
    hsts = response.headers.get("Strict-Transport-Security")

    assert "max-age=31536000" in hsts
    assert "includeSubDomains" in hsts

def test_security_headers_on_all_endpoints():
    """Test security headers are present on all endpoints."""
    endpoints_to_test = [
        "/health",
        "/api/v1/auth/me",
        "/api/v1/scans/",
        "/api/v1/recommendations/healthy"
    ]

    for endpoint in endpoints_to_test:
        response = client.get(endpoint)
        # Test that key security headers are present
        assert response.headers.get("X-Content-Type-Options") == "nosniff"
        assert response.headers.get("X-Frame-Options") == "DENY"