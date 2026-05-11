import { create } from "zustand";
import type { DeckId, DeckState, KeyboardShortcut, Mode } from "./types";

interface AppState {
  mode: Mode;
  decks: Record<DeckId, DeckState>;
  activeDeck: DeckId;
  crossfader: number;
  masterGain: number;
  shortcuts: KeyboardShortcut[];
  lastAction: string;
  setMode: (mode: Mode) => void;
  setActiveDeck: (deckId: DeckId) => void;
  patchDeck: (deckId: DeckId, patch: Partial<DeckState>) => void;
  setCrossfader: (value: number) => void;
  setMasterGain: (value: number) => void;
  setLastAction: (action: string) => void;
}

const defaultShortcuts: KeyboardShortcut[] = [
  { action: "loadDeckA", combo: "Q", description: "Import audio to Deck A" },
  { action: "loadDeckB", combo: "P", description: "Import audio to Deck B" },
  { action: "togglePlayA", combo: "Z", description: "Play/Pause Deck A" },
  { action: "togglePlayB", combo: "X", description: "Play/Pause Deck B" },
  { action: "seekBack", combo: "Left Arrow", description: "Seek active deck backward" },
  { action: "seekForward", combo: "Right Arrow", description: "Seek active deck forward" },
  { action: "volumeDown", combo: "A", description: "Lower active deck volume" },
  { action: "volumeUp", combo: "S", description: "Raise active deck volume" },
  { action: "cue", combo: "C", description: "Set or jump cue on active deck" },
  { action: "loop", combo: "L", description: "Loop in/out on active deck" },
  { action: "autoloop", combo: "K", description: "Enable autoloop on active deck" },
  { action: "crossfaderLeft", combo: ",", description: "Crossfader left" },
  { action: "crossfaderRight", combo: ".", description: "Crossfader right" },
  { action: "masterDown", combo: "N", description: "Lower master output" },
  { action: "masterUp", combo: "M", description: "Raise master output" },
  { action: "activeDeck", combo: "Tab", description: "Switch active deck" },
  { action: "modeBrowse", combo: "1", description: "Switch to Browse Mode" },
  { action: "modeMix", combo: "2", description: "Switch to Mix Mode" },
  { action: "modeFx", combo: "3", description: "Switch to FX Mode" },
  { action: "modeRecovery", combo: "4", description: "Switch to Recovery Mode" }
];

function makeDeck(id: DeckId): DeckState {
  return {
    id,
    trackName: "No track loaded",
    bpm: 0,
    isPlaying: false,
    gain: 0.8,
    duration: 0,
    currentTime: 0,
    isLoaded: false,
    waveform: [],
    cuePoint: null,
    loopIn: null,
    loopOut: null,
    loopEnabled: false,
    error: null
  };
}

export const useAppStore = create<AppState>((set) => ({
  mode: "browse",
  decks: {
    A: makeDeck("A"),
    B: makeDeck("B")
  },
  activeDeck: "A",
  crossfader: 0.5,
  masterGain: 0.9,
  shortcuts: defaultShortcuts,
  lastAction: "Ready",
  setMode: (mode) => set({ mode, lastAction: `Mode switched to ${mode.toUpperCase()}` }),
  setActiveDeck: (deckId) => set({ activeDeck: deckId, lastAction: `Active deck: ${deckId}` }),
  patchDeck: (deckId, patch) =>
    set((state) => ({ decks: { ...state.decks, [deckId]: { ...state.decks[deckId], ...patch } } })),
  setCrossfader: (value) => set({ crossfader: Math.max(0, Math.min(1, value)) }),
  setMasterGain: (value) => set({ masterGain: Math.max(0, Math.min(1, value)) }),
  setLastAction: (action) => set({ lastAction: action })
}));
