import logging
from contextlib import asynccontextmanager
from fastapi import FastAPI, Request, Response, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from starlette.middleware.base import BaseHTTPMiddleware

from app.api.v1 import auth, scans, recommendations
from app.core.config import settings
from app.core.database import init_database, close_database, ping_database, get_database_stats, DatabaseError
from app.core.seed import seed_recommendations
from app.core.error_handlers import handle_generic_error, handle_http_exception

import os

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)


class SecurityHeadersMiddleware(BaseHTTPMiddleware):
    async def dispatch(self, request: Request, call_next):
        response = await call_next(request)

        # Security headers
        response.headers["X-Content-Type-Options"] = "nosniff"
        response.headers["X-Frame-Options"] = "DENY"
        response.headers["X-XSS-Protection"] = "1; mode=block"
        response.headers["Referrer-Policy"] = "strict-origin-when-cross-origin"
        response.headers["Content-Security-Policy"] = (
            "default-src 'self'; "
            "script-src 'self' 'unsafe-inline'; "
            "style-src 'self' 'unsafe-inline'; "
            "img-src 'self' data: blob:; "
            "font-src 'self'; "
            "connect-src 'self'"
        )
        response.headers["Strict-Transport-Security"] = "max-age=31536000; includeSubDomains"

        return response


@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup
    logger.info("Starting RiceGuard backend...")

    try:
        # Initialize database connection and indexes
        await init_database()
        logger.info("Database initialized successfully")

        # Seed recommendations data
        seed_recommendations()
        logger.info("Recommendations seeded successfully")

        logger.info("RiceGuard backend ready (Web + Mobile).")

    except DatabaseError as e:
        logger.error(f"Database initialization failed: {str(e)}")
        # Continue startup but database will be unavailable
    except Exception as e:
        logger.error(f"Startup error: {str(e)}")
        raise

    yield

    # Shutdown
    logger.info("RiceGuard backend shutting down...")
    await close_database()
    logger.info("Database connection closed")


app = FastAPI(
    title="RiceGuard Unified Backend",
    version="1.1",
    description="Single API backend for RiceGuard Web and Mobile applications.",
    lifespan=lifespan,
)

# ---------------------- SECURITY HEADERS -----------------
app.add_middleware(SecurityHeadersMiddleware)

# ---------------------- CORS --------------------------
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.ALLOWED_ORIGINS,
    allow_credentials=True,
    allow_methods=["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allow_headers=[
        "Accept",
        "Accept-Language",
        "Content-Language",
        "Content-Type",
        "Authorization",
        "X-Requested-With"
    ],
)

# ---------------------- STATIC FILES -------------------
if not os.path.exists(settings.UPLOAD_DIR):
    os.makedirs(settings.UPLOAD_DIR)
app.mount("/uploads", StaticFiles(directory=settings.UPLOAD_DIR), name="uploads")

# ---------------------- HEALTH ------------------------
@app.get("/health")
async def health():
    """Basic health check endpoint"""
    return {
        "status": "ok",
        "message": "RiceGuard backend (Web + Mobile) is running.",
        "version": "1.1"
    }

@app.get("/health/db")
async def database_health():
    """Detailed database health check endpoint"""
    try:
        # Test database connectivity
        is_connected = await ping_database()

        # Get database statistics
        stats = await get_database_stats()

        health_status = {
            "database": {
                "status": "connected" if is_connected else "disconnected",
                "connected": is_connected,
                "stats": stats
            }
        }

        if not is_connected:
            raise HTTPException(
                status_code=503,
                detail={
                    "error": "Database unavailable",
                    "health": health_status
                }
            )

        return {
            "status": "healthy",
            "message": "Database connection is healthy",
            "health": health_status
        }

    except DatabaseError as e:
        raise HTTPException(
            status_code=503,
            detail={
                "error": "Database error",
                "message": str(e)
            }
        )
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail={
                "error": "Health check failed",
                "message": str(e)
            }
        )

# ---------------------- ERROR HANDLERS -----------------
app.add_exception_handler(Exception, handle_generic_error)
app.add_exception_handler(HTTPException, handle_http_exception)

# ---------------------- ROUTERS -----------------------
app.include_router(auth.router, prefix="/api/v1/auth", tags=["auth"])
app.include_router(scans.router, prefix="/api/v1/scans", tags=["scans"])
app.include_router(recommendations.router, prefix="/api/v1/recommendations", tags=["recommendations"])


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(
        "app.main:app",
        host="0.0.0.0",
        port=8000,
        reload=True
    )