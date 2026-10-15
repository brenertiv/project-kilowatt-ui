import { Combobox } from '@base-ui/react/combobox';
import { NumberField } from '@base-ui/react/number-field';
import { Radio } from '@base-ui/react/radio';
import { RadioGroup } from '@base-ui/react/radio-group';
import { Select } from '@base-ui/react/select';
import { Slider } from '@base-ui/react/slider';
import { Toggle } from '@base-ui/react/toggle';
import { ToggleGroup } from '@base-ui/react/toggle-group';
import type { Meta, StoryObj } from '@storybook/react-vite';
import { buildings, meters } from 'src/data';
import { CheckIcon, ChevronDownIcon, ChevronUpDownIcon, MinusIcon, PlusIcon, XIcon } from 'src/icons';

/** Recipes for choosing values over Base UI. There are no wrapper components: copy the markup and classes. */
const meta = {
  title: 'Primitives/Forms',
  tags: ['!autodocs'],
} satisfies Meta;

export default meta;

type SelectArgs = { optionCount: number; disabled: boolean };
type ComboboxArgs = { emptyMessage: string; disabled: boolean };
type NumberArgs = { min: number; max: number; step: number; disabled: boolean };
type SliderArgs = { min: number; max: number; disabled: boolean };
type ToggleGroupArgs = { optionCount: number; multiple: boolean; disabled: boolean };
type RadioArgs = { disabled: boolean };

/** Pick one from a short, known list (under about ten): `ui-select` trigger, `ui-positioner`, `ui-popup` and `ui-item` rows. */
export const SelectRecipe: StoryObj<SelectArgs> = {
  name: 'Select',
  args: { optionCount: buildings.length, disabled: false },
  argTypes: { optionCount: { control: { type: 'range', min: 1, max: buildings.length } } },
  render: ({ optionCount, disabled }) => {
    const items = buildings.slice(0, Math.max(1, optionCount));
    return (
      <Select.Root items={items} defaultValue={items[0].value} disabled={disabled}>
        <Select.Trigger className="ui-select" aria-label="Building">
          <Select.Value />
          <Select.Icon className="ui-select-icon">
            <ChevronUpDownIcon />
          </Select.Icon>
        </Select.Trigger>
        <Select.Portal>
          <Select.Positioner className="ui-positioner" sideOffset={4}>
            <Select.Popup className="ui-popup">
              <Select.List>
                {items.map((item) => (
                  <Select.Item key={item.value} value={item.value} className="ui-item">
                    <Select.ItemIndicator className="ui-item-indicator">
                      <CheckIcon />
                    </Select.ItemIndicator>
                    <Select.ItemText>{item.label}</Select.ItemText>
                  </Select.Item>
                ))}
              </Select.List>
            </Select.Popup>
          </Select.Positioner>
        </Select.Portal>
      </Select.Root>
    );
  },
};

/** Pick one from a long list the user searches by typing: `ui-combobox` input group with clear and open buttons, and an empty message. */
export const ComboboxRecipe: StoryObj<ComboboxArgs> = {
  name: 'Combobox',
  args: { emptyMessage: 'No meters found.', disabled: false },
  render: ({ emptyMessage, disabled }) => (
    <Combobox.Root items={meters} defaultValue={meters[0]} disabled={disabled}>
      <label className="ui-label" htmlFor="meter">
        Meter
      </label>
      <Combobox.InputGroup className="ui-combobox">
        <Combobox.Input id="meter" className="ui-input" placeholder="Search meters" />
        <Combobox.Clear className="ui-icon-btn" aria-label="Clear">
          <XIcon />
        </Combobox.Clear>
        <Combobox.Trigger className="ui-icon-btn" aria-label="Open">
          <ChevronDownIcon />
        </Combobox.Trigger>
      </Combobox.InputGroup>
      <Combobox.Portal>
        <Combobox.Positioner className="ui-positioner" sideOffset={4}>
          <Combobox.Popup className="ui-popup">
            <Combobox.Empty className="ui-empty">{emptyMessage}</Combobox.Empty>
            <Combobox.List>
              {(item: (typeof meters)[number]) => (
                <Combobox.Item key={item.value} value={item} className="ui-item">
                  <Combobox.ItemIndicator className="ui-item-indicator">
                    <CheckIcon />
                  </Combobox.ItemIndicator>
                  <span>{item.label}</span>
                </Combobox.Item>
              )}
            </Combobox.List>
          </Combobox.Popup>
        </Combobox.Positioner>
      </Combobox.Portal>
    </Combobox.Root>
  ),
};

