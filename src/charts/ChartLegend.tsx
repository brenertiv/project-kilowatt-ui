export type LegendItem = {
  id: string;
  label: string;
  color: string;
  /** Mirrors the mark: a line key for lines, a swatch for bars and areas. */
  shape?: 'line' | 'rect';
};

type ChartLegendProps = {
  items: LegendItem[];
  hidden?: ReadonlySet<string>;
  onToggle?: (id: string) => void;
  label?: string;
};

/**
 * HTML legend. Styled with tokens, keyboard operable, and the dependable identity
 * channel for two or more series. Render nothing for a single series: the title names it.
 */
export function ChartLegend({ items, hidden, onToggle, label = 'Series' }: ChartLegendProps) {
  if (items.length < 2) return null;
  return (
    <ul className="chart-legend" aria-label={label}>
      {items.map((item) => {
        const isHidden = hidden?.has(item.id) ?? false;
        const key = (
          <span
            className="chart-legend-key"
            data-shape={item.shape ?? 'rect'}
            style={{ color: item.color }}
            aria-hidden="true"
          />
        );
        return (
          <li key={item.id}>
            {onToggle ? (
              <button
                type="button"
                className="chart-legend-item"
                aria-pressed={!isHidden}
                data-hidden={isHidden || undefined}
                onClick={() => onToggle(item.id)}
              >
                {key}
                <span className="chart-legend-label">{item.label}</span>
              </button>
            ) : (
              <span className="chart-legend-item">
                {key}
                <span className="chart-legend-label">{item.label}</span>
              </span>
            )}
          </li>
        );
      })}
    </ul>
  );
}
