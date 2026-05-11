import { useCallback, useEffect, useMemo, useRef } from "react";
import { DeckPanel } from "../components/decks/DeckPanel";
import { LibraryPanel } from "../components/library/LibraryPanel";
import { TopBar } from "../components/layout/TopBar";
import { MixerPanel } from "../components/mixer/MixerPanel";
import { WaveformPanel } from "../components/waveform/WaveformPanel";
import { KeyboardLegend } from "../components/keyboard/KeyboardLegend";
import { MappingPanel } from "../components/keyboard/MappingPanel";
import { OnboardingModal } from "../components/keyboard/OnboardingModal";
import { audioEngine } from "../services/audioEngine/engine";
import { getLegendForMode, useKeyboardShortcuts } from "../services/keyboard/KeyboardManager";
import type { FlowMode, KeyboardAction, KeyProfile } from "../services/keyboard/types";
import { fetchKeyboardProfiles, saveKeyboardProfiles } from "../services/api/keyboardProfilesApi";
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
  const fx = useAppStore((s) => s.fx);
  const eq = useAppStore((s) => s.eq);
  const profiles = useAppStore((s) => s.profiles);
  const selectedProfileId = useAppStore((s) => s.selectedProfileId);
  const showOnboarding = useAppStore((s) => s.showOnboarding);
  const showMappingPanel = useAppStore((s) => s.showMappingPanel);
  const lastAction = useAppStore((s) => s.lastAction);

  const patchDeck = useAppStore((s) => s.patchDeck);
  const setMode = useAppStore((s) => s.setMode);
  const setActiveDeck = useAppStore((s) => s.setActiveDeck);
  const setCrossfader = useAppStore((s) => s.setCrossfader);
  const setMasterGain = useAppStore((s) => s.setMasterGain);
  const setFx = useAppStore((s) => s.setFx);
  const setEq = useAppStore((s) => s.setEq);
  const setProfiles = useAppStore((s) => s.setProfiles);
  const selectProfile = useAppStore((s) => s.selectProfile);
  const setShowOnboarding = useAppStore((s) => s.setShowOnboarding);
  const setShowMappingPanel = useAppStore((s) => s.setShowMappingPanel);
  const setLastAction = useAppStore((s) => s.setLastAction);

  const activeProfile = useMemo(
    () => profiles.find((profile) => profile.id === selectedProfileId) ?? profiles[0],
    [profiles, selectedProfileId]
  );

  const legendItems = useMemo(() => getLegendForMode(activeProfile, mode as FlowMode), [activeProfile, mode]);

  useEffect(() => {
    audioEngine.init();
    if (!runAudioStateSanityChecks()) {
      setLastAction("Audio state utility checks failed");
    }
  }, [setLastAction]);

  useEffect(() => {
    void (async () => {
      const payload = await fetchKeyboardProfiles();
      if (payload && payload.profiles.length > 0) {
        setProfiles(payload.profiles, payload.selectedProfileId);
      }
    })();
  }, [setProfiles]);

  useEffect(() => {
    void saveKeyboardProfiles({ profiles, selectedProfileId });
  }, [profiles, selectedProfileId]);

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

  useEffect(() => {
    audioEngine.setCrossfader(crossfader, { A: decks.A.gain, B: decks.B.gain });
    audioEngine.setMasterGain(masterGain);
  }, [crossfader, decks.A.gain, decks.B.gain, masterGain]);

  const onLoadFile = useCallback(async (deckId: DeckId, file: File | null) => {
    if (!file) return;
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
  }, [patchDeck, setActiveDeck, setLastAction]);

  const onTogglePlay = useCallback(async (deckId: DeckId) => {
    try {
      const playing = await audioEngine.togglePlay(deckId);
      patchDeck(deckId, { isPlaying: playing });
      setLastAction(`Deck ${deckId} ${playing ? "playing" : "paused"}`);
    } catch (error) {
      setLastAction(error instanceof Error ? error.message : "Playback error");
    }
  }, [patchDeck, setLastAction]);

  const onSeekTo = useCallback((deckId: DeckId, time: number) => {
    const next = audioEngine.seek(deckId, time);
    patchDeck(deckId, { currentTime: next });
  }, [patchDeck]);

  const onGainChange = useCallback((deckId: DeckId, gain: number) => {
    patchDeck(deckId, { gain });
    audioEngine.setCrossfader(crossfader, {
      A: deckId === "A" ? gain : decks.A.gain,
      B: deckId === "B" ? gain : decks.B.gain
    });
  }, [crossfader, decks.A.gain, decks.B.gain, patchDeck]);

  const onCue = useCallback((deckId: DeckId) => {
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
  }, [decks, patchDeck, setLastAction]);

  const onLoop = useCallback((deckId: DeckId) => {
    const deck = decks[deckId];
    const loop = audioEngine.setLoopInOut(deckId, deck.currentTime);
    patchDeck(deckId, loop);
    setLastAction(`Deck ${deckId} loop ${loop.loopEnabled ? "enabled" : "updated"}`);
  }, [decks, patchDeck, setLastAction]);

  const onAutoloop = useCallback((deckId: DeckId) => {
    const deck = decks[deckId];
    const loop = audioEngine.setAutoloop(deckId, deck.bpm);
    patchDeck(deckId, loop);
    setLastAction(`Deck ${deckId} autoloop enabled`);
  }, [decks, patchDeck, setLastAction]);

  const onRecoveryEmergencyFade = useCallback(() => {
    const target = activeDeck;
    const other = target === "A" ? "B" : "A";
    onGainChange(target, 1);
    onGainChange(other, 0.1);
    setCrossfader(target === "A" ? 0.1 : 0.9);
    setLastAction("Recovery: emergency fade executed");
  }, [activeDeck, onGainChange, setCrossfader, setLastAction]);

  const onRecoveryKillSwitch = useCallback(() => {
    setMasterGain(0);
    void onTogglePlay("A");
    void onTogglePlay("B");
    setLastAction("Recovery: kill switch triggered (held)");
  }, [onTogglePlay, setLastAction, setMasterGain]);

  const onRecoverySafeTransition = useCallback(() => {
    const target = activeDeck;
    const other = target === "A" ? "B" : "A";
    if (!decks[target].isPlaying) {
      void onTogglePlay(target);
    }
    onGainChange(target, 0.95);
    onGainChange(other, 0.25);
    setCrossfader(target === "A" ? 0.2 : 0.8);
    setMasterGain(0.85);
    setLastAction("Recovery: safe transition applied");
  }, [activeDeck, decks, onGainChange, onTogglePlay, setCrossfader, setLastAction, setMasterGain]);

  const handleKeyboardAction = useCallback((action: KeyboardAction, focusedDeck: DeckId) => {
    switch (action) {
      case "modeBrowse": setMode("browse"); return;
      case "modeMix": setMode("mix"); return;
      case "modeFx": setMode("fx"); return;
      case "modeRecovery": setMode("recovery"); return;
      case "activeDeck": setActiveDeck(focusedDeck === "A" ? "B" : "A"); return;
      case "loadDeckA": fileInputARef.current?.click(); return;
      case "loadDeckB": fileInputBRef.current?.click(); return;
      case "togglePlayA": void onTogglePlay("A"); return;
      case "togglePlayB": void onTogglePlay("B"); return;
      case "seekBack": onSeekTo(focusedDeck, Math.max(0, decks[focusedDeck].currentTime - 5)); return;
      case "seekForward": onSeekTo(focusedDeck, decks[focusedDeck].currentTime + 5); return;
      case "volumeDown": onGainChange(focusedDeck, clampNormalized(decks[focusedDeck].gain - 0.05)); return;
      case "volumeUp": onGainChange(focusedDeck, clampNormalized(decks[focusedDeck].gain + 0.05)); return;
      case "crossfaderLeft": setCrossfader(clampNormalized(crossfader - 0.05)); return;
      case "crossfaderRight": setCrossfader(clampNormalized(crossfader + 0.05)); return;
      case "masterDown": setMasterGain(clampNormalized(masterGain - 0.05)); return;
      case "masterUp": setMasterGain(clampNormalized(masterGain + 0.05)); return;
      case "cue": onCue(focusedDeck); return;
      case "loop": onLoop(focusedDeck); return;
      case "autoloop": onAutoloop(focusedDeck); return;
      case "sync": patchDeck(focusedDeck, { bpm: decks[focusedDeck === "A" ? "B" : "A"].bpm }); setLastAction("Sync applied"); return;
      case "eqLowToggle": setEq({ lowCut: !eq.lowCut }); setLastAction(`EQ low ${!eq.lowCut ? "cut" : "flat"}`); return;
      case "eqHighToggle": setEq({ highCut: !eq.highCut }); setLastAction(`EQ high ${!eq.highCut ? "cut" : "flat"}`); return;
      case "fxTrigger1": setFx({ slot1Active: !fx.slot1Active }); setLastAction(`FX slot 1 ${!fx.slot1Active ? "on" : "off"}`); return;
      case "fxTrigger2": setFx({ slot2Active: !fx.slot2Active }); setLastAction(`FX slot 2 ${!fx.slot2Active ? "on" : "off"}`); return;
      case "fxMomentary": setFx({ momentaryActive: !fx.momentaryActive }); setLastAction(`FX momentary ${!fx.momentaryActive ? "on" : "off"}`); return;
      case "recoveryEmergencyFade": onRecoveryEmergencyFade(); return;
      case "recoveryKillSwitch": onRecoveryKillSwitch(); return;
      case "recoverySafeTransition": onRecoverySafeTransition(); return;
      case "showHelp": setShowOnboarding(true); return;
      case "openMapping": setShowMappingPanel(true); return;
      case "browseUp": setLastAction("Browse: moved selection up"); return;
      case "browseDown": setLastAction("Browse: moved selection down"); return;
      case "browseSearch": setLastAction("Browse: search focus placeholder"); return;
      default: return;
    }
  }, [crossfader, decks, eq.highCut, eq.lowCut, fx.momentaryActive, fx.slot1Active, fx.slot2Active, masterGain, onAutoloop, onCue, onGainChange, onLoop, onRecoveryEmergencyFade, onRecoveryKillSwitch, onRecoverySafeTransition, onSeekTo, onTogglePlay, patchDeck, setActiveDeck, setCrossfader, setEq, setFx, setLastAction, setMasterGain, setMode, setShowMappingPanel, setShowOnboarding]);

  const onUpdateKey = useCallback((targetMode: FlowMode, action: string, nextCode: string, nextLabel: string) => {
    const updatedProfiles = profiles.map((profile) => {
      if (profile.id !== selectedProfileId) return profile;
      const nextMappings = profile.mappings[targetMode].map((entry) =>
        entry.action === action ? { ...entry, code: nextCode, label: nextLabel } : entry
      );
      return { ...profile, mappings: { ...profile.mappings, [targetMode]: nextMappings } } as KeyProfile;
    });
    setProfiles(updatedProfiles, selectedProfileId);
    setLastAction(`Updated mapping for ${action}`);
  }, [profiles, selectedProfileId, setLastAction, setProfiles]);

  useKeyboardShortcuts({
    mode: mode as FlowMode,
    activeDeck,
    profile: activeProfile,
    onAction: handleKeyboardAction
  });

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
        <MixerPanel crossfader={crossfader} masterGain={masterGain} onCrossfaderChange={setCrossfader} onMasterGainChange={setMasterGain} />
        <WaveformPanel deckA={decks.A} deckB={decks.B} />
        <KeyboardLegend modeLabel={mode.toUpperCase()} items={legendItems} />
        <LibraryPanel />
      </main>
      {showOnboarding ? <OnboardingModal onClose={() => setShowOnboarding(false)} /> : null}
      {showMappingPanel ? (
        <MappingPanel
          mode={mode as FlowMode}
          profiles={profiles}
          selectedProfileId={selectedProfileId}
          onSelectProfile={selectProfile}
          onUpdateKey={onUpdateKey}
          onClose={() => setShowMappingPanel(false)}
        />
      ) : null}
    </div>
  );
}
