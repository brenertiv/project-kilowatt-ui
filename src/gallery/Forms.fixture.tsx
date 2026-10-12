import { Combobox } from '@base-ui/react/combobox';
import { NumberField } from '@base-ui/react/number-field';
import { Radio } from '@base-ui/react/radio';
import { RadioGroup } from '@base-ui/react/radio-group';
import { Select } from '@base-ui/react/select';
import { Slider } from '@base-ui/react/slider';
import { Toggle } from '@base-ui/react/toggle';
import { ToggleGroup } from '@base-ui/react/toggle-group';
import { buildings, meters } from '../data';
import { CheckIcon, ChevronDownIcon, ChevronUpDownIcon, MinusIcon, PlusIcon, XIcon } from '../icons';
import { useFixtureInput, useFixtureSelect } from '../workbench/inputs';

function SelectFixture() {
  const [count] = useFixtureInput('option count', buildings.length);
  const [disabled] = useFixtureInput('disabled', false);
  const [value, setValue] = useFixtureInput('value', buildings[0].value);
  const items = buildings.slice(0, Math.max(1, Math.min(buildings.length, count)));
  return (
    <Select.Root items={items} value={items.some((item) => item.value === value) ? value : items[0].value} onValueChange={(next) => next && setValue(next)} disabled={disabled}>
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
}

function ComboboxFixture() {
  const [disabled] = useFixtureInput('disabled', false);
  const [emptyText] = useFixtureInput('empty message', 'No meters found.');
  const [preselected] = useFixtureInput('preselected', true);
  return (
    <Combobox.Root items={meters} defaultValue={preselected ? meters[0] : null} disabled={disabled}>
      <label className="ui-label" htmlFor="fixture-meter">
        Meter
      </label>
      <Combobox.InputGroup className="ui-combobox">
        <Combobox.Input id="fixture-meter" className="ui-input" placeholder="Search meters" />
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
            <Combobox.Empty className="ui-empty">{emptyText}</Combobox.Empty>
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
  );
}

function NumberFieldFixture() {
  const [value, setValue] = useFixtureInput('value', 250);
  const [min] = useFixtureInput('min', 0);
  const [max] = useFixtureInput('max', 1000);
  const [step] = useFixtureInput('step', 10);
  const [disabled] = useFixtureInput('disabled', false);
  return (
    <NumberField.Root
      id="fixture-threshold"
      value={value}
      min={min}
      max={max}
      step={step}
      disabled={disabled}
      onValueChange={(next) => setValue(next ?? 0)}
      className="ui-number"
    >
      <NumberField.ScrubArea className="ui-scrub">
        <label htmlFor="fixture-threshold" className="ui-label">
          Demand threshold (kW)
        </label>
      </NumberField.ScrubArea>
      <NumberField.Group className="ui-number-group">
        <NumberField.Decrement className="ui-stepper">
          <MinusIcon />
        </NumberField.Decrement>
        <NumberField.Input className="ui-input ui-number-input" />
        <NumberField.Increment className="ui-stepper">
          <PlusIcon />
        </NumberField.Increment>
      </NumberField.Group>
    </NumberField.Root>
  );
}

function SliderFixture() {
  const [value, setValue] = useFixtureInput('value', 68);
  const [min] = useFixtureInput('min', 40);
  const [max] = useFixtureInput('max', 85);
  const [disabled] = useFixtureInput('disabled', false);
  return (
    <Slider.Root className="ui-slider" value={[value]} onValueChange={(next) => setValue(Array.isArray(next) ? next[0] : next)} min={min} max={max} disabled={disabled}>
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
  );
}

function ToggleGroupFixture() {
  const [multiple] = useFixtureInput('multiple', false);
  const [disabled] = useFixtureInput('disabled', false);
  const [count] = useFixtureInput('option count', 3);
  const options = ['kW', 'kWh', '$', 'CO₂', 'therms'].slice(0, Math.max(1, Math.min(5, count)));
  return (
    <ToggleGroup defaultValue={[options[0]]} multiple={multiple} disabled={disabled} className="ui-toggle-group">
      {options.map((option) => (
        <Toggle key={option} value={option} className="ui-toggle">
          {option}
        </Toggle>
      ))}
    </ToggleGroup>
  );
}

function RadioGroupFixture() {
  const [value, setValue] = useFixtureSelect('value', { options: ['electric', 'steam', 'gas'] as const });
  const [disabled] = useFixtureInput('disabled', false);
  return (
    <RadioGroup value={value} onValueChange={(next) => setValue(next as typeof value)} className="demo-stack" aria-label="Meter type" disabled={disabled}>
      {(['electric', 'steam', 'gas'] as const).map((option) => (
        <label key={option} className="ui-inline-label">
          <Radio.Root value={option} className="ui-radio">
            <Radio.Indicator className="ui-radio-indicator" />
          </Radio.Root>
          {option[0].toUpperCase() + option.slice(1)}
        </label>
      ))}
    </RadioGroup>
  );
}

export default {
  Select: SelectFixture,
  Combobox: ComboboxFixture,
  'Number field': NumberFieldFixture,
  Slider: SliderFixture,
  'Toggle group': ToggleGroupFixture,
  'Radio group': RadioGroupFixture,
};
