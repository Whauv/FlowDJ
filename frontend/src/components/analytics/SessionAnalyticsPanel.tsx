import type { SessionAnalyticsPayload } from "../../modules/analytics/types";

interface SessionAnalyticsPanelProps {
  analytics: SessionAnalyticsPayload | null;
  onEndSession: () => void;
  onExportJson: () => void;
  onExportCsv: () => void;
}

export function SessionAnalyticsPanel({ analytics, onEndSession, onExportJson, onExportCsv }: SessionAnalyticsPanelProps) {
  return (
    <section className="panel analytics-panel">
      <div className="row between">
        <h3>Session Analytics</h3>
        <div className="row">
          <button className="action-btn" onClick={onEndSession}>End Session</button>
          <button className="action-btn" onClick={onExportJson} disabled={!analytics}>Export JSON</button>
          <button className="action-btn" onClick={onExportCsv} disabled={!analytics}>Export CSV</button>
        </div>
      </div>

      {!analytics ? (
        <p className="tiny-text">Session is recording. End session to generate scorecard and replay report.</p>
      ) : (
        <>
          <div className="score-grid">
            <div className="metric"><strong>Total:</strong> {analytics.total_score}</div>
            <div className="metric"><strong>Transition Timing:</strong> {analytics.transition_timing_score}</div>
            <div className="metric"><strong>Dead Air (s):</strong> {analytics.dead_air_seconds}</div>
            <div className="metric"><strong>Overlap Quality:</strong> {analytics.overlap_quality_score}</div>
            <div className="metric"><strong>Abrupt Volume:</strong> {analytics.abrupt_volume_score}</div>
            <div className="metric"><strong>BPM Mismatch:</strong> {analytics.bpm_mismatch_severity}</div>
            <div className="metric"><strong>Key Clash Risk:</strong> {analytics.key_clash_risk}</div>
            <div className="metric"><strong>Loop Quality:</strong> {analytics.loop_usage_quality}</div>
            <div className="metric"><strong>Recovery Used:</strong> {analytics.recovery_actions_used}</div>
            <div className="metric"><strong>Avg Energy:</strong> {analytics.average_energy_flow}</div>
          </div>

          <div className="suggestion-card">
            <h4>Improvement Suggestions</h4>
            {analytics.suggestions.map((item) => (
              <p className="tiny-text" key={item}>- {item}</p>
            ))}
          </div>

          <div className="suggestion-card">
            <h4>Transition-by-Transition Report</h4>
            {analytics.transitions.map((t, idx) => (
              <p className="tiny-text" key={`${t.timestamp_ms}-${idx}`}>
                #{idx + 1} {t.from_deck}{"->"}{t.to_deck} | BPM mismatch {t.bpm_mismatch.toFixed(2)} | key risk {t.key_clash_risk.toFixed(2)} | overlap {t.overlap_seconds.toFixed(2)}s
              </p>
            ))}
          </div>

          <div className="suggestion-card">
            <h4>Replay Timeline</h4>
            <div className="timeline-strip">
              {analytics.transitions.map((t, idx) => (
                <div className="timeline-marker" key={`${t.timestamp_ms}-${idx}`} title={`Transition ${idx + 1} at ${t.timestamp_ms}ms`} />
              ))}
            </div>
            <p className="tiny-text">Markers represent transition moments during your set.</p>
          </div>
        </>
      )}
    </section>
  );
}
