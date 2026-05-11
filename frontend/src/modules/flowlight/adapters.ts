import type { LightOutputAdapter } from "./types";

export const dmxPlaceholderAdapter: LightOutputAdapter = {
  id: "dmx-placeholder",
  async connect() {
    return;
  },
  async disconnect() {
    return;
  },
  async sendState(_state) {
    return;
  }
};

export const huePlaceholderAdapter: LightOutputAdapter = {
  id: "hue-placeholder",
  async connect() {
    return;
  },
  async disconnect() {
    return;
  },
  async sendState(_state) {
    return;
  }
};

export const midiClockPlaceholderAdapter: LightOutputAdapter = {
  id: "midi-clock-placeholder",
  async connect() {
    return;
  },
  async disconnect() {
    return;
  },
  async sendState(_state) {
    return;
  }
};
