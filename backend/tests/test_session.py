"""Session analytics lifecycle: start -> append -> finalize -> read/export."""

from __future__ import annotations

import json


def _start(client) -> str:
    response = client.post("/sessions/start", json={"started_at_iso": "2026-01-01T00:00:00Z"})
    assert response.status_code == 200
    return response.json()["id"]


def _sample_transition() -> dict:
    return {
        "timestamp_ms": 1000,
        "from_deck": "A",
        "to_deck": "B",
        "bpm_mismatch": 1.0,
        "key_clash_risk": 0.1,
        "overlap_seconds": 5.0,
        "abrupt_volume_delta": 0.1,
        "used_loop": True,
        "used_recovery": False,
        "notes": "clean blend",
    }


def _sample_timeline_point() -> dict:
    return {"timestamp_ms": 1000, "master_gain": 0.8, "crossfader": 0.5, "energy": 6.0}


def test_start_returns_session_id(client) -> None:
    session_id = _start(client)
    assert session_id.startswith("session-")


def test_append_then_finalize_scores_session(client) -> None:
    session_id = _start(client)

    append = client.post(
        "/sessions/append",
        json={
            "id": session_id,
            "timeline": [_sample_timeline_point()],
            "transitions": [_sample_transition()],
        },
    )
    assert append.status_code == 200
    assert append.json() == {"status": "ok"}

    finalize = client.post(
        "/sessions/finalize",
        json={"id": session_id, "ended_at_iso": "2026-01-01T01:00:00Z"},
    )
    assert finalize.status_code == 200
    payload = finalize.json()
    assert payload["id"] == session_id
    assert payload["ended_at_iso"] == "2026-01-01T01:00:00Z"
    assert 0.0 <= payload["total_score"] <= 100.0
    assert len(payload["transitions"]) == 1
    assert len(payload["timeline"]) == 1
    assert payload["suggestions"], "finalize should always produce at least one suggestion"


def test_finalize_missing_session_returns_404(client) -> None:
    response = client.post(
        "/sessions/finalize",
        json={"id": "does-not-exist", "ended_at_iso": "2026-01-01T01:00:00Z"},
    )
    assert response.status_code == 404


def test_list_and_detail_after_finalize(client) -> None:
    session_id = _start(client)
    client.post(
        "/sessions/finalize",
        json={"id": session_id, "ended_at_iso": "2026-01-01T01:00:00Z"},
    )

    listing = client.get("/sessions")
    assert listing.status_code == 200
    assert any(item["id"] == session_id for item in listing.json())

    detail = client.get(f"/sessions/{session_id}")
    assert detail.status_code == 200
    assert detail.json()["id"] == session_id


def test_detail_unknown_session_returns_404(client) -> None:
    assert client.get("/sessions/nope").status_code == 404


def test_export_json_and_csv(client) -> None:
    session_id = _start(client)
    client.post("/sessions/append", json={"id": session_id, "transitions": [_sample_transition()]})
    client.post(
        "/sessions/finalize",
        json={"id": session_id, "ended_at_iso": "2026-01-01T01:00:00Z"},
    )

    export_json = client.get(f"/sessions/{session_id}/export/json")
    assert export_json.status_code == 200
    assert export_json.json()["id"] == session_id

    export_csv = client.get(f"/sessions/{session_id}/export/csv")
    assert export_csv.status_code == 200
    assert export_csv.headers["content-type"].startswith("text/csv")
    assert f"filename={session_id}.csv" in export_csv.headers["content-disposition"]
    assert "total_score" in export_csv.text


def test_export_unknown_session_returns_404(client) -> None:
    assert client.get("/sessions/nope/export/json").status_code == 404
    assert client.get("/sessions/nope/export/csv").status_code == 404


def test_finalize_persists_to_configured_data_dir(client, data_dir) -> None:
    # Regression guard for the storage-path bug: finalized sessions must be
    # written into the configured data dir (not next to the service code).
    session_id = _start(client)
    client.post(
        "/sessions/finalize",
        json={"id": session_id, "ended_at_iso": "2026-01-01T01:00:00Z"},
    )

    sessions_file = data_dir / "sessions.json"
    assert sessions_file.exists(), "finalize should write sessions.json into the data dir"

    stored = json.loads(sessions_file.read_text(encoding="utf-8"))
    match = next(s for s in stored["sessions"] if s["id"] == session_id)
    assert match["analytics"] is not None
    assert match["ended_at_iso"] == "2026-01-01T01:00:00Z"
