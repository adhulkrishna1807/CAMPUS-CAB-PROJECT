import os
from pydantic_settings import BaseSettings

class Settings(BaseSettings):
    PROJECT_NAME: str = "Campus Cab"
    SECRET_KEY: str = "campuscab-secret-key-production-grade-2026"
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60 * 24 * 7  # 7 days
    DATABASE_URL: str = "sqlite+aiosqlite:///./campuscab.db"
    DEMO_MODE: bool = True
    LAUNDRY_RATE_PER_KG: float = 65.0
    LAUNDRY_EXTRA_CHARGE: float = 25.0
    RENTAL_SECURITY_DEPOSIT: float = 1000.0

settings = Settings()
