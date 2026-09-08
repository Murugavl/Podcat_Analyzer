# backend/routers/analyze.py
import os
import uuid
import logging
from datetime import datetime, timezone
from typing import List
from fastapi import APIRouter, UploadFile, File, HTTPException

from backend.config import settings
from backend.models import (
    AnalysisResult,
    AnalysisStatus,
    EnqueueResponse,
    JobStatusResponse
)
from backend.database.db import save_job, get_job, get_all_jobs, delete_job
from backend.worker import podcast_worker

router = APIRouter()

# Configure logging inside router
logger = logging.getLogger(__name__)

@router.post("/api/analyze", response_model=EnqueueResponse, status_code=202)
async def analyze_audio(file: UploadFile = File(...)):
    # 1. Validate file extension
    filename = file.filename or "audio.mp3"
    ext = filename.split(".")[-1].lower() if "." in filename else ""
    if ext not in ["mp3", "wav", "m4a", "flac"]:
        raise HTTPException(status_code=400, detail="Unsupported format")
        
    # 2. Validate file size
    await file.seek(0, 2)
    file_size_bytes = await file.tell()
    await file.seek(0)  # reset cursor
    
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
    save_job(result)
    
    # 4. Prepare temp audio path
    os.makedirs(settings.AUDIO_TEMP_DIR, exist_ok=True)
    audio_path = os.path.join(settings.AUDIO_TEMP_DIR, f"{job_id}.mp3")
    
    try:
        # Write contents to temp file
        contents = await file.read()
        with open(audio_path, "wb") as f:
            f.write(contents)
            
        # Enqueue the background task
        await podcast_worker.enqueue(job_id, audio_path, filename)
        
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
        save_job(result)
        raise HTTPException(status_code=500, detail=f"Failed to enqueue job: {str(e)}")
        
    return EnqueueResponse(job_id=job_id, status=AnalysisStatus.PENDING)

@router.get("/api/jobs/{job_id}/status", response_model=JobStatusResponse)
def get_job_status_endpoint(job_id: str):
    job = get_job(job_id)
    if not job:
        raise HTTPException(status_code=404, detail="Job not found")
    return JobStatusResponse(
        job_id=job.job_id,
        status=job.status,
        error=job.error
    )

@router.get("/api/jobs", response_model=List[AnalysisResult])
def list_jobs():
    return get_all_jobs()

@router.get("/api/jobs/{job_id}", response_model=AnalysisResult)
def get_job_endpoint(job_id: str):
    job = get_job(job_id)
    if not job:
        raise HTTPException(status_code=404, detail="Job not found")
    return job

@router.delete("/api/jobs/{job_id}")
def delete_job_endpoint(job_id: str):
    deleted = delete_job(job_id)
    if not deleted:
        raise HTTPException(status_code=404, detail="Job not found")
    return {"deleted": True}
