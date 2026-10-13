import { useFixtureInput, useFixtureSelect } from 'react-cosmos/client';
import Card from '@mui/material/Card';
import type { AsyncStatus } from '../../api/state';
import { propertyAlertSets } from '../../fixtures/data';
import { DataState } from './DataState';
import { EntityList } from './EntityList';
import { ListSkeleton } from './Skeletons';
import { AlertStateChip } from './StatusChip';

const statuses: AsyncStatus[] = ['ready', 'loading', 'fetching', 'empty', 'error', 'idle'];

function Playground() {
  const [status] = useFixtureSelect('status', { options: statuses });
  const [error] = useFixtureInput('error message', 'Server error.');
  const [retry] = useFixtureInput('retry available', true);
  const items = propertyAlertSets.few.map((alert) => ({
    id: alert.id,
    primary: alert.name,
    secondary: alert.description,
    trailing: <AlertStateChip alert={alert} />,
  }));
  return (
    <Card sx={{ maxWidth: 640 }}>
      <DataState
        state={{ status, error, onRetry: retry ? () => undefined : undefined }}
        skeleton={<ListSkeleton rows={5} />}
        empty={{ title: 'No alerts', description: 'Every meter is reporting on schedule.' }}
      >
        <EntityList items={items} />
      </DataState>
    </Card>
  );
}

export default { Playground };
