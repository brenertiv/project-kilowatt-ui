import { useMemo } from 'react';
import Box from '@mui/material/Box';
import Link from '@mui/material/Link';
import Table from '@mui/material/Table';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import TableContainer from '@mui/material/TableContainer';
import TableHead from '@mui/material/TableHead';
import TableRow from '@mui/material/TableRow';
import Tooltip from '@mui/material/Tooltip';
import Typography from '@mui/material/Typography';
import { useTheme, type CssVarsTheme, type Theme } from '@mui/material/styles';
import { heatColors, heatEnd, type HeatEnd, type WorseSide } from '../charts/deviation';
import type { ColorScheme } from '../mui/departures';
import { useResolvedScheme } from '../mui/useResolvedScheme';
import { HeaderLabel } from './HeaderLabel';
import { usePagedRows } from './usePagedRows';

/** One row: its key, the label in its header cell, and what opening it does. */
export type HeatmapTableRow = {
  /** The key the cells name in `row`. */
  key: string;
  /** The row header: a building, a meter, a utility. A long one truncates; every cell's tooltip names it in full. */
  label: string;
  /** What the row header does when it's a link: opening the building, say. Leave it out for plain text. */
  onOpen?: () => void;
  /** The link's accessible name, where the label alone doesn't say what opening does: `Open 350 Park Avenue: sets it as your scope`. Default `Open <label>`. */
  openLabel?: string;
};

/** One cell: where it sits, its value and what it says in full. */
export type HeatmapTableCell = {
  /** The row it sits in, one of `rows`' keys. */
  row: string;
  /** The column it sits in, one of `columns`. */
  column: string;
  /** The value, in `unit`. Leave it out for a cell with nothing to show: it stays a dash on the bare surface. */
  value?: number;
  /** The cell's full statement, for its tooltip: `350 Park Avenue, Jan 2026: 41,200 kWh, +12.3% on Jan 2025`. Default: the row, the column and the formatted value, or "No data". */
  detail?: string;
};

export type HeatmapTableProps = {
  /** The rows, top to bottom. Past ten they're paged (`usePagedRows`). */
  rows: HeatmapTableRow[];
  /** The column labels, left to right: months, hours. Each is a column's key too, so keep them distinct (`Jan 25`, `Jan 26` across years). */
  columns: string[];
  /** The cells, in any order; a row and column with no cell show a dash. */
  cells: HeatmapTableCell[];
  /** How values map to color (Rules → Charts → A heatmap cell is an overlay). `'diverging'`: a distance from a midpoint of 0, stronger the further from 0, full from `cap` on. `'sequential'`: a magnitude, `chart.sequential[3]` at the cell's place between the lowest and highest value. Default `'diverging'`. */
  scale?: 'diverging' | 'sequential';
  /** For a diverging scale, which side of 0 is worse: `'above'` where less is better (energy, cost, emissions) and `'below'` where more is (occupancy, data coverage), the worse side in `error` and the better in `chart.neutral`; or `'none'` for a comparison where neither side is worse (this month against a year earlier), on `chart.diverging`, brand blue below and parchment above. Default `'above'`. */
  worse?: WorseSide | 'none';
  /** For a diverging scale, the distance from 0 at which a cell takes the full color; further values take it too. Set it to the change that matters. Default: the largest distance in `cells`. */
  cap?: number;
  /** The unit of the values, in the cells, tooltips and legend: `%`, `kWh`. */
  unit: string;
  /** For a diverging scale, what each side means, for the legend: `['Less than last year', 'More than last year']`. Default `['Below', 'Above']`. */
  sides?: [string, string];
  /** The first column's header: `Property`, `Meter`. */
  rowHeader: string;
  /** The table's accessible name, with what it shows and when: `Usage Tracking, year to date`. */
  label: string;
  /** How a cell writes its value. Default: `Intl` with one decimal at most and the unit, signed on a diverging scale. */
  format?: (value: number) => string;
  /** What the legend calls a cell with no value. Default `'No data'`. */
  missing?: string;
};

/** The dash a cell with no value shows (Rules → Charts → No change isn't no data). */
const dash = '–';

/** The scale's ends over the card surface in one color scheme, each with the opacity where its text flips. */
type HeatEnds = { below: HeatEnd; above: HeatEnd; error: HeatEnd; neutral: HeatEnd; magnitude: HeatEnd };

