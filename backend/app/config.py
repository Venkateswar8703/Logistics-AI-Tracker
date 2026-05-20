"""
Application configuration using pydantic-settings.

Loads settings from environment variables and .env file.
"""

from pathlib import Path
from typing import List, Optional

from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    """Global application settings loaded from environment / .env file."""

    APP_NAME: str = "Logistics AI Tracker"
    DEBUG: bool = False
    OPENAI_API_KEY: Optional[str] = None
    CORS_ORIGINS: List[str] = ["*"]
    VECTOR_STORE_PATH: str = str(
        Path(__file__).resolve().parent / "data" / "vector_store"
    )

    # Paths derived from the package location
    DATA_DIR: str = str(Path(__file__).resolve().parent / "data")
    DOCS_DIR: str = str(Path(__file__).resolve().parent / "data" / "docs")

    model_config = {
        "env_file": str(Path(__file__).resolve().parent.parent / ".env"),
        "env_file_encoding": "utf-8",
        "extra": "ignore",
    }


# Singleton settings instance
settings = Settings()
