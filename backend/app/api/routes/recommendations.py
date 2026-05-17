import json
from pathlib import Path
from fastapi import APIRouter
from app.api.schemas import RecommendationRequest, RecommendationResponse, RecommendationTrack
from app.services.recommendation import recommend_tracks

router = APIRouter()
FIXTURE_PATH = Path(__file__).resolve().parents[2] / "storage" / "recommendation_fixtures.json"


@router.get("/recommendations/fixtures", response_model=list[RecommendationTrack])
def recommendation_fixtures() -> list[RecommendationTrack]:
    raw = json.loads(FIXTURE_PATH.read_text(encoding="utf-8"))
    return [RecommendationTrack.model_validate(item) for item in raw]


@router.post("/recommendations/next", response_model=RecommendationResponse)
def recommendation_next(payload: RecommendationRequest) -> RecommendationResponse:
    return recommend_tracks(payload)
