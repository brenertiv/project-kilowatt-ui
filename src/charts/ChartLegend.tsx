/** One legend entry. */
export type LegendItem = {
  /** The series id. Passed to `onToggle` and checked against `hidden`. */
  id: string;
  /** Reader-facing series name. */
  label: string;
  /** The key color. `ChartFrame` fills this from the token palette; outside a frame, pass a token such as `var(--chart-1)`. */
  color: string;
  /** Mirrors the mark: a line key for lines, a swatch for bars and areas. */
  shape?: 'line' | 'rect';
};

export type ChartLegendProps = {
  /** The entries, in series order. Fewer than two renders nothing. */
  items: LegendItem[];
  /** Ids currently hidden; their buttons show as unpressed. Only matters with `onToggle`. */
  hidden?: ReadonlySet<string>;
  /** Called with an item's id when the reader clicks it. Pass it to make entries toggle buttons; omit it for a static key. */
  onToggle?: (id: string) => void;
  /** Accessible name for the list. Defaults to "Series". */
  label?: string;
};

/**
 * HTML legend. Styled with tokens, keyboard operable, and the dependable identity channel for two or
 * more series. Renders nothing for a single series: the title names it. `ChartFrame` renders this
 * for you, with colors and toggles wired; use it directly only for a key outside a frame.
 *
 * @summary Token-styled series key, optionally with toggle buttons; ChartFrame renders it for you.
 * @import import { ChartLegend } from 'src/charts/ChartLegend';
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
