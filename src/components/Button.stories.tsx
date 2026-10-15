import Button from '@mui/material/Button';
import MuiIconButton from '@mui/material/IconButton';
import Stack from '@mui/material/Stack';
import type { Meta, StoryObj } from '@storybook/react-vite';
import { fn } from 'storybook/test';
import { MoreIcon, PlusIcon } from 'src/icons';
import { tokenContrast } from 'src/stories/a11y';

/** The parts a button story varies. Use MUI's `Button` and `IconButton` as themed; there is no Kilowatt wrapper. */
type ButtonArgs = {
  /** The button text, in sentence case. For an icon button, its `aria-label`. */
  label: string;
  /** Turns the button off. */
  disabled: boolean;
  onClick: () => void;
};

const meta = {
  title: 'Primitives/Button',
  tags: ['!autodocs'],
  args: { label: 'Dispatch ticket', disabled: false, onClick: fn() },
  argTypes: { onClick: { control: false } },
} satisfies Meta<ButtonArgs>;

export default meta;
type Story = StoryObj<ButtonArgs>;

/** The main action on a screen or in a dialog: `variant="contained"`. Use one per view. */
export const Primary: Story = {
  render: ({ label, disabled, onClick }) => (
    <Button variant="contained" disabled={disabled} onClick={onClick}>
      {label}
    </Button>
  ),
};

/** Any other action beside the primary one, or a standalone action: `variant="outlined"`. */
export const Secondary: Story = {
  args: { label: 'Export CSV' },
  render: ({ label, disabled, onClick }) => (
    <Button variant="outlined" disabled={disabled} onClick={onClick}>
      {label}
    </Button>
  ),
};

/** A low-emphasis action in toolbars, table rows and card headers: `variant="text"`, MUI's default. */
export const Text: Story = {
  args: { label: 'View all' },
  render: ({ label, disabled, onClick }) => (
    <Button variant="text" disabled={disabled} onClick={onClick}>
      {label}
    </Button>
  ),
};

/** A leading icon that names the action: pass an icon from `src/icons` as `startIcon`. */
export const WithIcon: Story = {
  name: 'With icon',
  args: { label: 'New work order' },
  render: ({ label, disabled, onClick }) => (
    <Button variant="contained" startIcon={<PlusIcon />} disabled={disabled} onClick={onClick}>
      {label}
    </Button>
  ),
};

/** An icon-only action for dense UI: MUI's `IconButton`. Always give it an `aria-label`; `label` is used for that here. */
export const IconButton: Story = {
  name: 'Icon button',
  // Contrast off: MUI's action.active icon color on backgroundDefault is 4.44:1. axe reads the icon ligature as
  // text (4.5:1); as a graphic it needs 3:1, which it passes. See src/stories/a11y.ts.
  parameters: { a11y: tokenContrast },
  args: { label: 'More actions' },
  render: ({ label, disabled, onClick }) => (
    <MuiIconButton aria-label={label} disabled={disabled} onClick={onClick}>
      <MoreIcon />
    </MuiIconButton>
  ),
};

/** An action that is not available yet. Prefer explaining why nearby over a silent disabled button. */
export const Disabled: Story = {
  args: { disabled: true },
  render: ({ label, disabled, onClick }) => (
    <Stack direction="row" spacing={1}>
      <Button variant="contained" disabled={disabled} onClick={onClick}>
        {label}
      </Button>
      <Button variant="outlined" disabled={disabled} onClick={onClick}>
        Export CSV
      </Button>
    </Stack>
  ),
};

/** While the action runs: set `loading`, which disables the button and shows a spinner, and say what is happening in the label. */
export const Loading: Story = {
  args: { label: 'Dispatching…' },
  render: ({ label, onClick }) => (
    <Button variant="contained" loading loadingPosition="start" startIcon={<PlusIcon />} onClick={onClick}>
      {label}
    </Button>
  ),
};
