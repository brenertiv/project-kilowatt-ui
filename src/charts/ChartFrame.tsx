import { createContext, useContext, useId, useMemo, useState, type ReactNode } from 'react';
import { useTranslation } from 'react-i18next';
import Alert from '@mui/material/Alert';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import CardHeader from '@mui/material/CardHeader';
import Skeleton from '@mui/material/Skeleton';
import Stack from '@mui/material/Stack';
import Table from '@mui/material/Table';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import TableContainer from '@mui/material/TableContainer';
import TableHead from '@mui/material/TableHead';
import TableRow from '@mui/material/TableRow';
import ToggleButton from '@mui/material/ToggleButton';
import ToggleButtonGroup from '@mui/material/ToggleButtonGroup';
import Typography from '@mui/material/Typography';
import { formatUnit } from '../lib/format';
import { format } from 'date-fns';
import { formatCalendarDate } from '../lib/dates';
import { useKilowattTheme } from '../theme/useKilowattTheme';
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

/** Reads hidden series and colors from the enclosing `ChartFrame`. For chart kinds; throws outside a frame. */
export function useChartFrame(): FrameState {
  const context = useContext(FrameContext);
  if (!context) throw new Error('Chart kinds must render inside <ChartFrame>.');
  return context;
}

export type ChartFrameProps = {
  /** What the chart shows, e.g. "Demand". Rendered as the heading that names the figure. */
  title: string;
  /** The measure and period, e.g. "Hourly kW". */
  subtitle?: string;
  /** The same `ChartData` the chart inside gets. Drives the legend, the series colors, the table view and the empty state. */
  data: ChartData;
  /** One chart kind: `TimeSeriesChart`, `CategoryBarChart`, `DonutChart` or `HeatmapChart`. Shown only in the chart view once data is ready. */
  children: ReactNode;
  /** Mark shape for legend keys: `'line'` for line charts, `'rect'` for bars, slices and areas. Defaults to `'rect'`. */
  legendShape?: LegendItem['shape'];
  /** Lets the reader hide series from the legend; the last visible series cannot be hidden. Defaults to true. Set false when every series must stay on screen. */
  toggleableLegend?: boolean;
  /** Controls rendered before the Chart/Table toggle, e.g. a range picker. */
  toolbar?: ReactNode;
  /** First load with nothing to show yet: the plot area shows a skeleton at `height`. Defaults to false. */
  loading?: boolean;
  /** The previous render stays visible at reduced opacity while a refetch runs. Defaults to false. */
  fetching?: boolean;
  /** A message for a failed request. Replaces the plot with the message and, with `onRetry`, a Retry button. Defaults to null. */
  error?: string | null;
  /** Called by the Retry button in the error state. Without it, the error shows no button. */
  onRetry?: () => void;
  /** Shown when every point in `data` is null. Defaults to "No data for this range." (`chart.empty`). Name the range or the reason when you know it. */
  emptyMessage?: string;
  /** Height of the plot area in px. Fixed so layouts never jump between states. Defaults to 240. */
  height?: number;
  /** How to print x values in the table view: `'date'` formats ISO dates and epoch ms. Defaults to `'category'`. */
  xKind?: 'date' | 'category';
  /** Show the categorical legend. Defaults to true. Set false for a heatmap, whose color encodes magnitude, and pass `scale` instead. */
  legend?: boolean;
  /** A color scale or other key rendered where the legend would go, e.g. `<HeatScale>`. Shown in the chart view only. */
  scale?: ReactNode;
  /** Extra class on the outer `figure` (an outlined MUI `Card`), for layout from the parent. */
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

function ChartTable({ data, xKind, title }: { data: ChartData; xKind: 'date' | 'category'; title: string }) {
  const { t } = useTranslation();
  const xs = xValues(data);
  return (
    // A focusable, named region so keyboard users can scroll a table wider or taller than the card.
    <TableContainer role="region" aria-label={t('chart.tableLabel', { title })} tabIndex={0} sx={{ height: '100%' }}>
      <Table size="small" stickyHeader>
        <TableHead>
          <TableRow>
            <TableCell scope="col">{data.xLabel ?? (xKind === 'date' ? t('chart.date') : t('chart.category'))}</TableCell>
            {data.series.map((series) => (
              <TableCell key={series.id} scope="col" align="right">
                {series.label}
                {series.unit && series.unit !== 'count' ? ` (${series.unit})` : ''}
              </TableCell>
            ))}
          </TableRow>
        </TableHead>
        <TableBody>
          {xs.map((x) => (
            <TableRow key={String(x)}>
              <TableCell component="th" scope="row">
                {formatX(x, xKind)}
              </TableCell>
              {data.series.map((series) => {
                const point = series.points.find((candidate) => candidate.x === x);
                return (
                  <TableCell key={series.id} align="right" sx={{ fontVariantNumeric: 'tabular-nums' }}>
                    {point && point.y !== null ? formatUnit(point.y, series.unit ?? 'count') : '—'}
                  </TableCell>
                );
              })}
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </TableContainer>
  );
}

/** Centers a loading, error or empty state in the fixed-height plot area. */
function StateSlot({ children, ...props }: { children: ReactNode; role?: string; 'aria-busy'?: boolean }) {
  return (
    <Stack spacing={1.5} sx={{ height: '100%', alignItems: 'center', justifyContent: 'center', textAlign: 'center' }} {...props}>
      {children}
    </Stack>
  );
}

/**
 * The card chrome every chart shares, as an outlined MUI `Card`: a `CardHeader` with the title,
 * subtitle, toolbar and a Chart/Table `ToggleButtonGroup`, then the legend and the plot area. Loading
 * (a `Skeleton`), fetching (dimmed), empty and error (an `Alert` with Retry) states keep the plot at a
 * fixed height, and the table view makes every value reachable without hover or color. Don't nest it
 * in another `Card`. Chart kinds render as its child and must sit inside it: `TimeSeriesChart`,
 * `CategoryBarChart`, `DonutChart` and `HeatmapChart` throw outside one. The frame assigns series colors from the
 * token palette by series id, so never pass colors. For a single
 * number, use `StatCard` instead of a chart.
 *
 * @summary Shared chart card: title, legend with series toggles, async states and a table view.
 * @import import { ChartFrame } from 'src/charts/ChartFrame';
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
  emptyMessage,
  height = 240,
  xKind = 'category',
  legend = true,
  scale,
  className,
}: ChartFrameProps) {
  const { t } = useTranslation();
  const id = useId();
  const { values } = useKilowattTheme();
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
      <StateSlot role="status" aria-busy>
        {/* The skeleton is a named progressbar, so the status region reads "Loading". */}
        <Skeleton
          variant="rounded"
          role="progressbar"
          aria-label={t('data.loading')}
          sx={{ width: '100%', height: '100%' }}
        />
      </StateSlot>
    );
  } else if (error) {
    body = (
      <StateSlot>
        <Alert
          severity="error"
          action={
            onRetry ? (
              <Button color="inherit" size="small" onClick={onRetry}>
                {t('data.retry')}
              </Button>
            ) : undefined
          }
        >
          {error}
        </Alert>
      </StateSlot>
    );
  } else if (empty) {
    body = (
      <StateSlot>
        <Typography variant="body2" color="text.secondary">
          {emptyMessage ?? t('chart.empty')}
        </Typography>
      </StateSlot>
    );
  } else if (view === 'table') {
    body = <ChartTable data={data} xKind={xKind} title={title} />;
  } else {
    body = children;
  }

  return (
    <FrameContext.Provider value={frame}>
      <Card
        component="figure"
        className={className}
        aria-labelledby={`${id}-title`}
        sx={{ m: 0, minWidth: 0, display: 'flex', flexDirection: 'column' }}
      >
        <CardHeader
          component="figcaption"
          title={title}
          subheader={subtitle}
          slotProps={{ title: { id: `${id}-title`, component: 'h4' }, action: { sx: { alignSelf: 'center', my: 0 } } }}
          action={
            <Stack direction="row" spacing={1} sx={{ alignItems: 'center' }}>
              {toolbar}
              <ToggleButtonGroup
                exclusive
                size="small"
                value={view}
                onChange={(_event, next: 'chart' | 'table' | null) => {
                  if (next) setView(next);
                }}
                aria-label={t('chart.viewAs')}
              >
                <ToggleButton value="chart">{t('chart.chart')}</ToggleButton>
                <ToggleButton value="table">{t('chart.table')}</ToggleButton>
              </ToggleButtonGroup>
            </Stack>
          }
        />
        <CardContent sx={{ display: 'flex', flexDirection: 'column', gap: 1.5, pt: 0, '&:last-child': { pb: 2 } }}>
          {view === 'chart' && legend ? (
            <ChartLegend items={legendItems} hidden={hidden} onToggle={toggleableLegend ? toggle : undefined} />
          ) : null}
          {view === 'chart' && scale ? <Box sx={{ display: 'flex', justifyContent: 'flex-end' }}>{scale}</Box> : null}
          <Box
            aria-busy={fetching || undefined}
            sx={{ position: 'relative', minHeight: 0, height, opacity: fetching ? 0.6 : 1, transition: 'opacity 150ms' }}
          >
            {body}
          </Box>
        </CardContent>
      </Card>
    </FrameContext.Provider>
  );
}
