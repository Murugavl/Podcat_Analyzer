# backend/main.py
import asyncio
import logging
import os
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from backend.config import settings
from backend.ml.model_cache import (
    get_whisper_model,
    get_translator_to_en,
    get_summarizer,
    get_sentiment_analyzer,
    get_emotion_analyzer
)
from backend.routers.analyze import router as analyze_router
from backend.worker import podcast_worker

log_dir = os.path.dirname(settings.LOG_FILE)
if log_dir:
    os.makedirs(log_dir, exist_ok=True)

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s %(levelname)s %(name)s: %(message)s",
    handlers=[logging.FileHandler(settings.LOG_FILE), logging.StreamHandler()],
)
logger = logging.getLogger(__name__)

app = FastAPI(title="Echoscribe API", version="1.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.allowed_origins_list,
    allow_credentials=True,  # the session cookie rides on every request
    allow_methods=["*"],
    allow_headers=["*"]
)

@app.on_event("startup")
async def startup():
    # Pre-load all models on startup so first request is fast
    try:
        get_whisper_model()
        get_translator_to_en()
        get_summarizer()
        get_sentiment_analyzer()
        get_emotion_analyzer()
    except Exception as e:
        logger.error(f"Error preloading models during startup: {e}")

    # Start background worker task
    asyncio.create_task(podcast_worker.start())

@app.on_event("shutdown")
async def shutdown():
    podcast_worker.running = False

app.include_router(analyze_router, prefix="")

@app.get("/health")
def health():
    return {"status": "ok"}
