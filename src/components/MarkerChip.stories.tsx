import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import CardHeader from '@mui/material/CardHeader';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';
import type { Meta, StoryObj } from '@storybook/react-vite';
import { expect, fn } from 'storybook/test';
import { MarkedCard, MarkerChip } from 'src/components/MarkerChip';

/**
 * Kilowatt's `MarkerChip`: a round icon chip in the brand-blue tint that says something lives on the
 * card, row or title beside it, widening to its label on hover or keyboard focus.
 */
const meta = {
  title: 'Data display/MarkerChip',
  component: MarkerChip,
  tags: ['!autodocs'],
  // The MUI components this page documents; docs.test.ts checks its MUI departures section against them.
  parameters: { muiComponents: ['Chip', 'Collapse'] },
  args: {
    icon: 'lightbulb',
    label: '$12,400 a year',
    'aria-label': '2 savings opportunities on Energy Use, $12,400 a year. Open',
    onClick: fn(),
  },
} satisfies Meta<typeof MarkerChip>;

export default meta;
type Story = StoryObj<typeof meta>;

/** On a card's corner, at 32px: over the top-left corner, outside the card, widening over the title. */
export const OnCardCorner: Story = {
  render: (args) => (
    <Box sx={{ width: 320, p: 2 }}>
      <MarkedCard marker={<MarkerChip {...args} />}>
        <Card variant="outlined">
          <CardHeader title="Energy Use" />
          <CardContent>
            <Typography variant="h4" component="p" sx={{ fontVariantNumeric: 'tabular-nums' }}>
              1,284,000 kWh
            </Typography>
          </CardContent>
        </Card>
      </MarkedCard>
    </Box>
  ),
  play: async ({ args, canvas, userEvent }) => {
    await userEvent.click(canvas.getByRole('button', { name: /savings opportunities on Energy Use/ }));
    await expect(args.onClick).toHaveBeenCalledOnce();
  },
};

/** Beside a title, at 24px (`size="small"`), on the title's line. */
export const BesideTitle: Story = {
  args: { size: 'small', 'aria-label': '1 savings opportunity on Building A, $3,200 a year. Open', label: '$3,200 a year' },
  render: (args) => (
    <Stack direction="row" sx={{ gap: 1, alignItems: 'center' }}>
      <Typography variant="h3" component="h1">
        Building A
      </Typography>
      <MarkerChip {...args} />
    </Stack>
  ),
};

/** A marker that opens a dialog says so (`aria-haspopup="dialog"`), so assistive tech announces what a click opens; its label's figures are tabular. */
export const OpensDialog: Story = {
  name: 'Opens a dialog',
  args: { 'aria-haspopup': 'dialog', label: '$12,400 a year' },
  render: (args) => (
    <Box sx={{ p: 2 }}>
      <MarkerChip {...args} />
    </Box>
  ),
  play: async ({ canvas }) => {
    await expect(canvas.getByRole('button', { name: /savings opportunities on Energy Use/ })).toHaveAttribute('aria-haspopup', 'dialog');
  },
};

/** While what it marks is unread (`alerting`), a ring pulses out every 3 seconds; it stops on hover and under reduced motion. */
export const Unread: Story = {
  args: { alerting: true },
  render: (args) => (
    <Box sx={{ p: 2 }}>
      <MarkerChip {...args} />
    </Box>
  ),
};
