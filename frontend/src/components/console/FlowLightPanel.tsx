import { MOOD_PRESETS } from "../../modules/flowlight/palettes";
import type { FlowLightSettings, FlowLightState } from "../../modules/flowlight/types";

interface FlowLightPreviewPanelProps {
  state: FlowLightState;
  onSettingsChange: (next: Partial<FlowLightSettings>) => void;
  onApplyMoodPreset: (presetId: string) => void;
  onUpdatePaletteColor: (paletteId: string, index: number, color: string) => void;
  onUpdateKeyMapping: (group: string, paletteId: string) => void;
}

export function FlowLightPreviewPanel({
  state,
  onSettingsChange,
  onApplyMoodPreset,
  onUpdatePaletteColor,
  onUpdateKeyMapping
}: FlowLightPreviewPanelProps) {
  const groups = ["1","2","3","4","5","6","7","8","9","10","11","12"];

  return (
    <section className="panel flowlight-panel">
      <div className="row between">
        <h3>FlowLight Preview</h3>
        <p className="tiny-text">Scene: {state.sceneName}</p>
      </div>

      <div className="flowlight-controls">
        <label className="tiny-text">Mood Preset
          <select value={state.settings.selectedMoodPreset} onChange={(e) => onApplyMoodPreset(e.target.value)}>
            {MOOD_PRESETS.map((preset) => <option key={preset.id} value={preset.id}>{preset.label}</option>)}
          </select>
        </label>
        <label className="tiny-text row">Key-Aware Coloring
          <input type="checkbox" checked={state.settings.keyAwareColoring} onChange={(e) => onSettingsChange({ keyAwareColoring: e.target.checked })} />
        </label>
        <label className="tiny-text">Movement Sensitivity
          <input type="range" min={0.4} max={2} step={0.05} value={state.settings.movementSensitivity} onChange={(e) => onSettingsChange({ movementSensitivity: Number(e.target.value) })} />
        </label>
        <label className="tiny-text">Intensity Scale
          <input type="range" min={0.3} max={1.4} step={0.05} value={state.settings.intensityScale} onChange={(e) => onSettingsChange({ intensityScale: Number(e.target.value) })} />
        </label>
        <label className="tiny-text">Beat Pulse Strength
          <input type="range" min={0} max={1} step={0.05} value={state.settings.beatPulseStrength} onChange={(e) => onSettingsChange({ beatPulseStrength: Number(e.target.value) })} />
        </label>
        <label className="tiny-text">Safety Limit
          <input type="range" min={0.35} max={1} step={0.05} value={state.settings.safetyLimit} onChange={(e) => onSettingsChange({ safetyLimit: Number(e.target.value) })} />
        </label>
        <label className="tiny-text row">Allow Strobe
          <input type="checkbox" checked={state.settings.allowStrobe} onChange={(e) => onSettingsChange({ allowStrobe: e.target.checked })} />
        </label>
        <label className="tiny-text row">Drops/Build Only Strobe
          <input type="checkbox" checked={state.settings.strobeOnDropsOnly} onChange={(e) => onSettingsChange({ strobeOnDropsOnly: e.target.checked })} />
        </label>
      </div>

      <div className="suggestion-card">
        <h4>Lighting Decision</h4>
        <p className="tiny-text">Palette: {state.decision.paletteName}</p>
        <p className="tiny-text">Reason: {state.decision.explanation}</p>
        <div className="row">
          <span className="chip" style={{ background: state.decision.fromColor }}>From</span>
          <span className="chip" style={{ background: state.decision.toColor }}>To</span>
          <span className="chip" style={{ background: state.decision.blendedColor }}>Blend</span>
        </div>
      </div>

      <div className="suggestion-card">
        <h4>Key to Palette Mapping</h4>
        <div className="mapping-grid">
          {groups.map((group) => (
            <label className="tiny-text" key={group}>{group}
              <select value={state.settings.keyToPalette[group]} onChange={(e) => onUpdateKeyMapping(group, e.target.value)}>
                {state.settings.paletteLibrary.map((palette) => (
                  <option key={palette.id} value={palette.id}>{palette.name}</option>
                ))}
              </select>
            </label>
          ))}
        </div>
      </div>

      <div className="suggestion-card">
        <h4>Custom Palette Editor</h4>
        {state.settings.paletteLibrary.map((palette) => (
          <div className="palette-row" key={palette.id}>
            <p className="tiny-text"><strong>{palette.name}</strong></p>
            <div className="row">
              {palette.colors.map((color, index) => (
                <input key={`${palette.id}-${index}`} type="color" value={color} onChange={(e) => onUpdatePaletteColor(palette.id, index, e.target.value)} />
              ))}
            </div>
          </div>
        ))}
      </div>

      <div className="fixture-grid">
        {state.fixtures.map((fixture) => (
          <div className="fixture-card" key={fixture.id}>
            <p><strong>{fixture.label}</strong></p>
            <div className="fixture-lamp" style={{ background: fixture.color, opacity: Math.max(0.15, fixture.intensity) }} />
            <p className="tiny-text">Intensity: {(fixture.intensity * 100).toFixed(0)}%</p>
            <p className="tiny-text">Pan/Tilt: {fixture.pan}/{fixture.tilt}</p>
            <p className="tiny-text">Strobe: {fixture.strobeHz.toFixed(1)} Hz</p>
          </div>
        ))}
      </div>

      <div className="suggestion-card">
        <h4>Phrase Mapper</h4>
        {Object.entries(state.phraseToScene).map(([phrase, scene]) => (
          <p className="tiny-text" key={phrase}>{phrase}: {scene}</p>
        ))}
      </div>

      {state.lastEvent ? (
        <p className="tiny-text">
          BPM {state.lastEvent.bpm.toFixed(1)} | Deck {state.lastEvent.activeDeck} | Phrase {state.lastEvent.phraseSection} | Marker {state.lastEvent.marker}
        </p>
      ) : null}
    </section>
  );
}
