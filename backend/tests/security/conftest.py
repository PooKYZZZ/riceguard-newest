"""
Security test configuration and fixtures.
"""
import pytest
import tempfile
import os
from fastapi.testclient import TestClient
from app.main import app
from app.core.config import settings

@pytest.fixture
def client():
    """Create test client with security headers enabled."""
    return TestClient(app)

@pytest.fixture
def temp_upload_dir():
    """Create temporary upload directory for testing."""
    with tempfile.TemporaryDirectory() as temp_dir:
        # Override the upload directory setting for tests
        original_upload_dir = settings.UPLOAD_DIR
        settings.UPLOAD_DIR = temp_dir
        yield temp_dir
        settings.UPLOAD_DIR = original_upload_dir

@pytest.fixture
def sample_image():
    """Create sample image file for testing."""
    # Simple JPEG header for testing
    jpeg_header = b'\xff\xd8\xff\xe0\x00\x10JFIF'
    return jpeg_header + b'\0' * 1000  # Make it larger than minimum

@pytest.fixture
def valid_user_data():
    """Valid user data for testing."""
    return {
        "email": "test@securitytest.com",
        "password": "SecureP@ssw0rd!",
        "name": "Security Test User"
    }

@pytest.fixture
def weak_passwords():
    """List of weak passwords for testing."""
    return [
        "password",
        "12345678",
        "qwerty",
        "Password",
        "password1",
        "1234567890"
    ]

@pytest.fixture
def strong_passwords():
    """List of strong passwords for testing."""
    return [
        "SecureP@ssw0rd!",
        "MyP@ssword123",
        "RiceGuard#2024",
        "Complex!Pass9"
    ]

@pytest.fixture
def malicious_filenames():
    """List of malicious filenames for testing."""
    return [
        "../../../etc/passwd.jpg",
        "..\\..\\windows\\system32\\config.jpg",
        "<script>alert('xss')</script>.jpg",
        "image\x00.jpg",  # Null byte injection
        "con.jpg",  # Windows reserved name
        "a" * 300 + ".jpg",  # Too long
        "image<script>alert(1)</script>.jpg",
        "image.jpg\r\n\r\nHTTP/1.1 200 OK\r\n\r\n<script>alert(1)</script>",
    ]

@pytest.fixture(autouse=True)
def cleanup_security_monitor():
    """Clean up security monitor before each test."""
    from app.core.error_handlers import security_monitor
    security_monitor.failed_attempts.clear()
    yield
    security_monitor.failed_attempts.clear()

# Override database connection for testing
@pytest.fixture(autouse=True)
def test_db():
    """Use test database configuration."""
    # This would typically connect to a test database
    # For now, we'll let the tests handle database errors gracefully
    yield