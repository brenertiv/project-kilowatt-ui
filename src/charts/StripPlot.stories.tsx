import type { Meta, StoryObj } from '@storybook/react-vite';
import { expect, waitFor } from 'storybook/test';
import { StripPlot } from 'src/charts/StripPlot';
import { certificationScore, energyStarByProperty } from 'src/fixtures/charts';
import { inCard } from 'src/stories/decorators';

const eligible = energyStarByProperty.filter(({ score }) => score >= certificationScore).length;
const references = [{ value: certificationScore, label: 'Certification' }];

/**
 * Kilowatt's reference strip plot: amCharts 5 through `useChart`, every item a dot in its group's row.
 * Each story shows it in a `Card` under a `CardHeader`, as it ships.
 */
const meta = {
  title: 'Charts/Strip plot',
  component: StripPlot,
  tags: ['!autodocs'],
  decorators: [inCard],
} satisfies Meta<typeof StripPlot>;

export default meta;
type Story = StoryObj<typeof meta>;

/** Each property's ENERGY STAR score, one row per property type, against the score of 75 that certification takes. */
export const AgainstThreshold: Story = {
  name: 'Against a threshold',
  parameters: { card: { title: 'ENERGY STAR Scores by Type' } },
  args: {
    data: energyStarByProperty,
    categoryField: 'type',
    valueField: 'score',
    labelField: 'property',
    name: 'ENERGY STAR score',
    max: 100,
    references,
    summary: `${eligible} of ${energyStarByProperty.length} properties score ${certificationScore} or more and can be certified; industrial properties score highest and retail lowest.`,
  },
  play: async ({ canvas }) => {
    const figure = canvas.getByRole('figure', { name: /can be certified/ });
    await waitFor(() => expect(figure.querySelector('canvas')).not.toBeNull());
  },
};
