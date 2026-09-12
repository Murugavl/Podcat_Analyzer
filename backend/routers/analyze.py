# backend/routers/analyze.py
import os
import re
import uuid
import logging
from datetime import datetime, timezone
from typing import List
from fastapi import APIRouter, UploadFile, File, HTTPException, Depends
from fastapi.responses import FileResponse
from starlette.background import BackgroundTask

from backend.config import settings
from backend.dependencies import get_session_id
from backend.models import (
    AnalysisResult,
    AnalysisStatus,
    EnqueueResponse,
    JobStatusResponse
)
from backend import session_store
from backend.ml.tts import synthesize_speech
from backend.worker import podcast_worker

router = APIRouter()

# Configure logging inside router
logger = logging.getLogger(__name__)

@router.post("/api/analyze", response_model=EnqueueResponse, status_code=202)
async def analyze_audio(
    file: UploadFile = File(...),
    session_id: str = Depends(get_session_id),
):
    # 1. Validate file extension
    filename = file.filename or "audio.mp3"
    ext = filename.split(".")[-1].lower() if "." in filename else ""
    if ext not in ["mp3", "wav", "m4a", "flac"]:
        raise HTTPException(status_code=400, detail="Unsupported format")

    # 2. Validate file size.
    # Starlette's UploadFile.seek() takes only an offset (no whence) and
    # tell() is synchronous, so measure via the underlying file object.
    file.file.seek(0, os.SEEK_END)
    file_size_bytes = file.file.tell()
    file.file.seek(0)  # reset cursor

    max_size_bytes = settings.MAX_UPLOAD_SIZE_MB * 1024 * 1024
    if file_size_bytes > max_size_bytes:
        raise HTTPException(status_code=413, detail="File too large")

    # 3. Create job_id and initial PENDING job record
    job_id = str(uuid.uuid4())
    created_at = datetime.now(timezone.utc).isoformat()

    result = AnalysisResult(
        job_id=job_id,
        status=AnalysisStatus.PENDING,
        filename=filename,
        created_at=created_at
    )
    session_store.save_job(session_id, result)

    # 4. Prepare temp audio path
    os.makedirs(settings.AUDIO_TEMP_DIR, exist_ok=True)
    audio_path = os.path.join(settings.AUDIO_TEMP_DIR, f"{job_id}.mp3")

    try:
        # Write contents to temp file
        contents = await file.read()
        with open(audio_path, "wb") as f:
            f.write(contents)

        # Enqueue the background task
        await podcast_worker.enqueue(session_id, job_id, audio_path, filename)

    except Exception as e:
        logger.exception(f"Failed to enqueue job {job_id}")
        # Clean up audio if file save succeeded but enqueue failed
        if os.path.exists(audio_path):
            try:
                os.remove(audio_path)
            except Exception:
                pass
        result.status = AnalysisStatus.FAILED
        result.error = f"Enqueue failed: {str(e)}"
        session_store.save_job(session_id, result)
        raise HTTPException(status_code=500, detail=f"Failed to enqueue job: {str(e)}")

    return EnqueueResponse(job_id=job_id, status=AnalysisStatus.PENDING)

@router.get("/api/jobs/{job_id}/status", response_model=JobStatusResponse)
def get_job_status_endpoint(job_id: str, session_id: str = Depends(get_session_id)):
    job = session_store.get_job(session_id, job_id)
    if not job:
        raise HTTPException(status_code=404, detail="Job not found")
    return JobStatusResponse(
        job_id=job.job_id,
        status=job.status,
        error=job.error
    )

@router.get("/api/jobs", response_model=List[AnalysisResult])
def list_jobs(session_id: str = Depends(get_session_id)):
    return session_store.get_all_jobs(session_id)

@router.get("/api/jobs/{job_id}", response_model=AnalysisResult)
def get_job_endpoint(job_id: str, session_id: str = Depends(get_session_id)):
    job = session_store.get_job(session_id, job_id)
    if not job:
        raise HTTPException(status_code=404, detail="Job not found")
    return job

@router.delete("/api/jobs/{job_id}")
def delete_job_endpoint(job_id: str, session_id: str = Depends(get_session_id)):
    deleted = session_store.delete_job(session_id, job_id)
    if not deleted:
        raise HTTPException(status_code=404, detail="Job not found")
    return {"deleted": True}


def _remove_file_quietly(path: str) -> None:
    try:
        os.remove(path)
    except OSError:
        pass


@router.get("/api/jobs/{job_id}/audio-summary")
def download_audio_summary(job_id: str, session_id: str = Depends(get_session_id)):
    """Narrate the summary with the OS's offline TTS engine and hand back
    a WAV file — a short "summarized podcast" version of the upload."""
    job = session_store.get_job(session_id, job_id)
    if not job:
        raise HTTPException(status_code=404, detail="Job not found")
    if job.status != AnalysisStatus.COMPLETE:
        raise HTTPException(status_code=409, detail="Job is not complete yet")

    text = (job.summary_original or job.summary_en or "").strip()
    if not text:
        raise HTTPException(status_code=404, detail="No summary available to narrate")

    os.makedirs(settings.AUDIO_TEMP_DIR, exist_ok=True)
    output_path = os.path.join(settings.AUDIO_TEMP_DIR, f"{job_id}-summary.wav")

    try:
        synthesize_speech(text, output_path)
    except Exception as e:
        logger.exception(f"Audio-summary synthesis failed for job {job_id}")
        raise HTTPException(status_code=500, detail=f"Could not generate audio summary: {e}")

    safe_stem = re.sub(r"[^A-Za-z0-9._-]+", "_", os.path.splitext(job.filename)[0]).strip("_") or "summary"
    return FileResponse(
        path=output_path,
        media_type="audio/wav",
        filename=f"{safe_stem}-summary.wav",
        background=BackgroundTask(_remove_file_quietly, output_path),
    )
