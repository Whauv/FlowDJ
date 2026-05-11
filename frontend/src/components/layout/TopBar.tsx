import type { Mode } from "../../state/types";

interface TopBarProps {
  mode: Mode;
  lastAction: string;
  audioStatus: string;
}

const modes: Mode[] = ["browse", "mix", "fx", "recovery"];

export function TopBar({ mode, lastAction, audioStatus }: TopBarProps) {
  return (
    <header className="top-bar">
      <div>
        <strong>FlowDJ</strong>
        <p className="status">Laptop-first keyboard DJ scaffold</p>
      </div>
      <div className="row">
        {modes.map((entry) => (
          <span className={`pill ${mode === entry ? "active" : ""}`} key={entry}>
            {entry.toUpperCase()} MODE
          </span>
        ))}
      </div>
      <div>
        <p className="status">Audio: {audioStatus}</p>
        <p className="status">Last Action: {lastAction}</p>
      </div>
    </header>
  );
}
