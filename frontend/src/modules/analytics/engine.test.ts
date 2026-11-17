import { describe, expect, it } from "vitest";

import { estimateCurrentEnergy, makeTimelinePoint } from "./engine";

describe("estimateCurrentEnergy", () => {
  it("crossfades between the two deck energies", () => {
    expect(estimateCurrentEnergy(6, 8, 0)).toBe(6);
    expect(estimateCurrentEnergy(6, 8, 1)).toBe(8);
    expect(estimateCurrentEnergy(6, 8, 0.5)).toBe(7);
  });

  it("clamps to the 0..10 range", () => {
    expect(estimateCurrentEnergy(10, 10, 0.5)).toBe(10);
    expect(estimateCurrentEnergy(-5, -5, 0.5)).toBe(0);
  });
});

describe("makeTimelinePoint", () => {
  it("clamps gain/crossfader to [0,1] and energy to [0,10]", () => {
    const point = makeTimelinePoint(1234, 2, -0.3, 42);
    expect(point).toEqual({
      timestamp_ms: 1234,
      master_gain: 1,
      crossfader: 0,
      energy: 10
    });
  });

  it("preserves in-range values", () => {
    const point = makeTimelinePoint(500, 0.7, 0.4, 6.5);
    expect(point).toEqual({
      timestamp_ms: 500,
      master_gain: 0.7,
      crossfader: 0.4,
      energy: 6.5
    });
  });
});
