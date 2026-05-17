import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { DeckPanel } from "../components/decks/DeckPanel";
import { LibraryPanel } from "../components/library/LibraryPanel";
import { TopBar } from "../components/layout/TopBar";
import { MixerPanel } from "../components/mixer/MixerPanel";
import { WaveformPanel } from "../components/waveform/WaveformPanel";
import { KeyboardLegend } from "../components/keyboard/KeyboardLegend";
import { MappingPanel } from "../components/keyboard/MappingPanel";
import { OnboardingModal } from "../components/keyboard/OnboardingModal";
import { SessionAnalyticsPanel } from "../components/analytics/SessionAnalyticsPanel";
import { NextTrackPanel } from "../components/recommendations/NextTrackPanel";
import { StrategySelector } from "../components/recommendations/StrategySelector";
import { FlowLightPreviewPanel } from "../components/lighting/FlowLightPreviewPanel";
import { DeviceIntegrationPanel } from "../components/lighting/DeviceIntegrationPanel";
import { audioEngine } from "../services/audioEngine/engine";
import { getLegendForMode, useKeyboardShortcuts } from "../services/keyboard/KeyboardManager";
import type { FlowMode, KeyboardAction, KeyProfile } from "../services/keyboard/types";
import { fetchKeyboardProfiles, saveKeyboardProfiles } from "../services/api/keyboardProfilesApi";
import { appendSession, exportSessionCsv, exportSessionJson, finalizeSession, startSession } from "../services/api/sessionApi";
import { fetchNextRecommendations, fetchRecommendationFixtures } from "../services/api/recommendationApi";
import { fetchTrackAssets, importYoutubeMp3, uploadOwnedMp3, type TrackAsset } from "../services/api/trackSourcesApi";
import { useAppStore } from "../state/useAppStore";
import type { DeckId } from "../state/types";
import { clampNormalized, runAudioStateSanityChecks } from "../state/utils/audioStateTestUtils";
import { buildTransitionGuidance } from "../modules/transitions/engine";
import { SAMPLE_TRACKS } from "../modules/transitions/sampleTracks";
import { runTransitionTestCases } from "../modules/transitions/testCases";
import type { TrackMeta } from "../modules/transitions/types";
import type { SessionAnalyticsPayload, SessionTimelinePoint, SessionTransitionEvent } from "../modules/analytics/types";
import { estimateCurrentEnergy, makeTimelinePoint } from "../modules/analytics/engine";
import type { RecommendationResponse, RecommendationTrack } from "../modules/recommendations/types";
import { flowLightEventBus } from "../modules/flowlight/eventBus";
import { flowLightManager } from "../modules/flowlight/manager";
import type { AdapterDiagnostics, AdapterKind, FlowLightState, HardwareMode } from "../modules/flowlight/types";

function deckToTrackMeta(deckId: DeckId, deck: { trackName: string; bpm: number; musicalKey: string; energy: number; duration: number }): TrackMeta {
  return { id: `deck-${deckId}`, title: deck.trackName, bpm: deck.bpm || 124, key: deck.musicalKey || "8A", energy: deck.energy || 5, duration: deck.duration || 300 };
}

function toRecommendationTrack(deckId: DeckId, deck: { trackName: string; bpm: number; musicalKey: string; energy: number }): RecommendationTrack {
  return { id: `deck-${deckId}`, title: deck.trackName || `Deck ${deckId}`, bpm: deck.bpm || 124, key: deck.musicalKey || "8A", energy: deck.energy || 5, genres: [] };
}

function keyClashRisk(a: string, b: string): number {
  if (!a || !b) return 0.4;
  if (a === b) return 0.1;
  return a.slice(-1) === b.slice(-1) ? 0.35 : 0.7;
}

