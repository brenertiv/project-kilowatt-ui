import Autocomplete from '@mui/material/Autocomplete';
import Box from '@mui/material/Box';
import FormControl from '@mui/material/FormControl';
import FormControlLabel from '@mui/material/FormControlLabel';
import FormLabel from '@mui/material/FormLabel';
import MenuItem from '@mui/material/MenuItem';
import Radio from '@mui/material/Radio';
import RadioGroup from '@mui/material/RadioGroup';
import Slider from '@mui/material/Slider';
import Stack from '@mui/material/Stack';
import TextField from '@mui/material/TextField';
import ToggleButton from '@mui/material/ToggleButton';
import ToggleButtonGroup from '@mui/material/ToggleButtonGroup';
import Typography from '@mui/material/Typography';
import type { Meta, StoryObj } from '@storybook/react-vite';
import { useId, useState } from 'react';
import { fn } from 'storybook/test';
import { buildings, meters } from 'src/data';
import { tokenContrast } from 'src/stories/a11y';

/** Value pickers: MUI's Select, Autocomplete, number TextField, Slider, ToggleButtonGroup and RadioGroup as themed. */
const meta = {
  title: 'Primitives/Forms',
  tags: ['!autodocs'],
} satisfies Meta;

export default meta;

type SelectArgs = { optionCount: number; disabled: boolean; onChange: (value: string) => void };
type AutocompleteArgs = { noOptionsText: string; disabled: boolean; onChange: (value: string | null) => void };
type NumberArgs = { min: number; max: number; step: number; disabled: boolean; onChange: (value: string) => void };
type SliderArgs = { min: number; max: number; disabled: boolean; onChange: (value: number) => void };
type ToggleGroupArgs = { optionCount: number; multiple: boolean; disabled: boolean; onChange: (value: string[]) => void };
type RadioArgs = { disabled: boolean; onChange: (value: string) => void };

const callback = { control: false } as const;

/** Pick one from a short, known list (under about ten): `TextField` with `select` and a `MenuItem` per option. */
export const SelectRecipe: StoryObj<SelectArgs> = {
  name: 'Select',
  args: { optionCount: buildings.length, disabled: false, onChange: fn() },
  argTypes: { optionCount: { control: { type: 'range', min: 1, max: buildings.length } }, onChange: callback },
  render: ({ optionCount, disabled, onChange }) => {
    const items = buildings.slice(0, Math.max(1, optionCount));
    return (
      <TextField
        select
        label="Building"
        defaultValue={items[0].value}
        disabled={disabled}
        onChange={(event) => onChange(event.target.value)}
        sx={{ minWidth: 240 }}
      >
        {items.map((item) => (
          <MenuItem key={item.value} value={item.value}>
            {item.label}
          </MenuItem>
        ))}
      </TextField>
    );
  },
};

/** Pick one from a long list the user searches by typing: `Autocomplete` with a `TextField` input and a `noOptionsText`. */
export const AutocompleteRecipe: StoryObj<AutocompleteArgs> = {
  name: 'Autocomplete',
  args: { noOptionsText: 'No meters found.', disabled: false, onChange: fn() },
  argTypes: { onChange: callback },
  render: ({ noOptionsText, disabled, onChange }) => (
    <Autocomplete
      options={meters}
      defaultValue={meters[0]}
      isOptionEqualToValue={(option, value) => option.value === value.value}
      noOptionsText={noOptionsText}
      disabled={disabled}
      onChange={(_event, value) => onChange(value?.value ?? null)}
      sx={{ width: 280 }}
      renderInput={(params) => <TextField {...params} label="Meter" placeholder="Search meters" />}
    />
  ),
};

/** An exact number within limits, such as a threshold: `TextField` with `type="number"` and `min`, `max` and `step` on the input. */
export const NumberFieldRecipe: StoryObj<NumberArgs> = {
  name: 'Number field',
  args: { min: 0, max: 1000, step: 10, disabled: false, onChange: fn() },
  argTypes: { onChange: callback },
  render: ({ min, max, step, disabled, onChange }) => (
    <TextField
      type="number"
      label="Demand threshold (kW)"
      defaultValue={250}
      disabled={disabled}
      helperText={`${min} to ${max} kW`}
      onChange={(event) => onChange(event.target.value)}
      slotProps={{ htmlInput: { min, max, step } }}
    />
  ),
};

