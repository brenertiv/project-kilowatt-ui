import Box from '@mui/material/Box';
import Slider from '@mui/material/Slider';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';
import type { Meta, StoryObj } from '@storybook/react-vite';
import { expect, fn } from 'storybook/test';

/**
 * MUI's `Slider`, used as MUI documents it. Kilowatt has no wrapper: the theme's
 * departures (Foundations → MUI departures) are the only differences from stock MUI.
 */
const meta = {
  title: 'Components/Slider',
  component: Slider,
  tags: ['!autodocs'],
  // The MUI components this page documents; docs.test.ts checks its MUI departures section against them.
  parameters: { muiComponents: ['Slider'] },
  decorators: [(Story) => <Box sx={{ width: 320, px: 1 }}>{Story()}</Box>],
  argTypes: {
    color: { control: 'select', options: ['primary', 'secondary', 'error', 'warning', 'info', 'success'] },
    size: { control: 'inline-radio', options: ['small', 'medium'] },
    valueLabelDisplay: { control: 'inline-radio', options: ['auto', 'on', 'off'] },
    onChange: { control: false },
  },
} satisfies Meta<typeof Slider>;

export default meta;
type Story = StoryObj<typeof meta>;

/** A value on a range where the rough position matters more than the exact number: a labelled `Slider` with `valueLabelDisplay="auto"`. */
export const Continuous: Story = {
  args: { 'aria-labelledby': 'dimming-label', defaultValue: 70, valueLabelDisplay: 'auto', onChange: fn() },
  render: (args) => (
    <>
      <Typography id="dimming-label" gutterBottom>
        Lighting Level (%)
      </Typography>
      <Slider {...args} />
    </>
  ),
  play: async ({ args, canvas, userEvent }) => {
    const thumb = canvas.getByRole('slider', { name: 'Lighting Level (%)' });
    thumb.focus();
    await userEvent.keyboard('{ArrowRight}');
    await expect(thumb).toHaveValue('71');
    await expect(args.onChange).toHaveBeenCalled();
  },
};

const setpointMarks = [62, 66, 70, 74, 78].map((value) => ({ value, label: `${value}°F` }));

/** A value in fixed steps: `step` with `marks`. Label the marks with units. */
export const Discrete: Story = {
  args: {
    'aria-labelledby': 'setpoint-label',
    defaultValue: 72,
    min: 62,
    max: 78,
    step: 1,
    marks: setpointMarks,
    valueLabelDisplay: 'auto',
  },
  render: (args) => (
    <>
      <Typography id="setpoint-label" gutterBottom>
        Cooling Setpoint
      </Typography>
      <Slider {...args} />
    </>
  ),
};

/** Only the listed values: `step={null}` with `marks`, for a short set of uneven choices. */
export const RestrictedValues: Story = {
  name: 'Restricted values',
  args: {
    'aria-labelledby': 'interval-label',
    defaultValue: 15,
    min: 1,
    max: 60,
    step: null,
    marks: [1, 5, 15, 30, 60].map((value) => ({ value, label: `${value} min` })),
  },
  render: (args) => (
    <>
      <Typography id="interval-label" gutterBottom>
        Reading Interval
      </Typography>
      <Slider {...args} />
    </>
  ),
};

/** A range with two ends: an array value. Name each thumb with `getAriaLabel`. */
export const Range: Story = {
  args: {
    defaultValue: [68, 74],
    min: 60,
    max: 80,
    valueLabelDisplay: 'auto',
    getAriaLabel: (index: number) =>
      index === 0 ? 'Lowest comfortable temperature' : 'Highest comfortable temperature',
    getAriaValueText: (value: number) => `${value}°F`,
  },
  render: (args) => (
    <>
      <Typography gutterBottom>Comfort Band (°F)</Typography>
      <Slider {...args} />
    </>
  ),
};

/** A value that can't be changed here: `disabled`. Say nearby why. */
export const Disabled: Story = {
  args: { 'aria-label': 'Lighting Level', defaultValue: 40, disabled: true },
};

/** MUI's two sizes. `small` suits filters and dense panels. */
export const Sizes: Story = {
  render: () => (
    <Stack spacing={2}>
      <Slider size="small" defaultValue={30} aria-label="Small" />
      <Slider defaultValue={60} aria-label="Medium" />
    </Stack>
  ),
};
