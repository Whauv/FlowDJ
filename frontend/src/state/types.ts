export type Mode = "browse" | "mix" | "fx" | "recovery";
export type DeckId = "A" | "B";

export interface DeckState {
  id: DeckId;
  trackName: string;
  bpm: number;
  isPlaying: boolean;
  gain: number;
  duration: number;
  currentTime: number;
  isLoaded: boolean;
  waveform: number[];
  cuePoint: number | null;
  loopIn: number | null;
  loopOut: number | null;
  loopEnabled: boolean;
  error: string | null;
}

export interface FxState {
  slot1Active: boolean;
  slot2Active: boolean;
  momentaryActive: boolean;
}

export interface EqState {
  lowCut: boolean;
  highCut: boolean;
}
