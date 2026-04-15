from pydantic_settings import BaseSettings
from pathlib import Path


class Settings(BaseSettings):
    # LLM
    llm_provider: str = "anthropic"
    anthropic_api_key: str = ""
    openai_api_key: str = ""
    llm_model: str = "claude-sonnet-4-6-20250415"

    # YOLO
    yolo_model_path: str = str(Path(__file__).parent.parent.parent / "yolo" / "models" / "best_campus.pt")
    yolo_confidence_threshold: float = 0.5
    yolo_iou_threshold: float = 0.45

    # Server
    host: str = "0.0.0.0"
    port: int = 8000
    cors_origins: str = "http://localhost:3000,http://localhost:5500"

    # Campus data
    campus_graph_path: str = str(Path(__file__).parent / "data" / "campus_graph.json")

    model_config = {"env_file": ".env", "env_file_encoding": "utf-8"}


settings = Settings()
