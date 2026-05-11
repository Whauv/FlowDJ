import type { FlowLightEvent, FlowLightSettings, PhraseSection, VirtualFixture } from "./types";

const KEY_COLORS: Record<string, string> = {
  "8A": "#3b82f6",
  "8B": "#06b6d4",
  "9A": "#8b5cf6",
  "9B": "#ec4899",
  "7A": "#22c55e",
  "7B": "#14b8a6"
};

export const PHRASE_SCENE_MAP: Record<PhraseSection, string> = {
  intro: "Intro Bloom",
  buildup: "Build Climb",
  drop: "Drop Impact",
  breakdown: "Breakdown Drift",
  outro: "Outro Fade",
  groove: "Groove Pulse"
};

function clamp01(value: number): number {
  return Math.max(0, Math.min(1, value));
}

function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}

function colorFromEvent(event: FlowLightEvent): string {
  if (event.key && KEY_COLORS[event.key]) return KEY_COLORS[event.key];
  if (event.marker === "drop") return "#f97316";
  if (event.marker === "build") return "#eab308";
  if (event.marker === "breakdown") return "#6366f1";
  return "#22d3ee";
}

export function chooseSceneName(event: FlowLightEvent): string {
  return PHRASE_SCENE_MAP[event.phraseSection] ?? "Groove Pulse";
}

export function renderVirtualScene(event: FlowLightEvent, settings: FlowLightSettings): VirtualFixture[] {
  const bpmNorm = clamp(event.bpm / 140, 0.5, 1.35);
  const baseIntensity = clamp01((event.energy / 10) * settings.intensityScale);
  const crossBiasA = clamp01(1 - event.crossfader);
  const crossBiasB = clamp01(event.crossfader);
  const beatPulse = 1 - settings.beatPulseStrength + ((0.5 + Math.sin(event.beatPhase * Math.PI * 2) * 0.5) * settings.beatPulseStrength * 2);

  const dominantDeckBoostA = event.activeDeck === "A" ? 1 + settings.movementSensitivity * 0.35 : 1;
  const dominantDeckBoostB = event.activeDeck === "B" ? 1 + settings.movementSensitivity * 0.35 : 1;

  const color = colorFromEvent(event);
  const sceneMultiplier = event.phraseSection === "drop" ? 1.2 : event.phraseSection === "breakdown" ? 0.75 : event.phraseSection === "outro" ? 0.6 : 1;

  const strobeAllowed = settings.allowStrobe && (!settings.strobeOnDropsOnly || event.marker === "drop" || event.phraseSection === "buildup");
  const strobeHz = strobeAllowed ? clamp((event.bpm / 60) * (event.marker === "drop" ? 2.2 : 1.2), 0, 12) : 0;

  const iA = clamp01(baseIntensity * crossBiasA * beatPulse * dominantDeckBoostA * sceneMultiplier);
  const iB = clamp01(baseIntensity * crossBiasB * beatPulse * dominantDeckBoostB * sceneMultiplier);
  const iCenter = clamp01(baseIntensity * (0.6 + Math.abs(0.5 - event.crossfader)) * sceneMultiplier);
  const iBack = clamp01(baseIntensity * (event.marker === "drop" ? 1 : 0.45) * sceneMultiplier);

  const cappedA = Math.min(iA, settings.safetyLimit);
  const cappedB = Math.min(iB, settings.safetyLimit);
  const cappedCenter = Math.min(iCenter, settings.safetyLimit);
  const cappedBack = Math.min(iBack, settings.safetyLimit);

  return [
    {
      id: "fx-1",
      label: "Front Wash A",
      intensity: cappedA,
      color,
      pan: Math.round(clamp(180 * crossBiasA + bpmNorm * settings.movementSensitivity * 8, 0, 180)),
      tilt: Math.round(clamp(35 + beatPulse * 40, 10, 90)),
      strobeHz: 0
    },
    {
      id: "fx-2",
      label: "Front Wash B",
      intensity: cappedB,
      color,
      pan: Math.round(clamp(180 * crossBiasB - bpmNorm * settings.movementSensitivity * 8, 0, 180)),
      tilt: Math.round(clamp(35 + beatPulse * 40, 10, 90)),
      strobeHz: 0
    },
    {
      id: "fx-3",
      label: "Center Beam",
      intensity: cappedCenter,
      color,
      pan: 90,
      tilt: Math.round(clamp(20 + event.energy * 5 * settings.movementSensitivity, 10, 90)),
      strobeHz: 0
    },
    {
      id: "fx-4",
      label: "Back Strobe",
      intensity: cappedBack,
      color: event.marker === "drop" ? "#ffffff" : color,
      pan: 90,
      tilt: 60,
      strobeHz
    }
  ];
}
