import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';
import { portfolio } from '../../fixtures/data';
import { DateRangeText, DateText, RelativeTime } from './DateText';

const now = new Date('2026-10-13T12:00:00-04:00');
const action = portfolio.actions[0]!;
const alert = portfolio.propertyAlerts.find((row) => row.relevant_period)!;

function Case({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <Stack direction="row" spacing={4} sx={{ alignItems: 'baseline' }}>
      <Typography variant="body2" color="text.secondary" sx={{ width: 220 }}>
        {title}
      </Typography>
      <Typography variant="body1">{children}</Typography>
    </Stack>
  );
}

export default function Cases() {
  return (
    <Stack spacing={3}>
      <Case title="Calendar date">
        <DateText value={action.due_date} />
      </Case>
      <Case title="Timestamp with offset">
        <DateText value={action.created} />
      </Case>
      <Case title="Timestamp, date only">
        <DateText value={action.created} time={false} />
      </Case>
      <Case title="Relative">
        <RelativeTime value={alert.time_evaluated} now={now} />
      </Case>
      <Case title="Calendar range">
        <DateRangeText range={alert.relevant_period} />
      </Case>
      <Case title="Timestamp range">
        <DateRangeText range={action.schedule_date} />
      </Case>
      <Case title="Open-ended range">
        <DateRangeText range={{ lower: '2026-10-01', upper: null, bounds: '[)' }} />
      </Case>
      <Case title="Missing">
        <DateText value={null} /> · <DateRangeText range={null} />
      </Case>
    </Stack>
  );
}
