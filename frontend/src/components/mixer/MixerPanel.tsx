interface MixerPanelProps {
  crossfader: number;
  masterGain: number;
  onCrossfaderChange: (value: number) => void;
  onMasterGainChange: (value: number) => void;
}

export function MixerPanel({ crossfader, masterGain, onCrossfaderChange, onMasterGainChange }: MixerPanelProps) {
  return (
    <section className="panel mixer">
      <h3>Mixer</h3>
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
      <p className="tiny-text">Master keys: <span className="kbd">N</span>/<span className="kbd">M</span></p>
    </section>
  );
}
