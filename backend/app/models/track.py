from pydantic import BaseModel
from typing import Literal


class TrackModel(BaseModel):
    id: str
    title: str
    source: Literal["local", "youtube"]
    filename: str
    url: str
