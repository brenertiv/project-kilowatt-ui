import { Button } from '@base-ui/react/button';
import type { Meta, StoryObj } from '@storybook/react-vite';
import { fn } from 'storybook/test';
import { MoreIcon, PlusIcon } from '../icons';

/** The parts a button recipe varies. There is no Button component: use Base UI's `Button` with a `ui-btn` class. */
type ButtonArgs = {
  /** The button text. */
  label: string;
  /** Turns the button off. */
  disabled: boolean;
  onClick: () => void;
};

const meta = {
  title: 'Primitives/Button',
  args: { label: 'Dispatch ticket', disabled: false, onClick: fn() },
  argTypes: { onClick: { control: false } },
} satisfies Meta<ButtonArgs>;

export default meta;
type Story = StoryObj<ButtonArgs>;

/** The main action on a screen or in a dialog: `ui-btn ui-btn-solid`. Use one per view. */
export const Primary: Story = {
  render: ({ label, disabled, onClick }) => (
    <Button className="ui-btn ui-btn-solid" disabled={disabled} onClick={onClick}>
      {label}
    </Button>
  ),
};

/** Any other action beside the primary one, or a standalone action: plain `ui-btn` (outlined). */
export const Secondary: Story = {
  args: { label: 'Export CSV' },
  render: ({ label, disabled, onClick }) => (
    <Button className="ui-btn" disabled={disabled} onClick={onClick}>
      {label}
    </Button>
  ),
};

/** A low-emphasis action in toolbars, table rows and card headers: `ui-btn ui-btn-ghost`. */
export const Ghost: Story = {
  args: { label: 'View all' },
  render: ({ label, disabled, onClick }) => (
    <Button className="ui-btn ui-btn-ghost" disabled={disabled} onClick={onClick}>
      {label}
    </Button>
  ),
};

/** A leading icon that names the action: put the icon before the text inside any `ui-btn` variant. */
export const WithIcon: Story = {
  args: { label: 'New work order' },
  render: ({ label, disabled, onClick }) => (
    <Button className="ui-btn ui-btn-solid" disabled={disabled} onClick={onClick}>
      <PlusIcon />
      {label}
    </Button>
  ),
};

/** An icon-only button for dense UI: `ui-icon-btn`. Always give it an `aria-label`; `label` is used for that here. */
export const IconButton: Story = {
  name: 'Icon button',
  args: { label: 'More actions' },
  render: ({ label, disabled, onClick }) => (
    <Button className="ui-icon-btn" aria-label={label} disabled={disabled} onClick={onClick}>
      <MoreIcon />
    </Button>
  ),
};

/** An action that is not available yet. Prefer explaining why nearby over a silent disabled button. */
export const Disabled: Story = {
  args: { disabled: true },
  render: ({ label, disabled, onClick }) => (
    <Button className="ui-btn ui-btn-solid" disabled={disabled} onClick={onClick}>
      {label}
    </Button>
  ),
};

/**
 * While the action runs: disable the button but keep it focusable (`focusableWhenDisabled`) so focus is not lost,
 * mark it `aria-busy`, and change the text to say what is happening.
 */
export const Loading: Story = {
  args: { label: 'Dispatching…', disabled: true },
  render: ({ label, disabled, onClick }) => (
    <Button className="ui-btn ui-btn-solid" disabled={disabled} focusableWhenDisabled aria-busy={disabled} onClick={onClick}>
      {label}
    </Button>
  ),
};
