import { Accordion } from '@base-ui/react/accordion';
import { Avatar } from '@base-ui/react/avatar';
import { Collapsible } from '@base-ui/react/collapsible';
import { Meter } from '@base-ui/react/meter';
import { Progress } from '@base-ui/react/progress';
import { ScrollArea } from '@base-ui/react/scroll-area';
import { Separator } from '@base-ui/react/separator';
import type { Meta, StoryObj } from '@storybook/react-vite';
import { tickets } from 'src/data';
import { ChevronDownIcon, PlusIcon } from 'src/icons';

/** Recipes for grouping, revealing and measuring content over Base UI. There are no wrapper components: copy the markup and classes. */
const meta = {
  title: 'Primitives/Structure',
  tags: ['!autodocs'],
} satisfies Meta;

export default meta;

const alerts = [
  ['AHU-3', 'Vibration exceeded 4.2 mm/s for 12 minutes.'],
  ['Chiller-1', 'Leaving water 2.1°F above setpoint.'],
  ['Meter-12', '15-minute gap last night from 01:00–01:15.'],
  ['Boiler-2', 'Stack temperature trending up over 3 cycles.'],
  ['Pump-7', 'Runtime 40% above the seasonal baseline.'],
] as const;

type AccordionArgs = { itemCount: number; multiple: boolean };
type ValueArgs = { value: number };
type AvatarArgs = { name: string; role: string; initials: string };
type CollapsibleArgs = { label: string };
type ScrollAreaArgs = { rowCount: number; height: number };
type SeparatorArgs = { label: string; text: string };