/**
 * The ends from the scheme's own palette: under CSS variables `theme.palette` is always the light scheme's, so
 * the dark scheme's ends come from `theme.colorSchemes.dark`. The surface is the card's, `background.level3`.
 */
function heatEnds(theme: Theme, scheme: ColorScheme): HeatEnds {
  const { palette } = (theme as Theme & CssVarsTheme).colorSchemes[scheme]!;
  const end = (color: string) =>
    heatEnd(color, palette.background.level3, palette.text.primary, palette.chart.diverging.contrastText);
  return {
    below: end(palette.chart.diverging.below),
    above: end(palette.chart.diverging.above),
    error: end(palette.error.main),
    neutral: end(palette.chart.neutral),
    magnitude: end(palette.chart.sequential[3]),
  };
}

/** A number with its unit: `%` sits against the number, every other unit after a space. */
const withUnit = (number: string, unit: string) => (unit === '%' ? `${number}%` : `${number} ${unit}`);

/**
 * A heatmap as a table, for when every cell's number must show: a row per building or meter, a column per month,
 * each cell its value tinted by it. It's the `Heatmap` chart's grid in MUI's `Table`, so the numbers, links, real
 * rows and headers are there to read and print, and the grid scrolls sideways inside its card with the row headers
 * held in place. Every cell is an overlay: one end color over the card at an opacity of its value, continuous,
 * full from the cap and fading to the bare card at no change (`heatColors`, Rules → Charts). A diverging scale
 * shows a distance from 0, the worse side in `error` and the better in `chart.neutral`, or with `worse="none"` a
 * comparison on `chart.diverging`; a sequential scale shows magnitude on `chart.sequential[3]` against the range.
 * Text stays `text.primary` while it holds 4.5:1 over the tint, then takes `chart.diverging.contrastText`. A cell
 * with no value is a dash on the bare card. Every cell has a tooltip with its full statement, which is also its
 * accessible name; a legend under the grid draws the scale as a gradient with the cap or the range at its ends;
 * past ten rows a pager follows. It sits straight in an outlined `Card` under a `CardHeader`.
 *
 * @summary A heatmap as a table, every cell its number tinted by its value, with a gradient legend and paging.
 * @import import { HeatmapTable } from 'src/components/HeatmapTable';
 */
