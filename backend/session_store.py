# backend/session_store.py
"""In-memory, per-session job store.

Replaces the old SQLite database. Nothing is written to disk: each browser
gets an opaque id in a cookie (see backend/dependencies.py), and only ever
sees the jobs created under its own id. History resets when the server
restarts — that's the tradeoff for not needing a database file.
"""
import threading
from typing import Dict, List, Optional

from backend.models import AnalysisResult, AnalysisStatus, EmotionRow, SentimentResult

SESSION_COOKIE_NAME = "echoscribe_session"

_lock = threading.Lock()
_sessions: Dict[str, Dict[str, AnalysisResult]] = {}


def save_job(session_id: str, result: AnalysisResult) -> None:
    with _lock:
        _sessions.setdefault(session_id, {})[result.job_id] = result


def get_job(session_id: str, job_id: str) -> Optional[AnalysisResult]:
    with _lock:
        return _sessions.get(session_id, {}).get(job_id)


def get_all_jobs(session_id: str) -> List[AnalysisResult]:
    with _lock:
        jobs = list(_sessions.get(session_id, {}).values())
    return sorted(jobs, key=lambda j: j.created_at, reverse=True)


def delete_job(session_id: str, job_id: str) -> bool:
    with _lock:
        session = _sessions.get(session_id)
        if not session or job_id not in session:
            return False
        del session[job_id]
        return True


def update_job_status(
    session_id: str,
    job_id: str,
    status: str,
    data: Optional[dict] = None,
    error: Optional[str] = None,
) -> None:
    with _lock:
        session = _sessions.get(session_id)
        if not session or job_id not in session:
            return
        job = session[job_id]
        job.status = AnalysisStatus(status)

        if status == "complete" and data:
            job.detected_language = data.get("detected_language", "")
            job.transcript = data.get("transcript", "")
            job.translated_transcript = data.get("translated_transcript", "")
            job.summary_en = data.get("summary_en", "")
            job.summary_original = data.get("summary_original", "")
            sentiment = data.get("sentiment")
            job.sentiment = SentimentResult(**sentiment) if sentiment else None
            job.emotions = [EmotionRow(**e) for e in data.get("emotions", [])]
            job.error = None
        elif status == "failed":
            job.error = error or "Unknown error"
