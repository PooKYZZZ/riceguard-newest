#!/usr/bin/env python3
"""
RiceGuard Server Runner

Production-ready server runner with proper environment handling.
"""

import os
import sys
import uvicorn
from pathlib import Path

def main():
    # Add backend to path
    backend_dir = Path(__file__).parent.parent
    sys.path.insert(0, str(backend_dir))

    # Load configuration
    from app.core.config import get_settings
    settings = get_settings()

    # Configure uvicorn based on environment
    uvicorn_config = {
        "app": "app.main:app",
        "host": "0.0.0.0",
        "port": 8000,
        "log_level": settings.LOG_LEVEL.lower(),
        "access_log": True,
    }

    # Development-specific settings
    if settings.IS_DEVELOPMENT:
        uvicorn_config.update({
            "reload": settings.RELOAD,
            "reload_dirs": [str(backend_dir / "app")],
        })

    # Production-specific settings
    if settings.IS_PRODUCTION:
        uvicorn_config.update({
            "workers": 4,  # Number of worker processes
            "limit_concurrency": 1000,
            "limit_max_requests": 10000,
            "timeout_keep_alive": 65,
        })

    # Testing-specific settings
    if settings.IS_TESTING:
        uvicorn_config.update({
            "reload": False,
            "log_level": "error",
        })

    print(f"🚀 Starting RiceGuard backend in {settings.ENVIRONMENT} mode")
    print(f"📋 Configuration:")
    print(f"   - Environment: {settings.ENVIRONMENT}")
    print(f"   - Debug: {settings.DEBUG}")
    print(f"   - Log Level: {settings.LOG_LEVEL}")
    print(f"   - Database: {settings.DB_NAME}")
    print(f"   - Upload Dir: {settings.UPLOAD_DIR}")
    print(f"   - Reload: {settings.RELOAD}")

    # Start server
    uvicorn.run(**uvicorn_config)

if __name__ == "__main__":
    main()