import type { FlowLightEvent } from "./types";

type Listener = (event: FlowLightEvent) => void;

export class FlowLightEventBus {
  private listeners = new Set<Listener>();

  publish(event: FlowLightEvent): void {
    this.listeners.forEach((listener) => listener(event));
  }

  subscribe(listener: Listener): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }
}

export const flowLightEventBus = new FlowLightEventBus();
