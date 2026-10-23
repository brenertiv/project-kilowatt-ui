import Box from '@mui/material/Box';
import type { Meta, StoryObj } from '@storybook/react-vite';
import { expect, waitFor } from 'storybook/test';
import { portfolio } from 'src/fixtures/data';
import { EmissionsForecastWidget } from 'src/widgets/EmissionsForecastWidget';

const client = portfolio.clients.find((candidate) => !candidate.tenant && !candidate.parent_client)!;

/** The emissions forecast recipe against the mock API (Guides → Data layer): the sample portfolio's monthly emissions, measured and projected. *
 * @summary Monthly emissions measured and projected a year ahead, fetched and mapped from the API.
 */
const meta = {
  title: 'Widgets/Emissions forecast',
  component: EmissionsForecastWidget,
  tags: ['!autodocs'],
  decorators: [(Story) => <Box sx={{ maxWidth: 720 }}>{Story()}</Box>],
  args: { scope: { client: client.id }, from: '2024-01-01', to: '2026-10-31' },
} satisfies Meta<typeof EmissionsForecastWidget>;

export default meta;
type Story = StoryObj<typeof meta>;

/**
 * Measured through September 2026, then projected to September 2027, dashed. The two buildings with gaps
 * in their records are left out, and named under the chart, so the months compare like for like.
 */
export const Portfolio: Story = {
  play: async ({ canvas }) => {
    const figure = await canvas.findByRole('figure', { name: /projected to reach/ }, { timeout: 5000 });
    await waitFor(() => expect(figure.querySelector('canvas')).not.toBeNull());
    await expect(canvas.getByText(/Left out for gaps/)).toHaveTextContent('55 Water Street');
  },
};

/** Less than two years measured: the months are shown, and there's no projection to draw. */
export const ShortHistory: Story = {
  args: { from: '2026-01-01' },
  play: async ({ canvas }) => {
    await expect(await canvas.findByRole('figure', { name: /enough history/ }, { timeout: 5000 })).toBeVisible();
  },
};
