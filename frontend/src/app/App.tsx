import { useEffect } from "react";
import { DeckPanel } from "../components/decks/DeckPanel";
import { LibraryPanel } from "../components/library/LibraryPanel";
import { TopBar } from "../components/layout/TopBar";
import { MixerPanel } from "../components/mixer/MixerPanel";
import { WaveformPanel } from "../components/waveform/WaveformPanel";
import { audioEngine } from "../services/audioEngine/engine";
import { useKeyboardShortcuts } from "../services/keyboard/KeyboardManager";
import { useAppStore } from "../state/useAppStore";

export function App() {
  const mode = useAppStore((s) => s.mode);
  const decks = useAppStore((s) => s.decks);
  const lastAction = useAppStore((s) => s.lastAction);

  useKeyboardShortcuts();

  useEffect(() => {
    audioEngine.init();
  }, []);

  return (
    <div className="app-shell">
      <TopBar mode={mode} lastAction={lastAction} audioStatus={audioEngine.getStatus()} />
      <main className="main-layout">
        <DeckPanel deck={decks.A} />
        <DeckPanel deck={decks.B} />
        <MixerPanel />
        <WaveformPanel />
        <LibraryPanel />
      </main>
    </div>
  );
}
