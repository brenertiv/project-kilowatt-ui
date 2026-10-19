import InputAdornment from '@mui/material/InputAdornment';
import Stack from '@mui/material/Stack';
import TextField from '@mui/material/TextField';
import type { Meta, StoryObj } from '@storybook/react-vite';
import { expect, fn } from 'storybook/test';
import { Icon } from 'src/icons';

/**
 * MUI's `TextField`, used as MUI documents it. Kilowatt has no wrapper: the theme's
 * departures (Foundations → MUI departures) are the only differences from stock MUI.
 */
const meta = {
  title: 'Inputs/TextField',
  component: TextField,
  tags: ['!autodocs'],
  // The MUI components this page documents; docs.test.ts checks its MUI departures section against them.
  parameters: { muiComponents: ['TextField'] },
  args: { label: 'Work Order Title' },
  argTypes: {
    variant: { control: 'inline-radio', options: ['outlined', 'filled', 'standard'] },
    size: { control: 'inline-radio', options: ['small', 'medium'] },
    onChange: { control: false },
  },
} satisfies Meta<typeof TextField>;

export default meta;
type Story = StoryObj<typeof meta>;

/** A single line of free text: MUI's default `outlined` variant with a `label`. */
export const Outlined: Story = {
  args: { onChange: fn() },
  play: async ({ args, canvas, userEvent }) => {
    const input = canvas.getByRole('textbox', { name: 'Work Order Title' });
    await userEvent.type(input, 'Replace AHU filter');
    await expect(input).toHaveValue('Replace AHU filter');
    await expect(args.onChange).toHaveBeenCalled();
  },
};

/** Guidance that stays visible under the field: `helperText`. Say what format or range is expected. */
export const HelperText: Story = {
  name: 'Helper text',
  args: { label: 'Meter ID', helperText: 'The ID printed on the meter face, such as EM-1042.' },
};

/** A field that must be filled: `required` adds the asterisk and the native `required` attribute. */
export const Required: Story = {
  args: { required: true },
};

/** A value that failed validation: `error` with `helperText` that says how to fix it. */
export const Failed: Story = {
  args: {
    label: 'Meter ID',
    error: true,
    defaultValue: 'EM 1042',
    helperText: 'Use letters, digits and hyphens only, such as EM-1042.',
  },
};

/** A value that can't be changed here: `disabled`. Say nearby why it's locked. */
export const Disabled: Story = {
  args: { label: 'Building', disabled: true, defaultValue: '120 Broadway' },
  play: async ({ canvas }) => {
    await expect(canvas.getByRole('textbox', { name: 'Building' })).toBeDisabled();
  },
};

/** Longer text, such as notes on a work order: `multiline` with `minRows`. The field grows as people type. */
export const Multiline: Story = {
  args: { label: 'Notes', multiline: true, minRows: 3, fullWidth: true },
};

/** A unit or a leading icon inside the field: `InputAdornment` through `slotProps.input`. */
export const Adornments: Story = {
  render: () => (
    <Stack spacing={2}>
      <TextField
        label="Search Buildings"
        type="search"
        slotProps={{
          input: {
            startAdornment: (
              <InputAdornment position="start">
                <Icon name="search" />
              </InputAdornment>
            ),
          },
        }}
      />
      <TextField
        label="Peak Demand"
        type="number"
        defaultValue={420}
        slotProps={{
          input: { endAdornment: <InputAdornment position="end">kW</InputAdornment> },
          htmlInput: { min: 0 },
        }}
      />
    </Stack>
  ),
};

/** MUI's two sizes. Keep `medium`, the default; `small` is for a one-off instance. */
export const Sizes: Story = {
  render: () => (
    <Stack direction="row" spacing={2} sx={{ alignItems: 'center' }}>
      <TextField label="Small" size="small" />
      <TextField label="Medium" />
    </Stack>
  ),
};

/** MUI's other variants: `filled` and `standard`. Use `outlined`, the default, unless a layout already uses another. */
export const Variants: Story = {
  render: () => (
    <Stack direction="row" spacing={2} sx={{ alignItems: 'center' }}>
      <TextField label="Outlined" />
      <TextField label="Filled" variant="filled" />
      <TextField label="Standard" variant="standard" />
    </Stack>
  ),
};
