import type { DeckId, DeckState } from "../../state/types";
import { WaveformCanvas } from "../waveform/WaveformCanvas";
import type { RefObject } from "react";

interface DeckPanelProps {
  deck: DeckState;
  isActive: boolean;
  onSelect: (deckId: DeckId) => void;
  onLoadFile: (deckId: DeckId, file: File | null) => void;
  onTogglePlay: (deckId: DeckId) => void;
  onSeekTo: (deckId: DeckId, time: number) => void;
  onGainChange: (deckId: DeckId, gain: number) => void;
  onCue: (deckId: DeckId) => void;
  onLoop: (deckId: DeckId) => void;
  fileInputRef: RefObject<HTMLInputElement>;
}

function formatTime(seconds: number): string {
  const s = Math.max(0, Math.floor(seconds));
  const min = Math.floor(s / 60);
  const rem = s % 60;
  return `${min}:${String(rem).padStart(2, "0")}`;
}

export function DeckPanel({
  deck,
  isActive,
  onSelect,
  onLoadFile,
  onTogglePlay,
  onSeekTo,
  onGainChange,
  onCue,
  onLoop,
  fileInputRef
}: DeckPanelProps) {
  const progress = deck.duration > 0 ? deck.currentTime / deck.duration : 0;

  return (
    <section className={`panel ${deck.id === "A" ? "deck-a" : "deck-b"} ${isActive ? "deck-active" : ""}`}>
      <div className="row between">
        <h3>Deck {deck.id}</h3>
        <button onClick={() => onSelect(deck.id)} className="action-btn">Set Active</button>
      </div>
      <p>{deck.trackName}</p>
      {deck.error ? <p className="error-text">{deck.error}</p> : null}
      <div className="row">
        <span className="pill">BPM: {deck.bpm || "--"}</span>
        <span className="pill">Key: {deck.musicalKey || "--"}</span>
        <span className="pill">Energy: {deck.energy.toFixed(1)}</span>
        <span className="pill">State: {deck.isPlaying ? "Playing" : "Paused"}</span>
        <span className="pill">Cue: {deck.cuePoint === null ? "--" : formatTime(deck.cuePoint)}</span>
      </div>

      <WaveformCanvas waveform={deck.waveform} progress={progress} color={deck.id === "A" ? "#52d0ff" : "#64d98b"} />

      <div className="row controls">
        <label className="action-btn file-btn">
          Import
          <input
            ref={fileInputRef}
            type="file"
            accept="audio/*"
            onChange={(event) => {
              onLoadFile(deck.id, event.target.files?.[0] ?? null);
              event.currentTarget.value = "";
            }}
          />
        </label>
        <button className="action-btn" onClick={() => onTogglePlay(deck.id)}>{deck.isPlaying ? "Pause" : "Play"}</button>
        <button className="action-btn" onClick={() => onCue(deck.id)}>Cue</button>
        <button className="action-btn" onClick={() => onLoop(deck.id)}>
          {deck.loopEnabled ? "Clear Loop" : "Loop In/Out"}
        </button>
      </div>

      <div className="row">
        <label>Seek</label>
        <input
          type="range"
          min={0}
          max={deck.duration || 0}
          step={0.01}
          value={Math.min(deck.currentTime, deck.duration || 0)}
          onChange={(event) => onSeekTo(deck.id, Number(event.target.value))}
          disabled={!deck.isLoaded}
        />
        <span>{formatTime(deck.currentTime)} / {formatTime(deck.duration)}</span>
      </div>

      <div className="row">
        <label>Deck Volume</label>
        <input
          type="range"
          min={0}
          max={1}
          step={0.01}
          value={deck.gain}
          onChange={(event) => onGainChange(deck.id, Number(event.target.value))}
        />
      </div>

      <p className="tiny-text">
        Keys: <span className="kbd">Q/P</span> import, <span className="kbd">Z/X</span> play, <span className="kbd">C</span> cue, <span className="kbd">L</span> loop
      </p>
    </section>
  );
}
