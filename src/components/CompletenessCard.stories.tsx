import { useMemo, useState, type ReactNode } from 'react';
import Grid from '@mui/material/Grid';
import MenuItem from '@mui/material/MenuItem';
import Stack from '@mui/material/Stack';
import TextField from '@mui/material/TextField';
import Typography from '@mui/material/Typography';
import type { Meta, StoryObj } from '@storybook/react-vite';
import { expect, fn, within } from 'storybook/test';
import { CompletenessCard, type CompletenessCardProps } from 'src/components/CompletenessCard';
import { MonthBarsLegend, type MonthState } from 'src/components/MonthBars';

const states: Record<string, MonthState> = { x: 'complete', p: 'partial', '.': 'gap', a: 'awaiting' };
const months = (pattern: string) => [...pattern].map((c) => states[c]);
const feeds = ['Electricity', 'Water', 'Gas', 'Weather'];

/** A synthetic property's feeds, as month patterns: `x` complete, `p` partial, `.` gap, `a` awaiting, `-` not applicable, `0` no source. */
type SampleProperty = { name: string; where: string; status: CompletenessCardProps['status']; open: number; feeds: string[] };
const properties: SampleProperty[] = [
  { name: 'Harbor Point', where: 'Office · Springfield, OR', status: { label: 'Healthy', color: 'success' }, open: 0, feeds: ['xxxxxxxxxxaa', 'xxxxxxxxxxaa', 'xxxxxxxxxxaa', 'xxxxxxxxxxxx'] },
  { name: 'Maple Court', where: 'Multifamily · Salem, OR', status: { label: 'Needs review', color: 'warning' }, open: 2, feeds: ['xxx..xxxxxaa', 'xxxxpxxxxxaa', '-', 'xxxxxxxxxxxx'] },
  { name: 'Riverside Lofts', where: 'Multifamily · Eugene, OR', status: { label: 'Needs review', color: 'warning' }, open: 3, feeds: ['xxxxxxxxxxaa', '0', 'xxxxxx......', 'xxxxxxxxxxxx'] },
  { name: 'Cedar Annex', where: 'Retail · Bend, OR', status: { label: 'Healthy', color: 'success' }, open: 1, feeds: ['xxxxxxxxxxaa', 'xxxxxxxxpxaa', 'xxxxxxxxxxaa', 'xxxxxxxx.xxx'] },
];

/** A property's card props: a strip per feed, its counts, and its first and last months. */
function cardFor(property: SampleProperty, onOpen: (name: string) => void): { card: CompletenessCardProps; score: number } {
  let complete = 0;
  let counted = 0;
  let covered = 0;
  let applicable = 0;
  const rows = property.feeds.map((pattern, i) => {
    const label = feeds[i];
    if (pattern === '-') return { label, months: [], placeholder: 'Not applicable', summary: `${label}, Jan–Dec 2025: not applicable at ${property.name}.` };
    applicable += 1;
    if (pattern === '0') {
      counted += 12;
      return { label, months: months('............'), overlay: 'No source', summary: `${label}, Jan–Dec 2025: no source connected.` };
    }
    const m = months(pattern);
    const done = m.filter((s) => s === 'complete').length;
    const due = m.filter((s) => s !== 'awaiting').length;
    complete += done;
    counted += due;
    if (done === due) covered += 1;
    return { label, months: m, summary: `${label}, Jan–Dec 2025: ${done} of ${due} months complete.` };
  });
  const card: CompletenessCardProps = {
    title: property.name,
    subheader: property.where,
    open: { onClick: () => onOpen(property.name), label: `Open ${property.name}` },
    status: property.status,
    caption: `${covered}/${applicable} feeds complete · ${property.open === 0 ? 'No open items' : `${property.open} open item${property.open === 1 ? '' : 's'}`}`,
    rows,
    start: 'Jan 2025',
    end: 'Last data · Dec 2025',
  };
  return { card, score: counted ? complete / counted : 2 };
}

/** A single card's frame: the width of one column of the grid. */
const oneColumn = (Story: () => ReactNode) => (
  <Stack sx={{ maxWidth: 360 }}>
    <Story />
  </Stack>
);

/**
 * Kilowatt's `CompletenessCard`: a card of month-bar strips, one per feed, for a grid that scans the completeness of
 * many properties' data at once.
 */
