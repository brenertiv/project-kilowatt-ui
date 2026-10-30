import { useMemo, useRef, useState } from 'react';
import Button from '@mui/material/Button';
import CardActions from '@mui/material/CardActions';
import Checkbox from '@mui/material/Checkbox';
import Table from '@mui/material/Table';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import TableContainer from '@mui/material/TableContainer';
import TableFooter from '@mui/material/TableFooter';
import TableHead from '@mui/material/TableHead';
import TableRow from '@mui/material/TableRow';
import TableSortLabel from '@mui/material/TableSortLabel';
import Tooltip from '@mui/material/Tooltip';
import Typography from '@mui/material/Typography';
import type { SxProps, Theme } from '@mui/material/styles';
import { useInfiniteQuery } from '@tanstack/react-query';
import type { Meta, StoryObj } from '@storybook/react-vite';
import { expect, fn, userEvent, waitFor } from 'storybook/test';
import { fetchList } from 'src/api/queries';
import { fromQuery } from 'src/api/state';
import { AsyncContent } from 'src/components/AsyncContent';
import { HeaderLabel } from 'src/components/HeaderLabel';
import { usePagedRows } from 'src/components/usePagedRows';
import { monthlyUseGrid, monthlyVariance, monthNames, varianceBuildings } from 'src/fixtures/charts';
import { inCard } from 'src/stories/decorators';

type Building = { name: string; city: string; state: string; area: number; energy: number | null; cost: number | null; emissions: number | null };

/** Sample buildings. A building with no reading this period has `null`, shown as a dash, never 0. */
const buildings: Building[] = [
  { name: '120 Broadway', city: 'New York', state: 'NY', area: 1800000, energy: 61240, cost: 11023, emissions: 18.4 },
  { name: '1 World Trade Center', city: 'New York', state: 'NY', area: 3000000, energy: 98410, cost: 17714, emissions: 29.5 },
  { name: '350 Park Avenue', city: 'New York', state: 'NY', area: 570000, energy: 24875, cost: 4478, emissions: 7.5 },
  { name: '200 Vesey Street', city: 'New York', state: 'NY', area: 1500000, energy: 52930, cost: 9527, emissions: 15.9 },
  { name: '4 Times Square', city: 'New York', state: 'NY', area: 1600000, energy: null, cost: null, emissions: null },
  { name: '599 Lexington Avenue', city: 'New York', state: 'NY', area: 1000000, energy: 38120, cost: 6862, emissions: 11.4 },
  { name: '55 Water Street', city: 'New York', state: 'NY', area: 3800000, energy: 112650, cost: 20277, emissions: 33.8 },
  { name: '1000 Darrell Waltrip Drive', city: 'Lebanon', state: 'TN', area: 260000, energy: 14310, cost: 1860, emissions: 6.1 },
  { name: '1285 Avenue of the Americas', city: 'New York', state: 'NY', area: 1900000, energy: 66480, cost: 11966, emissions: 19.9 },
  { name: '11 Madison Avenue', city: 'New York', state: 'NY', area: 2300000, energy: 79205, cost: 14257, emissions: 23.8 },
  { name: '1633 Broadway', city: 'New York', state: 'NY', area: 2600000, energy: 87960, cost: 15833, emissions: 26.4 },
  { name: '300 Madison Avenue', city: 'New York', state: 'NY', area: 1100000, energy: 41760, cost: 7517, emissions: 12.5 },
];

const number = new Intl.NumberFormat('en-US');
const tonnes = new Intl.NumberFormat('en-US', { minimumFractionDigits: 1, maximumFractionDigits: 1 });
const intensity = new Intl.NumberFormat('en-US', { minimumFractionDigits: 3, maximumFractionDigits: 3 });
const dollars = new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 });

/** The cell text for a reading: the formatted number, or a dash when there isn't one. */
const reading = (value: number | null, format: Intl.NumberFormat = number) => (value === null ? '–' : format.format(value));

