export type Mode = "browse" | "mix" | "fx" | "recovery";

export interface DeckState {
  id: "A" | "B";
  trackName: string;
  bpm: number;
  isPlaying: boolean;
  gain: number;
}

export interface KeyboardShortcut {
  action: string;
  combo: string;
  description: string;
}
