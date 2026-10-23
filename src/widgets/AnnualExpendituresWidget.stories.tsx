import Box from '@mui/material/Box';
import type { Meta, StoryObj } from '@storybook/react-vite';
import { expect, waitFor } from 'storybook/test';
import { portfolio } from 'src/fixtures/data';
import { AnnualExpendituresWidget } from 'src/widgets/AnnualExpendituresWidget';

const client = portfolio.clients.find((candidate) => !candidate.tenant && !candidate.parent_client)!;
const building = portfolio.buildings.find(({ name }) => name === '350 Park Avenue')!;

/**
 * The annual expenditures recipe against the mock API (Guides → Data layer): the sample portfolio's
 * capital and approved carbon plans, by year and property.
 *
 * @summary Committed capital spend by year, stacked by property, fetched and mapped from the API.
 */
const meta = {
  title: 'Widgets/Annual expenditures',
  component: AnnualExpendituresWidget,
  tags: ['!autodocs'],
  decorators: [(Story) => <Box sx={{ maxWidth: 720 }}>{Story()}</Box>],
  args: { scope: { client: client.id } },
} satisfies Meta<typeof AnnualExpendituresWidget>;

export default meta;
type Story = StoryObj<typeof meta>;

/** Eight properties: the five with the most spend keep their colors, and the rest are grouped into Other. */
export const Portfolio: Story = {
  play: async ({ canvas }) => {
    const figure = await canvas.findByRole('figure', { name: /of capital is committed across 8 properties/ }, { timeout: 5000 });
    await waitFor(() => expect(figure.querySelector('canvas')).not.toBeNull());
  },
};

/** One building (`{ location: id }`): one series, its spend by year. */
export const Building: Story = {
  args: { scope: { location: building.id } },
};
