import Autocomplete from '@mui/material/Autocomplete';
import TextField from '@mui/material/TextField';
import type { Meta, StoryObj } from '@storybook/react-vite';
import { expect, fn, screen } from 'storybook/test';

/**
 * MUI's `Autocomplete`, used as MUI documents it, with a `TextField` as its input. Kilowatt
 * has no wrapper: the theme's departures (Foundations → MUI departures) are the only
 * differences from stock MUI.
 */
const meta = {
  title: 'Inputs/Autocomplete',
  component: Autocomplete,
  tags: ['!autodocs'],
  // The MUI components this page documents; docs.test.ts checks its MUI departures section against them.
  parameters: { muiComponents: ['Autocomplete'] },
  argTypes: {
    size: { control: 'inline-radio', options: ['small', 'medium'] },
    onChange: { control: false },
  },
} satisfies Meta<typeof Autocomplete>;

export default meta;
// Autocomplete is generic over its options, so stories take plain args and build it in `render`.
type Story = StoryObj<{ onChange?: () => void }>;

type Building = { id: number; name: string; city: string };

const buildings: Building[] = [
  { id: 1, name: '120 Broadway', city: 'New York' },
  { id: 2, name: '1 World Trade Center', city: 'New York' },
  { id: 3, name: '350 Park Avenue', city: 'New York' },
  { id: 4, name: '200 Vesey Street', city: 'New York' },
  { id: 5, name: '4 Times Square', city: 'New York' },
  { id: 6, name: '599 Lexington Avenue', city: 'New York' },
  { id: 7, name: '55 Water Street', city: 'New York' },
  { id: 8, name: '1000 Darrell Waltrip Drive', city: 'Nashville' },
];

const equipment = ['AHU-1', 'Chiller 1', 'Boiler B-2', 'Panel LP-3', 'Cooling Tower CT-1', 'Elevator Bank A'];

/** One choice from a long list people search: `options`, `getOptionLabel`, and a `TextField` in `renderInput`. */
export const ComboBox: Story = {
  name: 'Combo box',
  args: { onChange: fn() },
  render: (args) => (
    <Autocomplete
      onChange={args.onChange}
      options={buildings}
      getOptionLabel={(building) => building.name}
      sx={{ width: 300 }}
      renderInput={(params) => <TextField {...params} label="Building" />}
    />
  ),
  play: async ({ args, canvas, userEvent }) => {
    const input = canvas.getByRole('combobox', { name: 'Building' });
    await userEvent.type(input, 'Park');
    await userEvent.click(await screen.findByRole('option', { name: '350 Park Avenue' }));
    await expect(input).toHaveValue('350 Park Avenue');
    await expect(args.onChange).toHaveBeenCalledOnce();
  },
};

/** Several choices: `multiple`. Each choice shows as a chip in the field, and `limitTags` caps how many show unfocused. */
export const Multiple: Story = {
  render: () => (
    <Autocomplete
      multiple
      limitTags={2}
      options={buildings}
      getOptionLabel={(building) => building.name}
      defaultValue={[buildings[0], buildings[2]]}
      sx={{ width: 400 }}
      renderInput={(params) => <TextField {...params} label="Buildings" />}
    />
  ),
};

/** Options in sections: `groupBy`, with the options sorted by the same key. */
export const Grouped: Story = {
  render: () => (
    <Autocomplete
      options={[...buildings].sort((a, b) => a.city.localeCompare(b.city))}
      groupBy={(building) => building.city}
      getOptionLabel={(building) => building.name}
      sx={{ width: 300 }}
      renderInput={(params) => <TextField {...params} label="Building" />}
    />
  ),
};

/** A value that may not be in the list: `freeSolo` accepts whatever people type, and offers the options as suggestions. */
export const FreeSolo: Story = {
  name: 'Free solo',
  render: () => (
    <Autocomplete
      freeSolo
      options={equipment}
      sx={{ width: 300 }}
      renderInput={(params) => (
        <TextField {...params} label="Equipment" helperText="Pick from the list or type a new name." />
      )}
    />
  ),
};

/** While options load from the API: `loading` shows `loadingText` in the open list. */
export const Loading: Story = {
  render: () => (
    <Autocomplete
      loading
      open
      options={[] as Building[]}
      getOptionLabel={(building) => building.name}
      sx={{ width: 300 }}
      renderInput={(params) => <TextField {...params} label="Building" />}
    />
  ),
};

/** A choice that can't be changed here: `disabled`. Say nearby why it's locked. */
export const Disabled: Story = {
  render: () => (
    <Autocomplete
      disabled
      options={buildings}
      getOptionLabel={(building) => building.name}
      defaultValue={buildings[0]}
      sx={{ width: 300 }}
      renderInput={(params) => <TextField {...params} label="Building" />}
    />
  ),
};
