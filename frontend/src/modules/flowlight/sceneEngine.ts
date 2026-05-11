import type { FlowLightEvent, VirtualFixture } from "./types";

const KEY_COLORS: Record<string, string> = {
  "8A": "#3b82f6",
  "8B": "#06b6d4",
  "9A": "#8b5cf6",
  "9B": "#ec4899",
  "7A": "#22c55e",
  "7B": "#14b8a6"
};

function clamp01(value: number): number {
  return Math.max(0, Math.min(1, value));
}

function colorFromEvent(event: FlowLightEvent): string {
  if (event.key && KEY_COLORS[event.key]) return KEY_COLORS[event.key];
  if (event.marker === "drop") return "#f97316";
  if (event.marker === "build") return "#eab308";
  if (event.marker === "breakdown") return "#6366f1";
  return "#22d3ee";
}

export function chooseSceneName(event: FlowLightEvent): string {
  if (event.marker === "drop") return "Drop Impact";
  if (event.marker === "build") return "Build Rise";
  if (event.marker === "breakdown") return "Breakdown Drift";
  if (event.energy >= 7.5) return "Peak Drive";
  if (event.energy <= 4) return "Cooldown Glow";
  return "Groove Pulse";
}

export function renderVirtualScene(event: FlowLightEvent): VirtualFixture[] {
  const baseIntensity = clamp01(event.energy / 10);
  const crossBiasA = clamp01(1 - event.crossfader);
  const crossBiasB = clamp01(event.crossfader);
  const beatPulse = 0.55 + Math.sin(event.beatPhase * Math.PI * 2) * 0.45;
  const color = colorFromEvent(event);

  return [
    {
      id: "fx-1",
      label: "Front Wash A",
      intensity: clamp01(baseIntensity * crossBiasA * beatPulse),
      color,
      pan: Math.round(crossBiasA * 180),
      tilt: Math.round(40 + beatPulse * 35)
    },
    {
      id: "fx-2",
      label: "Front Wash B",
      intensity: clamp01(baseIntensity * crossBiasB * beatPulse),
      color,
      pan: Math.round(crossBiasB * 180),
      tilt: Math.round(40 + beatPulse * 35)
    },
    {
      id: "fx-3",
      label: "Center Beam",
      intensity: clamp01(baseIntensity * (0.7 + Math.abs(0.5 - event.crossfader))),
      color,
      pan: 90,
      tilt: Math.round(20 + event.energy * 5)
    },
    {
      id: "fx-4",
      label: "Back Strobe",
      intensity: event.marker === "drop" ? clamp01(baseIntensity) : clamp01(baseIntensity * 0.45),
      color: event.marker === "drop" ? "#ffffff" : color,
      pan: 90,
      tilt: 60
    }
  ];
}