/**
 * MUI's `Table` with its `TableContainer`, `TableHead`, `TableBody`, `TableRow`, `TableCell`, `TableFooter`
 * and `TableSortLabel`, used as MUI documents them. Kilowatt has no wrapper: the theme's departures
 * (Foundations → MUI departures) are the only differences from stock MUI. Every story shows the table as it
 * ships, straight in an outlined `Card` under a `CardHeader`, with no `CardContent`.
 */
const meta = {
  title: 'Data display/Table',
  component: Table,
  tags: ['!autodocs'],
  // The MUI components this page documents; docs.test.ts checks its MUI departures section against them.
  parameters: {
    muiComponents: ['Table', 'TableContainer', 'TableHead', 'TableBody', 'TableRow', 'TableCell', 'TableFooter', 'TableSortLabel', 'TablePagination'],
    card: { title: 'Building Energy' },
  },
  decorators: [inCard],
} satisfies Meta<typeof Table>;

export default meta;
type Story = StoryObj<typeof meta>;

/** A read-only table: text left, numbers right, each header aligned with its column. A missing reading is a dash, never 0. */
export const Basic: Story = {
  render: () => (
    <TableContainer>
      <Table aria-label="Building energy">
        <TableHead>
          <TableRow>
            <TableCell>Property</TableCell>
            <TableCell>City</TableCell>
            <TableCell align="right">Energy (kWh)</TableCell>
            <TableCell align="right">Cost</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {buildings.slice(0, 5).map(({ name, city, energy, cost }) => (
            <TableRow key={name}>
              <TableCell component="th" scope="row">
                {name}
              </TableCell>
              <TableCell>{city}</TableCell>
              <TableCell align="right">{reading(energy)}</TableCell>
              <TableCell align="right">{reading(cost, dollars)}</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </TableContainer>
  ),
  play: async ({ canvas }) => {
    const table = canvas.getByRole('table', { name: 'Building energy' });
    await expect(table).toBeVisible();
    await expect(canvas.getByRole('rowheader', { name: '120 Broadway' })).toBeVisible();
    await expect(canvas.getAllByText('–')).toHaveLength(2);
  },
};

type SortKey = 'name' | 'energy';
const compare = (a: string | number | null, b: string | number | null) => {
  if (typeof a === 'string' && typeof b === 'string') return a.localeCompare(b);
  return Number(a) - Number(b);
};

function SortableTable() {
  const [orderBy, setOrderBy] = useState<SortKey>('name');
  const [order, setOrder] = useState<'asc' | 'desc'>('asc');
  const rows = useMemo(() => {
    const shown = buildings.slice(0, 5);
    const known = shown.filter((building) => building[orderBy] !== null);
    const missing = shown.filter((building) => building[orderBy] === null);
    known.sort((a, b) => compare(a[orderBy], b[orderBy]) * (order === 'asc' ? 1 : -1));
    // A building with no reading has no place in the order: it stays last either way.
    return [...known, ...missing];
  }, [orderBy, order]);
  const sortBy = (key: SortKey) => {
    setOrder(orderBy === key && order === 'asc' ? 'desc' : 'asc');
    setOrderBy(key);
  };
  return (
    <TableContainer>
      <Table aria-label="Building energy">
        <TableHead>
          <TableRow>
            <TableCell sortDirection={orderBy === 'name' ? order : false}>
              <TableSortLabel active={orderBy === 'name'} direction={orderBy === 'name' ? order : 'asc'} onClick={() => sortBy('name')}>
                Property
              </TableSortLabel>
            </TableCell>
            <TableCell align="right" sortDirection={orderBy === 'energy' ? order : false}>
              <TableSortLabel active={orderBy === 'energy'} direction={orderBy === 'energy' ? order : 'asc'} onClick={() => sortBy('energy')}>
                Energy (kWh)
              </TableSortLabel>
            </TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {rows.map(({ name, energy }) => (
            <TableRow key={name}>
              <TableCell component="th" scope="row">
                {name}
              </TableCell>
              <TableCell align="right">{reading(energy)}</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </TableContainer>
  );
}

/** Rows people compare: `TableSortLabel` in the header, and `sortDirection` on its cell so screen readers hear the order. */
export const Sortable: Story = {
  render: () => <SortableTable />,
  play: async ({ canvas }) => {
    const energy = canvas.getByRole('columnheader', { name: 'Energy (kWh)' });
    await expect(energy).not.toHaveAttribute('aria-sort');
    await userEvent.click(canvas.getByRole('button', { name: 'Energy (kWh)' }));
    await waitFor(() => expect(energy).toHaveAttribute('aria-sort', 'ascending'));
    await userEvent.click(canvas.getByRole('button', { name: 'Energy (kWh)' }));
    await waitFor(() => expect(energy).toHaveAttribute('aria-sort', 'descending'));
    await expect(canvas.getAllByRole('rowheader')[0]).toHaveTextContent('1 World Trade Center');
  },
};

function SelectableTable() {
  const rows = buildings.slice(0, 5);
  const [selected, setSelected] = useState<string[]>([]);
  const toggle = (name: string) =>
    setSelected((names) => (names.includes(name) ? names.filter((other) => other !== name) : [...names, name]));
  return (
    <TableContainer>
      <Table aria-label="Building energy">
        <TableHead>
          <TableRow>
            <TableCell padding="checkbox">
              <Checkbox
                slotProps={{ input: { 'aria-label': 'Select all buildings' } }}
                checked={selected.length === rows.length}
                indeterminate={selected.length > 0 && selected.length < rows.length}
                onChange={(event) => setSelected(event.target.checked ? rows.map(({ name }) => name) : [])}
              />
            </TableCell>
            <TableCell>Property</TableCell>
            <TableCell align="right">Energy (kWh)</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {rows.map(({ name, energy }) => (
            <TableRow key={name} selected={selected.includes(name)}>
              <TableCell padding="checkbox">
                <Checkbox slotProps={{ input: { 'aria-label': `Select ${name}` } }} checked={selected.includes(name)} onChange={() => toggle(name)} />
              </TableCell>
              <TableCell component="th" scope="row">
                {name}
              </TableCell>
              <TableCell align="right">{reading(energy)}</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </TableContainer>
  );
}

/** Rows chosen for a bulk action: a `Checkbox` in a `padding="checkbox"` cell, `selected` on the row. */
export const Selectable: Story = {
  render: () => <SelectableTable />,
  play: async ({ canvas }) => {
    await userEvent.click(canvas.getByRole('checkbox', { name: 'Select 350 Park Avenue' }));
    await expect(canvas.getByRole('checkbox', { name: 'Select 350 Park Avenue' })).toBeChecked();
    await expect(canvas.getByRole('checkbox', { name: 'Select all buildings' })).toHaveAttribute('data-indeterminate', 'true');
    await userEvent.click(canvas.getByRole('checkbox', { name: 'Select all buildings' }));
    await expect(canvas.getByRole('checkbox', { name: 'Select 120 Broadway' })).toBeChecked();
  },
};

/** A long list in a fixed space: `stickyHeader` on the table, a height on the container, which people can scroll by keyboard. */
export const StickyHeader: Story = {
  render: () => (
    <TableContainer role="region" aria-label="Building energy, scrollable" tabIndex={0} sx={{ maxHeight: (theme) => theme.spacing(40) }}>
      <Table stickyHeader aria-label="Building energy">
        <TableHead>
          <TableRow>
            <TableCell>Property</TableCell>
            <TableCell align="right">Energy (kWh)</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {buildings.map(({ name, energy }) => (
            <TableRow key={name}>
              <TableCell component="th" scope="row">
                {name}
              </TableCell>
              <TableCell align="right">{reading(energy)}</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </TableContainer>
  ),
  play: async ({ canvas }) => {
    const region = canvas.getByRole('region', { name: 'Building energy, scrollable' });
    await expect(region.scrollHeight).toBeGreaterThan(region.clientHeight);
    region.scrollTop = region.scrollHeight;
    await expect(canvas.getByRole('columnheader', { name: 'Property' })).toBeVisible();
  },
};

/** More columns than the card is wide: the container scrolls sideways, inside the card, and takes keyboard focus to do it. */
export const Wide: Story = {
  render: () => (
    <TableContainer role="region" aria-label="Building energy, scrollable" tabIndex={0}>
      <Table aria-label="Building energy" sx={{ '& .MuiTableCell-root': { whiteSpace: 'nowrap' } }}>
        <TableHead>
          <TableRow>
            <TableCell>Property</TableCell>
            <TableCell>City</TableCell>
            <TableCell>State</TableCell>
            <TableCell align="right">Area (sq ft)</TableCell>
            <TableCell align="right">Energy (kWh)</TableCell>
            <TableCell align="right">Cost</TableCell>
            <TableCell align="right">Emissions (tCO₂e)</TableCell>
            <TableCell align="right">Energy intensity (kWh/sq ft)</TableCell>
            <TableCell align="right">Cost intensity ($/sq ft)</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {buildings.slice(0, 5).map(({ name, city, state, area, energy, cost, emissions }) => (
            <TableRow key={name}>
              <TableCell component="th" scope="row">
                {name}
              </TableCell>
              <TableCell>{city}</TableCell>
              <TableCell>{state}</TableCell>
              <TableCell align="right">{number.format(area)}</TableCell>
              <TableCell align="right">{reading(energy)}</TableCell>
              <TableCell align="right">{reading(cost, dollars)}</TableCell>
              <TableCell align="right">{reading(emissions, tonnes)}</TableCell>
              <TableCell align="right">{reading(energy === null ? null : energy / area, intensity)}</TableCell>
              <TableCell align="right">{reading(cost === null ? null : cost / area, intensity)}</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </TableContainer>
  ),
  play: async ({ canvas }) => {
    const region = canvas.getByRole('region', { name: 'Building energy, scrollable' });
    await expect(region.scrollWidth).toBeGreaterThan(region.clientWidth);
    await expect(getComputedStyle(canvas.getByRole('rowheader', { name: '1 World Trade Center' })).getPropertyValue('text-wrap-mode')).toBe('nowrap');
    await userEvent.tab();
    await expect(region).toHaveFocus();
  },
};

const tintedBuildings = varianceBuildings.slice(5);
const tintedMonths = monthNames.slice(4, 10);
const signed = new Intl.NumberFormat('en-US', { signDisplay: 'exceptZero', minimumFractionDigits: 1, maximumFractionDigits: 1 });

/** The tints of steps 1 to 4, low enough that `text.primary` holds 4.5:1 on each in both schemes. */
const strengths = [0.12, 0.22, 0.33, 0.44];
/** Under this distance from 0 a change is no change: noise, not a signal. */
const neutral = 1;

/** A cell's tint: `action.hover` under `neutral`, then `success` under 0 or `error` over it, in four equal steps up to `cap`. */
function changeTint(change: number, cap: number): SxProps<Theme> {
  if (Math.abs(change) < neutral) return { bgcolor: 'action.hover' };
  const step = Math.min(4, Math.ceil((Math.abs(change) / cap) * 4));
  const intent = change < 0 ? 'success' : 'error';
  return { bgcolor: (theme) => `rgba(${theme.vars!.palette[intent].mainChannel} / ${strengths[step - 1]})` };
}

/** Change on a year earlier, a row per building and a column per month. `cap` is where the tint stops growing, in percent. */
function VarianceTable({ cap }: { cap: number }) {
  return (
    <>
      <TableContainer role="region" aria-label="Energy use change, scrollable" tabIndex={0}>
        <Table aria-label="Energy use change on a year earlier" sx={{ '& .MuiTableCell-root': { whiteSpace: 'nowrap' } }}>
          <TableHead>
            <TableRow>
              <TableCell>Property</TableCell>
              {tintedMonths.map((month) => (
                <TableCell key={month} align="right">
                  {month}
                </TableCell>
              ))}
            </TableRow>
          </TableHead>
          <TableBody>
            {tintedBuildings.map((name) => (
              <TableRow key={name}>
                <TableCell component="th" scope="row">
                  {name}
                </TableCell>
                {tintedMonths.map((month) => {
                  const change = monthlyVariance.find(({ row, column }) => row === name && column === month)?.value;
                  return (
                    <Tooltip key={month} title={`${name}, ${month}: ${change === undefined ? 'nothing to compare' : `${signed.format(change)}% on a year earlier`}`}>
                      <TableCell align="right" sx={change === undefined ? undefined : changeTint(change, cap)}>
                        {change === undefined ? '–' : `${signed.format(change)}%`}
                      </TableCell>
                    </Tooltip>
                  );
                })}
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>
      <CardActions>
        <Typography variant="caption" sx={{ color: 'text.secondary', px: 1 }}>
          {`Green is less than a year earlier, red more, strongest at ${cap}% or further. Under ${neutral}% is no change.`}
        </Typography>
      </CardActions>
    </>
  );
}

/** Every number must show: a cell tinted by its change, in `success` and `error` at four strengths up to a cap, with `action.hover` under 1%. */
export const TintedCells: Story = {
  parameters: { card: { title: 'Change on a Year Earlier' } },
  render: () => <VarianceTable cap={20} />,
  play: async ({ canvas }) => {
    await expect(canvas.getAllByRole('rowheader')).toHaveLength(tintedBuildings.length);
    await expect(canvas.getByRole('table', { name: 'Energy use change on a year earlier' })).toBeVisible();
  },
};

/** The text on each `chart.sequential` step, nearest the surface first: the role that holds 4.5:1 on it in both schemes. */
const stepText = ['text.primary', 'text.primary', 'common.black', 'background.level0', 'background.level0'];
const useRows = tintedBuildings.map((name) => tintedMonths.map((month) => monthlyUseGrid.find(({ row, column }) => row === name && column === month)!.value));
const lowestUse = Math.min(...useRows.flat());
const stepWidth = (Math.max(...useRows.flat()) - lowestUse) / stepText.length;

/** A value with no midpoint: `chart.sequential` in equal-width steps, and the line under the table says how wide a step is. */
export const TintedByMagnitude: Story = {
  parameters: { card: { title: 'Energy Use' } },
  render: () => (
    <>
      <TableContainer role="region" aria-label="Energy use, scrollable" tabIndex={0}>
        <Table aria-label="Energy use by month" sx={{ '& .MuiTableCell-root': { whiteSpace: 'nowrap' } }}>
          <TableHead>
            <TableRow>
              <TableCell>Property</TableCell>
              {tintedMonths.map((month) => (
                <TableCell key={month} align="right">
                  {`${month} (MWh)`}
                </TableCell>
              ))}
            </TableRow>
          </TableHead>
          <TableBody>
            {tintedBuildings.map((name, row) => (
              <TableRow key={name}>
                <TableCell component="th" scope="row">
                  {name}
                </TableCell>
                {useRows[row].map((value, month) => {
                  const step = Math.min(stepText.length - 1, Math.floor((value - lowestUse) / stepWidth));
                  return (
                    <Tooltip key={tintedMonths[month]} title={`${name}, ${tintedMonths[month]}: ${number.format(value)} MWh`}>
                      <TableCell align="right" sx={{ bgcolor: (theme) => theme.vars!.palette.chart.sequential[step], color: stepText[step] }}>
                        {number.format(value)}
                      </TableCell>
                    </Tooltip>
                  );
                })}
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>
      <CardActions>
        <Typography variant="caption" sx={{ color: 'text.secondary', px: 1 }}>
          {`Each step is ${number.format(Math.round(stepWidth))} MWh.`}
        </Typography>
      </CardActions>
    </>
  ),
  play: async ({ canvas }) => {
    await expect(canvas.getByRole('table', { name: 'Energy use by month' })).toBeVisible();
  },
};

const totalEnergy = buildings.slice(0, 5).reduce((sum, { energy }) => sum + (energy ?? 0), 0);
const totalCost = buildings.slice(0, 5).reduce((sum, { cost }) => sum + (cost ?? 0), 0);

/** A sum under the rows: `TableFooter` with `variant="head"` cells, so totals read at full size. The last body row keeps its line. */
export const Totals: Story = {
  render: () => (
    <TableContainer>
      <Table aria-label="Building energy">
        <TableHead>
          <TableRow>
            <TableCell>Property</TableCell>
            <TableCell align="right">Energy (kWh)</TableCell>
            <TableCell align="right">Cost</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {buildings.slice(0, 5).map(({ name, energy, cost }) => (
            <TableRow key={name}>
              <TableCell component="th" scope="row">
                {name}
              </TableCell>
              <TableCell align="right">{reading(energy)}</TableCell>
              <TableCell align="right">{reading(cost, dollars)}</TableCell>
            </TableRow>
          ))}
        </TableBody>
        <TableFooter>
          <TableRow>
            <TableCell variant="head" component="th" scope="row">
              Total
            </TableCell>
            <TableCell variant="head" align="right">
              {number.format(totalEnergy)}
            </TableCell>
            <TableCell variant="head" align="right">
              {dollars.format(totalCost)}
            </TableCell>
          </TableRow>
        </TableFooter>
      </Table>
    </TableContainer>
  ),
  play: async ({ canvas }) => {
    await expect(canvas.getByRole('rowheader', { name: 'Total' })).toBeVisible();
    await expect(canvas.getByRole('cell', { name: number.format(totalEnergy) })).toBeVisible();
  },
};

/** Every row in hand: `usePagedRows` gives the page's rows and the pager, and each header sits in `HeaderLabel`. */
function PagedTable() {
  const { shown, pager } = usePagedRows(buildings);
  return (
    <>
      <TableContainer>
        <Table aria-label="Building energy">
          <TableHead>
            <TableRow>
              <TableCell>
                <HeaderLabel>Property</HeaderLabel>
              </TableCell>
              <TableCell align="right">
                <HeaderLabel>Energy (kWh)</HeaderLabel>
              </TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {shown.map(({ name, energy }) => (
              <TableRow key={name}>
                <TableCell component="th" scope="row">
                  {name}
                </TableCell>
                <TableCell align="right">{reading(energy)}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>
      {pager}
    </>
  );
}

/** Rows already in hand: 10, 25 or 50 a page, the pager shown only past ten rows, and each header on one line in `HeaderLabel`. */
export const Paged: Story = {
  render: () => <PagedTable />,
  play: async ({ canvas }) => {
    await expect(canvas.getAllByRole('rowheader')).toHaveLength(10);
    await userEvent.click(canvas.getByRole('button', { name: /next page/i }));
    await waitFor(() => expect(canvas.getAllByRole('rowheader')).toHaveLength(2));
  },
};

function LoadMoreTable() {
  const region = useRef<HTMLDivElement>(null);
  const query = useInfiniteQuery({
    queryKey: ['location', 'buildings'],
    queryFn: ({ pageParam }) => fetchList('location', { parent_location_id__isnull: true, ordering: 'name', page_size: 5, cursor: pageParam }),
    initialPageParam: undefined as string | undefined,
    getNextPageParam: ({ next }) => (next ? (new URL(next, window.location.origin).searchParams.get('cursor') ?? undefined) : undefined),
  });
  const rows = query.data?.pages.flatMap(({ results }) => results) ?? [];
  const state = fromQuery(query, { isEmpty: ({ pages }) => pages[0].results.length === 0 });
  const loadMore = async () => {
    const { hasNextPage } = await query.fetchNextPage();
    // The button goes with the last page; keep keyboard focus in the table rather than losing it.
    if (!hasNextPage) region.current?.focus();
  };
  return (
    <AsyncContent state={state} height={320} loadingLabel="Loading buildings" emptyText="No buildings in this portfolio.">
      <TableContainer ref={region} role="region" aria-label="Buildings, scrollable" tabIndex={0}>
        <Table aria-label="Buildings">
          <TableHead>
            <TableRow>
              <TableCell>Property</TableCell>
              <TableCell>City</TableCell>
              <TableCell>State</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {rows.map((building) => (
              <TableRow key={building.id}>
                <TableCell component="th" scope="row">
                  {building.name}
                </TableCell>
                <TableCell>{building.city ?? '–'}</TableCell>
                <TableCell>{building.state ?? '–'}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>
      <CardActions sx={{ justifyContent: 'space-between' }}>
        <Typography variant="body2" role="status" sx={{ color: 'text.secondary', px: 1 }}>
          Showing {number.format(rows.length)} buildings
        </Typography>
        {query.hasNextPage && (
          <Button loading={query.isFetchingNextPage} onClick={loadMore}>
            Load More
          </Button>
        )}
      </CardActions>
    </AsyncContent>
  );
}

/** A cursor-paged list: rows add up with `useInfiniteQuery`, the running count is announced, and focus stays in the table at the end. */
export const LoadMore: Story = {
  render: () => <LoadMoreTable />,
  play: async ({ canvas }) => {
    const button = await canvas.findByRole('button', { name: 'Load More' });
    const region = canvas.getByRole('region', { name: 'Buildings, scrollable' });
    await expect(canvas.getByRole('status')).toHaveTextContent('Showing 5 buildings');
    await userEvent.click(button);
    await waitFor(() => expect(canvas.getByRole('status')).not.toHaveTextContent('Showing 5 buildings'));
    await waitFor(() => expect(canvas.getAllByRole('row').length).toBeGreaterThan(6));
    await waitFor(() => expect(region).toHaveFocus());
    await expect(canvas.getByRole('region', { name: 'Buildings, scrollable' })).toBe(region);
  },
};

/** First load: `AsyncContent` holds the table's space with a skeleton, named for screen readers. */
export const Loading: Story = {
  render: () => (
    <AsyncContent state={{ status: 'loading' }} height={320} loadingLabel="Loading buildings">
      <Table aria-label="Buildings" />
    </AsyncContent>
  ),
  play: async ({ canvas }) => {
    await expect(canvas.getByRole('progressbar', { name: 'Loading buildings' })).toBeVisible();
  },
};

/** Nothing to list: `AsyncContent` says what has no data, in place of a table of empty rows. */
export const Empty: Story = {
  render: () => (
    <AsyncContent state={{ status: 'empty' }} height={320} emptyText="No buildings in this portfolio.">
      <Table aria-label="Buildings" />
    </AsyncContent>
  ),
  play: async ({ canvas }) => {
    await expect(canvas.getByText('No buildings in this portfolio.')).toBeVisible();
  },
};

/** The request failed: `AsyncContent` shows the message and Retry in the table's space. */
export const Failed: Story = {
  render: () => (
    <AsyncContent state={{ status: 'error', error: 'The buildings didn’t load.', onRetry: fn() }} height={320}>
      <Table aria-label="Buildings" />
    </AsyncContent>
  ),
  play: async ({ canvas }) => {
    await expect(canvas.getByRole('alert')).toHaveTextContent('The buildings didn’t load.');
    await expect(canvas.getByRole('button', { name: 'Retry' })).toBeVisible();
  },
};