/** A stack of titled sections the user expands one at a time: `ui-accordion` items with a plus icon that turns on open. */
export const AccordionRecipe: StoryObj<AccordionArgs> = {
  name: 'Accordion',
  args: { itemCount: 3, multiple: false },
  argTypes: { itemCount: { control: { type: 'range', min: 1, max: alerts.length } } },
  render: ({ itemCount, multiple }) => (
    <Accordion.Root className="ui-accordion" multiple={multiple}>
      {alerts.slice(0, Math.max(1, itemCount)).map(([title, body]) => (
        <Accordion.Item key={title} value={title} className="ui-accordion-item">
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
  ),
};

/** How far a running task has got: `ui-progress` with a `ui-track`. Pass `value={null}` when the end is unknown. */
export const ProgressRecipe: StoryObj<ValueArgs> = {
  name: 'Progress',
  args: { value: 72 },
  argTypes: { value: { control: { type: 'range', min: 0, max: 100 } } },
  render: ({ value }) => (
    <Progress.Root className="ui-progress" value={value}>
      <Progress.Label className="ui-label">Interval ingest</Progress.Label>
      <Progress.Value className="ui-progress-value" />
      <Progress.Track className="ui-track">
        <Progress.Indicator className="ui-track-indicator" />
      </Progress.Track>
    </Progress.Root>
  ),
};

/** A task with no known end: `value={null}` makes the progress bar indeterminate. */
export const ProgressIndeterminate: StoryObj = {
  name: 'Progress, indeterminate',
  render: () => (
    <Progress.Root className="ui-progress" value={null}>
      <Progress.Label className="ui-label">Interval ingest</Progress.Label>
      <Progress.Track className="ui-track">
        <Progress.Indicator className="ui-track-indicator" />
      </Progress.Track>
    </Progress.Root>
  ),
};

/** A static level within a known range, such as occupancy, not a task's progress: `Meter` with the same `ui-progress` classes. */
export const MeterRecipe: StoryObj<ValueArgs> = {
  name: 'Meter',
  args: { value: 63 },
  argTypes: { value: { control: { type: 'range', min: 0, max: 100 } } },
  render: ({ value }) => (
    <Meter.Root className="ui-progress" value={value}>
      <Meter.Label className="ui-label">Occupancy</Meter.Label>
      <Meter.Value className="ui-progress-value" />
      <Meter.Track className="ui-track">
        <Meter.Indicator className="ui-track-indicator" />
      </Meter.Track>
    </Meter.Root>
  ),
};

/** A person with a photo: `ui-avatar` with an image; the initials fallback shows while it loads or if it fails. */
export const AvatarRecipe: StoryObj<AvatarArgs> = {
  name: 'Avatar',
  args: { name: 'Alex Rivera', role: 'On-call operator', initials: 'AR' },
  render: ({ name, role, initials }) => (
    <div className="demo-row">
      <Avatar.Root className="ui-avatar">
        <Avatar.Image src="https://i.pravatar.cc/64?img=12" alt={name} />
        <Avatar.Fallback>{initials}</Avatar.Fallback>
      </Avatar.Root>
      <div>
        <div className="ui-popup-title">{name}</div>
        <div className="ui-description">{role}</div>
      </div>
    </div>
  ),
};

/** A person with no photo: leave out `Avatar.Image` and the initials show. */
export const AvatarInitials: StoryObj<AvatarArgs> = {
  name: 'Avatar, initials',
  args: AvatarRecipe.args,
  render: ({ name, role, initials }) => (
    <div className="demo-row">
      <Avatar.Root className="ui-avatar">
        <Avatar.Fallback>{initials}</Avatar.Fallback>
      </Avatar.Root>
      <div>
        <div className="ui-popup-title">{name}</div>
        <div className="ui-description">{role}</div>
      </div>
    </div>
  ),
};

/** One section of secondary detail that can be shown or hidden: `Collapsible` with the accordion trigger and panel classes. */
export const CollapsibleRecipe: StoryObj<CollapsibleArgs> = {
  name: 'Collapsible',
  args: { label: 'Shift notes' },
  render: ({ label }) => (
    <Collapsible.Root>
      <Collapsible.Trigger className="ui-accordion-trigger">
        {label}
        <ChevronDownIcon className="ui-icon-chevron" />
      </Collapsible.Trigger>
      <Collapsible.Panel className="ui-accordion-panel">
        <div className="ui-accordion-body">Chiller-1 is in night setback until 06:00. Do not override unless occupancy exceeds 40%.</div>
      </Collapsible.Panel>
    </Collapsible.Root>
  ),
};

/** A fixed-height region that scrolls with the themed scrollbar: `ui-scroll`, `ui-scroll-viewport` and `ui-scrollbar`. */
export const ScrollAreaRecipe: StoryObj<ScrollAreaArgs> = {
  name: 'Scroll area',
  args: { rowCount: 12, height: 160 },
  argTypes: { rowCount: { control: { type: 'range', min: 1, max: 60 } } },
  render: ({ rowCount, height }) => (
    <ScrollArea.Root className="ui-scroll" style={{ height }}>
      <ScrollArea.Viewport className="ui-scroll-viewport">
        {Array.from({ length: Math.max(1, rowCount) }, (_, index) => {
          const ticket = tickets[index % tickets.length];
          return (
            <div key={`${ticket.id}-${index}`} className="ticket-row">
              <span className="ticket-id">{ticket.id}</span>
              <span className="ticket-title">{ticket.title}</span>
              <span className="ui-description">{ticket.status}</span>
            </div>
          );
        })}
      </ScrollArea.Viewport>
      <ScrollArea.Scrollbar className="ui-scrollbar">
        <ScrollArea.Thumb className="ui-scrollbar-thumb" />
      </ScrollArea.Scrollbar>
    </ScrollArea.Root>
  ),
};

/** A rule between two groups of content: `ui-separator`. */
export const SeparatorRecipe: StoryObj<SeparatorArgs> = {
  name: 'Separator',
  args: { label: 'Operations', text: 'Tickets, meters, and occupancy in one queue.' },
  render: ({ label, text }) => (
    <div className="demo-stack">
      <span className="ui-label">{label}</span>
      <Separator className="ui-separator" />
      <span className="ui-description">{text}</span>
    </div>
  ),
};
