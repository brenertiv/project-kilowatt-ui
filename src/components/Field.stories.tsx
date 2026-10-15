import { Field } from '@base-ui/react/field';
import { Input } from '@base-ui/react/input';
import type { Meta, StoryObj } from '@storybook/react-vite';

/** The parts a text field recipe varies. There is no Field component: compose Base UI's `Field` and `Input` with `ui-*` classes. */
type FieldArgs = {
  /** The visible label, wired to the input by `Field.Root`. */
  label: string;
  placeholder: string;
  /** Help text under the input. */
  description: string;
  /** The message `Field.Error` shows when the field is invalid. */
  error: string;
};

const meta = {
  title: 'Primitives/Field',
  tags: ['!autodocs'],
  args: {
    label: 'Site name',
    placeholder: 'Enter a site',
    description: 'Used on tickets and meter rollups.',
    error: 'Site name is required.',
  },
} satisfies Meta<FieldArgs>;

export default meta;
type Story = StoryObj<FieldArgs>;

/** A labelled text input with help text: `ui-field` wraps `ui-label`, `ui-input` and `ui-description`. */
export const Default: Story = {
  render: ({ label, placeholder, description }) => (
    <Field.Root className="ui-field" name="site">
      <Field.Label className="ui-label">{label}</Field.Label>
      <Input className="ui-input" defaultValue="120 Broadway" placeholder={placeholder} />
      <Field.Description className="ui-description">{description}</Field.Description>
    </Field.Root>
  ),
};

/** The smallest field: a label and an input with a placeholder, no help text. */
export const Empty: Story = {
  render: ({ label, placeholder }) => (
    <Field.Root className="ui-field" name="site">
      <Field.Label className="ui-label">{label}</Field.Label>
      <Input className="ui-input" placeholder={placeholder} />
    </Field.Root>
  ),
};

/** Failed validation: set `invalid` on `Field.Root` and show the reason in `Field.Error` (with `match`) in place of the help text. */
export const Invalid: Story = {
  render: ({ label, error }) => (
    <Field.Root className="ui-field" name="site" invalid>
      <Field.Label className="ui-label">{label}</Field.Label>
      <Input className="ui-input" defaultValue="" />
      <Field.Error className="ui-description ui-field-error" match>
        {error}
      </Field.Error>
    </Field.Root>
  ),
};

/** A read-only value the user cannot change here: `disabled` on `Field.Root`, with help text saying who can. */
export const Disabled: Story = {
  args: { description: 'Managed by the portfolio owner.' },
  render: ({ label, description }) => (
    <Field.Root className="ui-field" name="site" disabled>
      <Field.Label className="ui-label">{label}</Field.Label>
      <Input className="ui-input" defaultValue="120 Broadway" />
      <Field.Description className="ui-description">{description}</Field.Description>
    </Field.Root>
  ),
};
