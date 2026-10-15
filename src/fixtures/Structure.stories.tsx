import Accordion from '@mui/material/Accordion';
import AccordionDetails from '@mui/material/AccordionDetails';
import AccordionSummary from '@mui/material/AccordionSummary';
import Avatar from '@mui/material/Avatar';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Collapse from '@mui/material/Collapse';
import Divider from '@mui/material/Divider';
import LinearProgress from '@mui/material/LinearProgress';
import List from '@mui/material/List';
import ListItem from '@mui/material/ListItem';
import ListItemText from '@mui/material/ListItemText';
import Paper from '@mui/material/Paper';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';
import type { Meta, StoryObj } from '@storybook/react-vite';
import { type ReactNode, useId, useState } from 'react';
import avatarPhoto from 'src/assets/avatar-photo.svg';
import { tickets } from 'src/data';
import { ChevronDownIcon } from 'src/icons';
import { tokenContrast } from 'src/stories/a11y';

/** Grouping, revealing and measuring content: MUI's Accordion, Collapse, LinearProgress, Avatar, Paper and Divider as themed. */
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
type ValueArgs = { label: string; value: number };
type AvatarArgs = { name: string; role: string; initials: string };
type CollapseArgs = { label: string };
type ScrollArgs = { rowCount: number; height: number };
type DividerArgs = { label: string; text: string };

function AccordionDemo({ itemCount, multiple }: AccordionArgs) {
  const id = useId();
  const [open, setOpen] = useState<string[]>([]);
  return (
    <Box>
      {alerts.slice(0, Math.max(1, itemCount)).map(([title, body], index) => (
        <Accordion
          key={title}
          disableGutters
          expanded={open.includes(title)}
          onChange={(_event, expanded) =>
            setOpen((current) => (expanded ? (multiple ? [...current, title] : [title]) : current.filter((item) => item !== title)))
          }
        >
          <AccordionSummary expandIcon={<ChevronDownIcon />} id={`${id}-header-${index}`} aria-controls={`${id}-panel-${index}`}>
            <Typography component="span">{title}</Typography>
          </AccordionSummary>
          <AccordionDetails>
            <Typography variant="body2" color="text.secondary">
              {body}
            </Typography>
          </AccordionDetails>
        </Accordion>
      ))}
    </Box>
  );
}

/** A stack of titled sections the user expands, one at a time unless `multiple`: controlled `Accordion` items with `expanded`. */
export const AccordionRecipe: StoryObj<AccordionArgs> = {
  name: 'Accordion',
  args: { itemCount: 3, multiple: false },
  argTypes: { itemCount: { control: { type: 'range', min: 1, max: alerts.length } } },
  render: (args) => <AccordionDemo key={String(args.multiple)} {...args} />,
};

function CollapseDemo({ label }: CollapseArgs) {
  const id = useId();
  const [open, setOpen] = useState(false);
  return (
    <Box>
      <Button
        aria-expanded={open}
        aria-controls={id}
        endIcon={<ChevronDownIcon style={{ transform: open ? 'rotate(180deg)' : undefined }} />}
        onClick={() => setOpen(!open)}
      >
        {label}
      </Button>
      <Collapse in={open} id={id}>
        <Typography variant="body2" color="text.secondary" sx={{ py: 1 }}>
          Chiller-1 is in night setback until 06:00. Do not override unless occupancy exceeds 40%.
        </Typography>
      </Collapse>
    </Box>
  );
}

/** One section of secondary detail that can be shown or hidden: a text `Button` with `aria-expanded` toggling a `Collapse`. */
export const CollapseRecipe: StoryObj<CollapseArgs> = {
  name: 'Collapse',
  args: { label: 'Shift notes' },
  render: (args) => <CollapseDemo {...args} />,
};

function LabelledBar({ label, value, meter }: { label: string; value: number | null; meter?: boolean }) {
  const id = useId();
  return (
    <Box sx={{ width: 280 }}>
      <Stack direction="row" sx={{ justifyContent: 'space-between', mb: 0.5 }}>
        <Typography id={id} variant="body2" color="text.secondary">
          {label}
        </Typography>
        {value === null ? null : <Typography variant="body2">{value}%</Typography>}
      </Stack>
      {value === null ? (
        <LinearProgress aria-labelledby={id} />
      ) : (
        <LinearProgress
          variant="determinate"
          value={value}
          aria-labelledby={id}
          {...(meter ? { role: 'meter', 'aria-valuemin': 0, 'aria-valuemax': 100, 'aria-valuetext': `${value}%` } : {})}
        />
      )}
    </Box>
  );
}

