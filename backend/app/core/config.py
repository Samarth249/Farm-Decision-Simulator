import os
from pydantic_settings import BaseSettings, SettingsConfigDict

class Settings(BaseSettings):
    PROJECT_NAME: str = "AgriSim — Farm Scenario & Decision Simulator"
    API_V1_STR: str = "/api/v1"
    DATABASE_URL: str = os.getenv("DATABASE_URL", "sqlite+aiosqlite:///./agrisim.db")
    DEBUG: bool = True
    
    # Simulation defaults
    DEFAULT_CURRENCY: str = "INR"
    DEFAULT_AREA_UNIT: str = "ha"

    model_config = SettingsConfigDict(env_file=".env", extra="ignore")

settings = Settings()
