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
import Typography from '@mui/material/Typography';
import type { Meta, StoryObj } from '@storybook/react-vite';
import { expect, fn, waitFor } from 'storybook/test';
import { useChart, type ChartContext } from 'src/charts/useChart';
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

/** MUI's basic card: content, then text-button actions. It sits on surface level1 with MUI's elevation 1 shadow. */
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
  const yAxis = chart.yAxes.push(am5xy.ValueAxis.new(root, { min: 0, renderer: am5xy.AxisRendererY.new(root, {}) }));
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
        tooltip: am5.Tooltip.new(root, { labelText: "{name}: {valueY.formatNumber('#,###')} kWh" }),
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
 * A chart in a card: `CardHeader` names what's measured, the period and units, with actions in
 * `action`; the chart fills `CardContent`, run through `useChart`, in a `figure` whose caption is a one-line summary, its text alternative.
 */
export const Chart: Story = {
  render: (args) => (
    <Card {...args} variant="outlined" sx={{ maxWidth: 640 }}>
      <CardHeader
        title="Energy Use"
        subheader="Sep 1–30, 2026 · kWh"
        action={
          <IconButton aria-label="Chart options">
            <Icon name="more_horiz" fontSize="inherit" />
          </IconButton>
        }
      />
      <CardContent sx={{ pt: 0 }}>
        <Box component="figure" aria-labelledby="energy-use-summary" sx={{ m: 0 }}>
          <EnergyUseChart />
          <Typography id="energy-use-summary" component="figcaption" variant="body2" sx={{ color: 'text.secondary', mt: 1 }}>
            {summary}
          </Typography>
        </Box>
      </CardContent>
    </Card>
  ),
  play: async ({ canvas }) => {
    const figure = canvas.getByRole('figure', { name: /This period used/ });
    await waitFor(() => expect(figure.querySelector('canvas')).not.toBeNull());
  },
};
