import { useFixtureInput, useFixtureSelect } from 'react-cosmos/client';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import type { AsyncStatus } from '../../api/state';
import type { Location } from '../../api/types';
import {
  actionPriorities,
  actionSets,
  actionStatuses,
  portfolio,
  sampleSetNames,
  type SampleSetName,
} from '../../fixtures/data';
import { DateRangeText, DateText } from './DateText';
import { EntityCard } from './EntityCard';
import { RelationLink } from './RelationLink';
import { ActionPriorityChip, ActionStatusChip } from './StatusChip';

const statuses: AsyncStatus[] = ['ready', 'loading', 'fetching', 'error'];

function Playground() {
  const [set] = useFixtureSelect('data', {
    options: [...sampleSetNames.filter((name) => name !== 'none')] as SampleSetName[],
    defaultValue: 'one',
  });
  const [status] = useFixtureSelect('status', { options: statuses });
  const [link] = useFixtureInput('title links', true);
  const [actions] = useFixtureInput('actions', true);
  const records = actionSets[set].slice(0, 3);
  return (
    <Box sx={{ display: 'grid', gap: 4, maxWidth: 560 }}>
      {records.map((action) => (
        <EntityCard
          key={action.id}
          title={action.name}
          noun="work order"
          subtitle={action.description || undefined}
          to={link ? `/work-orders/${action.id}` : undefined}
          status={
            <>
              <ActionStatusChip status={action.action_status} lookup={actionStatuses} />
              <ActionPriorityChip priority={action.action_priority} lookup={actionPriorities} />
            </>
          }
          meta={[
            { label: 'Work order', value: `#${action.work_order_number}` },
            {
              label: 'Building',
              value: (
                <RelationLink<Location>
                  value={portfolio.locations.find((row) => row.id === action.location_id) ?? action.location_id}
                  label={(row) => row.name}
                  to={(id) => `/buildings/${id}`}
                />
              ),
            },
            {
              label: 'Equipment',
              value: (
                <RelationLink
                  value={action.equipment}
                  label={(row: { id: string; name: string }) => row.name}
                  to={(id) => `/equipment/${id}`}
                />
              ),
            },
            { label: 'Scheduled', value: <DateRangeText range={action.schedule_date} /> },
            { label: 'Due', value: <DateText value={action.due_date} /> },
          ]}
          actions={
            actions ? (
              <>
                <Button size="small" variant="outlined" color="inherit">
                  Assign
                </Button>
                <Button size="small" variant="contained">
                  Start
                </Button>
              </>
            ) : undefined
          }
          state={{ status, error: 'Work order could not be loaded.', onRetry: () => undefined }}
        />
      ))}
    </Box>
  );
}

export default { Playground };
