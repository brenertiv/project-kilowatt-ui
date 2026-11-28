import { useState, type ReactNode } from 'react';
import Box from '@mui/material/Box';
import InputAdornment from '@mui/material/InputAdornment';
import MenuItem from '@mui/material/MenuItem';
import TextField from '@mui/material/TextField';
import type { Meta, StoryObj } from '@storybook/react-vite';
import { expect, screen, waitFor, within } from 'storybook/test';
import { useContentWidth } from 'src/components/contentWidth';
import { FilterBar, filterWidth, type FilterBarView } from 'src/components/FilterBar';
import type { Period, PeriodPreset } from 'src/components/PeriodPicker';
import { Icon } from 'src/icons';

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

type Parts = { filters?: boolean; period?: boolean; view?: boolean; fold?: boolean; search?: boolean };

/** A page's bar, holding its choices in state as a page would. Two filters, set small with the rest of the bar. */
function Bar({ filters, period, view, fold, search }: Parts) {
  const [query, setQuery] = useState('');
  const [type, setType] = useState('all');
  const [utility, setUtility] = useState('all');
  const [chosen, setChosen] = useState<Period>('ytd');
  const [layout, setLayout] = useState<'cards' | 'table'>('cards');
  const select = (label: string, value: string, onChange: (next: string) => void, options: string[], fullWidth: boolean) => (
    <TextField select label={label} value={value} onChange={(event) => onChange(event.target.value)} fullWidth={fullWidth} sx={fullWidth ? undefined : { minWidth: filterWidth }}>
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
      fold={fold}
      before={
        search ? (
          <TextField
            fullWidth
            placeholder="Search"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            slotProps={{
              htmlInput: { 'aria-label': 'Search' },
              input: {
                startAdornment: (
                  <InputAdornment position="start">
                    <Icon name="search" />
                  </InputAdornment>
                ),
              },
            }}
          />
        ) : undefined
      }
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
  parameters: { muiComponents: ['TextField', 'IconButton', 'Menu', 'MenuItem', 'Popover', 'Drawer', 'Tooltip', 'Button'] },
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
    await expect(canvas.queryByRole('combobox', { name: 'Filters' })).toBeNull();
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

/** Where the bar no longer fits the page, the filters fold into one Filters field saying how many are set; from `sm` up it opens them in a popover under the field, two to a row, with Clear All and Done. */
export const Folded: Story = {
  render: () => (
    <AtPageWidth width={560}>
      <Bar filters period view />
    </AtPageWidth>
  ),
  play: async ({ canvas, userEvent }) => {
    const field = canvas.getByRole('combobox', { name: 'Filters' });
    await expect(field).toHaveValue('None');
    await expect(field).toHaveAttribute('aria-expanded', 'false');
    await userEvent.click(field);
    const sheet = await screen.findByRole('dialog', { name: 'Filters' });
    await expect(field).toHaveAttribute('aria-expanded', 'true');
    await userEvent.click(within(sheet).getByRole('combobox', { name: 'Utility' }));
    await userEvent.click(await screen.findByRole('option', { name: 'Electricity' }));
    await expect(field).toHaveValue('1 set');
    await userEvent.click(within(sheet).getByRole('button', { name: 'Clear All' }));
    await expect(field).toHaveValue('None');
    await userEvent.click(within(sheet).getByRole('button', { name: 'Done' }));
    await waitFor(() => expect(screen.queryByRole('dialog', { name: 'Filters' })).toBeNull());
    await expect(field).toHaveAttribute('aria-expanded', 'false');
  },
};

/** On a phone the folded filters open in a bottom sheet across the window, one to a row; the popover is for wider windows. */
export const FoldedOnPhone: Story = {
  name: 'Folded on a phone',
  globals: { viewport: { value: 'phone', isRotated: false } },
  render: () => (
    <AtPageWidth width={343}>
      <Bar filters period view />
    </AtPageWidth>
  ),
  play: async ({ canvas, userEvent }) => {
    await userEvent.click(canvas.getByRole('combobox', { name: 'Filters' }));
    const sheet = await screen.findByRole('dialog', { name: 'Filters' });
    await expect(sheet).toHaveClass('MuiDrawer-paper');
    await userEvent.click(within(sheet).getByRole('button', { name: 'Done' }));
    await waitFor(() => expect(screen.queryByRole('dialog', { name: 'Filters' })).toBeNull());
  },
};

/** With no period beside it, the folded Filters field sits at the left and is never wider than the period field (260px). */
export const FoldedFiltersOnly: Story = {
  name: 'Folded filters only',
  render: () => (
    <AtPageWidth width={400}>
      <Bar filters />
    </AtPageWidth>
  ),
  play: async ({ canvas }) => {
    const field = canvas.getByRole('combobox', { name: 'Filters' });
    await expect(field.closest('.MuiTextField-root')!.getBoundingClientRect().width).toBeLessThanOrEqual(260);
  },
};

/** `fold` folds the filters into the Filters field at any width, for a page that keeps its row for something else. */
export const AlwaysFolded: Story = {
  name: 'Always folded',
  render: () => (
    <AtPageWidth width={880}>
      <Bar filters period view fold />
    </AtPageWidth>
  ),
  play: async ({ canvas }) => {
    await expect(canvas.getByRole('combobox', { name: 'Filters' })).toBeVisible();
    await expect(canvas.queryByRole('combobox', { name: 'Property Type' })).toBeNull();
  },
};

/** `before` puts a control, a small search field, at the row's start, taking its free width; the filters fold beside it and the bar leaves no margin under itself. */
export const WithSearch: Story = {
  name: 'With a search field',
  render: () => (
    <AtPageWidth width={880}>
      <Bar filters search />
    </AtPageWidth>
  ),
  play: async ({ canvas, userEvent }) => {
    await userEvent.type(canvas.getByRole('textbox', { name: 'Search' }), 'boiler');
    await userEvent.click(canvas.getByRole('combobox', { name: 'Filters' }));
    const popover = await screen.findByRole('dialog', { name: 'Filters' });
    // The popover fades in: wait for it before reading what it holds.
    await waitFor(() => expect(within(popover).getByRole('combobox', { name: 'Property Type' })).toBeVisible());
    await userEvent.click(within(popover).getByRole('button', { name: 'Done' }));
    await waitFor(() => expect(screen.queryByRole('dialog', { name: 'Filters' })).toBeNull());
  },
};

/** Narrower still, the period takes a row of its own at full width, and the Filters field grows into the row under it, up to the period field's width. */
export const PeriodOwnRow: Story = {
  name: 'Period on its own row',
  render: () => (
    <AtPageWidth width={343}>
      <Bar filters period view />
    </AtPageWidth>
  ),
};
