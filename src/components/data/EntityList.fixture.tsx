import { useFixtureInput, useFixtureSelect } from 'react-cosmos/client';
import Card from '@mui/material/Card';
import type { AsyncStatus } from '../../api/state';
import { propertyAlertSets, sampleSetNames, type SampleSetName } from '../../fixtures/data';
import { RelativeTime } from './DateText';
import { EntityList } from './EntityList';
import { AlertStateChip } from './StatusChip';

const statuses: AsyncStatus[] = ['ready', 'loading', 'fetching', 'empty', 'error'];

function Playground() {
  const [set] = useFixtureSelect('data', { options: [...sampleSetNames] as SampleSetName[], defaultValue: 'few' });
  const [status] = useFixtureSelect('status', { options: statuses });
  const [dense] = useFixtureInput('dense', false);
  const [links] = useFixtureInput('rows link', true);
  const alerts = propertyAlertSets[set];
  const items = alerts.map((alert) => ({
    id: alert.id,
    primary: alert.name,
    secondary: (
      <>
        Evaluated <RelativeTime value={alert.time_evaluated} now={new Date('2026-10-13T12:00:00-04:00')} />
      </>
    ),
    trailing: <AlertStateChip alert={alert} />,
    to: links ? `/alerts/${alert.id}` : undefined,
  }));
  const effective = status === 'ready' && alerts.length === 0 ? 'empty' : status;
  return (
    <Card sx={{ maxWidth: 640 }}>
      <EntityList
        aria-label="Property alerts"
        items={items}
        dense={dense}
        state={{ status: effective, error: 'Alerts could not be loaded.', onRetry: () => undefined }}
        empty={{ title: 'No alerts', description: 'Every meter is reporting on schedule.' }}
      />
    </Card>
  );
}

export default { Playground };
