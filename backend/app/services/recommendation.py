from app.api.schemas import RecommendationBias, RecommendationDirection, RecommendationItem, RecommendationRequest, RecommendationResponse

CAMELOT_NEIGHBORS = {
    "1A": {"12A", "2A", "1B"}, "2A": {"1A", "3A", "2B"}, "3A": {"2A", "4A", "3B"},
    "4A": {"3A", "5A", "4B"}, "5A": {"4A", "6A", "5B"}, "6A": {"5A", "7A", "6B"},
    "7A": {"6A", "8A", "7B"}, "8A": {"7A", "9A", "8B"}, "9A": {"8A", "10A", "9B"},
    "10A": {"9A", "11A", "10B"}, "11A": {"10A", "12A", "11B"}, "12A": {"11A", "1A", "12B"},
    "1B": {"12B", "2B", "1A"}, "2B": {"1B", "3B", "2A"}, "3B": {"2B", "4B", "3A"},
    "4B": {"3B", "5B", "4A"}, "5B": {"4B", "6B", "5A"}, "6B": {"5B", "7B", "6A"},
    "7B": {"6B", "8B", "7A"}, "8B": {"7B", "9B", "8A"}, "9B": {"8B", "10B", "9A"},
    "10B": {"9B", "11B", "10A"}, "11B": {"10B", "12B", "11A"}, "12B": {"11B", "1B", "12A"}
}

MOOD_GENRE_HINTS = {
    "uplifting": {"house", "progressive", "trance"},
    "dark": {"techno", "industrial", "minimal"},
    "chill": {"downtempo", "ambient", "deep-house"},
    "groovy": {"house", "funk", "nu-disco"}
}


def _key_score(a: str, b: str) -> float:
    if a == b:
        return 100
    if b in CAMELOT_NEIGHBORS.get(a, set()):
        return 82
    return 40


def _direction_target_energy(direction: RecommendationDirection, current_energy: float) -> float:
    if direction == "build_energy":
        return min(10.0, current_energy + 1.6)
    if direction == "cool_down":
        return max(1.0, current_energy - 1.8)
    if direction == "surprise_switch":
        return max(1.0, min(10.0, 10 - current_energy))
    return current_energy


def _bias_multiplier(bias: RecommendationBias) -> tuple[float, float, float]:
    if bias == "safe":
        return (0.55, 0.3, 0.15)
    if bias == "adventurous":
        return (0.25, 0.2, 0.55)
    return (0.4, 0.3, 0.3)


def recommend_tracks(payload: RecommendationRequest) -> RecommendationResponse:
    current = payload.current_track
    target_energy = _direction_target_energy(payload.direction, current.energy)
    w_bpm, w_key, w_energy = _bias_multiplier(payload.bias)
    used_ids = set(payload.session_history_ids)

    items: list[RecommendationItem] = []

    for track in payload.library:
        if track.id == current.id or track.id in used_ids:
            continue

        bpm_diff = abs(track.bpm - current.bpm)
        bpm_score = max(0.0, 100 - bpm_diff * 9)
        key_score = _key_score(current.key, track.key)
        energy_delta = abs(track.energy - target_energy)
        energy_score = max(0.0, 100 - energy_delta * 20)

        score = bpm_score * w_bpm + key_score * w_key + energy_score * w_energy
        reasons: list[str] = [
            f"BPM difference {bpm_diff:.1f} ({track.bpm:.1f} vs {current.bpm:.1f})",
            f"Key relation {current.key} -> {track.key} gives harmonic score {key_score:.0f}",
            f"Energy {track.energy:.1f} vs target {target_energy:.1f}"
        ]

        if payload.target_mood:
            target = payload.target_mood.lower()
            mood_genres = MOOD_GENRE_HINTS.get(target, set())
            if mood_genres and any(g.lower() in mood_genres for g in track.genres):
                score += 9
                reasons.append(f"Matches target mood '{payload.target_mood}' via genre tags")

        if payload.direction == "surprise_switch" and bpm_diff > 4:
            score += 6
            reasons.append("Rewarded for contrast due to surprise switch direction")

        if payload.bias == "safe" and (bpm_diff > 5 or key_score < 60):
            score -= 14
            reasons.append("Penalized by safe bias for risky tempo/key move")

        items.append(
            RecommendationItem(
                track=track,
                score=round(max(0.0, min(100.0, score)), 2),
                reasons=reasons,
            )
        )

    items.sort(key=lambda x: x.score, reverse=True)
    return RecommendationResponse(
        direction=payload.direction,
        bias=payload.bias,
        target_mood=payload.target_mood,
        recommendations=items[:6],
    )
