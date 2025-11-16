from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles

from app.api.v1 import auth, scans, recommendations
from app.core.config import settings
from app.core.database import ensure_indexes
from app.core.seed import seed_recommendations

import os


@asynccontextmanager
async def lifespan(app: FastAPI):
    ensure_indexes()
    seed_recommendations()
    print("🚀 RiceGuard backend ready (Web + Mobile).")
    yield
    print("🛑 RiceGuard backend shutting down...")


app = FastAPI(
    title="RiceGuard Unified Backend",
    version="1.1",
    description="Single API backend for RiceGuard Web and Mobile applications.",
    lifespan=lifespan,
)

# ---------------------- CORS --------------------------
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.ALLOWED_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ---------------------- STATIC FILES -------------------
if not os.path.exists(settings.UPLOAD_DIR):
    os.makedirs(settings.UPLOAD_DIR)
app.mount("/uploads", StaticFiles(directory=settings.UPLOAD_DIR), name="uploads")

# ---------------------- HEALTH ------------------------
@app.get("/health")
def health():
    return {
        "status": "ok", 
        "message": "RiceGuard backend (Web + Mobile) is running.",
        "version": "1.1"
    }

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