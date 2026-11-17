from fastapi import APIRouter

from app.api.schemas import RecommendationRequest, RecommendationResponse, RecommendationTrack
from app.services.recommendation import recommend_tracks
from app.storage import json_store

router = APIRouter()


@router.get("/recommendations/fixtures", response_model=list[RecommendationTrack])
def recommendation_fixtures() -> list[RecommendationTrack]:
    raw = json_store.read_json(json_store.data_path("recommendation_fixtures.json"), [])
    return [RecommendationTrack.model_validate(item) for item in raw]


@router.post("/recommendations/next", response_model=RecommendationResponse)
def recommendation_next(payload: RecommendationRequest) -> RecommendationResponse:
    return recommend_tracks(payload)
