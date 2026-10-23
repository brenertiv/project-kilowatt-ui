import Box from '@mui/material/Box';
import type { Meta, StoryObj } from '@storybook/react-vite';
import { expect, waitFor } from 'storybook/test';
import { portfolio } from 'src/fixtures/data';
import { ExpendituresBreakdownWidget } from 'src/widgets/ExpendituresBreakdownWidget';

const client = portfolio.clients.find((candidate) => !candidate.tenant && !candidate.parent_client)!;

/**
 * The expenditures breakdown recipe against the mock API (Guides → Data layer): the sample portfolio's
 * committed spend, ranked by project type.
 *
 * @summary Committed capital spend ranked by project type as horizontal bars, fetched and mapped from the API.
 */
const meta = {
  title: 'Widgets/Expenditures breakdown',
  component: ExpendituresBreakdownWidget,
  tags: ['!autodocs'],
  decorators: [(Story) => <Box sx={{ maxWidth: 560 }}>{Story()}</Box>],
  args: { scope: { client: client.id } },
} satisfies Meta<typeof ExpendituresBreakdownWidget>;

export default meta;
type Story = StoryObj<typeof meta>;

/** Every project type with committed spend, largest first, in one color: a ranking, not a set of categories. */
export const Portfolio: Story = {
  play: async ({ canvas }) => {
    const figure = await canvas.findByRole('figure', { name: /has the most committed spend/ }, { timeout: 5000 });
    await waitFor(() => expect(figure.querySelector('canvas')).not.toBeNull());
  },
};

/** While the projects load, a skeleton holds the chart's space. */
export const Loading: Story = {
  parameters: { mockApi: { latencyMs: 60_000 } },
  play: async ({ canvas }) => {
    await expect(canvas.getByRole('progressbar', { name: 'Loading capital plans' })).toBeVisible();
  },
};