/** An exact number within limits, such as a threshold: `ui-number` with stepper buttons; drag the label to scrub. */
export const NumberFieldRecipe: StoryObj<NumberArgs> = {
  name: 'Number field',
  args: { min: 0, max: 1000, step: 10, disabled: false },
  render: ({ min, max, step, disabled }) => (
    <NumberField.Root id="threshold" className="ui-number" defaultValue={250} min={min} max={max} step={step} disabled={disabled}>
      <NumberField.ScrubArea className="ui-scrub">
        <label htmlFor="threshold" className="ui-label">
          Demand threshold (kW)
        </label>
      </NumberField.ScrubArea>
      <NumberField.Group className="ui-number-group">
        <NumberField.Decrement className="ui-stepper" aria-label="Decrease">
          <MinusIcon />
        </NumberField.Decrement>
        <NumberField.Input className="ui-input ui-number-input" />
        <NumberField.Increment className="ui-stepper" aria-label="Increase">
          <PlusIcon />
        </NumberField.Increment>
      </NumberField.Group>
    </NumberField.Root>
  ),
};

/** An approximate value in a range where the feel matters more than the digit, such as a setpoint: `ui-slider` with a value readout. */
export const SliderRecipe: StoryObj<SliderArgs> = {
  name: 'Slider',
  args: { min: 40, max: 85, disabled: false },
  render: ({ min, max, disabled }) => (
    <Slider.Root className="ui-slider" defaultValue={68} min={min} max={max} disabled={disabled}>
      <div className="ui-slider-head">
        <Slider.Label className="ui-label">Cooling setpoint</Slider.Label>
        <Slider.Value className="ui-slider-value">{(_formatted, values) => `${values[0]}°F`}</Slider.Value>
      </div>
      <Slider.Control className="ui-slider-control">
        <Slider.Track className="ui-slider-track">
          <Slider.Indicator className="ui-slider-indicator" />
          <Slider.Thumb className="ui-slider-thumb" />
        </Slider.Track>
      </Slider.Control>
    </Slider.Root>
  ),
};

const units = ['kW', 'kWh', '$', 'CO₂', 'therms'];

/** A compact switch between a few short options, such as units: `ui-toggle-group` of `ui-toggle`. Set `multiple` to allow several. */
export const ToggleGroupRecipe: StoryObj<ToggleGroupArgs> = {
  name: 'Toggle group',
  args: { optionCount: 3, multiple: false, disabled: false },
  argTypes: { optionCount: { control: { type: 'range', min: 1, max: units.length } } },
  render: ({ optionCount, multiple, disabled }) => {
    const options = units.slice(0, Math.max(1, optionCount));
    return (
      <ToggleGroup className="ui-toggle-group" defaultValue={[options[0]]} multiple={multiple} disabled={disabled}>
        {options.map((option) => (
          <Toggle key={option} value={option} className="ui-toggle">
            {option}
          </Toggle>
        ))}
      </ToggleGroup>
    );
  },
};

const meterTypes = [
  { value: 'electric', label: 'Electric' },
  { value: 'steam', label: 'Steam' },
  { value: 'gas', label: 'Gas' },
];

/** Pick one of a few options that should all stay visible: `ui-radio` rows inside a labelled `RadioGroup`. */
export const RadioGroupRecipe: StoryObj<RadioArgs> = {
  name: 'Radio group',
  args: { disabled: false },
  render: ({ disabled }) => (
    <RadioGroup className="ui-radio-group" aria-label="Meter type" defaultValue="electric" disabled={disabled}>
      {meterTypes.map((option) => (
        <label key={option.value} className="ui-inline-label">
          <Radio.Root value={option.value} className="ui-radio">
            <Radio.Indicator className="ui-radio-indicator" />
          </Radio.Root>
          {option.label}
        </label>
      ))}
    </RadioGroup>
  ),
};
