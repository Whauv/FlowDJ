import type { RecommendationBias, RecommendationDirection, RecommendationResponse, RecommendationTrack } from "../../modules/recommendations/types";

const API_BASE = "http://localhost:8000";

export async function fetchRecommendationFixtures(): Promise<RecommendationTrack[]> {
  try {
    const response = await fetch(`${API_BASE}/recommendations/fixtures`);
    if (!response.ok) return [];
    return (await response.json()) as RecommendationTrack[];
  } catch {
    return [];
  }
}

export async function fetchNextRecommendations(input: {
  currentTrack: RecommendationTrack;
  library: RecommendationTrack[];
  sessionHistoryIds: string[];
  direction: RecommendationDirection;
  bias: RecommendationBias;
  targetMood: string;
}): Promise<RecommendationResponse | null> {
  try {
    const response = await fetch(`${API_BASE}/recommendations/next`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        current_track: input.currentTrack,
        library: input.library,
        session_history_ids: input.sessionHistoryIds,
        direction: input.direction,
        bias: input.bias,
        target_mood: input.targetMood
      })
    });
    if (!response.ok) return null;
    return (await response.json()) as RecommendationResponse;
  } catch {
    return null;
  }
}
