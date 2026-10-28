import { useState } from 'react';
import type { Meta, StoryObj } from '@storybook/react-vite';
import { expect, fn, screen, waitFor, within } from 'storybook/test';
import { PeriodPicker, type Period, type PeriodPreset } from 'src/components/PeriodPicker';

/** The standard periods for data through September 2026. */
const presets: PeriodPreset[] = [
  { id: 'ytd', label: 'Year to date', from: '2026-01', to: '2026-09' },
  { id: 'last-12', label: 'Last 12 months', from: '2025-10', to: '2026-09' },
  { id: '2025', label: 'Calendar year 2025', from: '2025-01', to: '2025-12' },
  { id: '2024', label: 'Calendar year 2024', from: '2024-01', to: '2024-12' },
];

/** A month as the picker's selects write it, in the viewer's locale: "April 2025". */
const monthName = (year: number, monthIndex: number) =>
  new Intl.DateTimeFormat(undefined, { month: 'long', year: 'numeric' }).format(new Date(year, monthIndex, 1));

/**
 * Kilowatt's `PeriodPicker`: a field naming the period, opening the standard periods and a custom
 * range of whole months. Each story holds the period in state, so choosing one updates the field.
 */
const meta = {
  title: 'Inputs/PeriodPicker',
  component: PeriodPicker,
  tags: ['!autodocs'],
  // The MUI components this page documents; docs.test.ts checks its MUI departures section against them.
  parameters: {
    muiComponents: [
      'TextField',
      'Popover',
      'Dialog',
      'List',
      'ListItemButton',
      'Divider',
      'MenuItem',
      'Button',
      'IconButton',
    ],
  },
  args: { presets, value: 'ytd', firstMonth: '2024-01', lastMonth: '2026-09', onChange: () => {} },
  render: function Render(args) {
    const [value, setValue] = useState<Period>(args.value);
    return (
      <PeriodPicker
        {...args}
        value={value}
        onChange={(period) => {
          setValue(period);
          args.onChange(period);
        }}
      />
    );
  },
} satisfies Meta<typeof PeriodPicker>;

export default meta;
type Story = StoryObj<typeof meta>;

/** A standard period, named in the field. Open it and pick another; the list shows each one's months. */
export const Preset: Story = {
  play: async ({ canvas, userEvent }) => {
    const field = canvas.getByRole('combobox', { name: 'Period' });
    await expect(field).toHaveValue('Year to date');
    await userEvent.click(field);
    const periods = await screen.findByRole('list', { name: 'Standard periods' });
    await userEvent.click(within(periods).getByRole('button', { name: /Last 12 months/ }));
    await waitFor(() => expect(field).toHaveValue('Last 12 months'));
  },
};

/** A custom range is named by its months, as the viewer's locale writes a range. */
export const CustomRange: Story = {
  args: { value: { from: '2025-04', to: '2025-09' } },
  play: async ({ canvas }) => {
    await expect(canvas.getByRole('combobox', { name: 'Period' })).toHaveValue(
      new Intl.DateTimeFormat(undefined, { month: 'short', year: 'numeric' }).formatRange(
        new Date(2025, 3, 1),
        new Date(2025, 8, 1),
      ),
    );
  },
};

/** Choose a custom range: a From and a To month, then Apply. Apply stays disabled until both are set. */
export const ApplyCustomRange: Story = {
  args: { onChange: fn() },
  play: async ({ args, canvas, userEvent }) => {
    await userEvent.click(canvas.getByRole('combobox', { name: 'Period' }));
    const range = await screen.findByRole('group', { name: 'Custom range' });
    const apply = within(range).getByRole('button', { name: 'Apply' });
    await expect(apply).toBeDisabled();
    await userEvent.click(within(range).getByRole('combobox', { name: 'From' }));
    await userEvent.click(await screen.findByRole('option', { name: monthName(2025, 3) }));
    await userEvent.click(within(range).getByRole('combobox', { name: 'To' }));
    await userEvent.click(await screen.findByRole('option', { name: monthName(2026, 8) }));
    await waitFor(() => expect(apply).toBeEnabled());
    await userEvent.click(apply);
    await expect(args.onChange).toHaveBeenCalledWith({ from: '2025-04', to: '2026-09' });
  },
};

/** On phones the picker opens as a full-screen dialog, named by the field's label, with a close button. */
export const Phone: Story = {
  globals: { viewport: { value: 'phone', isRotated: false } },
  play: async ({ canvas, userEvent }) => {
    await userEvent.click(canvas.getByRole('combobox', { name: 'Period' }));
    const dialog = await screen.findByRole('dialog', { name: 'Period' });
    // The dialog fades in; wait for it rather than catching it mid-transition.
    await waitFor(() => expect(within(dialog).getByRole('list', { name: 'Standard periods' })).toBeVisible());
    await userEvent.click(within(dialog).getByRole('button', { name: 'Close' }));
    await waitFor(() => expect(screen.queryByRole('dialog')).toBeNull());
  },
};
