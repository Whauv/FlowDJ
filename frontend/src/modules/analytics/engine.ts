import type { SessionTimelinePoint } from "./types";

export function estimateCurrentEnergy(energyA: number, energyB: number, crossfader: number): number {
  const mix = energyA * (1 - crossfader) + energyB * crossfader;
  return Math.max(0, Math.min(10, Math.round(mix * 10) / 10));
}

export function makeTimelinePoint(
  timestampMs: number,
  masterGain: number,
  crossfader: number,
  energy: number
): SessionTimelinePoint {
  return {
    timestamp_ms: timestampMs,
    master_gain: Math.max(0, Math.min(1, masterGain)),
    crossfader: Math.max(0, Math.min(1, crossfader)),
    energy: Math.max(0, Math.min(10, energy))
  };
}
