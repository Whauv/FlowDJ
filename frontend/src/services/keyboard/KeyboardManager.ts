import { useEffect } from "react";
import { useAppStore } from "../../state/useAppStore";

export type ShortcutAction =
  | "playPauseA"
  | "playPauseB"
  | "modeBrowse"
  | "modeMix"
  | "modeFx"
  | "modeRecovery";

export interface ShortcutMapping {
  [key: string]: ShortcutAction;
}

const defaultMapping: ShortcutMapping = {
  Space: "playPauseA",
  Enter: "playPauseB",
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

  updateMapping(next: ShortcutMapping): void {
    this.mapping = next;
  }

  resolveAction(event: KeyboardEvent): ShortcutAction | null {
    return this.mapping[event.code] ?? null;
  }
}

export const keyboardManager = new KeyboardManager();

export function useKeyboardShortcuts(): void {
  const setMode = useAppStore((s) => s.setMode);
  const togglePlay = useAppStore((s) => s.togglePlay);
  const setLastAction = useAppStore((s) => s.setLastAction);

  useEffect(() => {
    const handler = (event: KeyboardEvent) => {
      const action = keyboardManager.resolveAction(event);
      if (!action) {
        return;
      }

      event.preventDefault();

      switch (action) {
        case "playPauseA":
          togglePlay("A");
          break;
        case "playPauseB":
          togglePlay("B");
          break;
        case "modeBrowse":
          setMode("browse");
          break;
        case "modeMix":
          setMode("mix");
          break;
        case "modeFx":
          setMode("fx");
          break;
        case "modeRecovery":
          setMode("recovery");
          break;
        default:
          setLastAction("Unhandled keyboard action");
      }
    };

    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [setMode, togglePlay, setLastAction]);
}
