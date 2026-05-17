import csv
import io
import json
from datetime import datetime, timezone
from pathlib import Path

from app.api.schemas import (
    SessionAnalyticsPayload,
    SessionTimelinePoint,
    SessionTransitionEvent,
)

SESSIONS_PATH = Path(__file__).resolve().parent / "sessions.json"


def _load_raw() -> dict:
    if not SESSIONS_PATH.exists():
        return {"sessions": []}
    try:
        return json.loads(SESSIONS_PATH.read_text(encoding="utf-8"))
    except json.JSONDecodeError:
        return {"sessions": []}


def _save_raw(data: dict) -> None:
    SESSIONS_PATH.write_text(json.dumps(data, indent=2), encoding="utf-8")


def _now_id() -> str:
    return datetime.now(timezone.utc).strftime("session-%Y%m%d-%H%M%S")


def create_session(started_at_iso: str) -> str:
    data = _load_raw()
    session_id = _now_id()
    data["sessions"].append(
        {
            "id": session_id,
            "started_at_iso": started_at_iso,
            "ended_at_iso": "",
            "timeline": [],
            "transitions": [],
            "analytics": None,
        }
    )
    _save_raw(data)
    return session_id


def append_session_data(
    session_id: str,
    timeline: list[SessionTimelinePoint],
    transitions: list[SessionTransitionEvent],
) -> None:
    data = _load_raw()
    for session in data["sessions"]:
      if session["id"] == session_id:
        if timeline:
            session["timeline"].extend([p.model_dump() for p in timeline])
        if transitions:
            session["transitions"].extend([t.model_dump() for t in transitions])
        _save_raw(data)
        return


def _avg(items: list[float]) -> float:
    return sum(items) / len(items) if items else 0.0


def _clamp_score(score: float) -> float:
    return max(0.0, min(100.0, round(score, 2)))


def _build_suggestions(payload: SessionAnalyticsPayload) -> list[str]:
    suggestions: list[str] = []
    if payload.dead_air_seconds > 8:
        suggestions.append("Reduce dead air by pre-cueing earlier and starting blend sooner.")
    if payload.bpm_mismatch_severity > 4:
        suggestions.append("Use sync/tempo nudges before transition to reduce BPM mismatch.")
    if payload.key_clash_risk > 0.45:
        suggestions.append("Prefer harmonically adjacent keys to avoid key clashes.")
    if payload.abrupt_volume_score < 65:
        suggestions.append("Smooth gain moves over 2-4 bars to avoid abrupt loudness jumps.")
    if payload.loop_usage_quality < 55:
        suggestions.append("Use 8-bar loops when phrase timing is uncertain.")
    if payload.recovery_actions_used > 2:
        suggestions.append("Recovery mode was used frequently; practice safer phrase-aligned entries.")
    if not suggestions:
        suggestions.append("Great control. Keep refining phrase-timed transitions for even smoother sets.")
    return suggestions


