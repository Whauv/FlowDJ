import type { FlowLightState } from "../../modules/flowlight/types";

interface FlowLightPreviewPanelProps {
  state: FlowLightState;
}

export function FlowLightPreviewPanel({ state }: FlowLightPreviewPanelProps) {
  return (
    <section className="panel flowlight-panel">
      <h3>FlowLight Preview</h3>
      <p className="tiny-text">Scene: {state.sceneName}</p>
      <div className="fixture-grid">
        {state.fixtures.map((fixture) => (
          <div className="fixture-card" key={fixture.id}>
            <p><strong>{fixture.label}</strong></p>
            <div className="fixture-lamp" style={{ background: fixture.color, opacity: Math.max(0.15, fixture.intensity) }} />
            <p className="tiny-text">Intensity: {(fixture.intensity * 100).toFixed(0)}%</p>
            <p className="tiny-text">Pan/Tilt: {fixture.pan}/{fixture.tilt}</p>
          </div>
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
