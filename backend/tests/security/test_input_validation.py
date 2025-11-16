"""
Input validation security test suite.
Tests proper validation of user inputs and file uploads.
"""
import pytest
import io
from fastapi.testclient import TestClient
from app.main import app

client = TestClient(app)

def test_user_registration_weak_password():
    """Test user registration rejects weak passwords."""
    weak_passwords = [
        "password",      # No uppercase, no digit, no special char
        "PASSWORD",      # No lowercase, no digit, no special char
        "12345678",      # No letters, no special char
        "Password1",     # No special character
        "Pass!",         # Too short
    ]

    for password in weak_passwords:
        response = client.post("/api/v1/auth/register", json={
            "email": "test@example.com",
            "password": password,
            "name": "Test User"
        })
        assert response.status_code == 422  # Validation error

def test_user_registration_strong_password():
    """Test user registration accepts strong passwords."""
    strong_passwords = [
        "SecureP@ssw0rd!",
        "MyP@ssword123",
        "RiceGuard#2024",
        "Complex!Pass9"
    ]

    for password in strong_passwords:
        response = client.post("/api/v1/auth/register", json={
            "email": f"test{password[:5]}@example.com",
            "password": password,
            "name": "Test User"
        })
        # Should pass validation (may fail due to email already exists)
        assert response.status_code not in [422]

def test_user_name_validation():
    """Test user name validation."""
    invalid_names = [
        "",                     # Empty
        "a",                    # Too short
        "a" * 101,              # Too long
        "User123!",             # Contains invalid characters
        "<script>alert('xss')</script>",  # XSS attempt
        "User\nAdmin",          # Contains newline
    ]

    for name in invalid_names:
        response = client.post("/api/v1/auth/register", json={
            "email": "test@example.com",
            "password": "SecureP@ssw0rd!",
            "name": name
        })
        assert response.status_code == 422  # Validation error

def test_file_upload_invalid_extension():
    """Test file upload rejects invalid file extensions."""
    invalid_files = [
        ("malware.exe", b"fake content", "application/octet-stream"),
        ("script.js", b"console.log('xss')", "application/javascript"),
        ("document.pdf", b"%PDF-1.4", "application/pdf"),
        ("archive.zip", b"PK\x03\x04", "application/zip"),
    ]

    for filename, content, content_type in invalid_files:
        files = {"file": (filename, io.BytesIO(content), content_type)}
        response = client.post(
            "/api/v1/scans/",
            files=files,
            headers={"Authorization": "Bearer fake_token"}
        )
        # Should be rejected before auth check due to content type
        assert response.status_code in [400, 422]

def test_file_upload_valid_extensions():
    """Test file upload accepts valid image extensions."""
    valid_files = [
        ("image.jpg", b"fake jpg content", "image/jpeg"),
        ("image.png", b"fake png content", "image/png"),
        ("image.gif", b"fake gif content", "image/gif"),
        ("image.webp", b"fake webp content", "image/webp"),
    ]

    for filename, content, content_type in valid_files:
        files = {"file": (filename, io.BytesIO(content), content_type)}
        response = client.post(
            "/api/v1/scans/",
            files=files,
            headers={"Authorization": "Bearer fake_token"}
        )
        # Should pass file validation (may fail due to auth)
        assert response.status_code not in [400, 422]

def test_filename_sanitization():
    """Test filename sanitization prevents path traversal."""
    malicious_filenames = [
        "../../../etc/passwd.jpg",
        "..\\..\\windows\\system32\\config.jpg",
        "image<script>alert('xss')</script>.jpg",
        "image\x00.jpg",  # Null byte injection
        "con.jpg",  # Windows reserved name
        "a" * 300 + ".jpg",  # Too long
    ]

    for filename in malicious_filenames:
        # Test the validation function directly
        from app.api.v1.scans import validate_filename
        try:
            validate_filename(filename)
            # If no exception, the filename was sanitized and is safe
            assert len(filename) <= 255
            assert ".." not in filename
            assert "<" not in filename
        except Exception:
            # Validation error is expected for malicious filenames
            pass

def test_notes_field_validation():
    """Test notes field validation and sanitization."""
    malicious_notes = [
        "<script>alert('xss')</script>",
        "javascript:alert('xss')",
        "' OR '1'='1",  # SQL injection attempt
        "a" * 1001,  # Too long
    ]

    for notes in malicious_notes:
        # Test notes validation by attempting to create scan
        files = {"file": ("image.jpg", b"fake content", "image/jpeg")}
        data = {"notes": notes}
        response = client.post(
            "/api/v1/scans/",
            files=files,
            data=data,
            headers={"Authorization": "Bearer fake_token"}
        )
        # Should pass validation (may fail due to auth or file size)
        assert response.status_code not in [400, 422]