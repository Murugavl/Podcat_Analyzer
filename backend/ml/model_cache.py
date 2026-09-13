# backend/ml/model_cache.py
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
