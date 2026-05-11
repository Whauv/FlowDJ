import { dmxPlaceholderAdapter, huePlaceholderAdapter, midiClockPlaceholderAdapter } from "./adapters";
import { flowLightEventBus } from "./eventBus";
import { PHRASE_SCENE_MAP, chooseSceneName, renderVirtualScene } from "./sceneEngine";
import type { FlowLightEvent, FlowLightSettings, FlowLightState, LightOutputAdapter } from "./types";

const DEFAULT_SETTINGS: FlowLightSettings = {
  movementSensitivity: 1,
  intensityScale: 1,
  beatPulseStrength: 0.75,
  safetyLimit: 0.9,
  allowStrobe: true,
  strobeOnDropsOnly: true
};

export class FlowLightManager {
  private adapters: LightOutputAdapter[];
  private state: FlowLightState;
  private settings: FlowLightSettings;

  constructor(adapters: LightOutputAdapter[] = [dmxPlaceholderAdapter, huePlaceholderAdapter, midiClockPlaceholderAdapter]) {
    this.adapters = adapters;
    this.settings = DEFAULT_SETTINGS;
    const seedEvent: FlowLightEvent = {
      timestampMs: 0,
      bpm: 120,
      beatPhase: 0,
      phraseSection: "groove",
      activeDeck: "A",
      crossfader: 0.5,
      energy: 5,
      marker: "none"
    };

    this.state = {
      sceneName: "Idle",
      fixtures: renderVirtualScene(seedEvent, this.settings),
      lastEvent: null,
      phraseToScene: PHRASE_SCENE_MAP,
      settings: this.settings
    };
  }

  getState(): FlowLightState {
    return this.state;
  }

  updateSettings(next: Partial<FlowLightSettings>): void {
    this.settings = { ...this.settings, ...next };
    this.state = { ...this.state, settings: this.settings };
    if (this.state.lastEvent) {
      void this.handleEvent(this.state.lastEvent);
    }
  }

  async start(): Promise<() => void> {
    await Promise.all(this.adapters.map((adapter) => adapter.connect()));
    const unsubscribe = flowLightEventBus.subscribe((event) => {
      void this.handleEvent(event);
    });
    return () => {
      unsubscribe();
      void Promise.all(this.adapters.map((adapter) => adapter.disconnect()));
    };
  }

  private async handleEvent(event: FlowLightEvent): Promise<void> {
    const nextState: FlowLightState = {
      sceneName: chooseSceneName(event),
      fixtures: renderVirtualScene(event, this.settings),
      lastEvent: event,
      phraseToScene: PHRASE_SCENE_MAP,
      settings: this.settings
    };
    this.state = nextState;
    await Promise.all(this.adapters.map((adapter) => adapter.sendState(nextState)));
  }
}

export const flowLightManager = new FlowLightManager();
