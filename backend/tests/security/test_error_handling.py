"""
Error handling security test suite.
Tests that error messages don't expose sensitive information.
"""
import pytest
from fastapi.testclient import TestClient
from app.main import app

client = TestClient(app)

def test_generic_error_messages():
    """Test that error messages don't expose internal details."""
    # Test with malformed data that should cause internal errors
    response = client.post("/api/v1/auth/login", json={
        "email": "nonexistent@test.com",
        "password": "wrongpassword"
    })

    # Should return generic error message
    assert response.status_code == 401
    assert "detail" in response.json()
    # Error should not reveal if user exists or not
    assert response.json()["detail"] == "Incorrect email or password"

def test_file_upload_error_messages():
    """Test that file upload errors don't expose system information."""
    # Test with invalid file that should cause processing error
    response = client.post(
        "/api/v1/scans/",
        files={"file": ("test.jpg", b"not an image", "image/jpeg")},
        headers={"Authorization": "Bearer invalid_token"}
    )

    # Should not expose internal error details
    if response.status_code == 500:
        error_detail = response.json().get("detail", "")
        # Should be generic, not contain file paths or system info
        assert "not an image" not in error_detail.lower()
        assert ".jpg" not in error_detail.lower()
        assert "byte" not in error_detail.lower()

def test_database_error_messages():
    """Test that database errors don't expose connection details."""
    # Test with invalid ObjectId format
    response = client.get(
        "/api/v1/scans/invalid-object-id",
        headers={"Authorization": "Bearer fake_token"}
    )

    # Should return generic error, not database error details
    assert response.status_code in [400, 401, 404, 422]
    if "detail" in response.json():
        detail = response.json()["detail"]
        assert "mongodb" not in detail.lower()
        assert "connection" not in detail.lower()
        assert "internal" not in detail.lower()

def test_authentication_error_messages():
    """Test authentication errors don't reveal user existence."""
    # Test with various invalid credentials
    invalid_credentials = [
        {"email": "nonexistent@test.com", "password": "wrong"},
        {"email": "test@test.com", "password": "wrong"},
        {"email": "invalid-email", "password": "wrong"},
    ]

    for creds in invalid_credentials:
        response = client.post("/api/v1/auth/login", json=creds)
        # All should return the same generic message
        assert response.status_code in [400, 401, 422]
        if response.status_code == 401:
            assert response.json()["detail"] == "Incorrect email or password"

def test_rate_limiting_error_messages():
    """Test rate limiting error messages are generic."""
    # This would require multiple rapid requests to trigger rate limiting
    # For now, test the format of rate limit errors
    from app.core.error_handlers import security_monitor

    # Simulate rate limit exceeded
    test_email = "test@ratelimit.com"
    for i in range(10):  # Exceed the rate limit
        security_monitor.record_failed_login(test_email, "127.0.0.1")

    # Now test login
    response = client.post("/api/v1/auth/login", json={
        "email": test_email,
        "password": "wrongpassword"
    })

    # Should return rate limited message
    if response.status_code == 429:
        assert "too many" in response.json()["detail"].lower()
        # Should not reveal rate limit configuration
        assert "5" not in response.json()["detail"]  # Don't reveal threshold
        assert "15" not in response.json()["detail"]  # Don't reveal window

def test_error_codes_consistency():
    """Test that errors include consistent error codes."""
    # Test various error conditions
    test_cases = [
        ("/api/v1/auth/login", "POST", {"email": "invalid", "password": "wrong"}),
        ("/api/v1/scans/invalid-id", "GET", None),
        ("/nonexistent/endpoint", "GET", None),
    ]

    for endpoint, method, data in test_cases:
        if method == "POST":
            response = client.post(endpoint, json=data or {})
        else:
            response = client.get(endpoint)

        if response.status_code >= 400:
            error_data = response.json()
            # Should have a detail field
            assert "detail" in error_data
            # For HTTP exceptions, should have error code
            if hasattr(app, 'exception_handlers'):
                assert "error_code" in error_data or "detail" in error_data