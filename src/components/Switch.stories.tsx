import FormControlLabel from '@mui/material/FormControlLabel';
import FormGroup from '@mui/material/FormGroup';
import Stack from '@mui/material/Stack';
import Switch from '@mui/material/Switch';
import type { Meta, StoryObj } from '@storybook/react-vite';
import { expect, fn } from 'storybook/test';

/**
 * MUI's `Switch`, labelled with `FormControlLabel`, used as MUI documents it. Kilowatt has
 * no wrapper: the theme's departures (Foundations → MUI departures) are the only
 * differences from stock MUI.
 */
const meta = {
  title: 'Components/Switch',
  component: Switch,
  tags: ['!autodocs'],
  // The MUI components this page documents; docs.test.ts checks its MUI departures section against them.
  parameters: { muiComponents: ['Switch'] },
  argTypes: {
    color: { control: 'select', options: ['primary', 'secondary', 'error', 'warning', 'info', 'success', 'default'] },
    size: { control: 'inline-radio', options: ['small', 'medium'] },
    onChange: { control: false },
  },
} satisfies Meta<typeof Switch>;

export default meta;
type Story = StoryObj<typeof meta>;

/** A setting that applies the moment it's flipped: a `Switch` in a `FormControlLabel`. */
export const Labeled: Story = {
  args: { onChange: fn() },
  render: (args) => <FormControlLabel control={<Switch {...args} />} label="Demand Response Alerts" />,
  play: async ({ args, canvas, userEvent }) => {
    const toggle = canvas.getByRole('switch', { name: 'Demand Response Alerts' });
    await userEvent.click(toggle);
    await expect(toggle).toBeChecked();
    await expect(args.onChange).toHaveBeenCalledOnce();
  },
};

/** A list of settings: one labelled switch per row in a `FormGroup`. */
export const Group: Story = {
  render: () => (
    <FormGroup>
      <FormControlLabel control={<Switch defaultChecked />} label="Weekly Summary Email" />
      <FormControlLabel control={<Switch />} label="After-Hours Alerts" />
      <FormControlLabel control={<Switch defaultChecked />} label="Show Weather Overlay" />
    </FormGroup>
  ),
};

/** A label before the switch, for settings lists that align switches on the right: `labelPlacement="start"`. */
export const LabelStart: Story = {
  name: 'Label start',
  render: () => <FormControlLabel control={<Switch />} label="Show Weather Overlay" labelPlacement="start" />,
};

/** A setting that can't be changed here: `disabled`. Say nearby why. */
export const Disabled: Story = {
  render: () => (
    <FormGroup>
      <FormControlLabel disabled control={<Switch />} label="After-Hours Alerts" />
      <FormControlLabel disabled control={<Switch defaultChecked />} label="Weekly Summary Email" />
    </FormGroup>
  ),
};

/** MUI's two sizes. `small` suits dense settings lists and table rows. */
export const Sizes: Story = {
  render: () => (
    <Stack direction="row" spacing={2} sx={{ alignItems: 'center' }}>
      <FormControlLabel control={<Switch size="small" defaultChecked />} label="Small" />
      <FormControlLabel control={<Switch defaultChecked />} label="Medium" />
    </Stack>
  ),
};
