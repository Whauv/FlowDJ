import { dmxPlaceholderAdapter, huePlaceholderAdapter, midiClockPlaceholderAdapter } from "./adapters";
import { flowLightEventBus } from "./eventBus";
import { DEFAULT_KEY_MAPPING, DEFAULT_PALETTES, getMoodMapping } from "./palettes";
import { PHRASE_SCENE_MAP, chooseSceneName, renderVirtualScene } from "./sceneEngine";
import type { FlowLightEvent, FlowLightSettings, FlowLightState, LightOutputAdapter, PaletteFamily } from "./types";

const DEFAULT_SETTINGS: FlowLightSettings = {
  movementSensitivity: 1,
  intensityScale: 1,
  beatPulseStrength: 0.75,
  safetyLimit: 0.9,
  allowStrobe: true,
  strobeOnDropsOnly: true,
  keyAwareColoring: true,
  selectedMoodPreset: "warm-club",
  keyToPalette: DEFAULT_KEY_MAPPING,
  paletteLibrary: DEFAULT_PALETTES
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
      marker: "none",
      key: "8A"
    };

    const seeded = renderVirtualScene(seedEvent, this.settings);

    this.state = {
      sceneName: "Idle",
      fixtures: seeded.fixtures,
      lastEvent: null,
      phraseToScene: PHRASE_SCENE_MAP,
      settings: this.settings,
      decision: seeded.decision
    };
  }

  getState(): FlowLightState {
    return this.state;
  }

  updateSettings(next: Partial<FlowLightSettings>): void {
    this.settings = { ...this.settings, ...next };
    this.state = { ...this.state, settings: this.settings };
    if (this.state.lastEvent) void this.handleEvent(this.state.lastEvent);
  }

  applyMoodPreset(presetId: string): void {
    const mapping = getMoodMapping(presetId);
    this.updateSettings({ selectedMoodPreset: presetId, keyToPalette: mapping });
  }

  updatePaletteColor(paletteId: string, index: number, color: string): void {
    const nextLib: PaletteFamily[] = this.settings.paletteLibrary.map((palette) => {
      if (palette.id !== paletteId) return palette;
      const colors: [string, string, string] = [...palette.colors] as [string, string, string];
      if (index >= 0 && index <= 2) colors[index] = color;
      return { ...palette, colors };
    });
    this.updateSettings({ paletteLibrary: nextLib });
  }

  updateKeyMapping(group: string, paletteId: string): void {
    this.updateSettings({ keyToPalette: { ...this.settings.keyToPalette, [group]: paletteId } });
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
    const next = renderVirtualScene(event, this.settings);
    const nextState: FlowLightState = {
      sceneName: chooseSceneName(event),
      fixtures: next.fixtures,
      lastEvent: event,
      phraseToScene: PHRASE_SCENE_MAP,
      settings: this.settings,
      decision: next.decision
    };
    this.state = nextState;
    await Promise.all(this.adapters.map((adapter) => adapter.sendState(nextState)));
  }
}

export const flowLightManager = new FlowLightManager();
