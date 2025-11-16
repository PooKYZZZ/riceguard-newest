"""
Centralized error handling utilities for RiceGuard API.
"""
import logging
from typing import Union
from fastapi import HTTPException, status
from fastapi.responses import JSONResponse
from fastapi import Request

logger = logging.getLogger(__name__)

class RiceGuardError(Exception):
    """Base exception for RiceGuard application."""
    def __init__(self, message: str, status_code: int = 500):
        self.message = message
        self.status_code = status_code
        super().__init__(self.message)

class ValidationError(RiceGuardError):
    """Validation related errors."""
    def __init__(self, message: str):
        super().__init__(message, status.HTTP_400_BAD_REQUEST)

class AuthenticationError(RiceGuardError):
    """Authentication related errors."""
    def __init__(self, message: str = "Authentication failed"):
        super().__init__(message, status.HTTP_401_UNAUTHORIZED)

class AuthorizationError(RiceGuardError):
    """Authorization related errors."""
    def __init__(self, message: str = "Access denied"):
        super().__init__(message, status.HTTP_403_FORBIDDEN)

class NotFoundError(RiceGuardError):
    """Resource not found errors."""
    def __init__(self, message: str = "Resource not found"):
        super().__init__(message, status.HTTP_404_NOT_FOUND)

class FileProcessingError(RiceGuardError):
    """File processing related errors."""
    def __init__(self, message: str = "File processing failed"):
        super().__init__(message, status.HTTP_500_INTERNAL_SERVER_ERROR)

class DatabaseError(RiceGuardError):
    """Database related errors."""
    def __init__(self, message: str = "Database operation failed"):
        super().__init__(message, status.HTTP_500_INTERNAL_SERVER_ERROR)

def handle_generic_error(request: Request, exc: Exception) -> JSONResponse:
    """Handle generic exceptions and prevent information leakage."""
    logger.error(f"Unhandled error: {exc}", exc_info=True)

    return JSONResponse(
        status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
        content={
            "detail": "An internal server error occurred",
            "error_code": "INTERNAL_ERROR"
        }
    )

def handle_http_exception(request: Request, exc: HTTPException) -> JSONResponse:
    """Handle HTTP exceptions with consistent error format."""
    return JSONResponse(
        status_code=exc.status_code,
        content={
            "detail": exc.detail,
            "error_code": f"HTTP_{exc.status_code}"
        }
    )

def log_security_event(event_type: str, details: dict, user_id: str = None):
    """Log security-related events for monitoring."""
    log_data = {
        "event_type": event_type,
        "details": details,
        "user_id": user_id,
        "ip_address": details.get("ip_address"),
        "user_agent": details.get("user_agent")
    }
    logger.warning(f"Security event: {event_type} - {log_data}")

# Rate limiting for security events (in-memory store for demonstration)
from collections import defaultdict
from datetime import datetime, timedelta

class SecurityEventMonitor:
    """Monitor security events for potential attacks."""

    def __init__(self):
        self.failed_attempts = defaultdict(list)
        self.max_attempts = 5
        self.window_minutes = 15

    def record_failed_login(self, identifier: str, ip_address: str = None):
        """Record failed login attempt."""
        now = datetime.utcnow()
        self.failed_attempts[identifier].append(now)

        # Clean old attempts
        cutoff = now - timedelta(minutes=self.window_minutes)
        self.failed_attempts[identifier] = [
            attempt for attempt in self.failed_attempts[identifier]
            if attempt > cutoff
        ]

        # Check if rate limit exceeded
        if len(self.failed_attempts[identifier]) >= self.max_attempts:
            log_security_event("BRUTE_FORCE_DETECTED", {
                "identifier": identifier,
                "attempts": len(self.failed_attempts[identifier]),
                "ip_address": ip_address
            })
            return True
        return False

    def is_rate_limited(self, identifier: str) -> bool:
        """Check if identifier is currently rate limited."""
        now = datetime.utcnow()
        cutoff = now - timedelta(minutes=self.window_minutes)

        recent_attempts = [
            attempt for attempt in self.failed_attempts[identifier]
            if attempt > cutoff
        ]

        return len(recent_attempts) >= self.max_attempts

# Global security monitor instance
security_monitor = SecurityEventMonitor()