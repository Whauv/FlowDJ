export type RecommendationDirection = "build_energy" | "maintain_groove" | "cool_down" | "surprise_switch";
export type RecommendationBias = "safe" | "balanced" | "adventurous";

export interface RecommendationTrack {
  id: string;
  title: string;
  bpm: number;
  key: string;
  energy: number;
  genres: string[];
}

export interface RecommendationItem {
  track: RecommendationTrack;
  score: number;
  reasons: string[];
}

export interface RecommendationResponse {
  direction: RecommendationDirection;
  bias: RecommendationBias;
  target_mood: string;
  recommendations: RecommendationItem[];
}
