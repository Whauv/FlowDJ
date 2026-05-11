import { useEffect, useMemo, useRef } from "react";
import type { DeckId } from "../../state/types";
import type { FlowMode, KeyboardAction, KeyboardLegendItem, KeyProfile, MappingEntry } from "./types";

interface KeyboardHandlers {
  mode: FlowMode;
  activeDeck: DeckId;
  profile: KeyProfile;
  onAction: (action: KeyboardAction, deckId: DeckId) => void;
}

const ACTION_DEBOUNCE_MS = 120;
const DANGEROUS_HOLD_MS = 1200;

function makeLookup(entries: MappingEntry[]): Record<string, KeyboardAction> {
  return entries.reduce<Record<string, KeyboardAction>>((acc, entry) => {
    acc[entry.code] = entry.action;
    return acc;
  }, {});
}

export function detectMappingConflicts(profile: KeyProfile): string[] {
  const conflicts: string[] = [];
  (Object.keys(profile.mappings) as FlowMode[]).forEach((mode) => {
    const seen = new Map<string, KeyboardAction>();
    profile.mappings[mode].forEach((entry) => {
      const existing = seen.get(entry.code);
      if (existing && existing !== entry.action) {
        conflicts.push(`${mode.toUpperCase()}: ${entry.code}`);
      }
      seen.set(entry.code, entry.action);
    });
  });
  return conflicts;
}

export function getLegendForMode(profile: KeyProfile, mode: FlowMode): KeyboardLegendItem[] {
  return profile.mappings[mode].map((entry) => ({
    action: entry.action,
    code: entry.code,
    label: entry.label,
    description: entry.description
  }));
}

export function useKeyboardShortcuts({ mode, activeDeck, profile, onAction }: KeyboardHandlers): void {
  const lastActionRef = useRef<Map<KeyboardAction, number>>(new Map());
  const holdStartRef = useRef<Map<string, number>>(new Map());

  const lookup = useMemo(() => makeLookup(profile.mappings[mode]), [profile, mode]);

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.target instanceof HTMLInputElement || event.target instanceof HTMLTextAreaElement) {
        return;
      }

      const action = lookup[event.code];
      if (!action) {
        return;
      }

      event.preventDefault();

      if (event.repeat && action !== "recoveryKillSwitch") {
        return;
      }

      if (action === "recoveryKillSwitch") {
        if (!holdStartRef.current.has(event.code)) {
          holdStartRef.current.set(event.code, Date.now());
        }
        return;
      }

      const now = Date.now();
      const last = lastActionRef.current.get(action) ?? 0;
      if (now - last < ACTION_DEBOUNCE_MS) {
        return;
      }

      lastActionRef.current.set(action, now);
      onAction(action, activeDeck);
    };

    const onKeyUp = (event: KeyboardEvent) => {
      const action = lookup[event.code];
      if (action !== "recoveryKillSwitch") {
        return;
      }

      const start = holdStartRef.current.get(event.code);
      holdStartRef.current.delete(event.code);
      if (!start) {
        return;
      }

      if (Date.now() - start >= DANGEROUS_HOLD_MS) {
        onAction("recoveryKillSwitch", activeDeck);
      }
    };

    window.addEventListener("keydown", onKeyDown);
    window.addEventListener("keyup", onKeyUp);
    return () => {
      window.removeEventListener("keydown", onKeyDown);
      window.removeEventListener("keyup", onKeyUp);
    };
  }, [activeDeck, lookup, onAction]);
}
