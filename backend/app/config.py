from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    APP_NAME: str = "Femantic"
    APP_VERSION: str = "1.3.0"
    DEBUG: bool = True
    APP_PUBLIC_URL: str = "https://analytics.globalcareerhub.org"

    DATABASE_URL: str = "postgresql://femantic:femantic_secret@localhost:5432/femantic"
    REDIS_URL: str = "redis://localhost:6379/0"

    JWT_SECRET: str = "change-this-to-a-very-long-random-secret-key-at-least-32-chars"
    JWT_ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 1440
    REFRESH_TOKEN_EXPIRE_DAYS: int = 7

    ADMIN_EMAIL: str = "admin@femantic.com"
    ADMIN_PASSWORD: str = "Admin@12345"
    ADMIN_FULL_NAME: str = "Femantic Admin"

    TRACK_RATE_LIMIT: int = 60
    BOT_SCORE_THRESHOLD: float = 0.7

    CORS_ORIGINS: str = "https://analytics.globalcareerhub.org,http://analytics.globalcareerhub.org,http://localhost:3000"

    class Config:
        env_file = ".env"
        case_sensitive = True


settings = Settings()
