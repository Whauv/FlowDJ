import type { DeckId } from "../state/types";
import { computeDeckCrossfadeGains } from "../state/utils/audioStateTestUtils";

interface DeckRuntime {
  element: HTMLAudioElement;
  source: MediaElementAudioSourceNode;
  gain: GainNode;
  loopIn: number | null;
  loopOut: number | null;
  loopEnabled: boolean;
}

export interface DeckAnalysis {
  bpm: number;
  waveform: number[];
  duration: number;
  key: string;
  energy: number;
}

const CAMELOT = ["1A","2A","3A","4A","5A","6A","7A","8A","9A","10A","11A","12A","1B","2B","3B","4B","5B","6B","7B","8B","9B","10B","11B","12B"];

export class AudioEngine {
  private context: AudioContext | null = null;
  private master: GainNode | null = null;
  private decks: Record<DeckId, DeckRuntime> | null = null;
  private initialized = false;

  init(): void {
    if (this.initialized) return;
    this.context = new AudioContext({ latencyHint: "interactive" });
    this.master = this.context.createGain();
    this.master.gain.value = 0.9;
    this.master.connect(this.context.destination);
    this.decks = { A: this.createDeckRuntime(), B: this.createDeckRuntime() };
    this.initialized = true;
  }

  private createDeckRuntime(): DeckRuntime {
    if (!this.context || !this.master) throw new Error("Audio engine not initialized");
    const element = new Audio();
    element.preload = "auto";
    const source = this.context.createMediaElementSource(element);
    const gain = this.context.createGain();
    gain.gain.value = 0.8;
    source.connect(gain);
    gain.connect(this.master);
    return { element, source, gain, loopIn: null, loopOut: null, loopEnabled: false };
  }

  private requireDeck(deckId: DeckId): DeckRuntime {
    if (!this.decks) throw new Error("Audio engine not initialized");
    return this.decks[deckId];
  }

  async ensureRunning(): Promise<void> {
    if (!this.context) this.init();
    if (this.context && this.context.state === "suspended") await this.context.resume();
  }

  async loadTrack(deckId: DeckId, file: File): Promise<DeckAnalysis> {
    await this.ensureRunning();
    if (!file.type.startsWith("audio/")) throw new Error("Unsupported file type. Please load a valid audio file.");

    const deck = this.requireDeck(deckId);
    const objectUrl = URL.createObjectURL(file);
    deck.element.src = objectUrl;
    deck.element.load();

    const fileBuffer = await file.arrayBuffer();
    const decoded = await this.context!.decodeAudioData(fileBuffer.slice(0));

    const waveform = this.extractWaveform(decoded, 140);
    const bpm = this.estimateBpm(decoded);
    const energy = this.estimateEnergy(waveform);
    const key = this.estimateKey(file.name, bpm, energy);

    return { bpm, waveform, duration: decoded.duration, key, energy };
  }

  async togglePlay(deckId: DeckId): Promise<boolean> {
    await this.ensureRunning();
    const deck = this.requireDeck(deckId);
    if (deck.element.paused) {
      await deck.element.play();
      return true;
    }
    deck.element.pause();
    return false;
  }

  seek(deckId: DeckId, timeSeconds: number): number {
    const deck = this.requireDeck(deckId);
    const duration = Number.isFinite(deck.element.duration) ? deck.element.duration : 0;
    const next = Math.max(0, Math.min(duration || 0, timeSeconds));
    deck.element.currentTime = next;
    return next;
  }

  setCrossfader(value: number, deckGains: Record<DeckId, number>): void {
    const normalized = Math.max(0, Math.min(1, value));
    const cross = computeDeckCrossfadeGains(normalized);
    this.requireDeck("A").gain.gain.value = cross.A * deckGains.A;
    this.requireDeck("B").gain.gain.value = cross.B * deckGains.B;
  }

  setMasterGain(value: number): void {
    if (!this.master) throw new Error("Audio engine not initialized");
    this.master.gain.value = Math.max(0, Math.min(1, value));
  }

