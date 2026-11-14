import type { Meta, StoryObj } from '@storybook/react-vite';
import { expect, fn } from 'storybook/test';
import { HeatmapTable, type HeatmapTableCell, type HeatmapTableRow } from 'src/components/HeatmapTable';
import { monthNames, monthlyUseGrid, monthlyVariance, varianceBuildings } from 'src/fixtures/charts';
import { inCard } from 'src/stories/decorators';

const months = monthNames.slice(0, 10);
const open = fn();
/** The eight variance buildings, each row header a link that opens its building. */
const buildingRows: HeatmapTableRow[] = varianceBuildings.map((name) => ({
  key: name,
  label: name,
  onOpen: open,
  openLabel: `Open ${name}: sets it as your scope`,
}));
/** The variance grid as cells: a value where there is one, nothing where the chart's fixture has no data or is loading. */
const varianceCells: HeatmapTableCell[] = monthlyVariance.map(({ row, column, value }) => ({
  row,
  column,
  ...(value === undefined ? {} : { value }),
}));
/** Fourteen buildings, more than fit on one page: the eight and six more on the same months. */
const manyRows: HeatmapTableRow[] = [
  ...varianceBuildings,
  '1 Penn Plaza',
  '30 Rockefeller Plaza',
  '245 Park Avenue',
  '1 Bryant Park',
  '7 World Trade Center',
  '277 Park Avenue',
].map((name) => ({ key: name, label: name }));
const manyCells: HeatmapTableCell[] = manyRows.flatMap(({ key }, i) =>
  varianceCells
    .filter(({ row }) => row === varianceBuildings[i % varianceBuildings.length])
    .map((cell) => ({ ...cell, row: key })),
);

/**
 * Kilowatt's `HeatmapTable`: the `Heatmap` chart's grid as MUI's `Table`, for when every cell's number must show.
 * Each story shows it in a `Card` under a `CardHeader`, as it ships.
 */
const meta = {
  title: 'Data display/HeatmapTable',
  component: HeatmapTable,
  tags: ['!autodocs'],
  // The MUI components this page documents; docs.test.ts checks its MUI departures section against them.
  parameters: {
    muiComponents: [
      'Table',
      'TableContainer',
      'TableHead',
      'TableBody',
      'TableRow',
      'TableCell',
      'TablePagination',
      'Tooltip',
      'Link',
    ],
  },
  decorators: [inCard],
  args: { rows: buildingRows, columns: months, rowHeader: 'Property' },
} satisfies Meta<typeof HeatmapTable>;

export default meta;
type Story = StoryObj<typeof meta>;

/**
 * A comparison where neither side is worse, each building's use against the same month a year earlier:
 * `worse="none"` tints less in `chart.diverging.below`, brand blue, and more in `above`, parchment, each cell at an
 * opacity of its change over `cap`, fading to the card at no change. A month with nothing to compare is a dash.
 */
export const Comparison: Story = {
  parameters: { card: { title: 'Usage Tracking' } },
  args: {
    cells: varianceCells,
    unit: '%',
    cap: 30,
    worse: 'none',
    sides: ['Less than a year earlier', 'More than a year earlier'],
    label: 'Usage Tracking, 2026',
  },
  play: async ({ canvas, userEvent }) => {
    await expect(canvas.getByRole('table', { name: 'Usage Tracking, 2026' })).toBeVisible();
    await expect(canvas.getAllByRole('rowheader')).toHaveLength(varianceBuildings.length);
    await userEvent.click(canvas.getByRole('button', { name: 'Open 350 Park Avenue: sets it as your scope' }));
    await expect(open).toHaveBeenCalled();
    await expect(canvas.getByText(/Less than a year earlier/)).toBeVisible();
  },
};

/**
 * A deviation, where more energy than last year is worse: the default `worse="above"` tints the worse side in
 * `error` and the better in `chart.neutral`, so only the cells that need attention are in color.
 */
export const Deviation: Story = {
  parameters: { card: { title: 'Energy Use Against Last Year' } },
  args: {
    cells: varianceCells,
    unit: '%',
    cap: 15,
    sides: ['Less than 2025', 'More than 2025'],
    label: 'Energy use against 2025',
  },
  play: async ({ canvas }) => {
    await expect(canvas.getByRole('table', { name: 'Energy use against 2025' })).toBeVisible();
    await expect(canvas.getByText(/More than 2025 \(\+15% or more\)/)).toBeVisible();
  },
};

/** A magnitude, each building's use by month: `scale="sequential"`, `chart.sequential[3]` at each cell's place in the range, with the range at the legend's ends. */
export const Sequential: Story = {
  parameters: { card: { title: 'Energy Use by Month' } },
  args: {
    cells: monthlyUseGrid,
    unit: 'MWh',
    scale: 'sequential',
    label: 'Energy use by month, 2026',
  },
  play: async ({ canvas }) => {
    await expect(canvas.getByRole('table', { name: 'Energy use by month, 2026' })).toBeVisible();
  },
};

/** Past ten rows the table pages them (`usePagedRows`), and every cell keeps its strength against the whole set, not the page shown. */
export const Paged: Story = {
  parameters: { card: { title: 'Usage Tracking' } },
  args: {
    rows: manyRows,
    cells: manyCells,
    unit: '%',
    cap: 30,
    worse: 'none',
    sides: ['Less than a year earlier', 'More than a year earlier'],
    label: 'Usage Tracking, 2026, fourteen buildings',
  },
  play: async ({ canvas }) => {
    await expect(canvas.getAllByRole('rowheader')).toHaveLength(10);
    await expect(canvas.getByRole('button', { name: 'Go to next page' })).toBeVisible();
  },
};
