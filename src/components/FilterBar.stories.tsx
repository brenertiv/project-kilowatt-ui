import { useState, type ReactNode } from 'react';
import Box from '@mui/material/Box';
import MenuItem from '@mui/material/MenuItem';
import TextField from '@mui/material/TextField';
import type { Meta, StoryObj } from '@storybook/react-vite';
import { expect, screen, waitFor, within } from 'storybook/test';
import { useContentWidth } from 'src/components/contentWidth';
import { FilterBar, filterWidth, type FilterBarView } from 'src/components/FilterBar';
import type { Period, PeriodPreset } from 'src/components/PeriodPicker';

const presets: PeriodPreset[] = [
  { id: 'ytd', label: 'Year to date', from: '2026-01', to: '2026-09' },
  { id: 'last-12', label: 'Last 12 months', from: '2025-10', to: '2026-09' },
];
const views: FilterBarView<'cards' | 'table'>[] = [
  { value: 'cards', label: 'Cards', icon: 'grid_view' },
  { value: 'table', label: 'Table', icon: 'table_rows' },
];

/** Measures its box as AppShell measures `main`, so a story shows the bar at a page's width whatever the window is. */
function AtPageWidth({ width, children }: { width: number; children: ReactNode }) {
  const { measure, provide } = useContentWidth<HTMLDivElement>();
  return (
    <Box ref={measure} sx={{ width, maxWidth: '100%' }}>
      {provide(children)}
    </Box>
  );
}

type Parts = { filters?: boolean; period?: boolean; view?: boolean };

/** A page's bar, holding its choices in state as a page would. Two filters, set small with the rest of the bar. */
function Bar({ filters, period, view }: Parts) {
  const [type, setType] = useState('all');
  const [utility, setUtility] = useState('all');
  const [chosen, setChosen] = useState<Period>('ytd');
  const [layout, setLayout] = useState<'cards' | 'table'>('cards');
  const select = (label: string, value: string, onChange: (next: string) => void, options: string[], fullWidth: boolean) => (
    <TextField select size="small" label={label} value={value} onChange={(event) => onChange(event.target.value)} fullWidth={fullWidth} sx={fullWidth ? undefined : { minWidth: filterWidth }}>
      <MenuItem value="all">All</MenuItem>
      {options.map((option) => (
        <MenuItem key={option} value={option}>
          {option}
        </MenuItem>
      ))}
    </TextField>
  );
  return (
    <FilterBar
      filters={
        filters
          ? {
              count: 2,
              set: [type, utility].filter((value) => value !== 'all').length,
              render: (fullWidth) => (
                <>
                  {select('Property Type', type, setType, ['Office', 'Industrial'], fullWidth)}
                  {select('Utility', utility, setUtility, ['Electricity', 'Natural gas'], fullWidth)}
                </>
              ),
              onClear: () => {
                setType('all');
                setUtility('all');
              },
            }
          : undefined
      }
      period={period ? { presets, value: chosen, onChange: setChosen, firstMonth: '2024-01', lastMonth: '2026-09' } : undefined}
      view={view ? { value: layout, options: views, onChange: setLayout } : undefined}
    />
  );
}

/**
 * Kilowatt's `FilterBar`: the one filters bar every page uses. Each story sets the bar at a page's width
 * (`useContentWidth`, which AppShell does for `main`), since it folds by the page's width, not the window's.
 */
const meta = {
  title: 'Inputs/FilterBar',
  component: FilterBar,
  tags: ['!autodocs'],
  // The MUI components this page documents; docs.test.ts checks its MUI departures section against them.
  parameters: { muiComponents: ['TextField', 'IconButton', 'Menu', 'MenuItem', 'Drawer', 'Tooltip', 'Button'] },
} satisfies Meta<typeof FilterBar>;

export default meta;
type Story = StoryObj<typeof meta>;

/** Filters on the left, the period on the right, the view to the right of the period, all on one row, every control small together. */
export const Full: Story = {
  render: () => (
    <AtPageWidth width={880}>
      <Bar filters period view />
    </AtPageWidth>
  ),
  play: async ({ canvas }) => {
    await expect(canvas.getByRole('group', { name: 'Filters' })).toBeVisible();
    await expect(canvas.getByRole('combobox', { name: 'Property Type' })).toBeVisible();
    await expect(canvas.queryByRole('textbox', { name: 'Filters' })).toBeNull();
  },
};

/** Filters alone stay on the left. */
export const FiltersOnly: Story = {
  name: 'Filters only',
  render: () => (
    <AtPageWidth width={880}>
      <Bar filters />
    </AtPageWidth>
  ),
};

/** The period and the view alone stay on the right; with no view, the period sits at the right. */
export const PeriodAndView: Story = {
  name: 'Period and view',
  render: () => (
    <AtPageWidth width={880}>
      <Bar period view />
    </AtPageWidth>
  ),
};

/** The view is an icon button showing the chosen view, which opens a menu of every view; a menu rather than a toggle, so there can be more than two. */
export const View: Story = {
  render: () => (
    <AtPageWidth width={880}>
      <Bar period view />
    </AtPageWidth>
  ),
  play: async ({ canvas, userEvent }) => {
    await userEvent.click(canvas.getByRole('button', { name: 'View: Cards' }));
    await userEvent.click(await screen.findByRole('menuitem', { name: 'Table' }));
    await expect(await canvas.findByRole('button', { name: 'View: Table' })).toBeVisible();
  },
};

/** Where the bar no longer fits the page, the filters fold into one Filters field saying how many are set; it opens them in a bottom sheet with Clear All and Done. */
export const Folded: Story = {
  render: () => (
    <AtPageWidth width={560}>
      <Bar filters period view />
    </AtPageWidth>
  ),
  play: async ({ canvas, userEvent }) => {
    const field = canvas.getByRole('textbox', { name: 'Filters' });
    await expect(field).toHaveValue('None');
    await userEvent.click(field);
    const sheet = await screen.findByRole('dialog', { name: 'Filters' });
    await userEvent.click(within(sheet).getByRole('combobox', { name: 'Utility' }));
    await userEvent.click(await screen.findByRole('option', { name: 'Electricity' }));
    await expect(field).toHaveValue('1 set');
    await userEvent.click(within(sheet).getByRole('button', { name: 'Clear All' }));
    await expect(field).toHaveValue('None');
    await userEvent.click(within(sheet).getByRole('button', { name: 'Done' }));
    await waitFor(() => expect(screen.queryByRole('dialog', { name: 'Filters' })).toBeNull());
  },
};

/** Narrower still, the period takes a row of its own at full width, and the Filters field grows into the row under it. */
export const PeriodOwnRow: Story = {
  name: 'Period on its own row',
  render: () => (
    <AtPageWidth width={343}>
      <Bar filters period view />
    </AtPageWidth>
  ),
};
