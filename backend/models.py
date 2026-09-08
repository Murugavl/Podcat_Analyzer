# backend/models.py
from enum import Enum
from typing import List, Optional
from pydantic import BaseModel

class AnalysisStatus(str, Enum):
    PENDING = "pending"
    PROCESSING = "processing"
    COMPLETE = "complete"
    FAILED = "failed"

class SentimentResult(BaseModel):
    label: str
    score: float

class EmotionRow(BaseModel):
    chunk: str
    emotion: str
    score: float

class AnalysisResult(BaseModel):
    job_id: str
    status: AnalysisStatus
    filename: str
    detected_language: str = ""
    transcript: str = ""
    translated_transcript: str = ""
    summary_en: str = ""
    summary_original: str = ""
    sentiment: Optional[SentimentResult] = None
    emotions: List[EmotionRow] = []
    error: Optional[str] = None
    created_at: str = ""

class EnqueueResponse(BaseModel):
    job_id: str
    status: AnalysisStatus

class JobStatusResponse(BaseModel):
    job_id: str
    status: AnalysisStatus
    error: Optional[str] = None

