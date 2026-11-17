import { describe, expect, it } from "vitest";

import { DEFAULT_KEY_MAPPING, DEFAULT_PALETTES } from "./palettes";
import { chooseSceneName, decideLightingColor, renderVirtualScene } from "./sceneEngine";
import type { FlowLightEvent, FlowLightSettings } from "./types";

function settings(overrides: Partial<FlowLightSettings> = {}): FlowLightSettings {
  return {
    movementSensitivity: 0.5,
    intensityScale: 1,
    beatPulseStrength: 0.5,
    safetyLimit: 0.9,
    allowStrobe: true,
    strobeOnDropsOnly: true,
    keyAwareColoring: true,
    selectedMoodPreset: "warm-club",
    keyToPalette: DEFAULT_KEY_MAPPING,
    paletteLibrary: DEFAULT_PALETTES,
    ...overrides
  };
}

function event(overrides: Partial<FlowLightEvent> = {}): FlowLightEvent {
  return {
    timestampMs: 0,
    bpm: 124,
    beatPhase: 0,
    phraseSection: "drop",
    activeDeck: "A",
    crossfader: 0.5,
    energy: 8,
    marker: "drop",
    key: "8A",
    ...overrides
  };
}

describe("chooseSceneName", () => {
  it("maps each phrase section to its scene", () => {
    expect(chooseSceneName(event({ phraseSection: "drop" }))).toBe("Drop Impact");
    expect(chooseSceneName(event({ phraseSection: "groove" }))).toBe("Groove Pulse");
    expect(chooseSceneName(event({ phraseSection: "intro" }))).toBe("Intro Bloom");
  });
});

describe("decideLightingColor", () => {
  it("uses energy/marker color when key-aware coloring is off", () => {
    const decision = decideLightingColor(event({ marker: "drop" }), settings({ keyAwareColoring: false }));
    expect(decision.paletteId).toBe("energy-only");
    expect(decision.blendedColor).toBe("#f97316");
  });

  it("maps a Camelot key to its palette when key-aware coloring is on", () => {
    // Key 8A -> family "8" -> DEFAULT_KEY_MAPPING["8"] = "dark-warehouse".
    const decision = decideLightingColor(event({ key: "8A", crossfader: 0 }), settings());
    expect(decision.paletteName).toBe("Dark Warehouse");
    expect(decision.fromColor).toBe("#334155");
    expect(decision.toColor).toBe("#1d4ed8");
    // crossfader 0 -> blend fully toward the "from" color.
    expect(decision.blendedColor).toBe("#334155");
  });
});

describe("renderVirtualScene", () => {
  it("emits four fixtures capped by the safety limit", () => {
    const { fixtures } = renderVirtualScene(event(), settings({ safetyLimit: 0.6 }));
    expect(fixtures).toHaveLength(4);
    for (const fixture of fixtures) {
      expect(fixture.intensity).toBeGreaterThanOrEqual(0);
      expect(fixture.intensity).toBeLessThanOrEqual(0.6);
    }
  });

  it("strobes the back fixture on a drop when strobe is allowed", () => {
    const { fixtures } = renderVirtualScene(event({ marker: "drop" }), settings());
    expect(fixtures[3].strobeHz).toBeGreaterThan(0);
  });

  it("disables strobe outside drops when strobeOnDropsOnly is set", () => {
    const quiet = event({ marker: "none", phraseSection: "groove" });
    const { fixtures } = renderVirtualScene(quiet, settings({ strobeOnDropsOnly: true }));
    expect(fixtures[3].strobeHz).toBe(0);
  });
});
