import type { KeyboardLegendItem } from "../../services/keyboard/types";

interface KeyboardLegendProps {
  modeLabel: string;
  items: KeyboardLegendItem[];
}

export function KeyboardLegend({ modeLabel, items }: KeyboardLegendProps) {
  return (
    <section className="panel keyboard-legend">
      <h3>Live Legend ({modeLabel})</h3>
      <div className="legend-grid">
        {items.map((item) => (
          <div className="legend-item" key={`${item.action}-${item.code}`}>
            <span className="kbd">{item.label}</span>
            <span>{item.description}</span>
          </div>
        ))}
      </div>
    </section>
  );
}
