import type { DeckState } from "../../state/types";
import { WaveformCanvas } from "./WaveformCanvas";

interface WaveformPanelProps {
  deckA: DeckState;
  deckB: DeckState;
}

export function WaveformPanel({ deckA, deckB }: WaveformPanelProps) {
  return (
    <section className="panel waveform">
      <h3>Waveform View</h3>
      <p>Dual deck preview with playhead markers.</p>
      <div className="wave-grid">
        <div>
          <p className="tiny-text">Deck A</p>
          <WaveformCanvas waveform={deckA.waveform} progress={deckA.duration ? deckA.currentTime / deckA.duration : 0} color="#52d0ff" />
        </div>
        <div>
          <p className="tiny-text">Deck B</p>
          <WaveformCanvas waveform={deckB.waveform} progress={deckB.duration ? deckB.currentTime / deckB.duration : 0} color="#64d98b" />
        </div>
      </div>
    </section>
  );
}
