import type { KeyPaletteMapping, MoodPreset, PaletteFamily } from "./types";

export const DEFAULT_PALETTES: PaletteFamily[] = [
  { id: "warm-club", name: "Warm Club", colors: ["#f97316", "#fb7185", "#facc15"] },
  { id: "neon-cyber", name: "Neon Cyber", colors: ["#22d3ee", "#06b6d4", "#8b5cf6"] },
  { id: "sunset-melodic", name: "Sunset Melodic", colors: ["#f59e0b", "#fb7185", "#7c3aed"] },
  { id: "dark-warehouse", name: "Dark Warehouse", colors: ["#334155", "#1d4ed8", "#0f172a"] }
];

export const DEFAULT_KEY_MAPPING: KeyPaletteMapping = {
  "1": "warm-club", "2": "warm-club", "3": "sunset-melodic", "4": "sunset-melodic",
  "5": "neon-cyber", "6": "neon-cyber", "7": "dark-warehouse", "8": "dark-warehouse",
  "9": "neon-cyber", "10": "sunset-melodic", "11": "warm-club", "12": "dark-warehouse"
};

export const MOOD_PRESETS: MoodPreset[] = [
  {
    id: "warm-club",
    label: "Warm Club",
    mapping: {
      "1": "warm-club", "2": "warm-club", "3": "warm-club", "4": "sunset-melodic",
      "5": "sunset-melodic", "6": "neon-cyber", "7": "dark-warehouse", "8": "dark-warehouse",
      "9": "warm-club", "10": "sunset-melodic", "11": "warm-club", "12": "dark-warehouse"
    }
  },
  {
    id: "neon-cyber",
    label: "Neon Cyber",
    mapping: {
      "1": "neon-cyber", "2": "neon-cyber", "3": "neon-cyber", "4": "neon-cyber",
      "5": "sunset-melodic", "6": "neon-cyber", "7": "dark-warehouse", "8": "neon-cyber",
      "9": "neon-cyber", "10": "sunset-melodic", "11": "neon-cyber", "12": "dark-warehouse"
    }
  },
  {
    id: "sunset-melodic",
    label: "Sunset Melodic",
    mapping: {
      "1": "sunset-melodic", "2": "sunset-melodic", "3": "sunset-melodic", "4": "sunset-melodic",
      "5": "warm-club", "6": "sunset-melodic", "7": "dark-warehouse", "8": "sunset-melodic",
      "9": "neon-cyber", "10": "sunset-melodic", "11": "warm-club", "12": "dark-warehouse"
    }
  },
  {
    id: "dark-warehouse",
    label: "Dark Warehouse",
    mapping: {
      "1": "dark-warehouse", "2": "dark-warehouse", "3": "dark-warehouse", "4": "dark-warehouse",
      "5": "neon-cyber", "6": "dark-warehouse", "7": "dark-warehouse", "8": "dark-warehouse",
      "9": "neon-cyber", "10": "dark-warehouse", "11": "warm-club", "12": "dark-warehouse"
    }
  }
];

export function getMoodMapping(id: string): KeyPaletteMapping {
  return MOOD_PRESETS.find((preset) => preset.id === id)?.mapping ?? DEFAULT_KEY_MAPPING;
}
