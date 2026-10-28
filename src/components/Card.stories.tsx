import { useState } from 'react';
import * as am5 from '@amcharts/amcharts5';
import * as am5xy from '@amcharts/amcharts5/xy';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Card from '@mui/material/Card';
import CardActionArea from '@mui/material/CardActionArea';
import CardActions from '@mui/material/CardActions';
import CardContent from '@mui/material/CardContent';
import CardHeader from '@mui/material/CardHeader';
import IconButton from '@mui/material/IconButton';
import List from '@mui/material/List';
import ListItem from '@mui/material/ListItem';
import ListItemText from '@mui/material/ListItemText';
import Menu from '@mui/material/Menu';
import MenuItem from '@mui/material/MenuItem';
import Typography from '@mui/material/Typography';
import type { Meta, StoryObj } from '@storybook/react-vite';
import { expect, fn, screen, waitFor, within } from 'storybook/test';
import { axisUnit, tooltipNumberFormat } from 'src/charts/theme';
import { useChart, type ChartContext } from 'src/charts/useChart';
import { SourceFigure, type FigureSource } from 'src/components/SourceFigure';
import { TruncatedText } from 'src/components/TruncatedText';
import { Icon } from 'src/icons';

/**
 * MUI's `Card` with its `CardHeader`, `CardContent`, `CardActions` and `CardActionArea`, used as MUI
 * documents them. Kilowatt has no wrapper: the theme's departures (Foundations → MUI
 * departures) are the only differences from stock MUI. Args hold only values that
 * differ from MUI's defaults, so each story's snippet shows only the props that matter.
 */
const meta = {
  title: 'Surfaces/Card',
  component: Card,
  tags: ['!autodocs'],
  // The MUI components this page documents; docs.test.ts checks its MUI departures section against them.
  parameters: { muiComponents: ['Card', 'CardHeader', 'CardContent', 'CardActions', 'CardActionArea'] },
  argTypes: {
    variant: { control: 'inline-radio', options: ['elevation', 'outlined'] },
  },
  render: (args) => (
    <Card {...args} sx={{ maxWidth: 360 }}>
      <CardContent>
        <Typography variant="overline" sx={{ color: 'text.secondary' }}>
          Building
        </Typography>
        <Typography variant="h5" component="h2">
          350 Fifth Avenue
        </Typography>
        <Typography variant="body2" sx={{ color: 'text.secondary', mt: 1 }}>
          Office tower in Midtown Manhattan, metered at the main switchgear and on every tenant floor.
        </Typography>
      </CardContent>
      <CardActions>
        <Button>View Building</Button>
      </CardActions>
    </Card>
  ),
} satisfies Meta<typeof Card>;

export default meta;
type Story = StoryObj<typeof meta>;

/** MUI's basic card: content, then text-button actions. It sits on surface level2, a step above the frame, with MUI's elevation 1 shadow. */
export const Basic: Story = {};

/** `variant="outlined"`: a border instead of a shadow, for cards in a dense grid or on a surface that already has depth. */
export const Outlined: Story = {
  args: { variant: 'outlined' },
};

/** Stands in for opening the building; the Clickable story's play function checks it. */
const openBuilding = fn();

/** A card that is one link or action as a whole: wrap its content in `CardActionArea`, which renders a button. */
export const Clickable: Story = {
  render: (args) => (
    <Card {...args} sx={{ maxWidth: 360 }}>
      <CardActionArea onClick={openBuilding}>
        <CardContent>
          <Typography variant="overline" sx={{ color: 'text.secondary' }}>
            Building
          </Typography>
          <Typography variant="h5" component="h2">
            350 Fifth Avenue
          </Typography>
          <Typography variant="body2" sx={{ color: 'text.secondary', mt: 1 }}>
            Open the building to see its meters, alerts and work orders.
          </Typography>
        </CardContent>
      </CardActionArea>
    </Card>
  ),
  play: async ({ canvas, userEvent }) => {
    openBuilding.mockClear();
    await userEvent.click(canvas.getByRole('button', { name: /350 Fifth Avenue/ }));
    await expect(openBuilding).toHaveBeenCalledOnce();
  },
};

