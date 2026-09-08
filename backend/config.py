# backend/config.py
from pydantic_settings import BaseSettings, SettingsConfigDict
from pydantic import Field

class Settings(BaseSettings):
    WHISPER_MODEL_SIZE: str = Field(default="base")
    MAX_UPLOAD_SIZE_MB: int = Field(default=100)
    AUDIO_TEMP_DIR: str = Field(default="audio")
    LOG_FILE: str = Field(default="logs/podcast_analyzer.log")
    DB_PATH: str = Field(default="database/podcast_history.db")

    model_config = SettingsConfigDict(
        env_file=".env",
        extra="ignore"
    )

settings = Settings()
