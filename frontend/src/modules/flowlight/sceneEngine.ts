import { DEFAULT_PALETTES } from "./palettes";
import type { FlowLightEvent, FlowLightSettings, LightingDecision, PhraseSection, VirtualFixture } from "./types";

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

function hexToRgb(hex: string): [number, number, number] {
  const clean = hex.replace("#", "");
  return [
    parseInt(clean.slice(0, 2), 16),
    parseInt(clean.slice(2, 4), 16),
    parseInt(clean.slice(4, 6), 16)
  ];
}

function rgbToHex(r: number, g: number, b: number): string {
  const part = (n: number) => n.toString(16).padStart(2, "0");
  return `#${part(Math.round(clamp(nanGuard(r), 0, 255)))}${part(Math.round(clamp(nanGuard(g), 0, 255)))}${part(Math.round(clamp(nanGuard(b), 0, 255)))}`;
}

function nanGuard(v: number): number {
  return Number.isFinite(v) ? v : 0;
}

function mixHex(a: string, b: string, t: number): string {
  const [ar, ag, ab] = hexToRgb(a);
  const [br, bg, bb] = hexToRgb(b);
  return rgbToHex(ar + (br - ar) * t, ag + (bg - ag) * t, ab + (bb - ab) * t);
}

function energyColor(event: FlowLightEvent): string {
  if (event.marker === "drop") return "#f97316";
  if (event.marker === "build") return "#eab308";
  if (event.marker === "breakdown") return "#6366f1";
  if (event.energy >= 7.5) return "#fb7185";
  if (event.energy <= 4) return "#22d3ee";
  return "#60a5fa";
}

function paletteFromKey(event: FlowLightEvent, settings: FlowLightSettings): { paletteId: string; paletteName: string; from: string; to: string; explanation: string } {
  const key = event.key ?? "8A";
  const group = key.replace(/[^0-9]/g, "") || "8";
  const paletteId = settings.keyToPalette[group] ?? settings.paletteLibrary[0]?.id ?? DEFAULT_PALETTES[0].id;
  const palette = settings.paletteLibrary.find((p) => p.id === paletteId) ?? settings.paletteLibrary[0] ?? DEFAULT_PALETTES[0];
  return {
    paletteId,
    paletteName: palette.name,
    from: palette.colors[0],
    to: palette.colors[1],
    explanation: `Key ${key} mapped to family ${group} -> ${palette.name}`
  };
}

export function chooseSceneName(event: FlowLightEvent): string {
  return PHRASE_SCENE_MAP[event.phraseSection] ?? "Groove Pulse";
}

export function decideLightingColor(event: FlowLightEvent, settings: FlowLightSettings): LightingDecision {
  if (!settings.keyAwareColoring) {
    const color = energyColor(event);
    return {
      paletteId: "energy-only",
      paletteName: "Energy Logic",
      fromColor: color,
      toColor: color,
      blendedColor: color,
      explanation: "Key-aware disabled: using energy/marker based color"
    };
  }

  const mapped = paletteFromKey(event, settings);
  const blendTarget = clamp01(event.crossfader);
  const blended = mixHex(mapped.from, mapped.to, blendTarget);
  return {
    paletteId: mapped.paletteId,
    paletteName: mapped.paletteName,
    fromColor: mapped.from,
    toColor: mapped.to,
    blendedColor: blended,
    explanation: `${mapped.explanation}; crossfader blend ${(blendTarget * 100).toFixed(0)}%`
  };
}

export function renderVirtualScene(event: FlowLightEvent, settings: FlowLightSettings): { fixtures: VirtualFixture[]; decision: LightingDecision } {
  const bpmNorm = clamp(event.bpm / 140, 0.5, 1.35);
  const baseIntensity = clamp01((event.energy / 10) * settings.intensityScale);
  const crossBiasA = clamp01(1 - event.crossfader);
  const crossBiasB = clamp01(event.crossfader);
  const beatPulse = 1 - settings.beatPulseStrength + ((0.5 + Math.sin(event.beatPhase * Math.PI * 2) * 0.5) * settings.beatPulseStrength * 2);

  const dominantDeckBoostA = event.activeDeck === "A" ? 1 + settings.movementSensitivity * 0.35 : 1;
  const dominantDeckBoostB = event.activeDeck === "B" ? 1 + settings.movementSensitivity * 0.35 : 1;

  const decision = decideLightingColor(event, settings);
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

  return {
    decision,
    fixtures: [
      {
        id: "fx-1",
        label: "Front Wash A",
        intensity: cappedA,
        color: decision.blendedColor,
        pan: Math.round(clamp(180 * crossBiasA + bpmNorm * settings.movementSensitivity * 8, 0, 180)),
        tilt: Math.round(clamp(35 + beatPulse * 40, 10, 90)),
        strobeHz: 0
      },
      {
        id: "fx-2",
        label: "Front Wash B",
        intensity: cappedB,
        color: decision.blendedColor,
        pan: Math.round(clamp(180 * crossBiasB - bpmNorm * settings.movementSensitivity * 8, 0, 180)),
        tilt: Math.round(clamp(35 + beatPulse * 40, 10, 90)),
        strobeHz: 0
      },
      {
        id: "fx-3",
        label: "Center Beam",
        intensity: cappedCenter,
        color: decision.toColor,
        pan: 90,
        tilt: Math.round(clamp(20 + event.energy * 5 * settings.movementSensitivity, 10, 90)),
        strobeHz: 0
      },
      {
        id: "fx-4",
        label: "Back Strobe",
        intensity: cappedBack,
        color: event.marker === "drop" ? "#ffffff" : decision.fromColor,
        pan: 90,
        tilt: 60,
        strobeHz
      }
    ]
  };
}