/** A month of daily readings: this period and the same days of the period before, in kWh. */
const days = Array.from({ length: 30 }, (_, i) => {
  const date = Date.UTC(2026, 8, 1 + i);
  const weekend = [0, 6].includes(new Date(date).getUTCDay());
  const base = weekend ? 820 : 1240;
  return { date, current: Math.round(base + 60 * Math.sin(i / 2)), previous: Math.round(base * 1.06 + 50 * Math.cos(i / 3)) };
});
const sum = (key: 'current' | 'previous') => days.reduce((total, day) => total + day[key], 0);
const kWh = new Intl.NumberFormat('en-US', { maximumFractionDigits: 0 });
const change = new Intl.NumberFormat('en-US', { style: 'percent', maximumFractionDigits: 0, signDisplay: 'never' });
const difference = sum('current') / sum('previous') - 1;
const summary = `This period used ${kWh.format(sum('current'))} kWh, ${change.format(difference)} ${difference < 0 ? 'less' : 'more'} than the previous 30 days.`;

/**
 * The chart: this period in the first series color, the previous period in the neutral, dashed.
 * Defined outside the component, so it stays the same function between renders.
 */
function buildEnergyChart({ root, colors }: ChartContext) {
  // The readings are dates in UTC; show them as such rather than in the viewer's time zone.
  root.utc = true;
  const chart = root.container.children.push(
    am5xy.XYChart.new(root, { layout: root.verticalLayout, paddingLeft: 0, paddingRight: 0 }),
  );
  const xAxis = chart.xAxes.push(
    am5xy.DateAxis.new(root, { baseInterval: { timeUnit: 'day', count: 1 }, renderer: am5xy.AxisRendererX.new(root, { minGridDistance: 60 }) }),
  );
  // One value axis, on the right, with its unit above it.
  const yAxis = chart.yAxes.push(am5xy.ValueAxis.new(root, { min: 0, renderer: am5xy.AxisRendererY.new(root, { opposite: true }) }));
  axisUnit(root, chart, yAxis, 'kWh');
  const line = (field: 'current' | 'previous', name: string, color: am5.Color) => {
    const series = chart.series.push(
      am5xy.LineSeries.new(root, {
        name,
        xAxis,
        yAxis,
        valueXField: 'date',
        valueYField: field,
        stroke: color,
        fill: color,
        tooltip: am5.Tooltip.new(root, { labelText: `{name}: {valueY.formatNumber('${tooltipNumberFormat}')} kWh` }),
      }),
    );
    series.strokes.template.setAll({ strokeWidth: 2 });
    return series;
  };
  const previous = line('previous', 'Previous 30 days', colors.neutral);
  previous.strokes.template.set('strokeDasharray', [4, 4]);
  const current = line('current', 'This period', colors.series[0]);
  chart.set('cursor', am5xy.XYCursor.new(root, { behavior: 'none' }));
  const legend = chart.children.push(am5.Legend.new(root, { centerX: am5.p50, x: am5.p50 }));
  legend.data.setAll([current, previous]);
  previous.data.setAll(days);
  current.data.setAll(days);
}

function EnergyUseChart() {
  const ref = useChart(buildEnergyChart);
  return <Box ref={ref} sx={{ height: 240 }} />;
}

/**
 * A chart in a card: a title-only `CardHeader` names what's measured, in `TruncatedText`, with actions in
 * `action`; the unit sits above the value axis and in the tooltip, and the page sets the period; the chart sits straight in the card with 16px of its own padding, run through `useChart`, in a `figure` named by a one-line summary, its text alternative for screen readers.
 */
