from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    HOST: str = "0.0.0.0"
    PORT: int = 8000
    NUM_CUSTOMERS: int = 10000
    NUM_PERSONAS: int = 10
    ABANDON_TIMEOUT_SECONDS: int = 10  # Short for demo
    DEMO_MODE: bool = True
    REASSIGNMENT_EVENT_THRESHOLD: int = 20
    DEMO_SIMULATOR_SESSIONS: int = 200
    DEMO_SIMULATOR_ENABLED: bool = True
    CORS_ORIGINS: list[str] = ["http://localhost:3000", "http://127.0.0.1:3000"]

    class Config:
        env_file = ".env"


settings = Settings()