def finalize_session(session_id: str, ended_at_iso: str) -> SessionAnalyticsPayload:
    data = _load_raw()
    for session in data["sessions"]:
        if session["id"] != session_id:
            continue

        transitions = [SessionTransitionEvent.model_validate(t) for t in session["transitions"]]
        timeline = [SessionTimelinePoint.model_validate(p) for p in session["timeline"]]

        dead_air = 0.0
        if timeline:
            low_points = [p for p in timeline if p.master_gain < 0.08]
            dead_air = len(low_points) * 0.4

        bpm_mismatch_vals = [t.bpm_mismatch for t in transitions]
        key_risk_vals = [t.key_clash_risk for t in transitions]
        overlap_vals = [t.overlap_seconds for t in transitions]
        abrupt_vals = [t.abrupt_volume_delta for t in transitions]
        loop_flags = [1.0 if t.used_loop else 0.0 for t in transitions]
        recovery_count = sum(1 for t in transitions if t.used_recovery)

        transition_timing = _clamp_score(100 - (_avg([abs(6 - o) for o in overlap_vals]) * 8))
        overlap_quality = _clamp_score(100 - (_avg([abs(5 - o) for o in overlap_vals]) * 10))
        abrupt_score = _clamp_score(100 - (_avg(abrupt_vals) * 120))
        bpm_severity = round(_avg(bpm_mismatch_vals), 2)
        key_risk = round(_avg(key_risk_vals), 3)
        loop_quality = _clamp_score(55 + (_avg(loop_flags) * 40) - (dead_air * 0.8))
        avg_energy = round(_avg([p.energy for p in timeline]), 2)

        total = _clamp_score(
            transition_timing * 0.2
            + overlap_quality * 0.2
            + abrupt_score * 0.15
            + (100 - min(100, bpm_severity * 12)) * 0.15
            + (100 - min(100, key_risk * 100)) * 0.1
            + loop_quality * 0.1
            + (100 - min(100, dead_air * 4)) * 0.1
        )

        payload = SessionAnalyticsPayload(
            id=session_id,
            started_at_iso=session["started_at_iso"],
            ended_at_iso=ended_at_iso,
            transition_timing_score=transition_timing,
            dead_air_seconds=round(dead_air, 2),
            overlap_quality_score=overlap_quality,
            abrupt_volume_score=abrupt_score,
            bpm_mismatch_severity=bpm_severity,
            key_clash_risk=key_risk,
            loop_usage_quality=loop_quality,
            recovery_actions_used=recovery_count,
            average_energy_flow=avg_energy,
            total_score=total,
            suggestions=[],
            transitions=transitions,
            timeline=timeline,
        )
        payload.suggestions = _build_suggestions(payload)

        session["ended_at_iso"] = ended_at_iso
        session["analytics"] = payload.model_dump()
        _save_raw(data)
        return payload

    raise ValueError("Session not found")


def list_session_analytics() -> list[SessionAnalyticsPayload]:
    data = _load_raw()
    items: list[SessionAnalyticsPayload] = []
    for session in data["sessions"]:
        if session.get("analytics"):
            items.append(SessionAnalyticsPayload.model_validate(session["analytics"]))
    return items


def get_session_analytics(session_id: str) -> SessionAnalyticsPayload | None:
    data = _load_raw()
    for session in data["sessions"]:
        if session["id"] == session_id and session.get("analytics"):
            return SessionAnalyticsPayload.model_validate(session["analytics"])
    return None


def export_session_csv(session: SessionAnalyticsPayload) -> str:
    buffer = io.StringIO()
    writer = csv.writer(buffer)
    writer.writerow(["metric", "value"])
    writer.writerow(["id", session.id])
    writer.writerow(["total_score", session.total_score])
    writer.writerow(["transition_timing_score", session.transition_timing_score])
    writer.writerow(["dead_air_seconds", session.dead_air_seconds])
    writer.writerow(["overlap_quality_score", session.overlap_quality_score])
    writer.writerow(["abrupt_volume_score", session.abrupt_volume_score])
    writer.writerow(["bpm_mismatch_severity", session.bpm_mismatch_severity])
    writer.writerow(["key_clash_risk", session.key_clash_risk])
    writer.writerow(["loop_usage_quality", session.loop_usage_quality])
    writer.writerow(["recovery_actions_used", session.recovery_actions_used])
    writer.writerow(["average_energy_flow", session.average_energy_flow])
    writer.writerow([])
    writer.writerow(["transition_index", "timestamp_ms", "from", "to", "bpm_mismatch", "key_clash_risk", "overlap_seconds", "abrupt_volume_delta", "used_loop", "used_recovery", "notes"])
    for idx, t in enumerate(session.transitions):
        writer.writerow([idx + 1, t.timestamp_ms, t.from_deck, t.to_deck, t.bpm_mismatch, t.key_clash_risk, t.overlap_seconds, t.abrupt_volume_delta, t.used_loop, t.used_recovery, t.notes])
    return buffer.getvalue()
