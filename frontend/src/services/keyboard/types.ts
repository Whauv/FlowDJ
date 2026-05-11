export type FlowMode = "browse" | "mix" | "fx" | "recovery";

export type KeyboardAction =
  | "modeBrowse"
  | "modeMix"
  | "modeFx"
  | "modeRecovery"
  | "activeDeck"
  | "loadDeckA"
  | "loadDeckB"
  | "browseUp"
  | "browseDown"
  | "browseSearch"
  | "togglePlayA"
  | "togglePlayB"
  | "cue"
  | "sync"
  | "crossfaderLeft"
  | "crossfaderRight"
  | "eqLowToggle"
  | "eqHighToggle"
  | "fxTrigger1"
  | "fxTrigger2"
  | "fxMomentary"
  | "seekBack"
  | "seekForward"
  | "volumeUp"
  | "volumeDown"
  | "masterUp"
  | "masterDown"
  | "loop"
  | "autoloop"
  | "recoveryEmergencyFade"
  | "recoveryKillSwitch"
  | "recoverySafeTransition"
  | "showHelp"
  | "openMapping";

export interface MappingEntry {
  action: KeyboardAction;
  code: string;
  label: string;
  description: string;
}

export type ModeMappings = Record<FlowMode, MappingEntry[]>;

export interface KeyProfile {
  id: string;
  name: string;
  compact: boolean;
  mappings: ModeMappings;
}

export interface KeyboardProfilesPayload {
  selectedProfileId: string;
  profiles: KeyProfile[];
}

export interface KeyboardLegendItem {
  action: KeyboardAction;
  code: string;
  label: string;
  description: string;
}
