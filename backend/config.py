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
    # Session cookie attributes. Locally, frontend (5173) and backend (8000)
    # are different ports but the same registrable domain ("site"), so
    # SameSite=Lax already lets the cookie through. In production the
    # frontend (Vercel) and backend (Render) are on different domains
    # entirely, which browsers treat as cross-site — that requires
    # SameSite=None, which in turn requires Secure (HTTPS-only) cookies.
    COOKIE_SAMESITE: str = Field(default="lax")
    COOKIE_SECURE: bool = Field(default=False)

    model_config = SettingsConfigDict(
        env_file=".env",
        extra="ignore"
    )

    @property
    def allowed_origins_list(self) -> list[str]:
        return [origin.strip() for origin in self.ALLOWED_ORIGINS.split(",") if origin.strip()]

settings = Settings()
