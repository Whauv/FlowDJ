export type DeckId = "A" | "B";
export type PhraseSection = "intro" | "buildup" | "drop" | "breakdown" | "outro" | "groove";

export interface FlowLightEvent {
  timestampMs: number;
  bpm: number;
  beatPhase: number;
  phraseSection: PhraseSection;
  activeDeck: DeckId;
  crossfader: number;
  energy: number;
  marker: "none" | "build" | "drop" | "breakdown";
  key?: string;
}

export interface FlowLightSettings {
  movementSensitivity: number;
  intensityScale: number;
  beatPulseStrength: number;
  safetyLimit: number;
  allowStrobe: boolean;
  strobeOnDropsOnly: boolean;
}

export interface VirtualFixture {
  id: string;
  label: string;
  intensity: number;
  color: string;
  pan: number;
  tilt: number;
  strobeHz: number;
}

export interface FlowLightState {
  sceneName: string;
  fixtures: VirtualFixture[];
  lastEvent: FlowLightEvent | null;
  phraseToScene: Record<PhraseSection, string>;
  settings: FlowLightSettings;
}

export interface LightOutputAdapter {
  id: string;
  connect: () => Promise<void>;
  disconnect: () => Promise<void>;
  sendState: (state: FlowLightState) => Promise<void>;
}
