import Rating from '@mui/material/Rating';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';
import type { Meta, StoryObj } from '@storybook/react-vite';
import { expect, fn } from 'storybook/test';

/**
 * MUI's `Rating`, used as MUI documents it. Kilowatt has no wrapper: the theme's
 * departures (Foundations → MUI departures) are the only differences from stock MUI.
 */
const meta = {
  title: 'Components/Rating',
  component: Rating,
  tags: ['!autodocs'],
  // The MUI components this page documents; docs.test.ts checks its MUI departures section against them.
  parameters: { muiComponents: ['Rating'] },
  argTypes: {
    size: { control: 'inline-radio', options: ['small', 'medium', 'large'] },
    precision: { control: 'inline-radio', options: [1, 0.5] },
    onChange: { control: false },
  },
} satisfies Meta<typeof Rating>;

export default meta;
type Story = StoryObj<typeof meta>;

/** A score people give, such as feedback on a closed work order: a labelled `Rating` with a `name`. */
export const Basic: Story = {
  args: { name: 'vendor-rating', onChange: fn() },
  render: (args) => (
    <Stack spacing={0.5}>
      <Typography component="legend">Vendor Rating</Typography>
      <Rating {...args} />
    </Stack>
  ),
  play: async ({ args, canvas, userEvent }) => {
    await userEvent.click(canvas.getByRole('radio', { name: '4 Stars' }));
    await expect(args.onChange).toHaveBeenCalledOnce();
  },
};

/** A score shown, not given: `readOnly`. The accessible name reads the value, such as "3.5 Stars". */
export const ReadOnly: Story = {
  name: 'Read only',
  args: { value: 3.5, precision: 0.5, readOnly: true },
};

/** Half steps: `precision={0.5}`. */
export const HalfPrecision: Story = {
  name: 'Half precision',
  args: { name: 'half-rating', defaultValue: 2.5, precision: 0.5 },
};

/** A score that can't be changed here: `disabled`. Say nearby why. */
export const Disabled: Story = {
  args: { name: 'disabled-rating', value: 2, disabled: true },
};

/** MUI's three sizes. Keep `medium`, the default; another size is for a one-off instance. */
export const Sizes: Story = {
  render: () => (
    <Stack spacing={1}>
      <Rating name="size-small" defaultValue={3} size="small" />
      <Rating name="size-medium" defaultValue={3} />
      <Rating name="size-large" defaultValue={3} size="large" />
    </Stack>
  ),
};
