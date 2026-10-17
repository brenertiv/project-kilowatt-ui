import Fab from '@mui/material/Fab';
import Stack from '@mui/material/Stack';
import type { Meta, StoryObj } from '@storybook/react-vite';
import { expect, fn } from 'storybook/test';
import { Icon } from 'src/icons';

/**
 * MUI's `Fab` (floating action button), used as MUI documents it. Kilowatt has no
 * wrapper: the theme's departures (Foundations → MUI departures) are the only differences
 * from stock MUI.
 */
const meta = {
  title: 'Components/Fab',
  component: Fab,
  tags: ['!autodocs'],
  // The MUI components this page documents; docs.test.ts checks its MUI departures section against them.
  parameters: { muiComponents: ['Fab'] },
  args: { color: 'primary' },
  argTypes: {
    variant: { control: 'inline-radio', options: ['circular', 'extended'] },
    color: {
      control: 'select',
      options: ['default', 'primary', 'secondary', 'error', 'warning', 'info', 'success', 'inherit'],
    },
    size: { control: 'inline-radio', options: ['small', 'medium', 'large'] },
    onClick: { control: false },
  },
} satisfies Meta<typeof Fab>;

export default meta;
type Story = StoryObj<typeof meta>;

/** The one main action on a screen, floating above the content: an icon-only `Fab` with an `aria-label`. */
export const Circular: Story = {
  args: { 'aria-label': 'New Work Order', children: <Icon name="add" />, onClick: fn() },
  play: async ({ args, canvas, userEvent }) => {
    await userEvent.click(canvas.getByRole('button', { name: 'New Work Order' }));
    await expect(args.onClick).toHaveBeenCalledOnce();
  },
};

/** The main action with a label, when the icon alone isn't clear: `variant="extended"`. */
export const Extended: Story = {
  render: (args) => (
    <Fab {...args} variant="extended">
      <Icon name="add" sx={{ mr: 1 }} />
      New Work Order
    </Fab>
  ),
};

/** MUI's three sizes. `medium` is the default (MUI's is `large`); another size is for a one-off instance. */
export const Sizes: Story = {
  render: (args) => (
    <Stack direction="row" spacing={2} sx={{ alignItems: 'center' }}>
      {(['small', 'medium', 'large'] as const).map((size) => (
        <Fab key={size} {...args} size={size} aria-label={`Edit (${size})`}>
          <Icon name="edit" />
        </Fab>
      ))}
    </Stack>
  ),
};

/** `color` takes a palette intent; `primary` is the usual one, `default` a neutral surface. */
export const Colors: Story = {
  render: () => (
    <Stack direction="row" spacing={2}>
      <Fab color="primary" aria-label="Add">
        <Icon name="add" />
      </Fab>
      <Fab color="secondary" aria-label="Edit">
        <Icon name="edit" />
      </Fab>
      <Fab aria-label="Refresh">
        <Icon name="refresh" />
      </Fab>
    </Stack>
  ),
};

/** An action that isn't available yet: `disabled`. Say nearby why. */
export const Disabled: Story = {
  args: { 'aria-label': 'New Work Order', children: <Icon name="add" />, disabled: true },
};
