import { beforeEach, describe, expect, it } from "vitest";

import { useAppStore } from "./deckStore";

const INITIAL = { ...useAppStore.getState() };

beforeEach(() => {
  useAppStore.setState(INITIAL, true);
});

describe("useAppStore defaults", () => {
  it("starts in browse mode with a centered crossfader", () => {
    const state = useAppStore.getState();
    expect(state.mode).toBe("browse");
    expect(state.crossfader).toBe(0.5);
    expect(state.masterGain).toBe(0.9);
    expect(state.safeMixMode).toBe(true);
    expect(state.activeDeck).toBe("A");
  });
});

describe("crossfader / master gain clamping", () => {
  it("clamps the crossfader into [0,1]", () => {
    useAppStore.getState().setCrossfader(2);
    expect(useAppStore.getState().crossfader).toBe(1);
    useAppStore.getState().setCrossfader(-1);
    expect(useAppStore.getState().crossfader).toBe(0);
    useAppStore.getState().setCrossfader(0.3);
    expect(useAppStore.getState().crossfader).toBe(0.3);
  });

  it("clamps master gain into [0,1]", () => {
    useAppStore.getState().setMasterGain(5);
    expect(useAppStore.getState().masterGain).toBe(1);
    useAppStore.getState().setMasterGain(-2);
    expect(useAppStore.getState().masterGain).toBe(0);
  });
});

describe("mode and deck actions", () => {
  it("records the last action when switching mode", () => {
    useAppStore.getState().setMode("mix");
    const state = useAppStore.getState();
    expect(state.mode).toBe("mix");
    expect(state.lastAction).toContain("MIX");
  });

  it("patches a single deck without touching the other", () => {
    useAppStore.getState().patchDeck("B", { bpm: 128, isPlaying: true });
    const state = useAppStore.getState();
    expect(state.decks.B.bpm).toBe(128);
    expect(state.decks.B.isPlaying).toBe(true);
    expect(state.decks.A.bpm).toBe(0); // unchanged default
  });
});