function SliderDemo({ min, max, disabled, onChange }: SliderArgs) {
  const id = useId();
  const [value, setValue] = useState(68);
  return (
    <Box sx={{ width: 280 }}>
      <Stack direction="row" sx={{ justifyContent: 'space-between' }}>
        <Typography id={id} variant="body2" color="text.secondary">
          Cooling setpoint
        </Typography>
        <Typography variant="body2">{value}°F</Typography>
      </Stack>
      <Slider
        aria-labelledby={id}
        value={value}
        min={min}
        max={max}
        disabled={disabled}
        getAriaValueText={(current) => `${current}°F`}
        valueLabelDisplay="auto"
        valueLabelFormat={(current) => `${current}°F`}
        onChange={(_event, next) => {
          setValue(next);
          onChange(next);
        }}
      />
    </Box>
  );
}

/** An approximate value in a range where the feel matters more than the digit, such as a setpoint: `Slider` with a labelled readout. */
export const SliderRecipe: StoryObj<SliderArgs> = {
  name: 'Slider',
  args: { min: 40, max: 85, disabled: false, onChange: fn() },
  argTypes: { onChange: callback },
  render: (args) => <SliderDemo {...args} />,
};

const units = ['kW', 'kWh', '$', 'CO₂', 'therms'];

function ToggleGroupDemo({ optionCount, multiple, disabled, onChange }: ToggleGroupArgs) {
  const options = units.slice(0, Math.max(1, optionCount));
  const [value, setValue] = useState<string[]>([options[0]]);
  return (
    <ToggleButtonGroup
      aria-label="Unit"
      size="small"
      exclusive={!multiple}
      disabled={disabled}
      value={multiple ? value : (value[0] ?? null)}
      onChange={(_event, next: string | string[] | null) => {
        // Exclusive groups pass null when the selected button is pressed again: keep one unit selected.
        if (next === null || (Array.isArray(next) && next.length === 0)) return;
        const values = Array.isArray(next) ? next : [next];
        setValue(values);
        onChange(values);
      }}
    >
      {options.map((option) => (
        <ToggleButton key={option} value={option}>
          {option}
        </ToggleButton>
      ))}
    </ToggleButtonGroup>
  );
}

/** A compact switch between a few short options, such as units: `ToggleButtonGroup` with `exclusive`; leave it off to allow several. */
export const ToggleGroupRecipe: StoryObj<ToggleGroupArgs> = {
  name: 'Toggle button group',
  // Contrast off: MUI's unselected ToggleButton text is action.active, 4.44:1 on backgroundDefault. See src/stories/a11y.ts.
  parameters: { a11y: tokenContrast },
  args: { optionCount: 3, multiple: false, disabled: false, onChange: fn() },
  argTypes: { optionCount: { control: { type: 'range', min: 1, max: units.length } }, onChange: callback },
  render: (args) => <ToggleGroupDemo key={String(args.multiple)} {...args} />,
};

const meterTypes = [
  { value: 'electric', label: 'Electric' },
  { value: 'steam', label: 'Steam' },
  { value: 'gas', label: 'Gas' },
];

function RadioGroupDemo({ disabled, onChange }: RadioArgs) {
  const id = useId();
  return (
    <FormControl disabled={disabled}>
      <FormLabel id={id}>Meter type</FormLabel>
      <RadioGroup aria-labelledby={id} name="meter-type" defaultValue="electric" onChange={(_event, value) => onChange(value)}>
        {meterTypes.map((option) => (
          <FormControlLabel key={option.value} value={option.value} control={<Radio />} label={option.label} />
        ))}
      </RadioGroup>
    </FormControl>
  );
}

/** Pick one of a few options that should all stay visible: `RadioGroup` of `Radio`, labelled by a `FormLabel`. */
export const RadioGroupRecipe: StoryObj<RadioArgs> = {
  name: 'Radio group',
  args: { disabled: false, onChange: fn() },
  argTypes: { onChange: callback },
  render: (args) => <RadioGroupDemo {...args} />,
};
