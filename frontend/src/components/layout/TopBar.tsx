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
      <div>
        <strong>FlowDJ</strong>
        <p className="status">Laptop-first keyboard DJ engine</p>
      </div>
      <div className="row">
        {modes.map((entry) => (
          <span className={`pill ${mode === entry ? "active" : ""}`} key={entry}>
            {entry.toUpperCase()} MODE
          </span>
        ))}
        <span className="pill active">ACTIVE DECK: {activeDeck}</span>
      </div>
      <div>
        <p className="status">Audio: {audioStatus}</p>
        <p className="status">Last Action: {lastAction}</p>
      </div>
    </header>
  );
}