export function App() {
  const fileInputARef = useRef<HTMLInputElement>(null);
  const fileInputBRef = useRef<HTMLInputElement>(null);
  const sessionIdRef = useRef<string | null>(null);
  const startMsRef = useRef<number>(Date.now());
  const lastCrossfaderRef = useRef<number>(0.5);
  const timelineBufferRef = useRef<SessionTimelinePoint[]>([]);
  const transitionBufferRef = useRef<SessionTransitionEvent[]>([]);
  const historyTrackIdsRef = useRef<string[]>([]);

  const [sessionAnalytics, setSessionAnalytics] = useState<SessionAnalyticsPayload | null>(null);
  const [recommendationLibrary, setRecommendationLibrary] = useState<RecommendationTrack[]>([]);
  const [recommendationResult, setRecommendationResult] = useState<RecommendationResponse | null>(null);
  const [flowLightState, setFlowLightState] = useState<FlowLightState>(flowLightManager.getState());
  const [hardwareMode, setHardwareMode] = useState<HardwareMode>(flowLightManager.getHardwareMode());
  const [adapterDiagnostics, setAdapterDiagnostics] = useState<AdapterDiagnostics[]>(flowLightManager.getDiagnostics());
  const [libraryTracks, setLibraryTracks] = useState<TrackAsset[]>([]);
  const [libraryBusy, setLibraryBusy] = useState(false);
  const [libraryError, setLibraryError] = useState<string | null>(null);

  const mode = useAppStore((s) => s.mode);
  const decks = useAppStore((s) => s.decks);
  const activeDeck = useAppStore((s) => s.activeDeck);
  const crossfader = useAppStore((s) => s.crossfader);
  const masterGain = useAppStore((s) => s.masterGain);
  const safeMixMode = useAppStore((s) => s.safeMixMode);
  const recommendationDirection = useAppStore((s) => s.recommendationDirection);
  const recommendationBias = useAppStore((s) => s.recommendationBias);
  const recommendationMood = useAppStore((s) => s.recommendationMood);
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
  const setSafeMixMode = useAppStore((s) => s.setSafeMixMode);
  const setRecommendationDirection = useAppStore((s) => s.setRecommendationDirection);
  const setRecommendationBias = useAppStore((s) => s.setRecommendationBias);
  const setRecommendationMood = useAppStore((s) => s.setRecommendationMood);
  const setFx = useAppStore((s) => s.setFx);
  const setEq = useAppStore((s) => s.setEq);
  const setProfiles = useAppStore((s) => s.setProfiles);
  const selectProfile = useAppStore((s) => s.selectProfile);
  const setShowOnboarding = useAppStore((s) => s.setShowOnboarding);
  const setShowMappingPanel = useAppStore((s) => s.setShowMappingPanel);
  const setLastAction = useAppStore((s) => s.setLastAction);

  const activeProfile = useMemo(() => profiles.find((profile) => profile.id === selectedProfileId) ?? profiles[0], [profiles, selectedProfileId]);
  const legendItems = useMemo(() => getLegendForMode(activeProfile, mode as FlowMode), [activeProfile, mode]);

  const transitionGuidance = useMemo(() => {
    const outgoingDeckId: DeckId = activeDeck === "A" ? "B" : "A";
    const incomingDeckId: DeckId = activeDeck;
    const outgoingDeck = decks[outgoingDeckId];
    const incomingDeck = decks[incomingDeckId];
    const source = deckToTrackMeta(outgoingDeckId, outgoingDeck.isLoaded ? outgoingDeck : incomingDeck);
    const liveCandidate = incomingDeck.isLoaded ? [deckToTrackMeta(incomingDeckId, incomingDeck)] : [];
    const candidates = [...liveCandidate, ...SAMPLE_TRACKS].filter((track) => track.title !== source.title);
    return buildTransitionGuidance(outgoingDeckId, incomingDeckId, source, candidates, outgoingDeck.currentTime, safeMixMode);
  }, [activeDeck, decks, safeMixMode]);

  const recordTransitionEvent = useCallback((fromDeck: DeckId, toDeck: DeckId, note: string, usedLoop: boolean, usedRecovery: boolean) => {
    const from = decks[fromDeck];
    const to = decks[toDeck];
    const event: SessionTransitionEvent = {
      timestamp_ms: Date.now() - startMsRef.current,
      from_deck: fromDeck,
      to_deck: toDeck,
      bpm_mismatch: Math.abs(from.bpm - to.bpm),
      key_clash_risk: keyClashRisk(from.musicalKey, to.musicalKey),
      overlap_seconds: Math.max(0, Math.min(from.currentTime, to.currentTime)),
      abrupt_volume_delta: Math.abs(from.gain - to.gain),
      used_loop: usedLoop,
      used_recovery: usedRecovery,
      notes: note
    };
    transitionBufferRef.current.push(event);
    const toId = `deck-${toDeck}`;
    if (!historyTrackIdsRef.current.includes(toId)) historyTrackIdsRef.current.push(toId);
  }, [decks]);

  useEffect(() => {
    audioEngine.init();
    if (!runAudioStateSanityChecks()) setLastAction("Audio state utility checks failed");
    const testResults = runTransitionTestCases();
    if (testResults.length > 0) console.table(testResults);

    void (async () => {
      const sid = await startSession(new Date().toISOString());
      sessionIdRef.current = sid;
      startMsRef.current = Date.now();
      const fixtures = await fetchRecommendationFixtures();
      setRecommendationLibrary(fixtures);
      try {
        const tracks = await fetchTrackAssets();
        setLibraryTracks(tracks);
      } catch {
        setLibraryError("Could not fetch track library.");
      }
    })();
  }, [setLastAction]);

  useEffect(() => {
    let dispose: (() => void) | null = null;
    void (async () => {
      dispose = await flowLightManager.start();
    })();
    return () => {
      if (dispose) dispose();
    };
  }, []);

  useEffect(() => {
    void (async () => {
      const payload = await fetchKeyboardProfiles();
      if (payload && payload.profiles.length > 0) setProfiles(payload.profiles, payload.selectedProfileId);
    })();
  }, [setProfiles]);

  useEffect(() => { void saveKeyboardProfiles({ profiles, selectedProfileId }); }, [profiles, selectedProfileId]);

  useEffect(() => {
    const interval = window.setInterval(async () => {
      const currentTrack = toRecommendationTrack(activeDeck, decks[activeDeck]);
      const dynamicLibrary = [toRecommendationTrack("A", decks.A), toRecommendationTrack("B", decks.B), ...recommendationLibrary];
      const dedup = Array.from(new Map(dynamicLibrary.map((t) => [t.id, t])).values());
      const result = await fetchNextRecommendations({
        currentTrack,
        library: dedup,
        sessionHistoryIds: historyTrackIdsRef.current,
        direction: recommendationDirection,
        bias: recommendationBias,
        targetMood: recommendationMood
      });
      setRecommendationResult(result);
    }, 1400);
    return () => window.clearInterval(interval);
  }, [activeDeck, decks, recommendationBias, recommendationDirection, recommendationLibrary, recommendationMood]);

  useEffect(() => {
    const syncInterval = window.setInterval(() => {
      (Object.keys(decks) as DeckId[]).forEach((deckId) => {
        audioEngine.updateLoop(deckId);
        patchDeck(deckId, { currentTime: audioEngine.getCurrentTime(deckId), duration: audioEngine.getDuration(deckId), isPlaying: audioEngine.isPlaying(deckId) });
      });
    }, 80);

    const timelineInterval = window.setInterval(() => {
      const point = makeTimelinePoint(Date.now() - startMsRef.current, masterGain, crossfader, estimateCurrentEnergy(decks.A.energy, decks.B.energy, crossfader));
      timelineBufferRef.current.push(point);
      const crossedCenter = (lastCrossfaderRef.current < 0.5 && crossfader >= 0.5) || (lastCrossfaderRef.current > 0.5 && crossfader <= 0.5);
      if (crossedCenter && decks.A.isLoaded && decks.B.isLoaded) {
        const fromDeck: DeckId = crossfader >= 0.5 ? "A" : "B";
        const toDeck: DeckId = fromDeck === "A" ? "B" : "A";
        recordTransitionEvent(fromDeck, toDeck, "Crossfader passed center", decks[fromDeck].loopEnabled || decks[toDeck].loopEnabled, false);
      }
      lastCrossfaderRef.current = crossfader;
    }, 400);

    const flushInterval = window.setInterval(() => {
      const sid = sessionIdRef.current;
      if (!sid) return;
      if (!timelineBufferRef.current.length && !transitionBufferRef.current.length) return;
      const timeline = [...timelineBufferRef.current];
      const transitions = [...transitionBufferRef.current];
      timelineBufferRef.current = [];
      transitionBufferRef.current = [];
      void appendSession(sid, timeline, transitions);
    }, 5000);

    return () => { window.clearInterval(syncInterval); window.clearInterval(timelineInterval); window.clearInterval(flushInterval); };
  }, [crossfader, decks, masterGain, patchDeck, recordTransitionEvent]);

  useEffect(() => {
    audioEngine.setCrossfader(crossfader, { A: decks.A.gain, B: decks.B.gain });
    audioEngine.setMasterGain(masterGain);
  }, [crossfader, decks.A.gain, decks.B.gain, masterGain]);

  useEffect(() => {
    const bpm = activeDeck === "A" ? decks.A.bpm || decks.B.bpm || 120 : decks.B.bpm || decks.A.bpm || 120;
    const currentTime = activeDeck === "A" ? decks.A.currentTime : decks.B.currentTime;
    const beatLength = bpm > 0 ? 60 / bpm : 0.5;
    const beatPhase = ((currentTime % beatLength) / beatLength) % 1;
    const duration = activeDeck === "A" ? decks.A.duration : decks.B.duration;
    const normalized = duration > 0 ? currentTime / duration : 0;
    const phraseLength = beatLength * 32;
    const phraseProgress = (currentTime % phraseLength) / phraseLength;
    const phraseSection =
      normalized < 0.12 ? "intro" :
      normalized > 0.88 ? "outro" :
      phraseProgress < 0.24 ? "buildup" :
      phraseProgress < 0.48 ? "drop" :
      phraseProgress < 0.72 ? "groove" :
      "breakdown";
    const marker = phraseSection === "drop" ? "drop" : phraseSection === "buildup" ? "build" : phraseSection === "breakdown" ? "breakdown" : "none";
    const key = activeDeck === "A" ? decks.A.musicalKey : decks.B.musicalKey;
    const energy = activeDeck === "A" ? decks.A.energy : decks.B.energy;

    flowLightEventBus.publish({
      timestampMs: Date.now(),
      bpm,
      beatPhase,
      phraseSection,
      activeDeck,
      crossfader,
      energy,
      marker,
      key
    });
    setFlowLightState(flowLightManager.getState());
  }, [activeDeck, crossfader, decks.A.bpm, decks.A.currentTime, decks.A.duration, decks.A.energy, decks.A.musicalKey, decks.B.bpm, decks.B.currentTime, decks.B.duration, decks.B.energy, decks.B.musicalKey]);

  useEffect(() => {
    const active = decks[activeDeck];
    const payload = {
      updatedAt: Date.now(),
      mode,
      activeDeck,
      crossfader,
      deckA: { bpm: decks.A.bpm, progress: decks.A.duration > 0 ? decks.A.currentTime / decks.A.duration : 0, playing: decks.A.isPlaying },
      deckB: { bpm: decks.B.bpm, progress: decks.B.duration > 0 ? decks.B.currentTime / decks.B.duration : 0, playing: decks.B.isPlaying },
      flowLightScene: flowLightState.sceneName,
      analyticsState: sessionAnalytics ? "Session finalized" : "Live session",
      activeTrack: active.trackName
    };
    window.localStorage.setItem("flowdj_landing_telemetry", JSON.stringify(payload));
  }, [activeDeck, crossfader, decks.A.bpm, decks.A.currentTime, decks.A.duration, decks.A.isPlaying, decks.B.bpm, decks.B.currentTime, decks.B.duration, decks.B.isPlaying, flowLightState.sceneName, mode, sessionAnalytics, decks]);

  useEffect(() => {
    const interval = window.setInterval(() => {
      setAdapterDiagnostics(flowLightManager.getDiagnostics());
    }, 1000);
    return () => window.clearInterval(interval);
  }, []);

  const onLoadFile = useCallback(async (deckId: DeckId, file: File | null) => {
    if (!file) return;
    try {
      const analysis = await audioEngine.loadTrack(deckId, file);
      patchDeck(deckId, { trackName: file.name, bpm: analysis.bpm, musicalKey: analysis.key, energy: analysis.energy, waveform: analysis.waveform, duration: analysis.duration, currentTime: 0, isLoaded: true, error: null, cuePoint: null, loopIn: null, loopOut: null, loopEnabled: false });
      setActiveDeck(deckId);
      setLastAction(`Loaded ${file.name} on Deck ${deckId}`);
    } catch (error) {
      patchDeck(deckId, { error: error instanceof Error ? error.message : "Failed to load track" });
      setLastAction(`Deck ${deckId} load failed`);
    }
  }, [patchDeck, setActiveDeck, setLastAction]);

  const loadTrackFromAsset = useCallback(async (deckId: DeckId, track: TrackAsset) => {
    try {
      const response = await fetch(`http://localhost:8000${track.url}`);
      if (!response.ok) throw new Error("Failed to fetch track audio.");
      const blob = await response.blob();
      const file = new File([blob], track.filename, { type: "audio/mpeg" });
      const analysis = await audioEngine.loadTrack(deckId, file);
      patchDeck(deckId, { trackName: track.title, bpm: analysis.bpm, musicalKey: analysis.key, energy: analysis.energy, waveform: analysis.waveform, duration: analysis.duration, currentTime: 0, isLoaded: true, error: null, cuePoint: null, loopIn: null, loopOut: null, loopEnabled: false });
      setActiveDeck(deckId);
      setLastAction(`Loaded ${track.title} on Deck ${deckId}`);
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
    } catch (error) { setLastAction(error instanceof Error ? error.message : "Playback error"); }
  }, [patchDeck, setLastAction]);

  const onSeekTo = useCallback((deckId: DeckId, time: number) => { patchDeck(deckId, { currentTime: audioEngine.seek(deckId, time) }); }, [patchDeck]);
  const onGainChange = useCallback((deckId: DeckId, gain: number) => {
    patchDeck(deckId, { gain });
    audioEngine.setCrossfader(crossfader, { A: deckId === "A" ? gain : decks.A.gain, B: deckId === "B" ? gain : decks.B.gain });
  }, [crossfader, decks.A.gain, decks.B.gain, patchDeck]);
  const onCue = useCallback((deckId: DeckId) => {
    const deck = decks[deckId];
    if (deck.cuePoint === null) { patchDeck(deckId, { cuePoint: audioEngine.getCurrentTime(deckId) }); setLastAction(`Cue set on Deck ${deckId}`); }
    else { patchDeck(deckId, { currentTime: audioEngine.seek(deckId, deck.cuePoint) }); setLastAction(`Cue jumped on Deck ${deckId}`); }
  }, [decks, patchDeck, setLastAction]);
  const onLoop = useCallback((deckId: DeckId) => { patchDeck(deckId, audioEngine.setLoopInOut(deckId, decks[deckId].currentTime)); setLastAction(`Deck ${deckId} loop updated`); }, [decks, patchDeck, setLastAction]);
  const onAutoloop = useCallback((deckId: DeckId) => { patchDeck(deckId, audioEngine.setAutoloop(deckId, decks[deckId].bpm)); setLastAction(`Deck ${deckId} autoloop enabled`); }, [decks, patchDeck, setLastAction]);

  const onRecoveryEmergencyFade = useCallback(() => {
    const target = activeDeck; const other = target === "A" ? "B" : "A";
    onGainChange(target, 1); onGainChange(other, 0.1); setCrossfader(target === "A" ? 0.1 : 0.9);
    recordTransitionEvent(other, target, "Recovery emergency fade", false, true); setLastAction("Recovery: emergency fade executed");
  }, [activeDeck, onGainChange, recordTransitionEvent, setCrossfader, setLastAction]);
  const onRecoveryKillSwitch = useCallback(() => {
    setMasterGain(0); void onTogglePlay("A"); void onTogglePlay("B");
    recordTransitionEvent("A", "B", "Recovery kill switch", false, true); setLastAction("Recovery: kill switch triggered (held)");
  }, [onTogglePlay, recordTransitionEvent, setLastAction, setMasterGain]);
  const onRecoverySafeTransition = useCallback(() => {
    const target = activeDeck; const other = target === "A" ? "B" : "A";
    if (!decks[target].isPlaying) void onTogglePlay(target);
    onGainChange(target, 0.95); onGainChange(other, 0.25); setCrossfader(target === "A" ? 0.2 : 0.8); setMasterGain(0.85);
    recordTransitionEvent(other, target, "Recovery safe transition", decks[target].loopEnabled || decks[other].loopEnabled, true); setLastAction("Recovery: safe transition applied");
  }, [activeDeck, decks, onGainChange, onTogglePlay, recordTransitionEvent, setCrossfader, setLastAction, setMasterGain]);

  const handleEndSession = useCallback(async () => {
    const sid = sessionIdRef.current; if (!sid) return;
    if (timelineBufferRef.current.length || transitionBufferRef.current.length) {
      await appendSession(sid, [...timelineBufferRef.current], [...transitionBufferRef.current]);
      timelineBufferRef.current = []; transitionBufferRef.current = [];
    }
    const payload = await finalizeSession(sid, new Date().toISOString());
    if (payload) { setSessionAnalytics(payload); setLastAction(`Session ${payload.id} finalized`); }
  }, [setLastAction]);

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

  const onUpdateKey = useCallback((targetMode: FlowMode, action: KeyboardAction, nextCode: string, nextLabel: string) => {
    const updatedProfiles = profiles.map((profile) => {
      if (profile.id !== selectedProfileId) return profile;
      const nextMappings = profile.mappings[targetMode].map((entry) => entry.action === action ? { ...entry, code: nextCode, label: nextLabel } : entry);
      return { ...profile, mappings: { ...profile.mappings, [targetMode]: nextMappings } } as KeyProfile;
    });
    setProfiles(updatedProfiles, selectedProfileId);
    setLastAction(`Updated mapping for ${action}`);
  }, [profiles, selectedProfileId, setLastAction, setProfiles]);

  useKeyboardShortcuts({ mode: mode as FlowMode, activeDeck, profile: activeProfile, onAction: handleKeyboardAction });

  return (
    <div className="app-shell performance-shell">
      <TopBar mode={mode} activeDeck={activeDeck} lastAction={lastAction} audioStatus={audioEngine.getStatus()} />
      <main className="console-layout">
        <aside className="left-rack">
          <DeviceIntegrationPanel
            mode={hardwareMode}
            diagnostics={adapterDiagnostics}
            onModeChange={(mode) => {
              flowLightManager.setHardwareMode(mode);
              setHardwareMode(mode);
              setAdapterDiagnostics(flowLightManager.getDiagnostics());
            }}
            onDiscover={(kind: AdapterKind) => {
              void flowLightManager.discover(kind).then(() => setAdapterDiagnostics(flowLightManager.getDiagnostics()));
            }}
            onConnect={(kind: AdapterKind, deviceId?: string) => {
              void flowLightManager.connectAdapter(kind, deviceId).then(() => setAdapterDiagnostics(flowLightManager.getDiagnostics()));
            }}
            onDisconnect={(kind: AdapterKind) => {
              void flowLightManager.disconnectAdapter(kind).then(() => setAdapterDiagnostics(flowLightManager.getDiagnostics()));
            }}
          />
          <KeyboardLegend modeLabel={mode.toUpperCase()} items={legendItems} />
        </aside>

        <section className="center-stage">
          <div className="stage-anchor">
            <FlowLightPreviewPanel
              state={flowLightState}
              onSettingsChange={(next) => {
                flowLightManager.updateSettings(next);
                setFlowLightState(flowLightManager.getState());
              }}
              onApplyMoodPreset={(presetId) => {
                flowLightManager.applyMoodPreset(presetId);
                setFlowLightState(flowLightManager.getState());
              }}
              onUpdatePaletteColor={(paletteId, index, color) => {
                flowLightManager.updatePaletteColor(paletteId, index, color);
                setFlowLightState(flowLightManager.getState());
              }}
              onUpdateKeyMapping={(group, paletteId) => {
                flowLightManager.updateKeyMapping(group, paletteId);
                setFlowLightState(flowLightManager.getState());
              }}
            />
          </div>
          <div className="deck-row">
            <DeckPanel deck={decks.A} isActive={activeDeck === "A"} fileInputRef={fileInputARef} onSelect={setActiveDeck} onLoadFile={onLoadFile} onTogglePlay={onTogglePlay} onSeekTo={onSeekTo} onGainChange={onGainChange} onCue={onCue} onLoop={onLoop} />
            <MixerPanel crossfader={crossfader} masterGain={masterGain} safeMixMode={safeMixMode} guidance={transitionGuidance} onCrossfaderChange={setCrossfader} onMasterGainChange={setMasterGain} onSafeMixToggle={setSafeMixMode} />
            <DeckPanel deck={decks.B} isActive={activeDeck === "B"} fileInputRef={fileInputBRef} onSelect={setActiveDeck} onLoadFile={onLoadFile} onTogglePlay={onTogglePlay} onSeekTo={onSeekTo} onGainChange={onGainChange} onCue={onCue} onLoop={onLoop} />
          </div>
          <WaveformPanel deckA={decks.A} deckB={decks.B} />
        </section>

        <aside className="right-stack">
          <LibraryPanel
            tracks={libraryTracks}
            busy={libraryBusy}
            error={libraryError}
            onUploadMp3={(file) => {
              if (!file) return;
              setLibraryBusy(true);
              setLibraryError(null);
              void uploadOwnedMp3(file)
                .then((track) => {
                  setLibraryTracks((prev) => [track, ...prev.filter((item) => item.id !== track.id)]);
                  setLastAction(`Added ${track.title} to library`);
                })
                .catch((error: unknown) => setLibraryError(error instanceof Error ? error.message : "Upload failed"))
                .finally(() => setLibraryBusy(false));
            }}
            onImportYoutube={(url) => {
              const trimmed = url.trim();
              if (!trimmed) return;
              setLibraryBusy(true);
              setLibraryError(null);
              void importYoutubeMp3(trimmed)
                .then((track) => {
                  setLibraryTracks((prev) => [track, ...prev.filter((item) => item.id !== track.id)]);
                  setLastAction(`Imported ${track.title} from YouTube`);
                })
                .catch((error: unknown) => setLibraryError(error instanceof Error ? error.message : "YouTube import failed"))
                .finally(() => setLibraryBusy(false));
            }}
            onLoadToDeck={(track, deckId) => {
              void loadTrackFromAsset(deckId, track);
            }}
          />
          <StrategySelector
            direction={recommendationDirection}
            bias={recommendationBias}
            targetMood={recommendationMood}
            onDirectionChange={setRecommendationDirection}
            onBiasChange={setRecommendationBias}
            onMoodChange={setRecommendationMood}
          />
          <NextTrackPanel recommendations={recommendationResult} />
        </aside>
      </main>
      <SessionAnalyticsPanel
        analytics={sessionAnalytics}
        onEndSession={() => void handleEndSession()}
        onExportJson={() => sessionAnalytics && exportSessionJson(sessionAnalytics)}
        onExportCsv={() => sessionAnalytics && void exportSessionCsv(sessionAnalytics.id)}
      />
      {showOnboarding ? <OnboardingModal onClose={() => setShowOnboarding(false)} /> : null}
      {showMappingPanel ? <MappingPanel mode={mode as FlowMode} profiles={profiles} selectedProfileId={selectedProfileId} onSelectProfile={selectProfile} onUpdateKey={onUpdateKey} onClose={() => setShowMappingPanel(false)} /> : null}
    </div>
  );
}
