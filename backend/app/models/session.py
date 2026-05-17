from pydantic import BaseModel


class SessionModel(BaseModel):
    id: str
    started_at_iso: str
    ended_at_iso: str | None = None
