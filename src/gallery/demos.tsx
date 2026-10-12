import { useState, type ComponentType } from 'react';
import { Accordion } from '@base-ui/react/accordion';
import { AlertDialog } from '@base-ui/react/alert-dialog';
import { Avatar } from '@base-ui/react/avatar';
import { Button } from '@base-ui/react/button';
import { Checkbox } from '@base-ui/react/checkbox';
import { Collapsible } from '@base-ui/react/collapsible';
import { Combobox } from '@base-ui/react/combobox';
import { Dialog } from '@base-ui/react/dialog';
import { Field } from '@base-ui/react/field';
import { Input } from '@base-ui/react/input';
import { Menu } from '@base-ui/react/menu';
import { Meter } from '@base-ui/react/meter';
import { NumberField } from '@base-ui/react/number-field';
import { Popover } from '@base-ui/react/popover';
import { Progress } from '@base-ui/react/progress';
import { Radio } from '@base-ui/react/radio';
import { RadioGroup } from '@base-ui/react/radio-group';
import { ScrollArea } from '@base-ui/react/scroll-area';
import { Select } from '@base-ui/react/select';
import { Separator } from '@base-ui/react/separator';
import { Slider } from '@base-ui/react/slider';
import { Switch } from '@base-ui/react/switch';
import { Tabs } from '@base-ui/react/tabs';
import { Toast } from '@base-ui/react/toast';
import { Toggle } from '@base-ui/react/toggle';
import { ToggleGroup } from '@base-ui/react/toggle-group';
import { Tooltip } from '@base-ui/react/tooltip';
import { buildings, meters, tickets } from '../data';
import { CheckIcon, ChevronDownIcon, ChevronUpDownIcon, MinusIcon, PlusIcon, XIcon } from '../icons';
import { chartDemos } from './chartDemos';
import { stackDemos } from './stackDemos';
import { tableDemos } from './tableDemos';

export type Demo = {
  id: string;
  title: string;
  group: string;
  /** Rendered as a component so demos that use hooks keep their own hook order. */
  render: ComponentType;
  /** Workbench fixture id (`slug/name`) that lets the reader click into this component. */
  workbench?: string;
};

function ButtonsDemo() {
  return (
    <div className="demo-row">
      <Button className="ui-btn ui-btn-solid">Dispatch ticket</Button>
      <Button className="ui-btn">Export CSV</Button>
      <Button className="ui-btn ui-btn-ghost">Cancel</Button>
      <Button className="ui-btn" disabled>
        Disabled
      </Button>
    </div>
  );
}

function InputsDemo() {
  return (
    <Field.Root className="ui-field" name="site">
      <Field.Label className="ui-label">Site name</Field.Label>
      <Input className="ui-input" defaultValue="120 Broadway" />
      <Field.Description className="ui-description">Used on tickets and meter rollups.</Field.Description>
    </Field.Root>
  );
}

function CheckboxSwitchRadioDemo() {
  return (
    <div className="demo-stack">
      <label className="ui-inline-label">
        <Checkbox.Root className="ui-checkbox" defaultChecked>
          <Checkbox.Indicator className="ui-checkbox-indicator">
            <CheckIcon />
          </Checkbox.Indicator>
        </Checkbox.Root>
        Include submetered loads
      </label>
      <Field.Root className="ui-inline-label">
        <Switch.Root className="ui-switch" defaultChecked>
          <Switch.Thumb className="ui-switch-thumb" />
        </Switch.Root>
        <Field.Label>Real-time alerts</Field.Label>
      </Field.Root>
      <RadioGroup defaultValue="electric" className="demo-stack" aria-label="Meter type">
        {['electric', 'steam', 'gas'].map((value) => (
          <label key={value} className="ui-inline-label">
            <Radio.Root value={value} className="ui-radio">
              <Radio.Indicator className="ui-radio-indicator" />
            </Radio.Root>
            {value[0].toUpperCase() + value.slice(1)}
          </label>
        ))}
      </RadioGroup>
    </div>
  );
}

