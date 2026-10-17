import Stack from '@mui/material/Stack';
import ToggleButton from '@mui/material/ToggleButton';
import ToggleButtonGroup from '@mui/material/ToggleButtonGroup';
import type { Meta, StoryObj } from '@storybook/react-vite';
import { useState } from 'react';
import { expect } from 'storybook/test';
import { Icon } from 'src/icons';

/**
 * MUI's `ToggleButton` and `ToggleButtonGroup`, used as MUI documents them. Kilowatt has no
 * wrapper: the theme's departures (Foundations → MUI departures) are the only differences
 * from stock MUI.
 */
const meta = {
  title: 'Components/ToggleButton',
  component: ToggleButtonGroup,
  tags: ['!autodocs'],
  // The MUI components this page documents; docs.test.ts checks its MUI departures section against them.
  parameters: { muiComponents: ['ToggleButton', 'ToggleButtonGroup'] },
  argTypes: {
    color: { control: 'select', options: ['standard', 'primary', 'secondary', 'error', 'warning', 'info', 'success'] },
    size: { control: 'inline-radio', options: ['small', 'medium', 'large'] },
    orientation: { control: 'inline-radio', options: ['horizontal', 'vertical'] },
  },
} satisfies Meta<typeof ToggleButtonGroup>;

export default meta;
type Story = StoryObj<typeof meta>;

/** One choice that's always made, such as a chart's time range: `exclusive`, ignoring `null` so a choice stays selected. */
export const Exclusive: Story = {
  render: function Render(args) {
    const [range, setRange] = useState('week');
    return (
      <ToggleButtonGroup
        {...args}
        exclusive
        value={range}
        onChange={(_, next: string | null) => next && setRange(next)}
        aria-label="Time range"
      >
        <ToggleButton value="day">Day</ToggleButton>
        <ToggleButton value="week">Week</ToggleButton>
        <ToggleButton value="month">Month</ToggleButton>
        <ToggleButton value="year">Year</ToggleButton>
      </ToggleButtonGroup>
    );
  },
  play: async ({ canvas, userEvent }) => {
    const month = canvas.getByRole('button', { name: 'Month' });
    await userEvent.click(month);
    await expect(month).toHaveAttribute('aria-pressed', 'true');
    await userEvent.click(month);
    await expect(month).toHaveAttribute('aria-pressed', 'true');
  },
};

/** A view switch in a toolbar: icon-only buttons, each with an `aria-label`. The selected icon fills through the theme. */
export const IconOnly: Story = {
  name: 'Icon only',
  render: function Render(args) {
    const [view, setView] = useState('bar');
    return (
      <ToggleButtonGroup
        {...args}
        exclusive
        value={view}
        onChange={(_, next: string | null) => next && setView(next)}
        aria-label="Chart type"
      >
        <ToggleButton value="bar" aria-label="Bar chart">
          <Icon name="bar_chart" />
        </ToggleButton>
        <ToggleButton value="line" aria-label="Line chart">
          <Icon name="show_chart" />
        </ToggleButton>
        <ToggleButton value="table" aria-label="Table">
          <Icon name="table_rows" />
        </ToggleButton>
      </ToggleButtonGroup>
    );
  },
};

/** Options people combine, such as series shown on a chart: no `exclusive`, so the value is an array. */
export const Multiple: Story = {
  render: function Render(args) {
    const [series, setSeries] = useState(['electric']);
    return (
      <ToggleButtonGroup {...args} value={series} onChange={(_, next: string[]) => setSeries(next)} aria-label="Series">
        <ToggleButton value="electric">Electric</ToggleButton>
        <ToggleButton value="gas">Gas</ToggleButton>
        <ToggleButton value="steam">Steam</ToggleButton>
        <ToggleButton value="water">Water</ToggleButton>
      </ToggleButtonGroup>
    );
  },
  play: async ({ canvas, userEvent }) => {
    await userEvent.click(canvas.getByRole('button', { name: 'Gas' }));
    await expect(canvas.getByRole('button', { name: 'Electric' })).toHaveAttribute('aria-pressed', 'true');
    await expect(canvas.getByRole('button', { name: 'Gas' })).toHaveAttribute('aria-pressed', 'true');
  },
};

/** One option that's on or off, shown as a button: a standalone `ToggleButton` with `selected` and `onChange`. */
export const Standalone: Story = {
  render: function Render() {
    const [selected, setSelected] = useState(false);
    return (
      <ToggleButton value="weather" selected={selected} onChange={() => setSelected(!selected)}>
        Weather Overlay
      </ToggleButton>
    );
  },
};

/** MUI's three sizes, set on the group. Keep `medium`, the default; another size is for a one-off instance. */
export const Sizes: Story = {
  render: (args) => (
    <Stack spacing={2} sx={{ alignItems: 'flex-start' }}>
      {(['small', 'medium', 'large'] as const).map((size) => (
        <ToggleButtonGroup key={size} {...args} size={size} exclusive value="week" aria-label={`Time range (${size})`}>
          <ToggleButton value="day">Day</ToggleButton>
          <ToggleButton value="week">Week</ToggleButton>
          <ToggleButton value="month">Month</ToggleButton>
        </ToggleButtonGroup>
      ))}
    </Stack>
  ),
};

/** A stacked group: `orientation="vertical"`. */
export const Vertical: Story = {
  args: { orientation: 'vertical', exclusive: true, value: 'bar', 'aria-label': 'Chart type' },
  render: (args) => (
    <ToggleButtonGroup {...args}>
      <ToggleButton value="bar" aria-label="Bar chart">
        <Icon name="bar_chart" />
      </ToggleButton>
      <ToggleButton value="line" aria-label="Line chart">
        <Icon name="show_chart" />
      </ToggleButton>
      <ToggleButton value="table" aria-label="Table">
        <Icon name="table_rows" />
      </ToggleButton>
    </ToggleButtonGroup>
  ),
};

/** Options that aren't available: `disabled` on one button or the whole group. Say nearby why. */
export const Disabled: Story = {
  args: { exclusive: true, value: 'week', 'aria-label': 'Time range' },
  render: (args) => (
    <ToggleButtonGroup {...args}>
      <ToggleButton value="day" disabled>
        Day
      </ToggleButton>
      <ToggleButton value="week">Week</ToggleButton>
      <ToggleButton value="month">Month</ToggleButton>
    </ToggleButtonGroup>
  ),
};
