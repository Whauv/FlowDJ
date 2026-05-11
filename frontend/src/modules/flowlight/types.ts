export type DeckId = "A" | "B";

export interface FlowLightEvent {
  timestampMs: number;
  bpm: number;
  beatPhase: number;
  phraseSection: "build" | "drop" | "breakdown" | "groove";
  activeDeck: DeckId;
  crossfader: number;
  energy: number;
  marker: "none" | "build" | "drop" | "breakdown";
  key?: string;
}

export interface VirtualFixture {
  id: string;
  label: string;
  intensity: number;
  color: string;
  pan: number;
  tilt: number;
}

export interface FlowLightState {
  sceneName: string;
  fixtures: VirtualFixture[];
  lastEvent: FlowLightEvent | null;
}

export interface LightOutputAdapter {
  id: string;
  connect: () => Promise<void>;
  disconnect: () => Promise<void>;
  sendState: (state: FlowLightState) => Promise<void>;
}