function SliderDemo() {
  const [value, setValue] = useState([68]);
  return (
    <Slider.Root className="ui-slider" value={value} onValueChange={setValue} min={40} max={85}>
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

function SelectDemo() {
  return (
    <Select.Root items={buildings} defaultValue="120-broadway">
      <Select.Label className="ui-label">Building</Select.Label>
      <Select.Trigger className="ui-select">
        <Select.Value />
        <Select.Icon className="ui-select-icon">
          <ChevronUpDownIcon />
        </Select.Icon>
      </Select.Trigger>
      <Select.Portal>
        <Select.Positioner className="ui-positioner" sideOffset={4}>
          <Select.Popup className="ui-popup">
            <Select.List>
              {buildings.map((building) => (
                <Select.Item key={building.value} value={building.value} className="ui-item">
                  <Select.ItemIndicator className="ui-item-indicator">
                    <CheckIcon />
                  </Select.ItemIndicator>
                  <Select.ItemText>{building.label}</Select.ItemText>
                </Select.Item>
              ))}
            </Select.List>
          </Select.Popup>
        </Select.Positioner>
      </Select.Portal>
    </Select.Root>
  );
}

function ComboboxDemo() {
  return (
    <Combobox.Root items={meters} defaultValue={meters[0]}>
      <label className="ui-label" htmlFor="meter-search">
        Meter
      </label>
      <Combobox.InputGroup className="ui-combobox">
        <Combobox.Input id="meter-search" className="ui-input" placeholder="Search meters" />
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
            <Combobox.Empty className="ui-empty">No meters found.</Combobox.Empty>
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

function NumberFieldDemo() {
  const id = 'demand-threshold';
  return (
    <NumberField.Root id={id} defaultValue={250} className="ui-number">
      <NumberField.ScrubArea className="ui-scrub">
        <label htmlFor={id} className="ui-label">
          Demand threshold&nbsp;(kW)
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

function TabsDemo() {
  return (
    <Tabs.Root defaultValue="today" className="ui-tabs">
      <Tabs.List className="ui-tabs-list">
        <Tabs.Tab className="ui-tab" value="today">
          Today
        </Tabs.Tab>
        <Tabs.Tab className="ui-tab" value="week">
          Week
        </Tabs.Tab>
        <Tabs.Tab className="ui-tab" value="month">
          Month
        </Tabs.Tab>
        <Tabs.Indicator className="ui-tab-indicator" />
      </Tabs.List>
      <Tabs.Panel className="ui-tab-panel" value="today">
        Peak demand 412&nbsp;kW at 14:00.
      </Tabs.Panel>
      <Tabs.Panel className="ui-tab-panel" value="week">
        Week-to-date 18.4&nbsp;MWh, 3.1% under baseline.
      </Tabs.Panel>
      <Tabs.Panel className="ui-tab-panel" value="month">
        Month-to-date 76.2&nbsp;MWh across 6 buildings.
      </Tabs.Panel>
    </Tabs.Root>
  );
}

function AccordionDemo() {
  return (
    <Accordion.Root className="ui-accordion">
      {[
        ['AHU-3', 'Vibration exceeded 4.2\u00a0mm/s for 12 minutes.'],
        ['Chiller-1', 'Leaving water 2.1°F above setpoint.'],
        ['Meter-12', '15-minute gap last night from 01:00–01:15.'],
      ].map(([title, body]) => (
        <Accordion.Item key={title} className="ui-accordion-item">
          <Accordion.Header>
            <Accordion.Trigger className="ui-accordion-trigger">
              {title}
              <PlusIcon className="ui-icon-plus" />
            </Accordion.Trigger>
          </Accordion.Header>
          <Accordion.Panel className="ui-accordion-panel">
            <div className="ui-accordion-body">{body}</div>
          </Accordion.Panel>
        </Accordion.Item>
      ))}
    </Accordion.Root>
  );
}

function DialogDemo() {
  return (
    <Dialog.Root>
      <Dialog.Trigger className="ui-btn">Open dialog</Dialog.Trigger>
      <Dialog.Portal>
        <Dialog.Backdrop className="ui-backdrop" />
        <Dialog.Viewport className="ui-dialog-viewport">
          <Dialog.Popup className="ui-dialog">
            <Dialog.Title className="ui-dialog-title">Confirm export</Dialog.Title>
            <Dialog.Description className="ui-description">
              Export the last 30 days of interval data for 120 Broadway.
            </Dialog.Description>
            <div className="demo-row demo-end">
              <Dialog.Close className="ui-btn">Cancel</Dialog.Close>
              <Dialog.Close className="ui-btn ui-btn-solid">Export</Dialog.Close>
            </div>
          </Dialog.Popup>
        </Dialog.Viewport>
      </Dialog.Portal>
    </Dialog.Root>
  );
}

function AlertDialogDemo() {
  return (
    <AlertDialog.Root>
      <AlertDialog.Trigger className="ui-btn">Delete ticket</AlertDialog.Trigger>
      <AlertDialog.Portal>
        <AlertDialog.Backdrop className="ui-backdrop" />
        <AlertDialog.Viewport className="ui-dialog-viewport">
          <AlertDialog.Popup className="ui-dialog">
            <AlertDialog.Title className="ui-dialog-title">Delete T-1842?</AlertDialog.Title>
            <AlertDialog.Description className="ui-description">
              This removes the AHU-3 vibration ticket. This cannot be undone.
            </AlertDialog.Description>
            <div className="demo-row demo-end">
              <AlertDialog.Close className="ui-btn">Keep</AlertDialog.Close>
              <AlertDialog.Close className="ui-btn ui-btn-solid">Delete</AlertDialog.Close>
            </div>
          </AlertDialog.Popup>
        </AlertDialog.Viewport>
      </AlertDialog.Portal>
    </AlertDialog.Root>
  );
}

function PopoverDemo() {
  return (
    <Popover.Root>
      <Popover.Trigger className="ui-btn">Notifications</Popover.Trigger>
      <Popover.Portal>
        <Popover.Positioner className="ui-positioner" sideOffset={8}>
          <Popover.Popup className="ui-popup ui-popup-padded">
            <Popover.Arrow className="ui-arrow" />
            <Popover.Title className="ui-popup-title">Queue</Popover.Title>
            <Popover.Description className="ui-description">3 open tickets, none past SLA.</Popover.Description>
          </Popover.Popup>
        </Popover.Positioner>
      </Popover.Portal>
    </Popover.Root>
  );
}

function TooltipDemo() {
  return (
    <Tooltip.Root>
      <Tooltip.Trigger className="ui-btn">Demand peak</Tooltip.Trigger>
      <Tooltip.Portal>
        <Tooltip.Positioner className="ui-positioner" sideOffset={6}>
          <Tooltip.Popup className="ui-tooltip">
            Last 15-minute interval: 412&nbsp;kW
          </Tooltip.Popup>
        </Tooltip.Positioner>
      </Tooltip.Portal>
    </Tooltip.Root>
  );
}

function MenuDemo() {
  return (
    <Menu.Root>
      <Menu.Trigger className="ui-btn">Actions</Menu.Trigger>
      <Menu.Portal>
        <Menu.Positioner className="ui-positioner" sideOffset={4}>
          <Menu.Popup className="ui-popup">
            <Menu.Item className="ui-item">Assign owner</Menu.Item>
            <Menu.Item className="ui-item">Snooze 4 hours</Menu.Item>
            <Menu.Separator className="ui-separator" />
            <Menu.Item className="ui-item">Mark resolved</Menu.Item>
          </Menu.Popup>
        </Menu.Positioner>
      </Menu.Portal>
    </Menu.Root>
  );
}

function ProgressMeterDemo() {
  return (
    <div className="demo-stack">
      <Progress.Root className="ui-progress" value={72}>
        <Progress.Label className="ui-label">Interval ingest</Progress.Label>
        <Progress.Value className="ui-progress-value" />
        <Progress.Track className="ui-track">
          <Progress.Indicator className="ui-track-indicator" />
        </Progress.Track>
      </Progress.Root>
      <Meter.Root className="ui-progress" value={0.63}>
        <Meter.Label className="ui-label">Occupancy</Meter.Label>
        <Meter.Value className="ui-progress-value">{(_formatted, value) => `${Math.round((value ?? 0) * 100)}%`}</Meter.Value>
        <Meter.Track className="ui-track">
          <Meter.Indicator className="ui-track-indicator" />
        </Meter.Track>
      </Meter.Root>
    </div>
  );
}

function ToastDemo() {
  const toastManager = Toast.useToastManager();
  return (
    <Button
      className="ui-btn"
      onClick={() =>
        toastManager.add({
          title: 'Export queued',
          description: '30-day interval CSV for 120 Broadway.',
        })
      }
    >
      Show toast
    </Button>
  );
}

function ToggleDemo() {
  return (
    <ToggleGroup defaultValue={['kw']} className="ui-toggle-group">
      <Toggle value="kw" className="ui-toggle">
        kW
      </Toggle>
      <Toggle value="kwh" className="ui-toggle">
        kWh
      </Toggle>
      <Toggle value="cost" className="ui-toggle">
        $
      </Toggle>
    </ToggleGroup>
  );
}

function AvatarCollapsibleDemo() {
  return (
    <div className="demo-stack">
      <div className="demo-row">
        <Avatar.Root className="ui-avatar">
          <Avatar.Image src="https://i.pravatar.cc/64?img=12" alt="Alex Rivera" />
          <Avatar.Fallback>AR</Avatar.Fallback>
        </Avatar.Root>
        <Avatar.Root className="ui-avatar">
          <Avatar.Fallback>JL</Avatar.Fallback>
        </Avatar.Root>
        <div>
          <div className="ui-popup-title">Alex Rivera</div>
          <div className="ui-description">On-call operator</div>
        </div>
      </div>
      <Collapsible.Root>
        <Collapsible.Trigger className="ui-accordion-trigger">
          Shift notes
          <ChevronDownIcon className="ui-icon-chevron" />
        </Collapsible.Trigger>
        <Collapsible.Panel className="ui-accordion-panel">
          <div className="ui-accordion-body">Chiller-1 is in night setback until 06:00. Do not override unless occupancy exceeds 40%.</div>
        </Collapsible.Panel>
      </Collapsible.Root>
    </div>
  );
}

function ScrollTicketsDemo() {
  return (
    <ScrollArea.Root className="ui-scroll">
      <ScrollArea.Viewport className="ui-scroll-viewport">
        {tickets.map((ticket) => (
          <div key={ticket.id} className="ticket-row">
            <span className="ticket-id">{ticket.id}</span>
            <span className="ticket-title">{ticket.title}</span>
            <span className="ui-description">{ticket.status}</span>
          </div>
        ))}
      </ScrollArea.Viewport>
      <ScrollArea.Scrollbar className="ui-scrollbar">
        <ScrollArea.Thumb className="ui-scrollbar-thumb" />
      </ScrollArea.Scrollbar>
    </ScrollArea.Root>
  );
}

function SeparatorDemo() {
  return (
    <div className="demo-stack">
      <span className="ui-label">Operations</span>
      <Separator className="ui-separator" />
      <span className="ui-description">Tickets, meters, and occupancy in one queue.</span>
    </div>
  );
}

export const demos: Demo[] = [
  { id: 'buttons', title: 'Button', group: 'Actions', render: ButtonsDemo, workbench: 'button/playground' },
  { id: 'menu', title: 'Menu', group: 'Actions', render: MenuDemo, workbench: 'overlays/menu' },
  { id: 'tooltip', title: 'Tooltip', group: 'Actions', render: TooltipDemo, workbench: 'overlays/tooltip' },
  { id: 'popover', title: 'Popover', group: 'Actions', render: PopoverDemo, workbench: 'overlays/popover' },
  { id: 'dialog', title: 'Dialog', group: 'Actions', render: DialogDemo, workbench: 'overlays/dialog' },
  { id: 'alert-dialog', title: 'Alert Dialog', group: 'Actions', render: AlertDialogDemo, workbench: 'overlays/alert-dialog' },
  { id: 'toast', title: 'Toast', group: 'Actions', render: ToastDemo, workbench: 'overlays/toast' },
  { id: 'input', title: 'Field + Input', group: 'Forms', render: InputsDemo, workbench: 'field/playground' },
  { id: 'select', title: 'Select', group: 'Forms', render: SelectDemo, workbench: 'forms/select' },
  { id: 'combobox', title: 'Combobox', group: 'Forms', render: ComboboxDemo, workbench: 'forms/combobox' },
  { id: 'number', title: 'Number Field', group: 'Forms', render: NumberFieldDemo, workbench: 'forms/number-field' },
  { id: 'choice', title: 'Checkbox, Switch, Radio', group: 'Forms', render: CheckboxSwitchRadioDemo, workbench: 'controls/switch' },
  { id: 'slider', title: 'Slider', group: 'Forms', render: SliderDemo, workbench: 'forms/slider' },
  { id: 'toggle', title: 'Toggle Group', group: 'Forms', render: ToggleDemo, workbench: 'forms/toggle-group' },
  { id: 'tabs', title: 'Tabs', group: 'Structure', render: TabsDemo, workbench: 'controls/tabs' },
  { id: 'accordion', title: 'Accordion', group: 'Structure', render: AccordionDemo, workbench: 'structure/accordion' },
  { id: 'progress', title: 'Progress + Meter', group: 'Structure', render: ProgressMeterDemo, workbench: 'structure/progress-and-meter' },
  { id: 'avatar', title: 'Avatar + Collapsible', group: 'Structure', render: AvatarCollapsibleDemo, workbench: 'structure/avatar' },
  { id: 'scroll', title: 'Scroll Area', group: 'Structure', render: ScrollTicketsDemo, workbench: 'structure/scroll-area' },
  { id: 'separator', title: 'Separator', group: 'Structure', render: SeparatorDemo, workbench: 'structure/separator' },
  ...stackDemos,
  ...chartDemos,
  ...tableDemos,
];
