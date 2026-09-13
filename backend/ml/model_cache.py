# backend/ml/model_cache.py
import gc

import whisper
from transformers import pipeline
from functools import lru_cache
from backend.config import settings

@lru_cache(maxsize=1)
def get_whisper_model():
    return whisper.load_model(settings.WHISPER_MODEL_SIZE)

@lru_cache(maxsize=1)
def get_translator_to_en():
    return pipeline("translation", model="Helsinki-NLP/opus-mt-mul-en")

@lru_cache(maxsize=1)
def get_summarizer():
    # distilbart-cnn-12-6 (~300MB) instead of bart-large-cnn (~1.6GB) — the
    # latter alone blows past a 512MB free-tier instance.
    return pipeline("summarization", model="sshleifer/distilbart-cnn-12-6")

@lru_cache(maxsize=1)
def get_sentiment_analyzer():
    return pipeline("sentiment-analysis")

@lru_cache(maxsize=1)
def get_emotion_analyzer():
    return pipeline(
        "text-classification",
        model="j-hartmann/emotion-english-distilroberta-base",
        top_k=None
    )

@lru_cache(maxsize=8)
def get_translator_back(lang_code):
    model_name = f"Helsinki-NLP/opus-mt-en-{lang_code}"
    return pipeline("translation", model=model_name)


_CACHED_GETTERS = (
    get_whisper_model,
    get_translator_to_en,
    get_summarizer,
    get_sentiment_analyzer,
    get_emotion_analyzer,
    get_translator_back,
)


def release(*getters) -> None:
    """Drop cached model(s) so their memory can be reclaimed.

    On a memory-constrained instance (e.g. Render's free 512MB tier), this
    app can't keep every model resident at once — bart/whisper/marian/etc.
    add up to several GB combined. The worker calls this after each
    pipeline step so only one model's weights are loaded at a time; the
    tradeoff is that a later job reloads that model from local disk cache
    (still on disk, not re-downloaded) rather than reusing an in-memory
    instance.
    """
    targets = getters or _CACHED_GETTERS
    for getter in targets:
        getter.cache_clear()
    gc.collect()
