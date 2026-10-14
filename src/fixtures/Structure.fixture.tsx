import { Accordion } from '@base-ui/react/accordion';
import { Avatar } from '@base-ui/react/avatar';
import { Collapsible } from '@base-ui/react/collapsible';
import { Meter } from '@base-ui/react/meter';
import { Progress } from '@base-ui/react/progress';
import { ScrollArea } from '@base-ui/react/scroll-area';
import { Separator } from '@base-ui/react/separator';
import { tickets } from '../data';
import { ChevronDownIcon, PlusIcon } from '../icons';
import { useFixtureInput, useFixtureSelect } from 'react-cosmos/client';

const alerts = [
  ['AHU-3', 'Vibration exceeded 4.2 mm/s for 12 minutes.'],
  ['Chiller-1', 'Leaving water 2.1°F above setpoint.'],
  ['Meter-12', '15-minute gap last night from 01:00–01:15.'],
  ['Boiler-2', 'Stack temperature trending up over 3 cycles.'],
  ['Pump-7', 'Runtime 40% above the seasonal baseline.'],
];

function AccordionFixture() {
  const [count] = useFixtureInput('item count', 3);
  const [multiple] = useFixtureInput('open multiple', false);
  const [openFirst] = useFixtureInput('first open', false);
  const items = alerts.slice(0, Math.max(1, Math.min(alerts.length, count)));
  return (
    <Accordion.Root className="ui-accordion" multiple={multiple} defaultValue={openFirst ? [items[0][0]] : []}>
      {items.map(([title, body]) => (
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
  );
}

function ProgressMeterFixture() {
  const [progress] = useFixtureInput('progress %', 72);
  const [meter] = useFixtureInput('meter %', 63);
  const [indeterminate] = useFixtureInput('progress indeterminate', false);
  return (
    <div className="demo-stack">
      <Progress.Root className="ui-progress" value={indeterminate ? null : Math.max(0, Math.min(100, progress))}>
        <Progress.Label className="ui-label">Interval ingest</Progress.Label>
        <Progress.Value className="ui-progress-value" />
        <Progress.Track className="ui-track">
          <Progress.Indicator className="ui-track-indicator" />
        </Progress.Track>
      </Progress.Root>
      <Meter.Root className="ui-progress" value={Math.max(0, Math.min(1, meter / 100))}>
        <Meter.Label className="ui-label">Occupancy</Meter.Label>
        <Meter.Value className="ui-progress-value">{(_formatted, value) => `${Math.round((value ?? 0) * 100)}%`}</Meter.Value>
        <Meter.Track className="ui-track">
          <Meter.Indicator className="ui-track-indicator" />
        </Meter.Track>
      </Meter.Root>
    </div>
  );
}

function AvatarFixture() {
  const [source] = useFixtureSelect('image', { options: [...(['photo', 'broken url', 'none'] as const)] });
  const [initials] = useFixtureInput('initials', 'AR');
  const [name] = useFixtureInput('name', 'Alex Rivera');
  const [role] = useFixtureInput('role', 'On-call operator');
  const src = source === 'photo' ? 'https://i.pravatar.cc/64?img=12' : source === 'broken url' ? 'https://example.invalid/missing.png' : undefined;
  return (
    <div className="demo-row">
      <Avatar.Root className="ui-avatar">
        {src ? <Avatar.Image src={src} alt={name} /> : null}
        <Avatar.Fallback>{initials}</Avatar.Fallback>
      </Avatar.Root>
      <div>
        <div className="ui-popup-title">{name}</div>
        <div className="ui-description">{role}</div>
      </div>
    </div>
  );
}

function CollapsibleFixture() {
  const [open, setOpen] = useFixtureInput('open', false);
  const [label] = useFixtureInput('label', 'Shift notes');
  return (
    <Collapsible.Root open={open} onOpenChange={setOpen}>
      <Collapsible.Trigger className="ui-accordion-trigger">
        {label}
        <ChevronDownIcon className="ui-icon-chevron" />
      </Collapsible.Trigger>
      <Collapsible.Panel className="ui-accordion-panel">
        <div className="ui-accordion-body">Chiller-1 is in night setback until 06:00. Do not override unless occupancy exceeds 40%.</div>
      </Collapsible.Panel>
    </Collapsible.Root>
  );
}

function ScrollAreaFixture() {
  const [rows] = useFixtureInput('row count', 12);
  const [height] = useFixtureInput('height', 160);
  const list = Array.from({ length: Math.max(1, Math.min(60, rows)) }, (_, index) => tickets[index % tickets.length]);
  return (
    <ScrollArea.Root className="ui-scroll" style={{ height }}>
      <ScrollArea.Viewport className="ui-scroll-viewport">
        {list.map((ticket, index) => (
          <div key={`${ticket.id}-${index}`} className="ticket-row">
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

function SeparatorFixture() {
  const [above] = useFixtureInput('label above', 'Operations');
  const [below] = useFixtureInput('text below', 'Tickets, meters, and occupancy in one queue.');
  return (
    <div className="demo-stack">
      <span className="ui-label">{above}</span>
      <Separator className="ui-separator" />
      <span className="ui-description">{below}</span>
    </div>
  );
}

export default {
  Accordion: AccordionFixture,
  'Progress and meter': ProgressMeterFixture,
  Avatar: AvatarFixture,
  Collapsible: CollapsibleFixture,
  'Scroll area': ScrollAreaFixture,
  Separator: SeparatorFixture,
};
