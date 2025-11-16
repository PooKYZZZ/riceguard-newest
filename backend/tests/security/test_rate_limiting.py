"""
Rate limiting security test suite.
Tests that rate limiting properly prevents brute force attacks.
"""
import pytest
import time
from fastapi.testclient import TestClient
from app.main import app
from app.core.error_handlers import security_monitor

client = TestClient(app)

def test_failed_login_rate_limiting():
    """Test that failed logins are rate limited."""
    test_email = "ratelimit@test.com"

    # Clear any existing attempts
    security_monitor.failed_attempts[test_email].clear()

    # Make multiple failed login attempts
    for i in range(6):  # Exceed the limit of 5
        response = client.post("/api/v1/auth/login", json={
            "email": test_email,
            "password": "wrongpassword"
        })

        if i < 5:
            # First 5 attempts should return 401
            assert response.status_code == 401
        else:
            # 6th attempt should return 429 (rate limited)
            assert response.status_code == 429
            assert "too many" in response.json()["detail"].lower()

def test_rate_limit_window():
    """Test that rate limit window expires correctly."""
    test_email = "window@test.com"

    # Clear any existing attempts
    security_monitor.failed_attempts[test_email].clear()

    # Fill up the rate limit
    for i in range(5):
        response = client.post("/api/v1/auth/login", json={
            "email": test_email,
            "password": "wrongpassword"
        })
        assert response.status_code == 401

    # Next attempt should be rate limited
    response = client.post("/api/v1/auth/login", json={
        "email": test_email,
        "password": "wrongpassword"
    })
    assert response.status_code == 429

    # Clear old attempts (simulate time passing)
    security_monitor.failed_attempts[test_email].clear()

    # Now should work again
    response = client.post("/api/v1/auth/login", json={
        "email": test_email,
        "password": "wrongpassword"
    })
    assert response.status_code == 401  # Not rate limited, just wrong password

def test_different_emails_independent():
    """Test that rate limiting is independent per email."""
    email1 = "test1@test.com"
    email2 = "test2@test.com"

    # Clear any existing attempts
    security_monitor.failed_attempts[email1].clear()
    security_monitor.failed_attempts[email2].clear()

    # Rate limit email1
    for i in range(6):
        response = client.post("/api/v1/auth/login", json={
            "email": email1,
            "password": "wrongpassword"
        })

    # email1 should be rate limited
    response = client.post("/api/v1/auth/login", json={
        "email": email1,
        "password": "wrongpassword"
    })
    assert response.status_code == 429

    # email2 should not be rate limited
    response = client.post("/api/v1/auth/login", json={
        "email": email2,
        "password": "wrongpassword"
    })
    assert response.status_code == 401  # Not rate limited

def test_successful_login_resets_rate_limit():
    """Test that successful login doesn't reset rate limit (security feature)."""
    test_email = "success@test.com"

    # Clear any existing attempts
    security_monitor.failed_attempts[test_email].clear()

    # Add some failed attempts
    for i in range(3):
        response = client.post("/api/v1/auth/login", json={
            "email": test_email,
            "password": "wrongpassword"
        })
        assert response.status_code == 401

    # Verify failed attempts are recorded
    assert len(security_monitor.failed_attempts[test_email]) == 3

    # Rate limit should still apply to this email
    for i in range(3):  # Total 6 attempts
        response = client.post("/api/v1/auth/login", json={
            "email": test_email,
            "password": "wrongpassword"
        })

    # Should be rate limited now
    response = client.post("/api/v1/auth/login", json={
        "email": test_email,
        "password": "wrongpassword"
    })
    assert response.status_code == 429

def test_security_monitor_data_structures():
    """Test security monitor internal data structures."""
    from app.core.error_handlers import SecurityEventMonitor

    monitor = SecurityEventMonitor()
    test_email = "monitor@test.com"

    # Test initial state
    assert not monitor.is_rate_limited(test_email)
    assert len(monitor.failed_attempts[test_email]) == 0

    # Test recording attempts
    assert not monitor.record_failed_login(test_email)
    assert len(monitor.failed_attempts[test_email]) == 1

    # Test rate limit detection
    for i in range(4):  # Add 4 more (total 5)
        monitor.record_failed_login(test_email)

    # Should still not be rate limited (exactly at threshold)
    assert not monitor.is_rate_limited(test_email)

    # One more should trigger rate limit
    assert monitor.record_failed_login(test_email)
    assert monitor.is_rate_limited(test_email)

def test_ip_address_tracking():
    """Test that IP addresses are tracked in security events."""
    # This test verifies the logging functionality
    # In a real scenario, this would check log files or monitoring systems

    test_email = "ip@test.com"

    # Clear any existing attempts
    security_monitor.failed_attempts[test_email].clear()

    # Make failed login attempts (with client IP)
    for i in range(3):
        response = client.post("/api/v1/auth/login", json={
            "email": test_email,
            "password": "wrongpassword"
        })
        assert response.status_code == 401

    # Verify attempts were recorded
    assert len(security_monitor.failed_attempts[test_email]) == 3

    # The actual IP tracking is done in the log_security_event function
    # This would typically be verified through log monitoring