  setLoopInOut(deckId: DeckId, currentTime: number): { loopIn: number | null; loopOut: number | null; loopEnabled: boolean } {
    const deck = this.requireDeck(deckId);
    if (deck.loopIn === null) {
      deck.loopIn = currentTime;
      deck.loopOut = null;
      deck.loopEnabled = false;
    } else if (deck.loopOut === null && currentTime > deck.loopIn) {
      deck.loopOut = currentTime;
      deck.loopEnabled = true;
    } else {
      deck.loopIn = null;
      deck.loopOut = null;
      deck.loopEnabled = false;
    }
    return { loopIn: deck.loopIn, loopOut: deck.loopOut, loopEnabled: deck.loopEnabled };
  }

  updateLoop(deckId: DeckId): void {
    const deck = this.requireDeck(deckId);
    if (!deck.loopEnabled || deck.loopIn === null || deck.loopOut === null) return;
    if (deck.element.currentTime >= deck.loopOut) deck.element.currentTime = deck.loopIn;
  }

  setAutoloop(deckId: DeckId, bpm: number): { loopIn: number; loopOut: number; loopEnabled: boolean } {
    const deck = this.requireDeck(deckId);
    const now = deck.element.currentTime;
    const beat = bpm > 0 ? 60 / bpm : 0.5;
    const fourBeats = Math.max(1, beat * 4);
    deck.loopIn = now;
    deck.loopOut = Math.min(now + fourBeats, deck.element.duration || now + fourBeats);
    deck.loopEnabled = true;
    return { loopIn: deck.loopIn, loopOut: deck.loopOut, loopEnabled: true };
  }

  getCurrentTime(deckId: DeckId): number { return this.requireDeck(deckId).element.currentTime; }
  getDuration(deckId: DeckId): number {
    const duration = this.requireDeck(deckId).element.duration;
    return Number.isFinite(duration) ? duration : 0;
  }
  isPlaying(deckId: DeckId): boolean { return !this.requireDeck(deckId).element.paused; }
  getStatus(): string { return this.context ? this.context.state : "idle"; }

  private estimateEnergy(waveform: number[]): number {
    if (!waveform.length) return 5;
    const avg = waveform.reduce((a, b) => a + b, 0) / waveform.length;
    return Math.max(1, Math.min(10, Math.round(avg * 24)));
  }

  private estimateKey(name: string, bpm: number, energy: number): string {
    const raw = `${name}:${bpm}:${energy}`;
    let hash = 0;
    for (let i = 0; i < raw.length; i += 1) hash = (hash * 31 + raw.charCodeAt(i)) >>> 0;
    return CAMELOT[hash % CAMELOT.length];
  }

  private extractWaveform(buffer: AudioBuffer, points: number): number[] {
    const channel = buffer.getChannelData(0);
    const segment = Math.max(1, Math.floor(channel.length / points));
    const result: number[] = [];
    for (let i = 0; i < points; i += 1) {
      let sum = 0;
      const start = i * segment;
      const end = Math.min(start + segment, channel.length);
      for (let j = start; j < end; j += 1) sum += Math.abs(channel[j]);
      result.push(sum / Math.max(1, end - start));
    }
    return result;
  }

  private estimateBpm(buffer: AudioBuffer): number {
    const channel = buffer.getChannelData(0);
    const sampleRate = buffer.sampleRate;
    const step = 1024;
    const envelope: number[] = [];
    for (let i = 0; i < channel.length; i += step) {
      let energy = 0;
      for (let j = i; j < Math.min(i + step, channel.length); j += 1) energy += Math.abs(channel[j]);
      envelope.push(energy / step);
    }
    const mean = envelope.reduce((a, b) => a + b, 0) / Math.max(1, envelope.length);
    const threshold = mean * 1.35;
    const peakTimes: number[] = [];
    for (let i = 1; i < envelope.length - 1; i += 1) {
      if (envelope[i] > threshold && envelope[i] > envelope[i - 1] && envelope[i] > envelope[i + 1]) {
        peakTimes.push((i * step) / sampleRate);
      }
    }
    if (peakTimes.length < 4) return 0;
    const intervals: number[] = [];
    for (let i = 1; i < peakTimes.length; i += 1) {
      const interval = peakTimes[i] - peakTimes[i - 1];
      if (interval > 0.2 && interval < 2) intervals.push(interval);
    }
    if (!intervals.length) return 0;
    const avgInterval = intervals.reduce((a, b) => a + b, 0) / intervals.length;
    let bpm = 60 / avgInterval;
    while (bpm < 80) bpm *= 2;
    while (bpm > 180) bpm /= 2;
    return Math.round(bpm);
  }
}

export const audioEngine = new AudioEngine();
