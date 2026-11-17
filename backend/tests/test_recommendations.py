"""Recommendation endpoints: fixtures listing and scoring."""

from __future__ import annotations


def _track(id_: str, bpm: float, key: str, energy: float, genres: list[str] | None = None) -> dict:
    return {"id": id_, "title": id_, "bpm": bpm, "key": key, "energy": energy, "genres": genres or []}


def test_fixtures_listing(client) -> None:
    response = client.get("/recommendations/fixtures")
    assert response.status_code == 200
    data = response.json()
    assert len(data) >= 1
    first = data[0]
    assert {"id", "title", "bpm", "key", "energy", "genres"} <= set(first)


def test_next_ranks_and_caps_results(client) -> None:
    current = _track("cur", bpm=124, key="8A", energy=6.0)
    library = [_track(f"lib-{i}", bpm=120 + i, key="8A", energy=6.0) for i in range(10)]

    response = client.post(
        "/recommendations/next",
        json={
            "current_track": current,
            "library": library,
            "direction": "maintain_groove",
            "bias": "balanced",
        },
    )
    assert response.status_code == 200
    body = response.json()
    assert body["direction"] == "maintain_groove"
    assert body["bias"] == "balanced"

    recs = body["recommendations"]
    assert 1 <= len(recs) <= 6  # engine caps at top 6
    assert all(r["track"]["id"] != "cur" for r in recs)  # current track excluded
    assert all(r["reasons"] for r in recs)  # every rec explains itself
    scores = [r["score"] for r in recs]
    assert scores == sorted(scores, reverse=True)  # sorted best-first


def test_next_excludes_session_history(client) -> None:
    current = _track("cur", bpm=124, key="8A", energy=6.0)
    library = [_track("a", 124, "8A", 6.0), _track("b", 125, "8A", 6.0)]

    response = client.post(
        "/recommendations/next",
        json={
            "current_track": current,
            "library": library,
            "session_history_ids": ["a"],
        },
    )
    assert response.status_code == 200
    ids = [r["track"]["id"] for r in response.json()["recommendations"]]
    assert "a" not in ids
    assert "b" in ids


def test_next_harmonic_match_outranks_clash(client) -> None:
    # Same BPM/energy so key relation decides the ordering.
    current = _track("cur", bpm=124, key="8A", energy=6.0)
    library = [
        _track("harmonic", bpm=124, key="8A", energy=6.0),  # identical key -> best
        _track("clash", bpm=124, key="3B", energy=6.0),  # distant key -> worse
    ]

    response = client.post(
        "/recommendations/next",
        json={"current_track": current, "library": library, "bias": "safe"},
    )
    recs = response.json()["recommendations"]
    assert recs[0]["track"]["id"] == "harmonic"