export const Chart: Story = {
  render: (args) => (
    <Card {...args} variant="outlined" sx={{ maxWidth: 640 }}>
      <CardHeader
        title={<TruncatedText>Energy Use</TruncatedText>}
        action={
          <IconButton aria-label="Chart options">
            <Icon name="more_horiz" fontSize="inherit" />
          </IconButton>
        }
      />
      <Box component="figure" aria-label={summary} sx={{ m: 0, px: 2, pb: 2 }}>
        <EnergyUseChart />
      </Box>
    </Card>
  ),
  play: async ({ canvas }) => {
    const figure = canvas.getByRole('figure', { name: /This period used/ });
    await waitFor(() => expect(figure.querySelector('canvas')).not.toBeNull());
  },
};

/** Three meters and their readings so far this period, in kWh. */
const meters = [
  { name: 'Main switchgear', reading: 412_880 },
  { name: 'Floors 2–20', reading: 236_410 },
  { name: 'Chiller plant', reading: 98_675 },
];

/**
 * Content that runs edge to edge: the `Card` has no padding of its own, so leave `CardContent` out and
 * let the element set its own. Here a `List` sits straight under the header, and its rows pad themselves.
 */
export const EdgeToEdge: Story = {
  render: (args) => (
    <Card {...args} variant="outlined" sx={{ maxWidth: 360 }}>
      <CardHeader
        title={<TruncatedText>Meters</TruncatedText>}
        action={
          <IconButton aria-label="Meter options">
            <Icon name="more_horiz" fontSize="inherit" />
          </IconButton>
        }
      />
      <List>
        {meters.map((meter) => (
          <ListItem key={meter.name} secondaryAction={<Typography sx={{ fontVariantNumeric: 'tabular-nums' }}>{kWh.format(meter.reading)}\u00a0kWh</Typography>}>
            <ListItemText primary={meter.name} />
          </ListItem>
        ))}
      </List>
    </Card>
  ),
};

/** The header's action, the same in every header story. */
const options = (
  <IconButton aria-label="Card options">
    <Icon name="more_horiz" fontSize="inherit" />
  </IconButton>
);

/**
 * A title alone: the icon sits level with the title line, 16px from the card's right edge, and the
 * header is the title's height plus 16px above and below; the button doesn't make it taller.
 */
export const TitleOnly: Story = {
  render: (args) => (
    <Card {...args} variant="outlined" sx={{ maxWidth: 360 }}>
      <CardHeader title={<TruncatedText>Energy Use</TruncatedText>} action={options} />
      <CardContent sx={{ pt: 0 }}>
        <Typography variant="body2" sx={{ color: 'text.secondary' }}>
          Down from last period across every floor.
        </Typography>
      </CardContent>
    </Card>
  ),
};

/** Where the period's energy use comes from, as the metric's source dialog lists it. */
const energySource: FigureSource = {
  source: 'Interval meter data from the main switchgear',
  period: 'September 1–30, 2026',
  calculation: 'The sum of the daily readings, in kWh',
  scope: 'The whole building, every metered floor',
  coverage: 'Readings for all 30 days',
  updated: new Intl.DateTimeFormat('en-US', { dateStyle: 'medium', timeZone: 'UTC' }).format(Date.UTC(2026, 9, 1)),
};
const comparison = `${change.format(difference)} ${difference < 0 ? 'less' : 'more'} than the previous 30 days.`;

/**
 * A headline number at the card's foot: `SourceFigure` sets it in `h2` with tabular numerals, the unit after it,
 * and opens its source; what would be a caption under it is its `note`. The card has a 160px floor.
 */
