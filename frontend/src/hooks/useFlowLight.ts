import { dmxPlaceholderAdapter, huePlaceholderAdapter, midiClockPlaceholderAdapter } from "./adapters";
import { flowLightEventBus } from "./eventBus";
import { DEFAULT_KEY_MAPPING, DEFAULT_PALETTES, getMoodMapping } from "./palettes";
import { PHRASE_SCENE_MAP, chooseSceneName, renderVirtualScene } from "./sceneEngine";
import type {
  AdapterDiagnostics,
  AdapterKind,
  ConnectionState,
  FlowLightEvent,
  FlowLightSettings,
  FlowLightState,
  HardwareMode,
  LightOutputAdapter,
  PaletteFamily
} from "./types";

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

function makeDiag(adapter: LightOutputAdapter): AdapterDiagnostics {
  return {
    adapterId: adapter.id,
    kind: adapter.kind,
    state: "disconnected",
    message: "Idle",
    selectedDeviceId: null,
    devices: []
  };
}

export class FlowLightManager {
  private adapters: LightOutputAdapter[];
  private state: FlowLightState;
  private settings: FlowLightSettings;
  private diagnostics: Record<AdapterKind, AdapterDiagnostics>;
  private hardwareMode: HardwareMode = "simulation";

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

    this.diagnostics = {
      dmx: makeDiag(dmxPlaceholderAdapter),
      hue: makeDiag(huePlaceholderAdapter),
      "midi-clock": makeDiag(midiClockPlaceholderAdapter)
    };
  }

  getState(): FlowLightState {
    return this.state;
  }

  getDiagnostics(): AdapterDiagnostics[] {
    return [this.diagnostics.dmx, this.diagnostics.hue, this.diagnostics["midi-clock"]];
  }

  getHardwareMode(): HardwareMode {
    return this.hardwareMode;
  }

  setHardwareMode(mode: HardwareMode): void {
    this.hardwareMode = mode;
    if (mode === "simulation") {
      this.getDiagnostics().forEach((diag) => {
        this.diagnostics[diag.kind] = { ...diag, message: "Simulation mode active" };
      });
    }
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

  async discover(kind: AdapterKind): Promise<void> {
    const adapter = this.adapters.find((a) => a.kind === kind);
    if (!adapter) return;
    this.diagnostics[kind] = { ...this.diagnostics[kind], state: "discovering", message: "Discovering devices..." };
    try {
      const devices = await adapter.discover();
      this.diagnostics[kind] = {
        ...this.diagnostics[kind],
        state: this.diagnostics[kind].state === "connected" ? "connected" : "disconnected",
        devices,
        message: devices.length ? `Found ${devices.length} device(s)` : "No devices found"
      };
    } catch {
      this.diagnostics[kind] = { ...this.diagnostics[kind], state: "error", message: "Discovery failed" };
    }
  }

  async connectAdapter(kind: AdapterKind, deviceId?: string): Promise<void> {
    const adapter = this.adapters.find((a) => a.kind === kind);
    if (!adapter) return;
    this.diagnostics[kind] = { ...this.diagnostics[kind], state: "connecting", message: "Connecting..." };
    try {
      await adapter.connect(deviceId);
      this.diagnostics[kind] = {
        ...this.diagnostics[kind],
        state: "connected",
        selectedDeviceId: deviceId ?? this.diagnostics[kind].devices[0]?.id ?? null,
        message: "Connected"
      };
    } catch {
      this.diagnostics[kind] = { ...this.diagnostics[kind], state: "error", message: "Connection failed" };
    }
  }

  async disconnectAdapter(kind: AdapterKind): Promise<void> {
    const adapter = this.adapters.find((a) => a.kind === kind);
    if (!adapter) return;
    try {
      await adapter.disconnect();
      this.diagnostics[kind] = { ...this.diagnostics[kind], state: "disconnected", message: "Disconnected", selectedDeviceId: null };
    } catch {
      this.diagnostics[kind] = { ...this.diagnostics[kind], state: "error", message: "Disconnect failed" };
    }
  }

  async start(): Promise<() => void> {
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

    if (this.hardwareMode === "live") {
      await Promise.all(this.adapters.map(async (adapter) => {
        const diag = this.diagnostics[adapter.kind];
        if (diag.state === "connected") {
          await adapter.sendState(nextState);
        }
      }));
    }
  }
}

export const flowLightManager = new FlowLightManager();
