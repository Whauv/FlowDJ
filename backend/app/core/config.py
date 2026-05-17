"""Application configuration and environment settings."""
from pydantic import BaseModel


class AppConfig(BaseModel):
    app_name: str = "FlowDJ API"
    app_version: str = "0.1.0"
