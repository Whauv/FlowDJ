import type { DeviceDescriptor, LightOutputAdapter } from "./types";

function makeStubDevices(prefix: string, label: string): DeviceDescriptor[] {
  return [
    { id: `${prefix}-sim-1`, label: `${label} Simulator`, transport: "simulation" }
  ];
}

function createStubAdapter(id: string, kind: "dmx" | "hue" | "midi-clock", devices: DeviceDescriptor[]): LightOutputAdapter {
  let connected = false;
  return {
    id,
    kind,
    async discover() {
      return devices;
    },
    async connect() {
      connected = true;
      return;
    },
    async disconnect() {
      connected = false;
      return;
    },
    async sendState(_state) {
      if (!connected) {
        return;
      }
      return;
    }
  };
}

// Wiring note: replace this with OLA/sACN/Art-Net client write calls.
export const dmxPlaceholderAdapter = createStubAdapter(
  "dmx-provider",
  "dmx",
  [
    ...makeStubDevices("dmx", "DMX"),
    { id: "dmx-udp-artnet", label: "DMX Art-Net Bridge", transport: "udp/artnet" }
  ]
);

// Wiring note: replace this with Hue Bridge local discovery + authenticated REST calls.
export const huePlaceholderAdapter = createStubAdapter(
  "hue-provider",
  "hue",
  [
    ...makeStubDevices("hue", "Hue"),
    { id: "hue-bridge-local", label: "Hue Bridge (Local Network)", transport: "https local bridge" }
  ]
);

// Wiring note: replace this with Web MIDI / native MIDI clock and Link bridge integration.
export const midiClockPlaceholderAdapter = createStubAdapter(
  "midi-provider",
  "midi-clock",
  [
    ...makeStubDevices("midi", "MIDI Clock"),
    { id: "midi-out-1", label: "MIDI Clock Output Port", transport: "midi clock" },
    { id: "ableton-link-bridge", label: "Ableton Link Bridge", transport: "link bridge" }
  ]
);
