import { create } from "zustand";
import type { DeckId, DeckState, EqState, FxState, Mode } from "./types";
import type { KeyProfile } from "../services/keyboard/types";
import type { RecommendationBias, RecommendationDirection } from "../modules/recommendations/types";
import { createDefaultProfiles } from "../services/keyboard/profiles/defaults";

interface AppState {
  mode: Mode;
  decks: Record<DeckId, DeckState>;
  activeDeck: DeckId;
  crossfader: number;
  masterGain: number;
  safeMixMode: boolean;
  recommendationDirection: RecommendationDirection;
  recommendationBias: RecommendationBias;
  recommendationMood: string;
  fx: FxState;
  eq: EqState;
  profiles: KeyProfile[];
  selectedProfileId: string;
  showOnboarding: boolean;
  showMappingPanel: boolean;
  lastAction: string;
  setMode: (mode: Mode) => void;
  setActiveDeck: (deckId: DeckId) => void;
  patchDeck: (deckId: DeckId, patch: Partial<DeckState>) => void;
  setCrossfader: (value: number) => void;
  setMasterGain: (value: number) => void;
  setSafeMixMode: (value: boolean) => void;
  setRecommendationDirection: (value: RecommendationDirection) => void;
  setRecommendationBias: (value: RecommendationBias) => void;
  setRecommendationMood: (value: string) => void;
  setFx: (patch: Partial<FxState>) => void;
  setEq: (patch: Partial<EqState>) => void;
  setProfiles: (profiles: KeyProfile[], selectedProfileId: string) => void;
  selectProfile: (profileId: string) => void;
  setShowOnboarding: (value: boolean) => void;
  setShowMappingPanel: (value: boolean) => void;
  setLastAction: (action: string) => void;
}

function makeDeck(id: DeckId): DeckState {
  return {
    id,
    trackName: "No track loaded",
    bpm: 0,
    musicalKey: "8A",
    energy: 5,
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

const profileDefaults = createDefaultProfiles();

export const useAppStore = create<AppState>((set) => ({
  mode: "browse",
  decks: { A: makeDeck("A"), B: makeDeck("B") },
  activeDeck: "A",
  crossfader: 0.5,
  masterGain: 0.9,
  safeMixMode: true,
  recommendationDirection: "maintain_groove",
  recommendationBias: "balanced",
  recommendationMood: "",
  fx: { slot1Active: false, slot2Active: false, momentaryActive: false },
  eq: { lowCut: false, highCut: false },
  profiles: profileDefaults.profiles,
  selectedProfileId: profileDefaults.selectedProfileId,
  showOnboarding: true,
  showMappingPanel: false,
  lastAction: "Ready",
  setMode: (mode) => set({ mode, lastAction: `Mode switched to ${mode.toUpperCase()}` }),
  setActiveDeck: (deckId) => set({ activeDeck: deckId, lastAction: `Active deck: ${deckId}` }),
  patchDeck: (deckId, patch) => set((state) => ({ decks: { ...state.decks, [deckId]: { ...state.decks[deckId], ...patch } } })),
  setCrossfader: (value) => set({ crossfader: Math.max(0, Math.min(1, value)) }),
  setMasterGain: (value) => set({ masterGain: Math.max(0, Math.min(1, value)) }),
  setSafeMixMode: (safeMixMode) => set({ safeMixMode }),
  setRecommendationDirection: (recommendationDirection) => set({ recommendationDirection }),
  setRecommendationBias: (recommendationBias) => set({ recommendationBias }),
  setRecommendationMood: (recommendationMood) => set({ recommendationMood }),
  setFx: (patch) => set((state) => ({ fx: { ...state.fx, ...patch } })),
  setEq: (patch) => set((state) => ({ eq: { ...state.eq, ...patch } })),
  setProfiles: (profiles, selectedProfileId) => set({ profiles, selectedProfileId }),
  selectProfile: (selectedProfileId) => set({ selectedProfileId }),
  setShowOnboarding: (showOnboarding) => set({ showOnboarding }),
  setShowMappingPanel: (showMappingPanel) => set({ showMappingPanel }),
  setLastAction: (lastAction) => set({ lastAction })
}));

