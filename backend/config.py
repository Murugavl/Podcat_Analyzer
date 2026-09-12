# backend/config.py
from pydantic_settings import BaseSettings, SettingsConfigDict
from pydantic import Field

class Settings(BaseSettings):
    WHISPER_MODEL_SIZE: str = Field(default="base")
    MAX_UPLOAD_SIZE_MB: int = Field(default=100)
    AUDIO_TEMP_DIR: str = Field(default="audio")
    LOG_FILE: str = Field(default="logs/podcast_analyzer.log")
    # Comma-separated list of origins allowed to call the API with cookies.
    ALLOWED_ORIGINS: str = Field(default="http://localhost:5173")

    model_config = SettingsConfigDict(
        env_file=".env",
        extra="ignore"
    )

    @property
    def allowed_origins_list(self) -> list[str]:
        return [origin.strip() for origin in self.ALLOWED_ORIGINS.split(",") if origin.strip()]

settings = Settings()
