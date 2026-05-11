import { create } from "zustand";
import type { DeckState, Mode, KeyboardShortcut } from "../state/types";

interface AppState {
  mode: Mode;
  decks: Record<"A" | "B", DeckState>;
  shortcuts: KeyboardShortcut[];
  lastAction: string;
  setMode: (mode: Mode) => void;
  togglePlay: (deckId: "A" | "B") => void;
  setLastAction: (action: string) => void;
}

const defaultShortcuts: KeyboardShortcut[] = [
  { action: "playPauseA", combo: "Space", description: "Play/Pause Deck A" },
  { action: "playPauseB", combo: "Enter", description: "Play/Pause Deck B" },
  { action: "modeBrowse", combo: "1", description: "Switch to Browse Mode" },
  { action: "modeMix", combo: "2", description: "Switch to Mix Mode" },
  { action: "modeFx", combo: "3", description: "Switch to FX Mode" },
  { action: "modeRecovery", combo: "4", description: "Switch to Recovery Mode" }
];

export const useAppStore = create<AppState>((set) => ({
  mode: "browse",
  decks: {
    A: { id: "A", trackName: "No track loaded", bpm: 0, isPlaying: false, gain: 0.8 },
    B: { id: "B", trackName: "No track loaded", bpm: 0, isPlaying: false, gain: 0.8 }
  },
  shortcuts: defaultShortcuts,
  lastAction: "Ready",
  setMode: (mode) => set({ mode, lastAction: `Mode switched to ${mode.toUpperCase()}` }),
  togglePlay: (deckId) =>
    set((state) => ({
      decks: {
        ...state.decks,
        [deckId]: {
          ...state.decks[deckId],
          isPlaying: !state.decks[deckId].isPlaying
        }
      },
      lastAction: `Deck ${deckId} ${state.decks[deckId].isPlaying ? "paused" : "playing"}`
    })),
  setLastAction: (action) => set({ lastAction: action })
}));
