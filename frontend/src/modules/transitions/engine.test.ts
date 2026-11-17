import { describe, expect, it } from "vitest";

import { buildTransitionGuidance, computeCompatibility } from "./engine";
import { SAMPLE_TRACKS } from "./sampleTracks";
import { runTransitionTestCases } from "./testCases";
import type { TrackMeta } from "./types";

function track(partial: Partial<TrackMeta>): TrackMeta {
  return { id: "x", title: "X", bpm: 124, key: "8A", energy: 6, duration: 300, ...partial };
}

describe("computeCompatibility", () => {
  it("scores an identical track as a perfect 100 with no warnings", () => {
    const source = track({});
    const result = computeCompatibility(source, { ...source }, false);
    expect(result.bpmScore).toBe(100);
    expect(result.keyScore).toBe(100);
    expect(result.energyScore).toBe(100);
    expect(result.total).toBe(100);
    expect(result.warnings).toEqual([]);
  });

  it("gives a harmonic neighbor key a score of 84", () => {
    const result = computeCompatibility(track({ key: "8A" }), track({ key: "9A" }), false);
    expect(result.keyScore).toBe(84);
  });

  it("flags a distant key as a potential clash", () => {
    const result = computeCompatibility(track({ key: "8A" }), track({ key: "3B" }), false);
    expect(result.keyScore).toBe(38);
    expect(result.warnings).toContain("Potential key clash (8A to 3B).");
  });

  it("warns on a large BPM gap", () => {
    const result = computeCompatibility(track({ bpm: 124 }), track({ bpm: 130 }), false);
    expect(result.warnings).toContain("Large BPM gap (6 BPM).");
  });

  it("penalizes risky moves when safe mix is on", () => {
    const source = track({ bpm: 124, key: "8A", energy: 6 });
    const candidate = track({ bpm: 130, key: "8A", energy: 6 });
    const relaxed = computeCompatibility(source, candidate, false);
    const safe = computeCompatibility(source, candidate, true);
    expect(relaxed.total).toBe(75.7);
    expect(safe.total).toBe(67.7); // relaxed minus the 8-point safe-mix BPM penalty
    expect(safe.total).toBeLessThan(relaxed.total);
  });
});

describe("buildTransitionGuidance", () => {
  it("returns at most four recommendations sorted best-first", () => {
    const [source, ...candidates] = SAMPLE_TRACKS;
    const guidance = buildTransitionGuidance("A", "B", source, candidates, 96, false);
    expect(guidance.recommendations.length).toBeLessThanOrEqual(4);
    const scores = guidance.recommendations.map((r) => r.compatibility.total);
    expect(scores).toEqual([...scores].sort((a, b) => b - a));
    expect(guidance.outgoingDeckId).toBe("A");
    expect(guidance.incomingDeckId).toBe("B");
    expect(guidance.phraseHint).toMatch(/boundary|Phrase/);
  });

  it("prepends a Safe Mix action when safe mix is active", () => {
    const [source, ...candidates] = SAMPLE_TRACKS;
    const guidance = buildTransitionGuidance("A", "B", source, candidates, 96, true);
    expect(guidance.actions[0]?.title).toBe("Safe Mix active");
  });
});

describe("runTransitionTestCases", () => {
  it("produces the three named scenarios with scored top tracks", () => {
    const results = runTransitionTestCases();
    expect(results.map((r) => r.name)).toEqual([
      "Balanced house blend",
      "Safe mix conservative",
      "Energy clash detection"
    ]);
    for (const result of results) {
      expect(result.score).toBeGreaterThanOrEqual(0);
      expect(result.score).toBeLessThanOrEqual(100);
      expect(Array.isArray(result.warnings)).toBe(true);
    }
  });
});
