# backend/main.py
import asyncio
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from backend.database.db import init_db
from backend.ml.model_cache import (
    get_whisper_model,
    get_translator_to_en,
    get_summarizer,
    get_sentiment_analyzer,
    get_emotion_analyzer
)
from backend.routers.analyze import router as analyze_router
from backend.worker import podcast_worker

app = FastAPI(title="Podcast Analyzer API", version="1.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"],
    allow_methods=["*"],
    allow_headers=["*"]
)

@app.on_event("startup")
async def startup():
    init_db()
    # Pre-load all models on startup so first request is fast
    try:
        get_whisper_model()
        get_translator_to_en()
        get_summarizer()
        get_sentiment_analyzer()
        get_emotion_analyzer()
    except Exception as e:
        import logging
        logging.error(f"Error preloading models during startup: {e}")
        
    # Start background worker task
    asyncio.create_task(podcast_worker.start())

@app.on_event("shutdown")
async def shutdown():
    podcast_worker.running = False

app.include_router(analyze_router, prefix="")

@app.get("/health")
def health():
    return {"status": "ok"}
