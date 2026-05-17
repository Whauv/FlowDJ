import type { Mode, DeckId } from "../../state/types";

interface TopBarProps {
  mode: Mode;
  activeDeck: DeckId;
  lastAction: string;
  audioStatus: string;
}

const modes: Mode[] = ["browse", "mix", "fx", "recovery"];

export function TopBar({ mode, activeDeck, lastAction, audioStatus }: TopBarProps) {
  return (
    <header className="top-bar">
      <div className="top-brand">
        <strong className="brand-mark">FlowDJ</strong>
        <p className="status">Performance Console</p>
      </div>
      <div className="mode-rail" aria-label="mode strip">
        {modes.map((entry) => (
          <span className={`mode-tab ${mode === entry ? "active" : ""}`} key={entry}>
            {entry.toUpperCase()}
          </span>
        ))}
        <span className="deck-indicator">DECK {activeDeck}</span>
      </div>
      <div className="top-telemetry">
        <p className="status">Engine {audioStatus}</p>
        <p className="status cut-text">{lastAction}</p>
      </div>
    </header>
  );
}
