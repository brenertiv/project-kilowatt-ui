import Checkbox from '@mui/material/Checkbox';
import FormControl from '@mui/material/FormControl';
import FormControlLabel from '@mui/material/FormControlLabel';
import FormGroup from '@mui/material/FormGroup';
import FormHelperText from '@mui/material/FormHelperText';
import FormLabel from '@mui/material/FormLabel';
import Stack from '@mui/material/Stack';
import type { Meta, StoryObj } from '@storybook/react-vite';
import { useState } from 'react';
import { expect, fn } from 'storybook/test';

/**
 * MUI's `Checkbox`, labelled with `FormControlLabel`, used as MUI documents them. Kilowatt
 * has no wrapper: the theme's departures (Foundations → MUI departures) are the only
 * differences from stock MUI.
 */
const meta = {
  title: 'Components/Checkbox',
  component: Checkbox,
  tags: ['!autodocs'],
  // The MUI components this page documents; docs.test.ts checks its MUI departures section against them.
  parameters: { muiComponents: ['Checkbox', 'FormControlLabel'] },
  argTypes: {
    color: { control: 'select', options: ['primary', 'secondary', 'error', 'warning', 'info', 'success', 'default'] },
    size: { control: 'inline-radio', options: ['small', 'medium', 'large'] },
    onChange: { control: false },
  },
} satisfies Meta<typeof Checkbox>;

export default meta;
type Story = StoryObj<typeof meta>;

/** One option that's on or off and takes effect when the form is saved: a `Checkbox` in a `FormControlLabel`. */
export const Labeled: Story = {
  args: { onChange: fn() },
  render: (args) => <FormControlLabel control={<Checkbox {...args} />} label="Notify Building Engineer" />,
  play: async ({ args, canvas, userEvent }) => {
    const checkbox = canvas.getByRole('checkbox', { name: 'Notify Building Engineer' });
    await userEvent.click(checkbox);
    await expect(checkbox).toBeChecked();
    await expect(args.onChange).toHaveBeenCalledOnce();
  },
};

/** Several independent options under one heading: `FormControl` as a fieldset, `FormLabel` as its legend, and a `FormGroup`. */
export const Group: Story = {
  render: () => (
    <FormControl component="fieldset">
      <FormLabel component="legend">Alert Channels</FormLabel>
      <FormGroup>
        <FormControlLabel control={<Checkbox defaultChecked />} label="Email" />
        <FormControlLabel control={<Checkbox />} label="SMS" />
        <FormControlLabel control={<Checkbox defaultChecked />} label="In-App" />
      </FormGroup>
    </FormControl>
  ),
};

const meters = ['Main electric', 'Chiller plant', 'Steam service'];

/** A parent that selects every child: `indeterminate` while only some are checked. */
export const Indeterminate: Story = {
  render: function Render() {
    const [checked, setChecked] = useState([true, false, false]);
    const all = checked.every(Boolean);
    const some = checked.some(Boolean);
    return (
      <Stack>
        <FormControlLabel
          label="All Meters"
          control={
            <Checkbox checked={all} indeterminate={some && !all} onChange={() => setChecked(checked.map(() => !all))} />
          }
        />
        <Stack sx={{ pl: 3 }}>
          {meters.map((meter, index) => (
            <FormControlLabel
              key={meter}
              label={meter}
              control={
                <Checkbox
                  checked={checked[index]}
                  onChange={() => setChecked(checked.map((value, i) => (i === index ? !value : value)))}
                />
              }
            />
          ))}
        </Stack>
      </Stack>
    );
  },
  play: async ({ canvas, userEvent }) => {
    const all = canvas.getByRole('checkbox', { name: 'All Meters' });
    await expect(all).toHaveAttribute('data-indeterminate', 'true');
    await userEvent.click(all);
    await expect(canvas.getByRole('checkbox', { name: 'Steam service' })).toBeChecked();
  },
};

/** A required box nobody checked: `error` and `required` on the `FormControl`, with `FormHelperText`. */
export const Failed: Story = {
  render: () => (
    <FormControl error required component="fieldset">
      <FormLabel component="legend">Confirmation</FormLabel>
      <FormControlLabel control={<Checkbox />} label="The equipment is locked out" />
      <FormHelperText>Confirm the lockout before closing the ticket.</FormHelperText>
    </FormControl>
  ),
};

/** An option that can't be changed here: `disabled` on the `Checkbox`. Say nearby why. */
export const Disabled: Story = {
  render: () => (
    <FormGroup>
      <FormControlLabel disabled control={<Checkbox />} label="SMS" />
      <FormControlLabel disabled control={<Checkbox defaultChecked />} label="Email" />
    </FormGroup>
  ),
};

/** MUI's three sizes. `medium` is the default; `small` suits table rows and dense lists. */
export const Sizes: Story = {
  render: () => (
    <Stack direction="row" spacing={1} sx={{ alignItems: 'center' }}>
      {(['small', 'medium', 'large'] as const).map((size) => (
        <FormControlLabel
          key={size}
          control={<Checkbox defaultChecked size={size} />}
          label={{ small: 'Small', medium: 'Medium', large: 'Large' }[size]}
        />
      ))}
    </Stack>
  ),
};
