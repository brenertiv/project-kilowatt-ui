import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';
import { actionPriorities, actionStatuses } from '../../fixtures/data';
import { CheckCircleIcon } from '../../icons';
import { ActionPriorityChip, ActionStatusChip, AlertStateChip, StatusChip, type Tone } from './StatusChip';

const tones: Tone[] = ['neutral', 'info', 'success', 'warning', 'error'];

function Row({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <Stack spacing={1.5}>
      <Typography variant="overline" color="text.secondary">
        {title}
      </Typography>
      <Stack direction="row" spacing={2} useFlexGap sx={{ flexWrap: 'wrap', alignItems: 'center' }}>
        {children}
      </Stack>
    </Stack>
  );
}

export default function AllChips() {
  return (
    <Stack spacing={5}>
      <Row title="Tones">
        {tones.map((tone) => (
          <StatusChip key={tone} label={tone} tone={tone} />
        ))}
        <StatusChip label="With icon" tone="success" icon={<CheckCircleIcon />} />
        <StatusChip label="Medium" tone="info" size="medium" />
      </Row>
      <Row title="Work order status, from the API lookup">
        {actionStatuses.map((status) => (
          <ActionStatusChip key={status.id} status={status.id} lookup={actionStatuses} />
        ))}
      </Row>
      <Row title="Work order priority">
        {actionPriorities.map((priority) => (
          <ActionPriorityChip key={priority.id} priority={priority.id} lookup={actionPriorities} />
        ))}
      </Row>
      <Row title="Property alert flags">
        <AlertStateChip alert={{ fixed: false, acknowledged: false }} />
        <AlertStateChip alert={{ fixed: false, acknowledged: true }} />
        <AlertStateChip alert={{ fixed: true, acknowledged: true }} />
      </Row>
      <Row title="Bare id with no lookup table">
        <ActionStatusChip status={7} />
      </Row>
    </Stack>
  );
}
