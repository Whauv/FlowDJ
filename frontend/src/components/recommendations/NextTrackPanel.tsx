import type { RecommendationResponse } from "../../modules/recommendations/types";

interface NextTrackPanelProps {
  recommendations: RecommendationResponse | null;
}

export function NextTrackPanel({ recommendations }: NextTrackPanelProps) {
  return (
    <section className="panel recommendation-panel">
      <h3>AI-Assisted Next Tracks</h3>
      {!recommendations || recommendations.recommendations.length === 0 ? (
        <p className="tiny-text">No recommendations yet. Load tracks and play to generate suggestions.</p>
      ) : (
        recommendations.recommendations.slice(0, 5).map((item) => (
          <div className="suggestion-card" key={item.track.id}>
            <p><strong>{item.track.title}</strong> - {item.score.toFixed(1)}</p>
            <p className="tiny-text">{item.track.bpm} BPM | {item.track.key} | Energy {item.track.energy}</p>
            {item.reasons.map((reason) => (
              <p className="tiny-text" key={reason}>- {reason}</p>
            ))}
          </div>
        ))
      )}
    </section>
  );
}
