import type { DeckState } from "../../state/types";

interface DeckPanelProps {
  deck: DeckState;
}

export function DeckPanel({ deck }: DeckPanelProps) {
  return (
    <section className={`panel ${deck.id === "A" ? "deck-a" : "deck-b"}`}>
      <h3>Deck {deck.id}</h3>
      <p>{deck.trackName}</p>
      <div className="row">
        <span className="pill">BPM: {deck.bpm || "--"}</span>
        <span className="pill">State: {deck.isPlaying ? "Playing" : "Paused"}</span>
      </div>
      <p>
        Toggle: <span className="kbd">{deck.id === "A" ? "Space" : "Enter"}</span>
      </p>
    </section>
  );
}
