from fastapi import APIRouter, HTTPException, Response
from app.api.schemas import SessionAppendRequest, SessionAnalyticsPayload, SessionCreateRequest, SessionFinalizeRequest
from app.services.analytics import (
    append_session_data,
    create_session,
    export_session_csv,
    finalize_session,
    get_session_analytics,
    list_session_analytics,
)

router = APIRouter()


@router.post("/sessions/start")
def start_session(payload: SessionCreateRequest) -> dict[str, str]:
    session_id = create_session(payload.started_at_iso)
    return {"id": session_id}


@router.post("/sessions/append")
def append_session(payload: SessionAppendRequest) -> dict[str, str]:
    append_session_data(payload.id, payload.timeline, payload.transitions)
    return {"status": "ok"}


@router.post("/sessions/finalize", response_model=SessionAnalyticsPayload)
def finalize(payload: SessionFinalizeRequest) -> SessionAnalyticsPayload:
    try:
        return finalize_session(payload.id, payload.ended_at_iso)
    except ValueError as exc:
        raise HTTPException(status_code=404, detail=str(exc)) from exc


@router.get("/sessions", response_model=list[SessionAnalyticsPayload])
def session_list() -> list[SessionAnalyticsPayload]:
    return list_session_analytics()


@router.get("/sessions/{session_id}", response_model=SessionAnalyticsPayload)
def session_detail(session_id: str) -> SessionAnalyticsPayload:
    session = get_session_analytics(session_id)
    if not session:
        raise HTTPException(status_code=404, detail="Session not found")
    return session


@router.get("/sessions/{session_id}/export/json")
def session_export_json(session_id: str) -> dict:
    session = get_session_analytics(session_id)
    if not session:
        raise HTTPException(status_code=404, detail="Session not found")
    return session.model_dump()


@router.get("/sessions/{session_id}/export/csv")
def session_export_csv(session_id: str) -> Response:
    session = get_session_analytics(session_id)
    if not session:
        raise HTTPException(status_code=404, detail="Session not found")
    csv_text = export_session_csv(session)
    return Response(content=csv_text, media_type="text/csv", headers={"Content-Disposition": f"attachment; filename={session_id}.csv"})
