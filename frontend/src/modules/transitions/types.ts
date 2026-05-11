export interface TrackMeta {
  id: string;
  title: string;
  bpm: number;
  key: string;
  energy: number;
  duration: number;
}

export interface CompatibilityBreakdown {
  bpmScore: number;
  keyScore: number;
  energyScore: number;
  total: number;
  explanation: string;
  warnings: string[];
}

export interface TrackRecommendation {
  track: TrackMeta;
  compatibility: CompatibilityBreakdown;
}

export interface TransitionHint {
  title: string;
  detail: string;
  severity: "info" | "warn";
}

export interface TransitionGuidance {
  outgoingDeckId: "A" | "B";
  incomingDeckId: "A" | "B";
  phraseHint: string;
  recommendations: TrackRecommendation[];
  actions: TransitionHint[];
}
