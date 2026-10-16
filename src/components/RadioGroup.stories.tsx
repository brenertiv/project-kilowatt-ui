import FormControl from '@mui/material/FormControl';
import FormControlLabel from '@mui/material/FormControlLabel';
import FormHelperText from '@mui/material/FormHelperText';
import FormLabel from '@mui/material/FormLabel';
import Radio from '@mui/material/Radio';
import RadioGroup from '@mui/material/RadioGroup';
import type { Meta, StoryObj } from '@storybook/react-vite';
import { expect, fn } from 'storybook/test';

/**
 * MUI's `RadioGroup` and `Radio`, labelled with `FormControlLabel`, used as MUI documents
 * them. Kilowatt has no wrapper: the theme's departures (Foundations → MUI departures) are
 * the only differences from stock MUI.
 */
const meta = {
  title: 'Components/RadioGroup',
  component: RadioGroup,
  tags: ['!autodocs'],
  // The MUI components this page documents; docs.test.ts checks its MUI departures section against them.
  parameters: { muiComponents: ['RadioGroup', 'Radio'] },
  argTypes: { onChange: { control: false } },
} satisfies Meta<typeof RadioGroup>;

export default meta;
type Story = StoryObj<typeof meta>;

/** One choice of a few, all visible: a `FormControl` with a `FormLabel` and a `RadioGroup` tied to it by `aria-labelledby`. */
export const Basic: Story = {
  args: { onChange: fn() },
  render: (args) => (
    <FormControl>
      <FormLabel id="interval-label">Reading Interval</FormLabel>
      <RadioGroup {...args} aria-labelledby="interval-label" name="interval" defaultValue="15">
        <FormControlLabel value="15" control={<Radio />} label="15 Minutes" />
        <FormControlLabel value="60" control={<Radio />} label="Hourly" />
        <FormControlLabel value="1440" control={<Radio />} label="Daily" />
      </RadioGroup>
    </FormControl>
  ),
  play: async ({ args, canvas, userEvent }) => {
    const daily = canvas.getByRole('radio', { name: 'Daily' });
    await userEvent.click(daily);
    await expect(daily).toBeChecked();
    await expect(args.onChange).toHaveBeenCalledOnce();
  },
};

/** Two or three short options on one line: `row`. */
export const Row: Story = {
  render: () => (
    <FormControl>
      <FormLabel id="units-label">Units</FormLabel>
      <RadioGroup row aria-labelledby="units-label" name="units" defaultValue="imperial">
        <FormControlLabel value="imperial" control={<Radio />} label="Imperial" />
        <FormControlLabel value="metric" control={<Radio />} label="Metric" />
      </RadioGroup>
    </FormControl>
  ),
};

/** A required choice nobody made: `error` on the `FormControl`, with `FormHelperText` that says what to pick. */
export const Failed: Story = {
  render: () => (
    <FormControl error required>
      <FormLabel id="source-label">Data Source</FormLabel>
      <RadioGroup aria-labelledby="source-label" name="source">
        <FormControlLabel value="meter" control={<Radio />} label="Meter" />
        <FormControlLabel value="bill" control={<Radio />} label="Utility Bill" />
      </RadioGroup>
      <FormHelperText>Choose where the readings come from.</FormHelperText>
    </FormControl>
  ),
};

/** An option that isn't available: `disabled` on its `FormControlLabel`. Say nearby why. */
export const Disabled: Story = {
  render: () => (
    <FormControl>
      <FormLabel id="interval-disabled-label">Reading Interval</FormLabel>
      <RadioGroup aria-labelledby="interval-disabled-label" name="interval-disabled" defaultValue="60">
        <FormControlLabel value="1" control={<Radio />} label="1 Minute" disabled />
        <FormControlLabel value="60" control={<Radio />} label="Hourly" />
        <FormControlLabel value="1440" control={<Radio />} label="Daily" />
      </RadioGroup>
    </FormControl>
  ),
};

/** MUI's two sizes on `Radio`. `small` suits dense forms and table rows. */
export const Sizes: Story = {
  render: () => (
    <RadioGroup row aria-label="Sizes" name="sizes" defaultValue="small">
      <FormControlLabel value="small" control={<Radio size="small" />} label="Small" />
      <FormControlLabel value="medium" control={<Radio />} label="Medium" />
    </RadioGroup>
  ),
};