export const Metric: Story = {
  render: (args) => (
    <Card {...args} variant="outlined" sx={{ maxWidth: 360, minHeight: (theme) => theme.spacing(20), display: 'flex', flexDirection: 'column' }}>
      <CardHeader title={<TruncatedText>Energy Use</TruncatedText>} action={options} />
      <CardContent sx={{ pt: 0, mt: 'auto', display: 'flex', flexDirection: 'column' }}>
        <SourceFigure title="Energy Use" value={kWh.format(sum('current'))} unit="kWh" note={comparison} source={energySource} />
      </CardContent>
    </Card>
  ),
  play: async ({ canvas, userEvent }) => {
    await userEvent.click(canvas.getByRole('button', { name: /view source for Energy Use$/ }));
    const dialog = await screen.findByRole('dialog', { name: 'Energy Use' });
    await waitFor(() => expect(within(dialog).getByText(comparison)).toBeVisible());
    await userEvent.click(within(dialog).getByRole('button', { name: 'Done' }));
    await waitFor(() => expect(screen.queryByRole('dialog')).toBeNull());
  },
};

/** Stands in for the highlight's menu actions; the Highlight story's play function checks one. */
const downloadData = fn();

/** The highlight's More button and its menu, in the header's `action` like any card's options. */
function HighlightActions({ title }: { title: string }) {
  const [anchor, setAnchor] = useState<HTMLElement | null>(null);
  const close = () => setAnchor(null);
  return (
    <>
      <IconButton aria-label={`More, ${title}`} aria-haspopup="menu" aria-expanded={Boolean(anchor)} onClick={(event) => setAnchor(event.currentTarget)}>
        <Icon name="more_horiz" fontSize="inherit" />
      </IconButton>
      <Menu anchorEl={anchor} open={Boolean(anchor)} onClose={close}>
        <MenuItem
          onClick={() => {
            close();
            downloadData();
          }}
        >
          Download Data
        </MenuItem>
        <MenuItem onClick={close}>Share</MenuItem>
      </Menu>
    </>
  );
}

/**
 * The card a page leads with: an outlined card like every other, its title in `h5`, one step above other card
 * titles, a More menu in the header's `action`, and its metric above the chart.
 */
export const Highlight: Story = {
  render: (args) => (
    <Card {...args} variant="outlined" sx={{ maxWidth: 640 }}>
      <CardHeader
        title={<TruncatedText>Energy Use</TruncatedText>}
        slotProps={{ title: { variant: 'h5', component: 'h2' } }}
        action={<HighlightActions title="Energy Use" />}
      />
      <CardContent sx={{ pt: 0, display: 'flex', flexDirection: 'column' }}>
        <SourceFigure title="Energy Use" value={kWh.format(sum('current'))} unit="kWh" note={comparison} source={energySource} />
      </CardContent>
      <Box component="figure" aria-label={summary} sx={{ m: 0, px: 2, pb: 2 }}>
        <EnergyUseChart />
      </Box>
    </Card>
  ),
  play: async ({ canvas, userEvent }) => {
    downloadData.mockClear();
    await expect(canvas.getByRole('heading', { level: 2, name: 'Energy Use' })).toBeVisible();
    await userEvent.click(canvas.getByRole('button', { name: 'More, Energy Use' }));
    const menu = await screen.findByRole('menu');
    await userEvent.click(within(menu).getByRole('menuitem', { name: 'Download Data' }));
    await expect(downloadData).toHaveBeenCalledOnce();
    await waitFor(() => expect(screen.queryByRole('menu')).toBeNull());
  },
};

/** A title too long for the card: it truncates to one line, with the full text in a tooltip. */
export const LongTitle: Story = {
  render: (args) => (
    <Card {...args} variant="outlined" sx={{ maxWidth: 360 }}>
      <CardHeader
        title={<TruncatedText>Energy Use by Floor, Tenant Submeters and Common Areas</TruncatedText>}
        action={options}
      />
    </Card>
  ),
  play: async ({ canvas }) => {
    const title = canvas.getByText(/^Energy Use by Floor/);
    await waitFor(() => expect(title).toHaveAttribute('tabindex', '0'));
    await expect(title.getBoundingClientRect().height).toBeLessThan(30);
  },
};
