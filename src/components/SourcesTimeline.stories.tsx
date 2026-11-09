import { useState } from 'react';
import Box from '@mui/material/Box';
import CardContent from '@mui/material/CardContent';
import Typography from '@mui/material/Typography';
import type { Meta, StoryObj } from '@storybook/react-vite';
import { expect, fn } from 'storybook/test';
import { SourcesTimeline, type SourcesTimelineProps, type TimelineSource } from 'src/components/SourcesTimeline';
import { inCard } from 'src/stories/decorators';

/** The twelve months of 2025, the axis every story shares. */
const months = Array.from({ length: 12 }, (_, i) => new Date(2025, i, 1));
const on = (pattern: string) => [...pattern].map((c) => c === 'x');

/** Synthetic sources: a utility account with a hole in spring, a meter that started in March, a sub-meter that went quiet. */
const sources: TimelineSource[] = [
  { id: 'acct-1', kind: 'Utility account', name: '4410-2271-08', reported: on('xxx..xxxxxxx') },
  { id: 'meter-1', kind: 'Meter', name: 'Main switchgear', reported: on('..xxxxxxxxxx') },
  { id: 'meter-2', kind: 'Meter', name: 'Rooftop unit 2', reported: on('xxxxxx......') },
];
const usage = [61200, 58400, 60100, undefined, undefined, 71900, 84300, 86100, 73800, 64200, 59700, 62800];

/**
 * Kilowatt's `SourcesTimeline`: a feed's sources on one month axis, with their runs, their gaps hatched and, optionally,
 * the feed's usage as columns above. Each story shows it in a `Card`, under `CardContent`, as it ships.
 */
const meta = {
  title: 'Charts/Sources timeline',
  component: SourcesTimeline,
  tags: ['!autodocs'],
  // The MUI components this page documents; docs.test.ts checks its MUI departures section against them.
  parameters: { muiComponents: ['Box', 'ButtonBase', 'Stack', 'Tooltip', 'Typography'] },
  decorators: [
    (Story) => (
      <CardContent sx={{ pt: 0 }}>
        <Story />
      </CardContent>
    ),
    inCard,
  ],
  args: { months, sources, label: 'Electricity sources, Jan–Dec 2025', heading: 'Electricity sources' },
} satisfies Meta<typeof SourcesTimeline>;

export default meta;
type Story = StoryObj<typeof meta>;

/** The rows alone: each source's runs, a hatched gap where it went silent, and a needs-fixing dot on a row with a gap. */
export const Rows: Story = {
  parameters: { card: { title: 'Sources' } },
  play: async ({ canvas }) => {
    await expect(canvas.getByRole('group', { name: 'Electricity sources, Jan–Dec 2025' })).toBeVisible();
    await expect(canvas.getByRole('button', { name: /Utility account · 4410-2271-08 · needs fixing: reported in 10 of 12 months; no data for April 2025 to May 2025/ })).toBeVisible();
    // Months before a meter's first reading aren't a gap.
    await expect(canvas.getByRole('button', { name: 'Meter · Main switchgear: reported in 10 of 12 months.' })).toBeVisible();
  },
};

/** `usage`: the feed's usage by month as columns above, on the same month slots, so a column lines up with the rows beneath it. */
export const WithUsage: Story = {
  parameters: { card: { title: 'Sources' } },
  args: { usage: { values: usage, unit: 'kWh', heading: 'Electricity usage · kWh per month' } },
  play: async ({ canvas }) => {
    await expect(canvas.getByRole('figure', { name: /Electricity usage · kWh per month: 10 of 12 months with data, the highest 86,100 kWh/ })).toBeVisible();
  },
};

/** `onSelect`: each row is a toggle button that selects its source, for its record under the timeline. */
export const Selectable: Story = {
  parameters: { card: { title: 'Sources' } },
  args: { onSelect: fn(), selected: 'acct-1' },
  play: async ({ args, canvas, userEvent }) => {
    await expect(canvas.getByText('Click a source for details')).toBeVisible();
    await userEvent.click(canvas.getByRole('button', { name: /Rooftop unit 2/ }));
    await expect(args.onSelect).toHaveBeenCalledWith('meter-2');
  },
};

/** The timeline with the selected source's record under it, as a property's sources page lays it out. */
function TimelineWithRecord(args: SourcesTimelineProps) {
  const [selected, setSelected] = useState(sources[0].id);
  const source = sources.find(({ id }) => id === selected)!;
  const count = source.reported.filter(Boolean).length;
  return (
    <Box sx={{ display: 'grid', gap: 3 }}>
      <SourcesTimeline {...args} selected={selected} onSelect={setSelected} />
      <Box component="dl" sx={{ m: 0, display: 'grid', gridTemplateColumns: { xs: '1fr', sm: 'auto 1fr' }, columnGap: 3, rowGap: 1 }}>
        {[
          ['Source', `${source.kind} · ${source.name}`],
          ['Reported', `${count} of 12 months`],
        ].map(([term, value]) => (
          <Box key={term} sx={{ display: 'contents' }}>
            <Typography component="dt" variant="body2" sx={{ color: 'text.secondary' }}>
              {term}
            </Typography>
            <Typography component="dd" variant="body2" sx={{ m: 0 }}>
              {value}
            </Typography>
          </Box>
        ))}
      </Box>
    </Box>
  );
}

/** A source chosen in the timeline shows its record under it. */
export const WithRecord: Story = {
  parameters: { card: { title: 'Sources' } },
  render: (args) => <TimelineWithRecord {...args} />,
  play: async ({ canvas, userEvent }) => {
    await userEvent.click(canvas.getByRole('button', { name: /Main switchgear/ }));
    await expect(canvas.getByText('Meter · Main switchgear')).toBeVisible();
  },
};