/** How far a running task has got: determinate `LinearProgress` with a visible label and percentage. */
export const ProgressRecipe: StoryObj<ValueArgs> = {
  name: 'Progress',
  args: { label: 'Interval ingest', value: 72 },
  argTypes: { value: { control: { type: 'range', min: 0, max: 100 } } },
  render: ({ label, value }) => <LabelledBar label={label} value={value} />,
};

/** A task with no known end: `LinearProgress` without `variant` is indeterminate. Keep the label; drop the percentage. */
export const ProgressIndeterminate: StoryObj<ValueArgs> = {
  name: 'Progress, indeterminate',
  args: { label: 'Interval ingest' },
  render: ({ label }) => <LabelledBar label={label} value={null} />,
};

/** A static level within a known range, such as occupancy, not a task's progress: determinate `LinearProgress` with `role="meter"`. */
export const MeterRecipe: StoryObj<ValueArgs> = {
  name: 'Meter',
  args: { label: 'Occupancy', value: 63 },
  argTypes: { value: { control: { type: 'range', min: 0, max: 100 } } },
  render: ({ label, value }) => <LabelledBar label={label} value={value} meter />,
};

function Person({ name, role, children }: { name: string; role: string; children: ReactNode }) {
  return (
    <Stack direction="row" spacing={1} sx={{ alignItems: 'center' }}>
      {children}
      <Box>
        <Typography variant="subtitle2">{name}</Typography>
        <Typography variant="body2" color="text.secondary">
          {role}
        </Typography>
      </Box>
    </Stack>
  );
}

/** A person with a photo: `Avatar` with `src` and `alt`. Initials show in its place if the image fails. */
export const AvatarRecipe: StoryObj<AvatarArgs> = {
  name: 'Avatar',
  args: { name: 'Alex Rivera', role: 'On-call operator', initials: 'AR' },
  render: ({ name, role, initials }) => (
    <Person name={name} role={role}>
      <Avatar src={avatarPhoto} alt={name}>
        {initials}
      </Avatar>
    </Person>
  ),
};

/** A person with no photo: `Avatar` with the initials as children. */
export const AvatarInitials: StoryObj<AvatarArgs> = {
  name: 'Avatar, initials',
  // Contrast off: MUI's default Avatar is backgroundDefault initials on grey[400], 1.65:1. See src/stories/a11y.ts.
  parameters: { a11y: tokenContrast },
  args: AvatarRecipe.args,
  render: ({ name, role, initials }) => (
    <Person name={name} role={role}>
      <Avatar aria-hidden="true">{initials}</Avatar>
    </Person>
  ),
};

/** A fixed-height list that scrolls inside the page: an outlined `Paper` with a height and `overflow: auto`, focusable and labelled. */
export const ScrollRecipe: StoryObj<ScrollArgs> = {
  name: 'Scrolling region',
  args: { rowCount: 12, height: 200 },
  argTypes: { rowCount: { control: { type: 'range', min: 1, max: 60 } } },
  render: ({ rowCount, height }) => (
    <Paper variant="outlined" tabIndex={0} role="region" aria-label="Open tickets" sx={{ height, overflow: 'auto', maxWidth: 480 }}>
      <List dense disablePadding>
        {Array.from({ length: Math.max(1, rowCount) }, (_, index) => {
          const ticket = tickets[index % tickets.length];
          return (
            <ListItem key={`${ticket.id}-${index}`} divider>
              <ListItemText primary={ticket.title} secondary={`${ticket.id} · ${ticket.status}`} />
            </ListItem>
          );
        })}
      </List>
    </Paper>
  ),
};

/** A rule between two groups of content: `Divider`. Use spacing alone when that already separates the groups. */
export const DividerRecipe: StoryObj<DividerArgs> = {
  name: 'Divider',
  args: { label: 'Operations', text: 'Tickets, meters, and occupancy in one queue.' },
  render: ({ label, text }) => (
    <Stack spacing={1} sx={{ maxWidth: 480 }}>
      <Typography variant="subtitle2">{label}</Typography>
      <Divider />
      <Typography variant="body2" color="text.secondary">
        {text}
      </Typography>
    </Stack>
  ),
};