export function HeatmapTable({
  rows,
  columns,
  cells,
  scale = 'diverging',
  worse = 'above',
  cap,
  unit,
  sides = ['Below', 'Above'],
  rowHeader,
  label,
  format,
  missing = 'No data',
}: HeatmapTableProps) {
  const theme = useTheme();
  const scheme = useResolvedScheme() ?? 'light';
  const ends = useMemo(() => heatEnds(theme, scheme), [theme, scheme]);
  const byKey = useMemo(() => new Map(cells.map((cell) => [`${cell.row}\u0000${cell.column}`, cell])), [cells]);
  // Across every row, not the page shown, so a cell keeps its strength as the pager moves.
  const values = useMemo(() => cells.flatMap(({ value }) => (value === undefined ? [] : [value])), [cells]);
  const limit = cap ?? Math.max(1, ...values.map(Math.abs));
  const [low, high] = [Math.min(...values), Math.max(...values)];
  const { shown, pager } = usePagedRows(rows);

  const number = useMemo(
    () =>
      new Intl.NumberFormat(undefined, {
        maximumFractionDigits: 1,
        signDisplay: scale === 'diverging' ? 'exceptZero' : 'auto',
      }),
    [scale],
  );
  const write = format ?? ((value: number) => withUnit(number.format(value), unit));

  // The end a value takes, and how strongly: its distance from 0 over the cap, or its place in the range.
  const tint = (value: number): { end: HeatEnd; strength: number } => {
    if (scale === 'sequential')
      return { end: ends.magnitude, strength: high === low ? 0 : (value - low) / (high - low) };
    const strength = Math.abs(value) / limit;
    if (worse === 'none') return { end: value < 0 ? ends.below : ends.above, strength };
    const isWorse = worse === 'above' ? value > 0 : value < 0;
    return { end: isWorse ? ends.error : ends.neutral, strength };
  };
  // The cell's overlay: the end color at the value's opacity, transparent so a hovered row shows through and no
  // change is the bare card; the text flips to the contrast color where `text.primary` no longer holds 4.5:1.
  const overlay = (value: number) => {
    const { end, strength } = tint(value);
    const { opacity, text } = heatColors(end, strength);
    return {
      bgcolor: `color-mix(in srgb, ${end.color} ${Math.round(opacity * 100)}%, transparent)`,
      ...(text === 'contrast' && { color: 'chart.diverging.contrastText' }),
    };
  };

  // The legend's ends, left (below 0) to right (above 0), as the cells draw them.
  const legendEnds = (): [HeatEnd, HeatEnd] => {
    if (worse === 'none') return [ends.below, ends.above];
    return worse === 'above' ? [ends.neutral, ends.error] : [ends.error, ends.neutral];
  };
  const caption = (text: string) => (
    <Typography variant="caption" sx={{ color: 'text.secondary' }}>
      {text}
    </Typography>
  );
  const gradient = (stops: string) => (
    <Box
      aria-hidden
      sx={(t) => ({
        width: t.spacing(18),
        height: t.spacing(1.5),
        borderRadius: 0.5,
        background: `linear-gradient(to right, ${stops})`,
      })}
    />
  );
  // The legend's ends: one decimal for a small number (a percent), none past 100, where a fraction is noise (a use in kWh).
  const plain = (value: number) =>
    withUnit(
      new Intl.NumberFormat(undefined, { maximumFractionDigits: Math.abs(value) >= 100 ? 0 : 1 }).format(value),
      unit,
    );

  return (
    <>
      <TableContainer role="region" aria-label={`${label}, scrollable`} tabIndex={0}>
        <Table aria-label={label} sx={{ '& .MuiTableCell-root': { whiteSpace: 'nowrap' } }}>
          <TableHead>
            <TableRow>
              {/* The row headers hold their place as the grid scrolls, on the card surface so the cells pass under them. */}
              <TableCell sx={{ position: 'sticky', left: 0, zIndex: 1, bgcolor: 'background.level3' }}>
                <HeaderLabel>{rowHeader}</HeaderLabel>
              </TableCell>
              {columns.map((column) => (
                <TableCell key={column} align="right" sx={{ px: 1 }}>
                  <HeaderLabel>{column}</HeaderLabel>
                </TableCell>
              ))}
            </TableRow>
          </TableHead>
          <TableBody>
            {shown.map((row) => (
              <TableRow key={row.key}>
                <TableCell
                  component="th"
                  scope="row"
                  sx={{
                    position: 'sticky',
                    left: 0,
                    zIndex: 1,
                    bgcolor: 'background.level3',
                    maxWidth: { xs: '40vw', sm: '30ch' },
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                  }}
                >
                  {row.onOpen ? (
                    <Link
                      component="button"
                      onClick={row.onOpen}
                      aria-label={row.openLabel ?? `Open ${row.label}`}
                      sx={{
                        display: 'block',
                        maxWidth: '100%',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        textAlign: 'start',
                      }}
                    >
                      {row.label}
                    </Link>
                  ) : (
                    row.label
                  )}
                </TableCell>
                {columns.map((column) => {
                  const cell = byKey.get(`${row.key}\u0000${column}`);
                  const value = cell?.value;
                  const detail =
                    cell?.detail ?? `${row.label}, ${column}: ${value === undefined ? missing : write(value)}`;
                  return (
                    <Tooltip key={column} title={detail}>
                      <TableCell align="right" sx={{ px: 1, ...(value === undefined ? {} : overlay(value)) }}>
                        {value === undefined ? dash : write(value)}
                      </TableCell>
                    </Tooltip>
                  );
                })}
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>
      {/* The legend: the scale as the cells draw it, an end color fading to the card, with its ends in words. */}
      <Box sx={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: 1, p: 2 }}>
        {scale === 'diverging' ? (
          <>
            {caption(`${sides[0]} (−${plain(limit)} or more)`)}
            {gradient(`${legendEnds()[0].color}, transparent 50%, ${legendEnds()[1].color}`)}
            {caption(`${sides[1]} (+${plain(limit)} or more)`)}
          </>
        ) : (
          <>
            {caption(values.length ? plain(low) : dash)}
            {gradient(`transparent, ${ends.magnitude.color}`)}
            {caption(values.length ? plain(high) : dash)}
          </>
        )}
        <Box sx={{ ml: 2 }}>{caption(`${dash} ${missing}`)}</Box>
      </Box>
      {pager}
    </>
  );
}
