import { dmxPlaceholderAdapter, huePlaceholderAdapter, midiClockPlaceholderAdapter } from "./adapters";
import { flowLightEventBus } from "./eventBus";
import { chooseSceneName, renderVirtualScene } from "./sceneEngine";
import type { FlowLightEvent, FlowLightState, LightOutputAdapter } from "./types";

export class FlowLightManager {
  private adapters: LightOutputAdapter[];
  private state: FlowLightState;

  constructor(adapters: LightOutputAdapter[] = [dmxPlaceholderAdapter, huePlaceholderAdapter, midiClockPlaceholderAdapter]) {
    this.adapters = adapters;
    this.state = {
      sceneName: "Idle",
      fixtures: renderVirtualScene({
        timestampMs: 0,
        bpm: 120,
        beatPhase: 0,
        phraseSection: "groove",
        activeDeck: "A",
        crossfader: 0.5,
        energy: 5,
        marker: "none"
      }),
      lastEvent: null
    };
  }

  getState(): FlowLightState {
    return this.state;
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
      fixtures: renderVirtualScene(event),
      lastEvent: event
    };
    this.state = nextState;
    await Promise.all(this.adapters.map((adapter) => adapter.sendState(nextState)));
  }
}

export const flowLightManager = new FlowLightManager();
