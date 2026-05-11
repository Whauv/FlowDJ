export interface SessionTimelinePoint {
  timestamp_ms: number;
  master_gain: number;
  crossfader: number;
  energy: number;
}

export interface SessionTransitionEvent {
  timestamp_ms: number;
  from_deck: "A" | "B";
  to_deck: "A" | "B";
  bpm_mismatch: number;
  key_clash_risk: number;
  overlap_seconds: number;
  abrupt_volume_delta: number;
  used_loop: boolean;
  used_recovery: boolean;
  notes: string;
}

export interface SessionAnalyticsPayload {
  id: string;
  started_at_iso: string;
  ended_at_iso: string;
  transition_timing_score: number;
  dead_air_seconds: number;
  overlap_quality_score: number;
  abrupt_volume_score: number;
  bpm_mismatch_severity: number;
  key_clash_risk: number;
  loop_usage_quality: number;
  recovery_actions_used: number;
  average_energy_flow: number;
  total_score: number;
  suggestions: string[];
  transitions: SessionTransitionEvent[];
  timeline: SessionTimelinePoint[];
}
