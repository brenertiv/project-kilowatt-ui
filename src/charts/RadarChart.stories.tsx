import type { Meta, StoryObj } from '@storybook/react-vite';
import { expect, waitFor } from 'storybook/test';
import { RadarChart } from 'src/charts/RadarChart';
import { buildingIntensity } from 'src/fixtures/charts';
import { inCard } from 'src/stories/decorators';

const highest = [...buildingIntensity].sort((a, b) => b.current - a.current)[0];
const lowestScore = [...buildingIntensity].sort((a, b) => a.score - b.score)[0];
const thisYear = [{ field: 'current', name: 'Last 12 months' }];
const withPrevious = [...thisYear, { field: 'previous', name: '12 months before', neutral: true, dashed: true }];
const scores = [{ field: 'score', name: 'ENERGY STAR score' }];

/**
 * Kilowatt's reference radar chart: amCharts 5 through `useChart`, colored from the palette.
 * Each story shows it in a `Card` under a `CardHeader`, as it ships.
 */
const meta = {
  title: 'Charts/Radar',
  component: RadarChart,
  tags: ['!autodocs'],
  decorators: [inCard],
} satisfies Meta<typeof RadarChart>;

export default meta;
type Story = StoryObj<typeof meta>;

/** One measure across eight buildings: each building is a spoke, values start at 0 at the center, and the outline shows which stand out. */
export const Buildings: Story = {
  parameters: { card: { title: 'Energy Use Intensity by Building' } },
  args: {
    data: buildingIntensity,
    categoryField: 'building',
    series: thisYear,
    unit: 'kBtu/sq ft',
    summary: `${highest.building} has the highest energy use intensity of eight buildings, ${highest.current} kBtu per square foot.`,
  },
  play: async ({ canvas }) => {
    const figure = canvas.getByRole('figure', { name: /highest energy use intensity/ });
    await waitFor(() => expect(figure.querySelector('canvas')).not.toBeNull());
  },
};

/** This period against the one before: the comparison is `neutral` and `dashed`, an outline with no fill, so the current period is the one colored shape. */
export const Comparison: Story = {
  parameters: { card: { title: 'Energy Use Intensity by Building' } },
  args: {
    data: buildingIntensity,
    categoryField: 'building',
    series: withPrevious,
    unit: 'kBtu/sq ft',
    summary: `Energy use intensity fell at every one of eight buildings on the 12 months before; ${highest.building} is still the highest, at ${highest.current} kBtu per square foot.`,
  },
};

/** A score on its fixed range (`max`): every spoke runs from 0 to 100, so the outline's distance from the rim is the room to improve. */
export const Scores: Story = {
  parameters: { card: { title: 'ENERGY STAR Score by Building' } },
  args: {
    data: buildingIntensity,
    categoryField: 'building',
    series: scores,
    unit: 'pts',
    max: 100,
    summary: `ENERGY STAR scores across eight buildings; ${lowestScore.building} is the lowest, at ${lowestScore.score}.`,
  },
};
