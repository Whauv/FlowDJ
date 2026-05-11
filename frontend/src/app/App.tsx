import { useCallback, useEffect, useRef } from "react";
import { DeckPanel } from "../components/decks/DeckPanel";
import { LibraryPanel } from "../components/library/LibraryPanel";
import { TopBar } from "../components/layout/TopBar";
import { MixerPanel } from "../components/mixer/MixerPanel";
import { WaveformPanel } from "../components/waveform/WaveformPanel";
import { audioEngine } from "../services/audioEngine/engine";
import { type ShortcutAction, useKeyboardShortcuts } from "../services/keyboard/KeyboardManager";
import { useAppStore } from "../state/useAppStore";
import type { DeckId } from "../state/types";
import { clampNormalized, runAudioStateSanityChecks } from "../state/utils/audioStateTestUtils";

export function App() {
  const fileInputARef = useRef<HTMLInputElement>(null);
  const fileInputBRef = useRef<HTMLInputElement>(null);
  const mode = useAppStore((s) => s.mode);
  const decks = useAppStore((s) => s.decks);
  const activeDeck = useAppStore((s) => s.activeDeck);
  const crossfader = useAppStore((s) => s.crossfader);
  const masterGain = useAppStore((s) => s.masterGain);
  const lastAction = useAppStore((s) => s.lastAction);

  const patchDeck = useAppStore((s) => s.patchDeck);
  const setActiveDeck = useAppStore((s) => s.setActiveDeck);
  const setCrossfader = useAppStore((s) => s.setCrossfader);
  const setMasterGain = useAppStore((s) => s.setMasterGain);
  const setLastAction = useAppStore((s) => s.setLastAction);

  useEffect(() => {
    audioEngine.init();
    if (!runAudioStateSanityChecks()) {
      setLastAction("Audio state utility checks failed");
    }
  }, [setLastAction]);

  useEffect(() => {
    const interval = window.setInterval(() => {
      (Object.keys(decks) as DeckId[]).forEach((deckId) => {
        audioEngine.updateLoop(deckId);
        patchDeck(deckId, {
          currentTime: audioEngine.getCurrentTime(deckId),
          duration: audioEngine.getDuration(deckId),
          isPlaying: audioEngine.isPlaying(deckId)
        });
      });
    }, 80);

    return () => window.clearInterval(interval);
  }, [decks, patchDeck]);

  const syncMixer = useCallback(
    (nextCrossfader: number) => {
      audioEngine.setCrossfader(nextCrossfader, { A: decks.A.gain, B: decks.B.gain });
    },
    [decks.A.gain, decks.B.gain]
  );

  useEffect(() => {
    syncMixer(crossfader);
    audioEngine.setMasterGain(masterGain);
  }, [crossfader, masterGain, syncMixer]);

  const onLoadFile = useCallback(
    async (deckId: DeckId, file: File | null) => {
      if (!file) {
        return;
      }

      try {
        const analysis = await audioEngine.loadTrack(deckId, file);
        patchDeck(deckId, {
          trackName: file.name,
          bpm: analysis.bpm,
          waveform: analysis.waveform,
          duration: analysis.duration,
          currentTime: 0,
          isLoaded: true,
          error: null,
          cuePoint: null,
          loopIn: null,
          loopOut: null,
          loopEnabled: false
        });
        setActiveDeck(deckId);
        setLastAction(`Loaded ${file.name} on Deck ${deckId}`);
      } catch (error) {
        patchDeck(deckId, { error: error instanceof Error ? error.message : "Failed to load track" });
        setLastAction(`Deck ${deckId} load failed`);
      }
    },
    [patchDeck, setActiveDeck, setLastAction]
  );

  const onTogglePlay = useCallback(
    async (deckId: DeckId) => {
      try {
        const playing = await audioEngine.togglePlay(deckId);
        patchDeck(deckId, { isPlaying: playing });
        setLastAction(`Deck ${deckId} ${playing ? "playing" : "paused"}`);
      } catch (error) {
        setLastAction(error instanceof Error ? error.message : "Playback error");
      }
    },
    [patchDeck, setLastAction]
  );

  const onSeekTo = useCallback(
    (deckId: DeckId, time: number) => {
      const next = audioEngine.seek(deckId, time);
      patchDeck(deckId, { currentTime: next });
    },
    [patchDeck]
  );

  const onGainChange = useCallback(
    (deckId: DeckId, gain: number) => {
      patchDeck(deckId, { gain });
      audioEngine.setCrossfader(crossfader, {
        A: deckId === "A" ? gain : decks.A.gain,
        B: deckId === "B" ? gain : decks.B.gain
      });
    },
    [crossfader, decks.A.gain, decks.B.gain, patchDeck]
  );

  const onCue = useCallback(
    (deckId: DeckId) => {
      const deck = decks[deckId];
      if (deck.cuePoint === null) {
        const at = audioEngine.getCurrentTime(deckId);
        patchDeck(deckId, { cuePoint: at });
        setLastAction(`Cue set on Deck ${deckId}`);
      } else {
        const next = audioEngine.seek(deckId, deck.cuePoint);
        patchDeck(deckId, { currentTime: next });
        setLastAction(`Cue jumped on Deck ${deckId}`);
      }
    },
    [decks, patchDeck, setLastAction]
  );

  const onLoop = useCallback(
    (deckId: DeckId) => {
      const deck = decks[deckId];
      const loop = audioEngine.setLoopInOut(deckId, deck.currentTime);
      patchDeck(deckId, loop);
      setLastAction(`Deck ${deckId} loop ${loop.loopEnabled ? "enabled" : "updated"}`);
    },
    [decks, patchDeck, setLastAction]
  );

  const onAutoloop = useCallback(
    (deckId: DeckId) => {
      const deck = decks[deckId];
      const loop = audioEngine.setAutoloop(deckId, deck.bpm);
      patchDeck(deckId, loop);
      setLastAction(`Deck ${deckId} autoloop enabled`);
    },
    [decks, patchDeck, setLastAction]
  );

  const handleKeyboardAction = useCallback(
    (action: ShortcutAction, focusedDeck: DeckId) => {
      switch (action) {
        case "togglePlayA":
          void onTogglePlay("A");
          return;
        case "togglePlayB":
          void onTogglePlay("B");
          return;
        case "loadDeckA":
          fileInputARef.current?.click();
          return;
        case "loadDeckB":
          fileInputBRef.current?.click();
          return;
        case "seekBack":
          onSeekTo(focusedDeck, Math.max(0, decks[focusedDeck].currentTime - 5));
          return;
        case "seekForward":
          onSeekTo(focusedDeck, decks[focusedDeck].currentTime + 5);
          return;
        case "volumeDown":
          onGainChange(focusedDeck, clampNormalized(decks[focusedDeck].gain - 0.05));
          return;
        case "volumeUp":
          onGainChange(focusedDeck, clampNormalized(decks[focusedDeck].gain + 0.05));
          return;
        case "crossfaderLeft":
          setCrossfader(clampNormalized(crossfader - 0.05));
          return;
        case "crossfaderRight":
          setCrossfader(clampNormalized(crossfader + 0.05));
          return;
        case "masterDown":
          setMasterGain(clampNormalized(masterGain - 0.05));
          return;
        case "masterUp":
          setMasterGain(clampNormalized(masterGain + 0.05));
          return;
        case "cue":
          onCue(focusedDeck);
          return;
        case "loop":
          onLoop(focusedDeck);
          return;
        case "autoloop":
          onAutoloop(focusedDeck);
          return;
        default:
          return;
      }
    },
    [crossfader, decks, masterGain, onAutoloop, onCue, onGainChange, onLoop, onSeekTo, onTogglePlay, setCrossfader, setMasterGain]
  );

  useKeyboardShortcuts({ onAction: handleKeyboardAction });

  return (
    <div className="app-shell">
      <TopBar mode={mode} activeDeck={activeDeck} lastAction={lastAction} audioStatus={audioEngine.getStatus()} />
      <main className="main-layout">
        <DeckPanel
          deck={decks.A}
          isActive={activeDeck === "A"}
          fileInputRef={fileInputARef}
          onSelect={setActiveDeck}
          onLoadFile={onLoadFile}
          onTogglePlay={onTogglePlay}
          onSeekTo={onSeekTo}
          onGainChange={onGainChange}
          onCue={onCue}
          onLoop={onLoop}
        />
        <DeckPanel
          deck={decks.B}
          isActive={activeDeck === "B"}
          fileInputRef={fileInputBRef}
          onSelect={setActiveDeck}
          onLoadFile={onLoadFile}
          onTogglePlay={onTogglePlay}
          onSeekTo={onSeekTo}
          onGainChange={onGainChange}
          onCue={onCue}
          onLoop={onLoop}
        />
        <MixerPanel
          crossfader={crossfader}
          masterGain={masterGain}
          onCrossfaderChange={setCrossfader}
          onMasterGainChange={setMasterGain}
        />
        <WaveformPanel deckA={decks.A} deckB={decks.B} />
        <LibraryPanel />
      </main>
    </div>
  );
}
