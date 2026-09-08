# backend/worker.py
import asyncio
import os
import logging
import json
from concurrent.futures import ThreadPoolExecutor
from typing import Optional

from backend.database.db import update_job_status
from backend.ml import processor
from backend.ml.model_cache import (
    get_whisper_model,
    get_translator_to_en,
    get_summarizer,
    get_sentiment_analyzer,
    get_emotion_analyzer,
    get_translator_back
)

logger = logging.getLogger(__name__)

class PodcastWorker:
    def __init__(self):
        self.queue = asyncio.Queue()
        self.running = False

    async def start(self):
        self.running = True
        logger.info("Podcast background worker started.")
        while self.running:
            try:
                job_id, audio_path, filename = await self.queue.get()
                await self.process_job(job_id, audio_path, filename)
                self.queue.task_done()
            except Exception as e:
                logger.exception("Error in worker main loop")
                await asyncio.sleep(1)  # prevent tight loop on error

    async def enqueue(self, job_id, audio_path, filename):
        await self.queue.put((job_id, audio_path, filename))
        logger.info(f"Enqueued job {job_id} for file {filename}")

    async def process_job(self, job_id, audio_path, filename):
        logger.info(f"Started processing job {job_id}")
        try:
            update_job_status(job_id, "processing")
            
            # Run CPU-bound tasks in ThreadPoolExecutor
            loop = asyncio.get_event_loop()
            with ThreadPoolExecutor() as pool:
                # 1. Transcribe audio
                whisper_model = get_whisper_model()
                transcript, detected_lang = await loop.run_in_executor(
                    pool,
                    processor.transcribe_audio,
                    whisper_model,
                    audio_path
                )
                
                if not transcript.strip():
                    raise ValueError("Transcript is empty.")
                
                # 2. Translate text if lang != "en"
                translated_transcript = transcript
                if detected_lang != "en":
                    translator_to_en = get_translator_to_en()
                    translated_transcript = await loop.run_in_executor(
                        pool,
                        processor.translate_text,
                        translator_to_en,
                        transcript
                    )
                
                # 3. Summarize text
                summarizer_model = get_summarizer()
                summary_en = await loop.run_in_executor(
                    pool,
                    processor.summarize_text,
                    summarizer_model,
                    translated_transcript
                )
                
                # 4. Translate summary back if lang != "en"
                summary_original = summary_en
                if detected_lang != "en":
                    translator_back = get_translator_back(detected_lang)
                    summary_original = await loop.run_in_executor(
                        pool,
                        processor.translate_text,
                        translator_back,
                        summary_en,
                        1000  # max length for back translation
                    )
                
                # 5. Analyze sentiment
                sentiment_analyzer = get_sentiment_analyzer()
                sentiment_res = await loop.run_in_executor(
                    pool,
                    processor.analyze_sentiment,
                    sentiment_analyzer,
                    translated_transcript
                )
                
                # 6. Analyze emotions
                emotion_analyzer = get_emotion_analyzer()
                emotions_res = await loop.run_in_executor(
                    pool,
                    processor.analyze_emotions,
                    emotion_analyzer,
                    translated_transcript
                )
                
            # Serialize fields for SQLite
            sentiment_label = sentiment_res.get("label") if sentiment_res else None
            sentiment_score = sentiment_res.get("score") if sentiment_res else None
            emotions_json = json.dumps([
                {"chunk": r["Chunk"], "emotion": r["Emotion"], "score": r["Score"]}
                for r in emotions_res
            ]) if emotions_res else "[]"
            
            result_data = {
                "detected_language": detected_lang,
                "transcript": transcript,
                "translated_transcript": translated_transcript,
                "summary_en": summary_en,
                "summary_original": summary_original,
                "sentiment_label": sentiment_label,
                "sentiment_score": sentiment_score,
                "emotions_json": emotions_json
            }
            
            update_job_status(job_id, "complete", result_data)
            logger.info(f"Completed job {job_id} successfully.")
            
        except Exception as e:
            logger.exception(f"Job {job_id} failed")
            update_job_status(job_id, "failed", error=str(e))
        finally:
            # Clean up temporary audio file
            if os.path.exists(audio_path):
                try:
                    os.remove(audio_path)
                    logger.info(f"Cleaned up audio file for job {job_id}")
                except Exception as e:
                    logger.error(f"Failed to remove temporary file {audio_path}: {e}")

podcast_worker = PodcastWorker()
