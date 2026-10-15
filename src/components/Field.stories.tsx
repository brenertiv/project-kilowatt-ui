import TextField from '@mui/material/TextField';
import type { Meta, StoryObj } from '@storybook/react-vite';
import { fn } from 'storybook/test';
import { tokenContrast } from 'src/stories/a11y';

/** The parts a text field story varies. Use MUI's `TextField` as themed; there is no Kilowatt wrapper. */
type FieldArgs = {
  /** The visible label, wired to the input by `TextField`. */
  label: string;
  placeholder: string;
  /** Help text under the input, passed as `helperText`. */
  helperText: string;
  /** The message shown as `helperText` when the field is invalid. */
  errorText: string;
  onChange: () => void;
};

const meta = {
  title: 'Primitives/Field',
  tags: ['!autodocs'],
  args: {
    label: 'Site name',
    placeholder: 'Enter a site',
    helperText: 'Used on tickets and meter rollups.',
    errorText: 'Site name is required.',
    onChange: fn(),
  },
  argTypes: { onChange: { control: false } },
} satisfies Meta<FieldArgs>;

export default meta;
type Story = StoryObj<FieldArgs>;

/** A labelled text input, the smallest field: `label` and an optional `placeholder`. */
export const Default: Story = {
  render: ({ label, placeholder, onChange }) => <TextField label={label} placeholder={placeholder} onChange={onChange} />,
};

/** A field whose value needs explaining: add `helperText` under the input. */
export const HelperText: Story = {
  name: 'Helper text',
  render: ({ label, placeholder, helperText, onChange }) => (
    <TextField label={label} placeholder={placeholder} defaultValue="120 Broadway" helperText={helperText} onChange={onChange} />
  ),
};

/** Failed validation: set `error` and put the fix in `helperText` in place of the help text. */
export const Invalid: Story = {
  name: 'Error',
  render: ({ label, errorText, onChange }) => <TextField label={label} defaultValue="" error helperText={errorText} onChange={onChange} />,
};

/** A value the user cannot change here: `disabled`, with help text saying who can. */
export const Disabled: Story = {
  // Contrast off: MUI sets a disabled field's helper text in textDisabled, 2.7:1 on backgroundDefault. See src/stories/a11y.ts.
  parameters: { a11y: tokenContrast },
  args: { helperText: 'Managed by the portfolio owner.' },
  render: ({ label, helperText, onChange }) => (
    <TextField label={label} defaultValue="120 Broadway" disabled helperText={helperText} onChange={onChange} />
  ),
};

/** A field the form cannot be saved without: `required` marks the label and the input. */
export const Required: Story = {
  render: ({ label, placeholder, helperText, onChange }) => (
    <TextField label={label} placeholder={placeholder} required helperText={helperText} onChange={onChange} />
  ),
};
