import { useEffect, useMemo, useState } from 'react';
import type { Meta, StoryObj } from '@storybook/react-vite';
import { expect, waitFor } from 'storybook/test';
import { VitalsGauge } from 'src/charts/VitalsGauge';
import { buildingVitals } from 'src/fixtures/charts';
import { inCard } from 'src/stories/decorators';

const [score, demand, occupancy, coverage] = buildingVitals;

/**
 * Kilowatt's reference multi-part gauge: amCharts 5 through `useChart`, colored from the palette.
 * Each story shows it in a `Card` under a `CardHeader`, as it ships.
 */
const meta = {
  title: 'Charts/Vitals gauge',
  component: VitalsGauge,
  tags: ['!autodocs'],
  decorators: [inCard],
} satisfies Meta<typeof VitalsGauge>;

export default meta;
type Story = StoryObj<typeof meta>;

/** Four readings in four units around one ring, each arc its own scale with a needle at the reading, named with its value in the legend. */
export const Vitals: Story = {
  parameters: { card: { title: 'Building Vitals' } },
  args: {
    vitals: buildingVitals,
    summary: `ENERGY STAR score ${score.value}, demand ${demand.value} kW of ${demand.max}, occupancy ${occupancy.value}% and data coverage ${coverage.value}%.`,
  },
  play: async ({ canvas }) => {
    const figure = canvas.getByRole('figure', { name: /ENERGY STAR score/ });
    await waitFor(() => expect(figure.querySelector('canvas')).not.toBeNull());
    await expect(canvas.getByText('Demand')).toBeVisible();
  },
};

/** Two readings: each arc takes half the ring. */
export const TwoReadings: Story = {
  name: 'Two readings',
  parameters: { card: { title: 'Occupancy and Data Coverage' } },
  args: {
    vitals: [occupancy, coverage],
    summary: `Occupancy is ${occupancy.value}% and data coverage ${coverage.value}%.`,
  },
};

/** Readings that change: each needle swings to its new value and the legend follows; the chart isn't rebuilt. */
export const Live: Story = {
  parameters: { card: { title: 'Building Vitals' } },
  args: { vitals: buildingVitals, summary: "The building's vitals, updating as new readings arrive." },
  render: function LiveVitals(args) {
    const [step, setStep] = useState(0);
    useEffect(() => {
      const timer = setInterval(() => setStep((current) => current + 1), 2000);
      return () => clearInterval(timer);
    }, []);
    const vitals = useMemo(
      () => args.vitals.map((vital, i) => ({ ...vital, value: Math.round(vital.value * (1 + 0.12 * Math.sin(step * 1.1 + i * 2))) })),
      [args.vitals, step],
    );
    return <VitalsGauge {...args} vitals={vitals.map((vital) => ({ ...vital, value: Math.min(vital.max, vital.value) }))} />;
  },
};
