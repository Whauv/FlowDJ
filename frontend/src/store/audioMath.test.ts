import { describe, expect, it } from "vitest";

import { clampNormalized, computeDeckCrossfadeGains, runAudioStateSanityChecks } from "./audioMath";

describe("computeDeckCrossfadeGains", () => {
  it("splits evenly at the center", () => {
    expect(computeDeckCrossfadeGains(0.5)).toEqual({ A: 0.5, B: 0.5 });
  });

  it("hard-pans at the extremes", () => {
    expect(computeDeckCrossfadeGains(0)).toEqual({ A: 1, B: 0 });
    expect(computeDeckCrossfadeGains(1)).toEqual({ A: 0, B: 1 });
  });

  it("clamps out-of-range input", () => {
    expect(computeDeckCrossfadeGains(-0.5)).toEqual({ A: 1, B: 0 });
    expect(computeDeckCrossfadeGains(1.5)).toEqual({ A: 0, B: 1 });
  });
});

describe("clampNormalized", () => {
  it("bounds values into [0, 1]", () => {
    expect(clampNormalized(-1)).toBe(0);
    expect(clampNormalized(2)).toBe(1);
    expect(clampNormalized(0.3)).toBe(0.3);
  });
});

describe("runAudioStateSanityChecks", () => {
  it("passes its own invariants", () => {
    expect(runAudioStateSanityChecks()).toBe(true);
  });
});
