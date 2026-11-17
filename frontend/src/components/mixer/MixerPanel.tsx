import type { TransitionGuidance } from "../../modules/transitions/types";

interface MixerPanelProps {
  crossfader: number;
  masterGain: number;
  safeMixMode: boolean;
  guidance: TransitionGuidance | null;
  onCrossfaderChange: (value: number) => void;
  onMasterGainChange: (value: number) => void;
  onSafeMixToggle: (value: boolean) => void;
}

export function MixerPanel({
  crossfader,
  masterGain,
  safeMixMode,
  guidance,
  onCrossfaderChange,
  onMasterGainChange,
  onSafeMixToggle
}: MixerPanelProps) {
  const topTrack = guidance?.recommendations[0];

  return (
    <section className="panel mixer">
      <div className="row between">
        <h3>Mixer</h3>
        <label className="row tiny-text">
          Safe Mix
          <input type="checkbox" checked={safeMixMode} onChange={(event) => onSafeMixToggle(event.target.checked)} />
        </label>
      </div>
      <p>Keyboard-first mix controls. Use <span className="kbd">,</span> and <span className="kbd">.</span> for crossfader.</p>

      <div className="row">
        <label>Crossfader</label>
        <input type="range" min={0} max={1} step={0.01} value={crossfader} onChange={(event) => onCrossfaderChange(Number(event.target.value))} />
      </div>

      <div className="row between">
        <span>Deck A</span>
        <span>Deck B</span>
      </div>

      <div className="row">
        <label>Master Output</label>
        <input type="range" min={0} max={1} step={0.01} value={masterGain} onChange={(event) => onMasterGainChange(Number(event.target.value))} />
      </div>
      <div className="level">
        <div style={{ width: `${Math.round(masterGain * 100)}%` }} />
      </div>

      <div className="suggestion-card">
        <h4>Suggested Next Track</h4>
        {topTrack ? (
          <>
            <p>
              <strong>{topTrack.track.title}</strong> - Score {topTrack.compatibility.total}/100
            </p>
            <p className="tiny-text">{topTrack.compatibility.explanation}</p>
            {topTrack.compatibility.warnings.map((warning) => (
              <p className="warn-text" key={warning}>{warning}</p>
            ))}
          </>
        ) : (
          <p className="tiny-text">Load and play a track to get live suggestions.</p>
        )}
      </div>

      <div className="suggestion-card">
        <h4>Transition Actions</h4>
        <p className="tiny-text">{guidance?.phraseHint ?? "Phrase timing unavailable."}</p>
        {guidance?.actions.slice(0, 3).map((action) => (
          <p className={action.severity === "warn" ? "warn-text" : "tiny-text"} key={action.title}>
            <strong>{action.title}:</strong> {action.detail}
          </p>
        ))}
      </div>

      <p className="tiny-text">Master keys: <span className="kbd">N</span>/<span className="kbd">M</span></p>
    </section>
  );
}
