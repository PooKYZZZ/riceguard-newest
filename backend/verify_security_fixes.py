#!/usr/bin/env python3
"""
Security verification script for RiceGuard backend.
Tests all security fixes implemented.
"""
import asyncio
import aiohttp
import requests
from typing import Dict, Any

class SecurityVerifier:
    def __init__(self, base_url: str = "http://localhost:8000"):
        self.base_url = base_url
        self.results = []

    def log_test(self, test_name: str, passed: bool, details: str = ""):
        """Log test result."""
        status = "✅ PASS" if passed else "❌ FAIL"
        self.results.append({
            "test": test_name,
            "status": status,
            "details": details
        })
        print(f"{status}: {test_name}")
        if details:
            print(f"    {details}")

    async def test_security_headers(self):
        """Test security headers are present."""
        try:
            async with aiohttp.ClientSession() as session:
                async with session.get(f"{self.base_url}/health") as response:
                    headers = response.headers

                    tests = [
                        ("X-Content-Type-Options", headers.get("X-Content-Type-Options") == "nosniff"),
                        ("X-Frame-Options", headers.get("X-Frame-Options") == "DENY"),
                        ("X-XSS-Protection", headers.get("X-XSS-Protection") == "1; mode=block"),
                        ("Referrer-Policy", "strict-origin-when-cross-origin" in headers.get("Referrer-Policy", "")),
                        ("Content-Security-Policy", "Content-Security-Policy" in headers),
                        ("Strict-Transport-Security", "Strict-Transport-Security" in headers),
                    ]

                    for header_name, passed in tests:
                        self.log_test(
                            f"Security Header: {header_name}",
                            passed,
                            f"Value: {headers.get(header_name, 'MISSING')}"
                        )

        except Exception as e:
            self.log_test("Security Headers Test", False, f"Connection error: {e}")

    def test_cors_configuration(self):
        """Test CORS configuration is restricted."""
        try:
            # Test with allowed origin
            response = requests.options(
                f"{self.base_url}/api/v1/auth/login",
                headers={"Origin": "http://localhost:3000"}
            )

            allowed_methods = response.headers.get("access-control-allow-methods", "")
            allowed_headers = response.headers.get("access-control-allow-headers", "")

            # Check that methods are restricted (not "*")
            methods_restricted = "*" not in allowed_methods and "GET" in allowed_methods
            headers_restricted = "*" not in allowed_headers and "authorization" in allowed_headers.lower()

            self.log_test(
                "CORS Methods Restricted",
                methods_restricted,
                f"Methods: {allowed_methods}"
            )
            self.log_test(
                "CORS Headers Restricted",
                headers_restricted,
                f"Headers: {allowed_headers}"
            )

            # Test with disallowed origin
            response = requests.options(
                f"{self.base_url}/api/v1/auth/login",
                headers={"Origin": "http://malicious-site.com"}
            )
            no_cors = "access-control-allow-origin" not in response.headers
            self.log_test(
                "CORS Blocks Disallowed Origins",
                no_cors,
                "Disallowed origin should not get CORS headers"
            )

        except Exception as e:
            self.log_test("CORS Configuration Test", False, f"Connection error: {e}")

    def test_input_validation(self):
        """Test input validation for user registration."""
        weak_passwords = [
            "password",
            "12345678",
            "PASSWORD",
            "Password1",
            "Pass!"
        ]

        for password in weak_passwords:
            try:
                response = requests.post(
                    f"{self.base_url}/api/v1/auth/register",
                    json={
                        "email": "test@example.com",
                        "password": password,
                        "name": "Test User"
                    }
                )
                # Should return 422 for validation errors
                passed = response.status_code == 422
                self.log_test(
                    f"Weak Password Rejected: {password[:10]}...",
                    passed,
                    f"Status: {response.status_code}"
                )
            except Exception as e:
                self.log_test(f"Weak Password Test: {password[:10]}...", False, f"Error: {e}")

    def test_jwt_security(self):
        """Test JWT configuration."""
        try:
            # Import and test JWT settings
            from app.core.config import settings

            secret = settings.JWT_SECRET
            secret_is_strong = (
                len(secret) >= 32 and
                secret != "CHANGE_ME_SUPER_SECRET" and
                secret != "ZNH1EyZEB8nmm7xNqUqf9FABdXcaFuyl"  # Old weak secret
            )

            self.log_test(
                "JWT Secret Strength",
                secret_is_strong,
                f"Length: {len(secret)} characters"
            )

            # Test JWT token creation
            from app.core.security import create_access_token, decode_access_token

            token = create_access_token(data={"sub": "test@example.com"})
            payload = decode_access_token(token)

            token_has_required_claims = "sub" in payload and "exp" in payload
            self.log_test(
                "JWT Token Structure",
                token_has_required_claims,
                f"Claims: {list(payload.keys())}"
            )

        except Exception as e:
            self.log_test("JWT Security Test", False, f"Error: {e}")

    def test_error_messages(self):
        """Test error messages don't expose sensitive information."""
        try:
            # Test login with invalid credentials
            response = requests.post(
                f"{self.base_url}/api/v1/auth/login",
                json={
                    "email": "nonexistent@test.com",
                    "password": "wrongpassword"
                }
            )

            if response.status_code == 401:
                error_detail = response.json().get("detail", "")
                # Should be generic message
                is_generic = error_detail == "Incorrect email or password"
                self.log_test(
                    "Generic Login Error Message",
                    is_generic,
                    f"Message: {error_detail}"
                )

            # Test invalid scan ID
            response = requests.get(f"{self.base_url}/api/v1/scans/invalid-id")
            if response.status_code >= 400:
                error_detail = response.json().get("detail", "")
                # Should not contain database details
                no_internal_details = "mongodb" not in error_detail.lower()
                self.log_test(
                    "No Internal Error Details",
                    no_internal_details,
                    f"Error: {error_detail[:50]}..."
                )

        except Exception as e:
            self.log_test("Error Message Test", False, f"Connection error: {e}")

    def test_rate_limiting(self):
        """Test rate limiting functionality."""
        try:
            from app.core.error_handlers import security_monitor

            test_email = "ratelimit@test.com"
            security_monitor.failed_attempts[test_email].clear()

            # Simulate failed attempts
            for i in range(6):
                is_blocked = security_monitor.record_failed_login(test_email, "127.0.0.1")

            # Should be rate limited after 5 attempts
            rate_limit_works = security_monitor.is_rate_limited(test_email)
            self.log_test(
                "Rate Limiting Works",
                rate_limit_works,
                f"Attempts recorded: {len(security_monitor.failed_attempts[test_email])}"
            )

        except Exception as e:
            self.log_test("Rate Limiting Test", False, f"Error: {e}")

    def run_all_tests(self):
        """Run all security tests."""
        print("🔒 Running RiceGuard Security Verification Tests")
        print("=" * 60)

        # Run synchronous tests
        self.test_cors_configuration()
        self.test_input_validation()
        self.test_jwt_security()
        self.test_error_messages()
        self.test_rate_limiting()

        # Run async tests
        print("\nRunning async tests...")
        asyncio.run(self.test_security_headers())

        # Print summary
        print("\n" + "=" * 60)
        print("📊 SECURITY VERIFICATION SUMMARY")
        print("=" * 60)

        passed = sum(1 for r in self.results if "✅" in r["status"])
        total = len(self.results)

        for result in self.results:
            print(f"{result['status']}: {result['test']}")
            if result["details"]:
                print(f"    {result['details']}")

        print(f"\n📈 RESULTS: {passed}/{total} tests passed")

        if passed == total:
            print("🎉 ALL SECURITY FIXES VERIFIED SUCCESSFULLY!")
        else:
            print("⚠️  Some security tests failed. Please review the issues above.")

        return passed == total

if __name__ == "__main__":
    verifier = SecurityVerifier()
    verifier.run_all_tests()