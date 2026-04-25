from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.config import get_settings
from app.routers import context, offers, merchants, redemption

settings = get_settings()

app = FastAPI(
    title="City Wallet API",
    description="AI-powered city wallet — context-aware offer generation and redemption",
    version="0.1.0",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(context.router)
app.include_router(offers.router)
app.include_router(merchants.router)
app.include_router(redemption.router)


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
