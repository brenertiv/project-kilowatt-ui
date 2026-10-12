import { createContext, useContext, useId, useMemo, useState, type ReactNode } from 'react';
import { Button } from '@base-ui/react/button';
import { Toggle } from '@base-ui/react/toggle';
import { ToggleGroup } from '@base-ui/react/toggle-group';
import { formatUnit } from '../lib/format';
import { format } from 'date-fns';
import { formatCalendarDate } from '../lib/dates';
import { useTheme } from '../theme/ThemeProvider';
import { assignSeriesColors } from './color';
import { ChartLegend, type LegendItem } from './ChartLegend';
import { xValues, type ChartData } from './types';

type FrameState = {
  /** Series ids the reader has toggled off in the legend. */
  hidden: ReadonlySet<string>;
  /** Stable id → color map shared by the chart and the legend. */
  colors: Record<string, string>;
  /** Unique id for aria wiring. */
  id: string;
};

const FrameContext = createContext<FrameState | null>(null);

export function useChartFrame(): FrameState {
  const context = useContext(FrameContext);
  if (!context) throw new Error('Chart kinds must render inside <ChartFrame>.');
  return context;
}

type ChartFrameProps = {
  title: string;
  subtitle?: string;
  data: ChartData;
  children: ReactNode;
  /** Mark shape for legend keys. */
  legendShape?: LegendItem['shape'];
  /** Lets the reader hide series from the legend. On by default for two or more series. */
  toggleableLegend?: boolean;
  toolbar?: ReactNode;
  loading?: boolean;
  /** The previous render stays visible at reduced opacity while a refetch runs. */
  fetching?: boolean;
  error?: string | null;
  onRetry?: () => void;
  emptyMessage?: string;
  /** Height of the plot area. Fixed so layouts never jump between states. */
  height?: number;
  /** How to print x values in the table view. */
  xKind?: 'date' | 'category';
  /** Hide the categorical legend, e.g. for a heatmap whose color encodes magnitude, and show `scale` instead. */
  legend?: boolean;
  /** A color scale or other key rendered where the legend would go. */
  scale?: ReactNode;
  className?: string;
};

function isEmpty(data: ChartData) {
  return data.series.every((series) => series.points.every((point) => point.y === null));
}

function formatX(x: string | number, kind: 'date' | 'category') {
  if (kind === 'date') {
    const date = typeof x === 'number' ? new Date(x) : new Date(x);
    if (Number.isNaN(date.getTime())) return String(x);
    const hasTime = typeof x === 'number' || x.includes('T');
    return hasTime ? format(date, 'MMM d, HH:mm') : formatCalendarDate(String(x).slice(0, 10));
  }
  return String(x);
}

function ChartTable({ data, xKind }: { data: ChartData; xKind: 'date' | 'category' }) {
  const xs = xValues(data);
  return (
    <div className="table-wrap chart-table-wrap">
      <table className="ui-table chart-table">
        <thead>
          <tr>
            <th scope="col">{data.xLabel ?? (xKind === 'date' ? 'Date' : 'Category')}</th>
            {data.series.map((series) => (
              <th key={series.id} scope="col" className="is-numeric">
                {series.label}
                {series.unit && series.unit !== 'count' ? ` (${series.unit})` : ''}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {xs.map((x) => (
            <tr key={String(x)}>
              <th scope="row">{formatX(x, xKind)}</th>
              {data.series.map((series) => {
                const point = series.points.find((candidate) => candidate.x === x);
                return (
                  <td key={series.id} className="is-numeric">
                    {point && point.y !== null ? formatUnit(point.y, series.unit ?? 'count') : '—'}
                  </td>
                );
              })}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

/**
 * The card chrome every chart shares: title, legend, toolbar, and loading,
 * fetching, empty and error states, plus a "view as table" toggle so every value
 * is reachable without hover or color. Chart kinds render as children and read
 * hidden series and colors from the frame.
 */
export function ChartFrame({
  title,
  subtitle,
  data,
  children,
  legendShape = 'rect',
  toggleableLegend = true,
  toolbar,
  loading = false,
  fetching = false,
  error = null,
  onRetry,
  emptyMessage = 'No data for this range.',
  height = 240,
  xKind = 'category',
  legend = true,
  scale,
  className,
}: ChartFrameProps) {
  const id = useId();
  const { values } = useTheme();
  const [hidden, setHidden] = useState<ReadonlySet<string>>(() => new Set());
  const [view, setView] = useState<'chart' | 'table'>('chart');

  const colors = useMemo(() => {
    const ids = data.series.filter((series) => series.role !== 'comparison').map((series) => series.id);
    const assigned = assignSeriesColors(ids, values);
    for (const series of data.series) {
      if (series.role === 'comparison') assigned[series.id] = values.track;
    }
    return assigned;
  }, [data.series, values]);

  const legendItems: LegendItem[] = data.series.map((series) => ({
    id: series.id,
    label: series.label,
    color: colors[series.id],
    shape: legendShape,
  }));

  function toggle(seriesId: string) {
    setHidden((current) => {
      const next = new Set(current);
      if (next.has(seriesId)) next.delete(seriesId);
      else if (next.size < data.series.length - 1) next.add(seriesId);
      return next;
    });
  }

  const empty = !loading && !error && isEmpty(data);
  const frame = useMemo<FrameState>(() => ({ hidden, colors, id }), [hidden, colors, id]);

  let body: ReactNode;
  if (loading) {
    body = (
      <div className="chart-state" aria-busy="true">
        <span className="ui-skeleton chart-skeleton" />
      </div>
    );
  } else if (error) {
    body = (
      <div className="chart-state" role="alert">
        <p className="ui-description">{error}</p>
        {onRetry ? (
          <Button className="ui-btn" onClick={onRetry}>
            Retry
          </Button>
        ) : null}
      </div>
    );
  } else if (empty) {
    body = (
      <div className="chart-state">
        <p className="ui-description">{emptyMessage}</p>
      </div>
    );
  } else if (view === 'table') {
    body = <ChartTable data={data} xKind={xKind} />;
  } else {
    body = children;
  }

  return (
    <FrameContext.Provider value={frame}>
      <figure className={['chart-frame', className].filter(Boolean).join(' ')} aria-labelledby={`${id}-title`}>
        <figcaption className="chart-frame-head">
          <div className="chart-frame-titles">
            <h4 id={`${id}-title`} className="chart-frame-title">
              {title}
            </h4>
            {subtitle ? <p className="ui-description">{subtitle}</p> : null}
          </div>
          <div className="chart-frame-tools">
            {toolbar}
            <ToggleGroup
              value={[view]}
              onValueChange={(next) => {
                const chosen = next[0] as 'chart' | 'table' | undefined;
                if (chosen) setView(chosen);
              }}
              className="ui-toggle-group chart-view-toggle"
              aria-label="View as"
            >
              <Toggle value="chart" className="ui-toggle">
                Chart
              </Toggle>
              <Toggle value="table" className="ui-toggle">
                Table
              </Toggle>
            </ToggleGroup>
          </div>
        </figcaption>
        {view === 'chart' && legend ? (
          <ChartLegend items={legendItems} hidden={hidden} onToggle={toggleableLegend ? toggle : undefined} />
        ) : null}
        {view === 'chart' && scale ? <div className="chart-scale-slot">{scale}</div> : null}
        <div className="chart-frame-body" data-fetching={fetching || undefined} style={{ height }}>
          {body}
        </div>
      </figure>
    </FrameContext.Provider>
  );
}
