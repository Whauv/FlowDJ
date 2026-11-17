import type { RecommendationBias, RecommendationDirection } from "../../modules/recommendations/types";

interface StrategySelectorProps {
  direction: RecommendationDirection;
  bias: RecommendationBias;
  targetMood: string;
  onDirectionChange: (value: RecommendationDirection) => void;
  onBiasChange: (value: RecommendationBias) => void;
  onMoodChange: (value: string) => void;
}

export function StrategySelector({ direction, bias, targetMood, onDirectionChange, onBiasChange, onMoodChange }: StrategySelectorProps) {
  return (
    <section className="panel strategy-panel">
      <h3>Mix Strategy</h3>
      <div className="row">
        <label>Direction</label>
        <select value={direction} onChange={(event) => onDirectionChange(event.target.value as RecommendationDirection)}>
          <option value="build_energy">Build Energy</option>
          <option value="maintain_groove">Maintain Groove</option>
          <option value="cool_down">Cool Down</option>
          <option value="surprise_switch">Surprise Switch</option>
        </select>
      </div>
      <div className="row">
        <label>Bias</label>
        <select value={bias} onChange={(event) => onBiasChange(event.target.value as RecommendationBias)}>
          <option value="safe">Safer</option>
          <option value="balanced">Balanced</option>
          <option value="adventurous">Adventurous</option>
        </select>
      </div>
      <div className="row">
        <label>Target Mood</label>
        <input value={targetMood} onChange={(event) => onMoodChange(event.target.value)} placeholder="uplifting, dark, chill..." />
      </div>
    </section>
  );
}
