from pydantic import BaseModel


class AnalyticsEventModel(BaseModel):
    timestamp_ms: int
    notes: str = ""
