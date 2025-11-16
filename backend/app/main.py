import logging
from contextlib import asynccontextmanager
from fastapi import FastAPI, Request, Response, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from starlette.middleware.base import BaseHTTPMiddleware
import os

# Configure logging first to ensure it works even if imports fail
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# RiceGuard Project: Lazy initialization pattern to prevent import-time side effects
# All heavy imports and operations are wrapped in try/except blocks to ensure
# the FastAPI app can be created even if dependencies are missing

# Lazy config loading - wrapped to prevent import failures
try:
    from app.core.config import settings
    SETTINGS_AVAILABLE = True
except ImportError as e:
    logger.warning(f"Config module not available: {e}. Using fallback configuration.")
    SETTINGS_AVAILABLE = False
    # Fallback settings for emergency mode
    class FallbackSettings:
        ALLOWED_ORIGINS = ["*"]
        UPLOAD_DIR = "uploads"
        MAX_UPLOAD_MB = 8
        MONGO_URI = None
        DB_NAME = "riceguard_fallback"
    settings = FallbackSettings()

# Lazy database imports - wrapped to prevent import failures
try:
    from app.core.database import init_database, close_database, ping_database, get_database_stats, DatabaseError
    DATABASE_AVAILABLE = True
except ImportError as e:
    logger.warning(f"Database module not available: {e}. Database features will be disabled.")
    DATABASE_AVAILABLE = False
    DatabaseError = Exception
    
    # Fallback database functions for emergency mode
    async def fallback_init():
        logger.info("Database initialization skipped (fallback mode)")
    async def fallback_close():
        logger.info("Database cleanup skipped (fallback mode)")
    async def fallback_ping():
        return False
    async def fallback_stats():
        return {}
    
    init_database = fallback_init
    close_database = fallback_close
    ping_database = fallback_ping
    get_database_stats = fallback_stats

# Lazy seed imports - wrapped to prevent import failures
try:
    from app.core.seed import seed_recommendations
    SEED_AVAILABLE = True
except ImportError as e:
    logger.warning(f"Seed module not available: {e}. Data seeding will be skipped.")
    SEED_AVAILABLE = False
    
    def fallback_seed():
        logger.info("Data seeding skipped (fallback mode)")
    
    seed_recommendations = fallback_seed

# Lazy error handler imports - wrapped to prevent import failures
try:
    from app.core.error_handlers import handle_generic_error, handle_http_exception
    ERROR_HANDLERS_AVAILABLE = True
except ImportError as e:
    logger.warning(f"Error handler module not available: {e}. Using basic error handling.")
    ERROR_HANDLERS_AVAILABLE = False
    
    # Basic fallback error handlers
    async def fallback_generic_error(request: Request, exc: Exception):
        from fastapi.responses import JSONResponse
        return JSONResponse(
            status_code=500,
            content={"detail": "Internal server error (fallback mode)"}
        )
    
    async def fallback_http_error(request: Request, exc: HTTPException):
        from fastapi.responses import JSONResponse
        return JSONResponse(
            status_code=exc.status_code,
            content={"detail": exc.detail}
        )
    
    handle_generic_error = fallback_generic_error
    handle_http_exception = fallback_http_error

# Lazy router imports - wrapped to prevent import failures
# This ensures the FastAPI app can be created even if API modules fail to import
ROUTER_IMPORTS = []
def lazy_load_routers():
    """Lazy load API routers to prevent import-time failures.
    
    RiceGuard Pattern: Routers are loaded on-demand during lifespan startup,
    not at import time. This prevents the entire application from failing
    if individual router modules have import issues.
    
    Note: Direct imports are used to avoid circular import issues with __init__.py
    """
    global ROUTER_IMPORTS
    if ROUTER_IMPORTS:
        return ROUTER_IMPORTS  # Already loaded
        
    # Import routers directly to avoid circular import from __init__.py
    try:
        from app.api.v1 import auth
        ROUTER_IMPORTS.append(("auth", auth.router))
        logger.info("Auth router loaded successfully")
    except ImportError as e:
        logger.warning(f"Auth router not available: {e}")
    
    try:
        from app.api.v1.scans import router as scans_router
        ROUTER_IMPORTS.append(("scans", scans_router))
        logger.info("Scans router loaded successfully")
    except ImportError as e:
        logger.warning(f"Scans router not available: {e}")
    
    try:
        from app.api.v1.recommendations import router as recommendations_router
        ROUTER_IMPORTS.append(("recommendations", recommendations_router))
        logger.info("Recommendations router loaded successfully")
    except ImportError as e:
        logger.warning(f"Recommendations router not available: {e}")
    
    return ROUTER_IMPORTS


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
        # RiceGuard Pattern: Lazy initialization with graceful degradation
        # All heavy operations are wrapped with proper error handling to ensure
        # the application can start even if some services are unavailable
        
        # Load API routers lazily during startup
        router_imports = lazy_load_routers()
        for router_name, router in router_imports:
            try:
                app.include_router(router, prefix=f"/api/v1/{router_name}", tags=[router_name])
                logger.info(f"{router_name} router registered successfully")
            except Exception as e:
                logger.error(f"Failed to register {router_name} router: {e}")
        
        # Initialize database connection and indexes with error handling
        try:
            await init_database()
            logger.info("Database initialized successfully")
        except Exception as e:
            logger.error(f"Database initialization failed: {e}")
            # Continue startup - database features will be unavailable
        
        # Seed recommendations data with error handling
        try:
            seed_recommendations()
            logger.info("Recommendations seeded successfully")
        except Exception as e:
            logger.error(f"Recommendations seeding failed: {e}")
            # Continue startup - default recommendations may be available

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
try:
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
except Exception as e:
    logger.error(f"Failed to configure CORS middleware: {e}")
    # Continue startup with default CORS

# ---------------------- STATIC FILES -------------------
try:
    if not os.path.exists(settings.UPLOAD_DIR):
        os.makedirs(settings.UPLOAD_DIR)
    app.mount("/uploads", StaticFiles(directory=settings.UPLOAD_DIR), name="uploads")
except Exception as e:
    logger.error(f"Failed to configure static files: {e}")
    # Continue startup without static file serving

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
# RiceGuard Pattern: Routers are now loaded lazily during lifespan startup
# This prevents import-time failures when router modules have missing dependencies
# See lazy_load_routers() function above for router registration logic


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(
        "app.main:app",
        host="0.0.0.0",
        port=8000,
        reload=True
    )