import Box from '@mui/material/Box';
import type { Meta, StoryObj } from '@storybook/react-vite';
import { expect, fn } from 'storybook/test';
import { StackingPlanCard, type StackingFloor } from 'src/components/StackingPlan';

/** A made-up building: four floors of tenant spaces, a roof of plant, and a lobby beside the ground-floor retail. */
const floors: StackingFloor[] = [
  { key: 'RF', label: 'Roof', spaces: [{ id: 'rf-1', name: 'Roof', kind: 'common', type: 'Mechanical' }] },
  {
    key: 'F12',
    label: '12',
    spaces: [
      { id: 'f12-1', name: 'Suite 1201', area: 12400, tenant: 'Northwind Logistics' },
      { id: 'f12-2', name: 'Suite 1202', area: 6200 },
    ],
  },
  {
    key: 'F11',
    label: '11',
    spaces: [
      { id: 'f11-1', name: 'Suite 1101', area: 9300, tenant: 'Ridgeline Dental' },
      { id: 'f11-2', name: 'Suite 1102', area: 4700, tenant: 'Summit Legal' },
      { id: 'f11-3', name: 'Suite 1103', area: 4600 },
    ],
  },
  {
    key: 'F10',
    label: '10',
    spaces: [{ id: 'f10-1', name: 'Suite 1001', area: 18600, tenant: 'Bluewater Analytics' }],
  },
  {
    key: 'F1',
    label: '1',
    spaces: [
      { id: 'f1-1', name: 'Lobby', kind: 'common', type: 'Lobby' },
      { id: 'f1-2', name: 'Retail A', area: 5100, tenant: 'Copper Kettle Café' },
      { id: 'f1-3', name: 'Retail B', area: 3900 },
    ],
  },
];

/**
 * Kilowatt's `StackingPlanCard`: one building's floors as rows of spaces sized by area, leased spaces tinted
 * with the first series slot, every space naming its occupant. Each story shows it at a card's width.
 */
const meta = {
  title: 'Charts/Stacking plan',
  component: StackingPlanCard,
  tags: ['!autodocs'],
  // The MUI components this page documents; docs.test.ts checks its MUI departures section against them.
  parameters: { muiComponents: ['Box', 'ButtonBase', 'Card', 'CardContent', 'CardHeader', 'Stack', 'Typography'] },
  decorators: [
    (Story) => (
      <Box sx={{ maxWidth: 560 }}>
        <Story />
      </Box>
    ),
  ],
  args: { name: 'Harbor Point', floors },
} satisfies Meta<typeof StackingPlanCard>;

export default meta;
type Story = StoryObj<typeof meta>;

/** A building with several floors: the header counts the floors with tenant spaces and the spaces leased; the legend names Leased and Vacant or Common Area. */
export const Building: Story = {
  play: async ({ canvas }) => {
    await expect(canvas.getByRole('figure', { name: 'Harbor Point stacking plan' })).toBeVisible();
    await expect(canvas.getByText('4 floors · 5 of 8 spaces leased')).toBeVisible();
    await expect(canvas.getByRole('list', { name: '12' })).toBeVisible();
    await expect(canvas.getByText('Northwind Logistics')).toBeVisible();
    await expect(canvas.getAllByText('Vacant')).toHaveLength(3);
    await expect(canvas.getByText('Vacant or Common Area')).toBeVisible();
    await expect(canvas.queryByRole('button')).toBeNull();
  },
};

/** A building with no plan: `floors` is `null`, the subheader says so, and the card has no body. */
export const NoPlan: Story = {
  name: 'No plan',
  args: { name: 'Lakeside Commons', floors: null },
  play: async ({ canvas }) => {
    await expect(canvas.getByText('No floors or spaces recorded.')).toBeVisible();
    await expect(canvas.queryByRole('figure')).toBeNull();
  },
};

/** Spaces that open their record: with `onOpen`, each space is a button named for the space and its occupant. */
export const OpensRecords: Story = {
  name: 'Opens records',
  args: { onOpen: fn() },
  play: async ({ args, canvas, userEvent }) => {
    await userEvent.click(canvas.getByRole('button', { name: 'Suite 1201, Northwind Logistics: open its record' }));
    await expect(args.onOpen).toHaveBeenCalledOnce();
    await expect(args.onOpen).toHaveBeenCalledWith(expect.objectContaining({ id: 'f12-1' }));
  },
};
