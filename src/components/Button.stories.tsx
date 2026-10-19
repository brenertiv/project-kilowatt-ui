import Button from '@mui/material/Button';
import IconButton from '@mui/material/IconButton';
import Stack from '@mui/material/Stack';
import type { Meta, StoryObj } from '@storybook/react-vite';
import { expect, fn } from 'storybook/test';
import { Icon } from 'src/icons';

/**
 * MUI's `Button` and `IconButton`, used as MUI documents them. Kilowatt has no
 * wrapper: the theme's departures (Foundations → MUI departures) are the only
 * differences from stock MUI. Args hold only values that differ from MUI's
 * defaults, so each story's snippet shows only the props that matter.
 */
const meta = {
  title: 'Inputs/Button',
  component: Button,
  tags: ['!autodocs'],
  // The MUI components this page documents; docs.test.ts checks its MUI departures section against them.
  parameters: { muiComponents: ['Button', 'IconButton'] },
  args: { children: 'Dispatch Ticket' },
  argTypes: {
    variant: { control: 'inline-radio', options: ['contained', 'outlined', 'text'] },
    color: { control: 'select', options: ['primary', 'secondary', 'error', 'warning', 'info', 'success', 'inherit'] },
    size: { control: 'inline-radio', options: ['small', 'medium', 'large'] },
    onClick: { control: false },
  },
} satisfies Meta<typeof Button>;

export default meta;
type Story = StoryObj<typeof meta>;

const intents = ['primary', 'secondary', 'error', 'warning', 'info', 'success'] as const;
/** Labels are written in Title Case (the `button-text-case` departure); the theme shows them as written. */
const intentLabels = { primary: 'Primary', secondary: 'Secondary', error: 'Error', warning: 'Warning', info: 'Info', success: 'Success' };
const sizeLabels = { small: 'Small', medium: 'Medium', large: 'Large' };

/** The main action in a view or dialog: `variant="contained"`, high emphasis. One per view. */
export const Contained: Story = {
  args: { variant: 'contained', onClick: fn() },
  play: async ({ args, canvas, userEvent }) => {
    await userEvent.click(canvas.getByRole('button', { name: 'Dispatch Ticket' }));
    await expect(args.onClick).toHaveBeenCalledOnce();
  },
};

/** A secondary action beside the main one, or a standalone action: `variant="outlined"`, medium emphasis. */
export const Outlined: Story = {
  args: { variant: 'outlined', children: 'Export CSV' },
};

/** A low-emphasis action in toolbars, table rows, cards and dialogs: `variant="text"`, MUI's default. */
export const Text: Story = {
  args: { variant: 'text', children: 'View All' },
};

/** Each palette intent in each variant. Use an intent for meaning (`error` to confirm a destructive action), not decoration. */
export const Intents: Story = {
  render: (args) => (
    <Stack spacing={2}>
      {(['contained', 'outlined', 'text'] as const).map((variant) => (
        <Stack key={variant} direction="row" spacing={1} useFlexGap sx={{ flexWrap: 'wrap' }}>
          {intents.map((color) => (
            <Button key={color} {...args} variant={variant} color={color}>
              {intentLabels[color]}
            </Button>
          ))}
        </Stack>
      ))}
    </Stack>
  ),
};

/** MUI's three sizes. Keep `medium`, the default; another size is for a one-off instance. */
export const Sizes: Story = {
  args: { variant: 'contained' },
  render: (args) => (
    <Stack direction="row" spacing={1} sx={{ alignItems: 'center' }}>
      {(['small', 'medium', 'large'] as const).map((size) => (
        <Button key={size} {...args} size={size} startIcon={<Icon name="add" />}>
          {sizeLabels[size]}
        </Button>
      ))}
    </Stack>
  ),
};

/** A leading icon that names the action: pass an `Icon` as `startIcon`. The button sizes it. */
export const StartIcon: Story = {
  name: 'Start icon',
  args: { variant: 'contained', children: 'New Work Order', startIcon: <Icon name="add" /> },
};

/** A trailing icon for direction or disclosure (opens a menu, leaves the page): `endIcon`. */
export const EndIcon: Story = {
  name: 'End icon',
  args: { variant: 'outlined', children: 'Open Report', endIcon: <Icon name="arrow_outward" /> },
};

/** An icon-only action for dense UI: MUI's `IconButton`. It always needs an `aria-label`, since the icon is hidden from assistive technology. */
export const IconOnly: Story = {
  name: 'Icon only',
  args: { onClick: fn() },
  render: (args) => (
    <Stack direction="row" spacing={1} sx={{ alignItems: 'center' }}>
      {(['small', 'medium', 'large'] as const).map((size) => (
        <IconButton key={size} aria-label={`More actions (${size})`} size={size} onClick={args.onClick}>
          <Icon name="more_horiz" fontSize="inherit" />
        </IconButton>
      ))}
    </Stack>
  ),
  play: async ({ args, canvas, userEvent }) => {
    await userEvent.click(canvas.getByRole('button', { name: 'More actions (medium)' }));
    await expect(args.onClick).toHaveBeenCalledOnce();
  },
};

/** An action that isn't available yet. Say why nearby rather than leaving a silent disabled button. */
export const Disabled: Story = {
  args: { variant: 'contained', disabled: true, onClick: fn() },
  play: async ({ args, canvas }) => {
    const button = canvas.getByRole('button', { name: 'Dispatch Ticket' });
    await expect(button).toBeDisabled();
    await expect(args.onClick).not.toHaveBeenCalled();
  },
};

/** While the action runs: `loading` disables the button and shows a spinner; with `loadingPosition="start"` it replaces the start icon. */
export const Loading: Story = {
  args: { variant: 'contained', loading: true, loadingPosition: 'start', startIcon: <Icon name="add" />, children: 'Dispatching…' },
  play: async ({ canvas }) => {
    await expect(canvas.getByRole('button', { name: /Dispatching/ })).toBeDisabled();
  },
};
