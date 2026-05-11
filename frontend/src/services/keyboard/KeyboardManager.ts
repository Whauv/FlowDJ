import { useEffect } from "react";
import { useAppStore } from "../../state/useAppStore";
import type { DeckId } from "../../state/types";

export type ShortcutAction =
  | "loadDeckA"
  | "loadDeckB"
  | "togglePlayA"
  | "togglePlayB"
  | "seekBack"
  | "seekForward"
  | "volumeUp"
  | "volumeDown"
  | "crossfaderLeft"
  | "crossfaderRight"
  | "masterUp"
  | "masterDown"
  | "cue"
  | "loop"
  | "autoloop"
  | "activeDeck"
  | "modeBrowse"
  | "modeMix"
  | "modeFx"
  | "modeRecovery";

export interface ShortcutMapping {
  [key: string]: ShortcutAction;
}

interface KeyboardHandlers {
  onAction: (action: ShortcutAction, activeDeck: DeckId) => void;
}

const defaultMapping: ShortcutMapping = {
  KeyQ: "loadDeckA",
  KeyP: "loadDeckB",
  KeyZ: "togglePlayA",
  KeyX: "togglePlayB",
  ArrowLeft: "seekBack",
  ArrowRight: "seekForward",
  KeyA: "volumeDown",
  KeyS: "volumeUp",
  Comma: "crossfaderLeft",
  Period: "crossfaderRight",
  KeyN: "masterDown",
  KeyM: "masterUp",
  KeyC: "cue",
  KeyL: "loop",
  KeyK: "autoloop",
  Tab: "activeDeck",
  Digit1: "modeBrowse",
  Digit2: "modeMix",
  Digit3: "modeFx",
  Digit4: "modeRecovery"
};

export class KeyboardManager {
  private mapping: ShortcutMapping;

  constructor(mapping: ShortcutMapping = defaultMapping) {
    this.mapping = mapping;
  }

  resolveAction(event: KeyboardEvent): ShortcutAction | null {
    return this.mapping[event.code] ?? null;
  }
}

export const keyboardManager = new KeyboardManager();

export function useKeyboardShortcuts({ onAction }: KeyboardHandlers): void {
  const activeDeck = useAppStore((s) => s.activeDeck);
  const setMode = useAppStore((s) => s.setMode);
  const setActiveDeck = useAppStore((s) => s.setActiveDeck);

  useEffect(() => {
    const handler = (event: KeyboardEvent) => {
      const action = keyboardManager.resolveAction(event);
      if (!action) {
        return;
      }

      if (event.target instanceof HTMLInputElement) {
        return;
      }

      event.preventDefault();

      if (action === "modeBrowse") return setMode("browse");
      if (action === "modeMix") return setMode("mix");
      if (action === "modeFx") return setMode("fx");
      if (action === "modeRecovery") return setMode("recovery");
      if (action === "activeDeck") return setActiveDeck(activeDeck === "A" ? "B" : "A");

      onAction(action, activeDeck);
    };

    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [activeDeck, onAction, setActiveDeck, setMode]);
}
