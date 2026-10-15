import type { Meta, StoryObj } from '@storybook/react-vite';
import { portfolio } from '../../fixtures/data';
import { DateRangeText, DateText, RelativeTime } from './DateText';

const now = new Date('2026-10-13T12:00:00-04:00');
const action = portfolio.actions[0]!;
const alert = portfolio.propertyAlerts.find((row) => row.relevant_period)!;

const meta = {
  title: 'Data/DateText',
  component: DateText,
  subcomponents: { RelativeTime, DateRangeText },
  args: {
    value: action.due_date,
  },
  argTypes: {
    value: { control: 'text' },
    time: { control: 'boolean' },
  },
} satisfies Meta<typeof DateText>;

export default meta;
type Story = StoryObj<typeof meta>;

/** A calendar date from the API (`YYYY-MM-DD`), such as a due date. Shows the date only. */
export const CalendarDate: Story = {};

/** A timestamp with an offset, such as `created`. Shows the date and time. */
export const Timestamp: Story = {
  args: { value: action.created },
};

/** A timestamp shown as a date only, with `time={false}`, where the time of day is noise. */
export const TimestampDateOnly: Story = {
  args: { value: action.created, time: false },
};

/** No value: the no-value dash, so a missing date never reads as blank space. */
export const Missing: Story = {
  args: { value: null },
};

/** `RelativeTime`: "3 days ago" with the absolute time on hover. Use for recency, such as when an alert was evaluated. */
export const Relative: Story = {
  render: () => <RelativeTime value={alert.time_evaluated} now={now} />,
};

/** `DateRangeText` over a calendar range, such as an alert's relevant period. */
export const CalendarRange: Story = {
  render: () => <DateRangeText range={alert.relevant_period} />,
};

/** `DateRangeText` over a timestamp range, such as a work order's schedule. */
export const TimestampRange: Story = {
  render: () => <DateRangeText range={action.schedule_date} />,
};

/** `DateRangeText` with no upper bound: the range reads as starting on a date and continuing. */
export const OpenEndedRange: Story = {
  render: () => <DateRangeText range={{ lower: '2026-10-01', upper: null, bounds: '[)' }} />,
};

/** `DateRangeText` with no range at all shows the no-value dash. */
export const MissingRange: Story = {
  render: () => <DateRangeText range={null} />,
};
