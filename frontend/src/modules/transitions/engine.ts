import type { CompatibilityBreakdown, TrackMeta, TrackRecommendation, TransitionGuidance, TransitionHint } from "./types";

const CAMELOT_NEIGHBORS: Record<string, string[]> = {
  "1A": ["12A", "2A", "1B"], "2A": ["1A", "3A", "2B"], "3A": ["2A", "4A", "3B"],
  "4A": ["3A", "5A", "4B"], "5A": ["4A", "6A", "5B"], "6A": ["5A", "7A", "6B"],
  "7A": ["6A", "8A", "7B"], "8A": ["7A", "9A", "8B"], "9A": ["8A", "10A", "9B"],
  "10A": ["9A", "11A", "10B"], "11A": ["10A", "12A", "11B"], "12A": ["11A", "1A", "12B"],
  "1B": ["12B", "2B", "1A"], "2B": ["1B", "3B", "2A"], "3B": ["2B", "4B", "3A"],
  "4B": ["3B", "5B", "4A"], "5B": ["4B", "6B", "5A"], "6B": ["5B", "7B", "6A"],
  "7B": ["6B", "8B", "7A"], "8B": ["7B", "9B", "8A"], "9B": ["8B", "10B", "9A"],
  "10B": ["9B", "11B", "10A"], "11B": ["10B", "12B", "11A"], "12B": ["11B", "1B", "12A"]
};

function keyScore(fromKey: string, toKey: string): number {
  if (!fromKey || !toKey) return 55;
  if (fromKey === toKey) return 100;
  if (CAMELOT_NEIGHBORS[fromKey]?.includes(toKey)) return 84;
  return 38;
}

function round(n: number): number {
  return Math.round(n * 10) / 10;
}

export function computeCompatibility(source: TrackMeta, candidate: TrackMeta, safeMix: boolean): CompatibilityBreakdown {
  const bpmDiff = Math.abs(source.bpm - candidate.bpm);
  const energyDiff = Math.abs(source.energy - candidate.energy);

  const bpmScore = Math.max(0, 100 - bpmDiff * 9);
  const harmonicScore = keyScore(source.key, candidate.key);
  const energyScore = Math.max(0, 100 - energyDiff * 16);

  let total = bpmScore * 0.45 + harmonicScore * 0.35 + energyScore * 0.2;
  const warnings: string[] = [];

  if (bpmDiff >= 6) warnings.push(`Large BPM gap (${round(bpmDiff)} BPM).`);
  if (harmonicScore < 60) warnings.push(`Potential key clash (${source.key} to ${candidate.key}).`);
  if (energyDiff >= 2.5) warnings.push("Abrupt energy mismatch risk.");

  if (safeMix) {
    if (bpmDiff > 4) total -= 8;
    if (energyDiff > 2) total -= 6;
  }

  const bounded = Math.max(0, Math.min(100, total));
  const explanation = `BPM ${round(bpmDiff)} diff, key ${source.key}->${candidate.key}, energy ${round(energyDiff)} diff.`;

  return {
    bpmScore: round(bpmScore),
    keyScore: round(harmonicScore),
    energyScore: round(energyScore),
    total: round(bounded),
    explanation,
    warnings
  };
}

function phraseHint(currentTime: number, bpm: number): string {
  if (!bpm || bpm <= 0) return "Phrase timing unavailable until BPM is detected.";
  const barLength = (60 / bpm) * 4;
  const eightBar = barLength * 8;
  const offset = currentTime % eightBar;
  const remaining = eightBar - offset;

  if (remaining <= barLength) return `Phrase boundary in ${round(remaining)}s: prepare transition.`;
  if (remaining <= barLength * 2) return `Phrase boundary in ${round(remaining)}s: cue incoming deck now.`;
  return `Next 8-bar boundary in ${round(remaining)}s.`;
}

export function buildTransitionGuidance(
  outgoingDeckId: "A" | "B",
  incomingDeckId: "A" | "B",
  sourceTrack: TrackMeta,
  candidates: TrackMeta[],
  currentTime: number,
  safeMix: boolean
): TransitionGuidance {
  const recommendations: TrackRecommendation[] = candidates
    .map((track) => ({ track, compatibility: computeCompatibility(sourceTrack, track, safeMix) }))
    .sort((a, b) => b.compatibility.total - a.compatibility.total)
    .slice(0, 4);

  const top = recommendations[0];
  const actions: TransitionHint[] = [];
  const phrase = phraseHint(currentTime, sourceTrack.bpm);

  if (top) {
    if (top.compatibility.total >= 80) {
      actions.push({ title: "Start blend now", detail: "Compatibility is strong; begin a gentle crossfader move.", severity: "info" });
    } else {
      actions.push({ title: "Enable 8-bar loop", detail: "Use loop to stabilize timing before blending.", severity: "warn" });
    }

    if (top.compatibility.energyScore < 65) {
      actions.push({ title: "Lower bass on outgoing deck", detail: "Energy mismatch detected; reduce low EQ before handoff.", severity: "warn" });
    } else {
      actions.push({ title: "Swap decks at drop", detail: "Phrase and energy are aligned for a drop handoff.", severity: "info" });
    }

    if (top.compatibility.bpmScore < 70) {
      actions.push({ title: "Use echo out", detail: "Mask tempo gap with a short echo tail on outgoing deck.", severity: "warn" });
    }
  }

  if (safeMix) {
    actions.unshift({ title: "Safe Mix active", detail: "Riskier transitions are deprioritized; conservative path selected.", severity: "info" });
  }

  return {
    outgoingDeckId,
    incomingDeckId,
    phraseHint: phrase,
    recommendations,
    actions
  };
}
