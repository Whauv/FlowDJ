from fastapi import APIRouter

router = APIRouter()


@router.get("/analytics/health")
def analytics_health() -> dict[str, str]:
    return {"status": "ok", "module": "analytics"}
