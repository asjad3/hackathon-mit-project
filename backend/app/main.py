import logging

from fastapi import FastAPI, Request
from fastapi.responses import JSONResponse
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager

from app.config import get_settings
from app.routers import context, finalize, offers, merchants, redemption
from app.database.db import init_db
from app.database.seed import seed_merchants
from app.database.db import SessionLocal

settings = get_settings()
logger = logging.getLogger(__name__)


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Lifespan context manager for startup and shutdown events."""
    # Startup
    logger.info("Initializing database...")
    init_db()
    
    # Seed merchants from JSON
    db = SessionLocal()
    try:
        seed_merchants(db)
    finally:
        db.close()
    
    logger.info("Database initialized and seeded")
    
    yield
    
    # Shutdown
    logger.info("Shutting down...")


app = FastAPI(
    title="City Wallet API",
    description="AI-powered city wallet — context-aware offer generation and redemption",
    version="0.1.0",
    lifespan=lifespan,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins,
    allow_credentials=False,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(context.router)
app.include_router(offers.router)
app.include_router(finalize.router)
app.include_router(merchants.router)
app.include_router(redemption.router)


@app.exception_handler(Exception)
async def unhandled_exception_handler(request: Request, exc: Exception):
    logger.exception("Unhandled error for %s %s", request.method, request.url.path)
    return JSONResponse(
        status_code=500,
        content={"detail": "Internal server error"},
    )


@app.get("/")
async def root():
    return {
        "app": settings.app_name,
        "version": "0.1.0",
        "status": "running",
        "docs": "/docs",
    }


@app.get("/health")
async def health():
    return {"status": "ok"}
