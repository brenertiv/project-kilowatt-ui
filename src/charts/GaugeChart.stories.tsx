import { useEffect, useState } from 'react';
import type { Meta, StoryObj } from '@storybook/react-vite';
import { expect, waitFor } from 'storybook/test';
import { GaugeChart } from 'src/charts/GaugeChart';
import type { StatusBand } from 'src/charts/LineChart';
import { buildingIntensity, energyStarCertification, energyStarScore } from 'src/fixtures/charts';
import { inCard } from 'src/stories/decorators';

/** The bands an ENERGY STAR score is read in: eligible for certification from 75, and the national median at 50. */
const energyStarBands: StatusBand[] = [
  { from: 75, to: 100, status: 'success', label: 'Eligible for certification' },
  { from: 50, to: 75, status: 'warning', label: 'Above the national median' },
  { from: 0, to: 50, status: 'error', label: 'Below the national median' },
];
const certification = [{ value: energyStarCertification, label: 'Certification' }];
const intensity = buildingIntensity[0].current;
const intensityBands: StatusBand[] = [
  { from: 0, to: 60, status: 'success', label: 'Better than the portfolio median' },
  { from: 60, to: 100, status: 'warning', label: 'Near the portfolio median' },
  { from: 100, to: 150, status: 'error', label: 'Worse than the portfolio median' },
];

/**
 * Kilowatt's reference gauge: amCharts 5 through `useChart`, its arc colored by the intents.
 * Each story shows it in a `Card` under a `CardHeader`, as it ships.
 */
const meta = {
  title: 'Charts/Gauge',
  component: GaugeChart,
  tags: ['!autodocs'],
  decorators: [inCard],
} satisfies Meta<typeof GaugeChart>;

export default meta;
type Story = StoryObj<typeof meta>;

/** One reading on a fixed scale of worse to better: a building's ENERGY STAR score, its band named under the number and the certification threshold ticked on the arc. */
export const Score: Story = {
  parameters: { card: { title: 'ENERGY STAR Score' } },
  args: {
    value: energyStarScore,
    name: 'ENERGY STAR score',
    unit: 'pts',
    bands: energyStarBands,
    references: certification,
    summary: `The ENERGY STAR score is ${energyStarScore}, above the certification threshold of ${energyStarCertification}.`,
  },
  play: async ({ canvas }) => {
    const figure = canvas.getByRole('figure', { name: /ENERGY STAR score is/ });
    await waitFor(() => expect(figure.querySelector('canvas')).not.toBeNull());
    await expect(canvas.getByText('Eligible for certification')).toBeVisible();
  },
};

/** `lowerIsBetter`: the arc runs from `success` at the low end to `error` at the high end, for a reading where less is better, on its own `max`. */
export const LowerIsBetter: Story = {
  name: 'Lower is better',
  parameters: { card: { title: 'Energy Use Intensity' } },
  args: {
    value: intensity,
    name: 'Site energy use intensity',
    unit: 'kBtu/sq ft',
    max: 150,
    lowerIsBetter: true,
    bands: intensityBands,
    summary: `Site energy use intensity is ${intensity} kBtu per square foot, near the portfolio median.`,
  },
};

/** A reading that changes: the needle swings to each new `value` (at once under reduced motion) and the number under it follows; the chart isn't rebuilt. */
export const Live: Story = {
  parameters: { card: { title: 'ENERGY STAR Score' } },
  args: {
    value: energyStarScore,
    name: 'ENERGY STAR score',
    unit: 'pts',
    bands: energyStarBands,
    references: certification,
    summary: 'The ENERGY STAR score, updating as new readings arrive.',
  },
  render: function LiveGauge(args) {
    const [step, setStep] = useState(0);
    useEffect(() => {
      const timer = setInterval(() => setStep((current) => current + 1), 2000);
      return () => clearInterval(timer);
    }, []);
    return <GaugeChart {...args} value={Math.round(args.value + 18 * Math.sin(step * 1.3))} />;
  },
};
