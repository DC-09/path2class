"""
Path2Class — Backend API
Campus AR navigation system.
Serves both the REST API and the frontend PWA from a single port.
"""

import logging
from pathlib import Path

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse

from config import settings
from routers import session, navigation, detect, assistant

# Logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Paths
FRONTEND_DIR = Path(__file__).parent.parent.parent / "frontend"

# App
app = FastAPI(
    title="Path2Class API",
    description="Backend API for the Path2Class campus AR navigation system.",
    version="0.1.0",
)

# CORS
origins = [o.strip() for o in settings.cors_origins.split(",")]
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# API Routers (must be registered before the static file catch-all)
app.include_router(session.router)
app.include_router(navigation.router)
app.include_router(detect.router)
app.include_router(assistant.router)


@app.get("/health")
async def health():
    return {"status": "ok"}


# Serve frontend static files
if FRONTEND_DIR.exists():
    app.mount("/static", StaticFiles(directory=str(FRONTEND_DIR)), name="static")

    # Serve index.html for all non-API routes (PWA routing)
    @app.get("/{full_path:path}")
    async def serve_frontend(full_path: str):
        # Specific static assets (css, js, icons, etc.)
        asset = FRONTEND_DIR / full_path
        if asset.exists() and asset.is_file():
            return FileResponse(str(asset))
        # Everything else → index.html
        return FileResponse(str(FRONTEND_DIR / "index.html"))
else:
    logger.warning(f"Frontend directory not found at {FRONTEND_DIR}. Only API endpoints available.")
