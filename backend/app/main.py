"""
Path2Class — Backend API
Campus AR navigation system.
"""

import logging

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from config import settings
from routers import session, navigation, detect, assistant

# Logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

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
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Routers
app.include_router(session.router)
app.include_router(navigation.router)
app.include_router(detect.router)
app.include_router(assistant.router)


@app.get("/")
async def root():
    return {
        "name": "Path2Class API",
        "version": "0.1.0",
        "status": "running",
        "docs": "/docs",
    }


@app.get("/health")
async def health():
    return {"status": "ok"}