const meta = {
  title: 'Surfaces/Completeness card',
  component: CompletenessCard,
  tags: ['!autodocs'],
  // The MUI components this page documents; docs.test.ts checks its MUI departures section against them.
  parameters: { muiComponents: ['Card', 'CardHeader', 'CardContent', 'CardActionArea', 'Chip'] },
  args: cardFor(properties[1], () => {}).card,
} satisfies Meta<typeof CompletenessCard>;

export default meta;
type Story = StoryObj<typeof meta>;

/** One property: its status chip at the top right, its counts, a strip per feed on one month axis, and its first and last months. With `open`, the whole card is one button that opens the property. */
export const Property: Story = {
  decorators: [oneColumn],
  args: { open: { onClick: fn(), label: 'Open Maple Court' } },
  play: async ({ args, canvas, userEvent }) => {
    await expect(canvas.getByRole('heading', { name: 'Maple Court' })).toBeVisible();
    await expect(canvas.getByText('Not applicable')).toBeVisible();
    const card = canvas.getByRole('button', { name: 'Open Maple Court' });
    // The card is the one control: its strips take no focus inside it.
    await expect(within(card).queryByRole('figure', { name: /Electricity/ })).not.toHaveAttribute('tabindex');
    await userEvent.click(card);
    await expect(args.open!.onClick).toHaveBeenCalledOnce();
  },
};

/** Without `open` the card is plain, for a subject with no page of its own; its strips then take focus, so the keyboard reaches their tooltips. */
export const PlainTitle: Story = {
  decorators: [oneColumn],
  args: { open: undefined, status: undefined },
};

type Sort = 'completeness' | 'name' | 'open';
const sortLabels: Record<Sort, string> = { completeness: 'Completeness', name: 'Name', open: 'Open items' };

/** The grid: a caption and the legend over the cards, a Sort By select, the cards least complete first, and the rule under them. */
function CardGrid() {
  const [sort, setSort] = useState<Sort>('completeness');
  const cards = useMemo(() => {
    const all = properties.map((property) => ({ property, ...cardFor(property, () => {}) }));
    return all.sort((a, b) => {
      const byName = a.property.name.localeCompare(b.property.name);
      if (sort === 'name') return byName;
      if (sort === 'open') return b.property.open - a.property.open || byName;
      return a.score - b.score || byName;
    });
  }, [sort]);
  return (
    <Stack sx={{ gap: 2 }}>
      <Stack direction="row" sx={{ gap: 2, flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between' }}>
        <Stack sx={{ gap: 1, minWidth: 0 }}>
          <Typography variant="body2" sx={{ color: 'text.secondary' }}>
            Each utility shows whether its data sources cover every month in the period. 4 properties, Jan–Dec 2025.
          </Typography>
          <MonthBarsLegend inline />
        </Stack>
        {/* Small, beside the caption, as a filters row may be (Rules → Component size). */}
        <TextField select size="small" label="Sort By" value={sort} onChange={(event) => setSort(event.target.value as Sort)} sx={{ minWidth: (t) => t.spacing(22) }}>
          {(Object.keys(sortLabels) as Sort[]).map((value) => (
            <MenuItem key={value} value={value}>
              {sortLabels[value]}
            </MenuItem>
          ))}
        </TextField>
      </Stack>
      <Grid container spacing={2} component="ul" aria-label="Properties by data completeness" sx={{ listStyle: 'none', p: 0, m: 0 }}>
        {cards.map(({ property, card }) => (
          <Grid key={property.name} component="li" size={{ xs: 12, sm: 6, md: 4 }}>
            <CompletenessCard {...card} />
          </Grid>
        ))}
      </Grid>
      <Typography variant="caption" sx={{ color: 'text.secondary' }}>
        Complete: every one of the feed’s sources reported in the month. Partial: some of them did. Gap: none did; a feed with no source draws every month as a gap. Awaiting: the months after the latest entry, up to 2, while the period runs to now.
      </Typography>
    </Stack>
  );
}

/** Cards in MUI's `Grid`, every card one shape, sorted least complete first, so the properties missing the most months lead. */
export const CardGridLayout: Story = {
  render: () => <CardGrid />,
  play: async ({ canvas }) => {
    const names = canvas.getAllByRole('heading', { level: 2 }).map((heading) => heading.textContent);
    await expect(names[0]).toBe('Riverside Lofts');
  },
};
