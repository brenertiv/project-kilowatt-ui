import { useFixtureInput, useFixtureSelect } from 'react-cosmos/client';
import Box from '@mui/material/Box';
import type { AsyncStatus } from '../../api/state';
import { BuildingIcon } from '../../icons';
import type { Unit } from '../../lib/format';
import { StatCard } from './StatCard';

const units: Unit[] = ['kWh', 'kW', 'MWh', 'USD', 'percent', 'count', 'score'];
const statuses: AsyncStatus[] = ['ready', 'loading', 'fetching', 'error'];
const directions = ['down', 'up', 'none'] as const;

function Playground() {
  const [label] = useFixtureInput('label', 'Consumption, last 30 days');
  const [value] = useFixtureInput('value', 12853);
  const [unit] = useFixtureSelect('unit', { options: units });
  const [compact] = useFixtureInput('compact', false);
  const [delta] = useFixtureInput('delta (fraction)', -0.042);
  const [goodDirection] = useFixtureSelect('good direction', { options: [...directions] });
  const [period] = useFixtureInput('period', 'vs previous 30 days');
  const [status] = useFixtureSelect('status', { options: statuses });
  return (
    <Box sx={{ maxWidth: 320 }}>
      <StatCard
        label={label}
        value={value}
        unit={unit}
        compact={compact}
        delta={delta}
        goodDirection={goodDirection}
        period={period || undefined}
        icon={<BuildingIcon />}
        state={{ status, error: 'Readings unavailable.', onRetry: () => undefined }}
      />
    </Box>
  );
}

function AllStates() {
  return (
    <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))', gap: 4 }}>
      <StatCard
        label="Consumption"
        value={12853}
        unit="kWh"
        delta={-0.042}
        goodDirection="down"
        period="vs last 30 days"
      />
      <StatCard
        label="Peak demand"
        value={418.6}
        unit="kW"
        delta={0.071}
        goodDirection="down"
        period="vs last 30 days"
      />
      <StatCard
        label="Utility spend"
        value={88200.87}
        unit="USD"
        compact
        delta={0.012}
        goodDirection="down"
        period="this quarter"
      />
      <StatCard
        label="Open work orders"
        value={17}
        unit="count"
        delta={-3}
        deltaUnit="count"
        goodDirection="down"
        period="since Monday"
      />
      <StatCard label="Energy Star score" value={74} unit="score" delta={2} deltaUnit="score" goodDirection="up" />
      <StatCard label="No value yet" value={null} unit="kWh" period="awaiting first bill" />
      <StatCard label="Loading" value={null} unit="kWh" state={{ status: 'loading' }} />
      <StatCard
        label="Refreshing"
        value={12853}
        unit="kWh"
        delta={-0.042}
        goodDirection="down"
        state={{ status: 'fetching' }}
      />
      <StatCard
        label="Failed"
        value={null}
        unit="kWh"
        state={{ status: 'error', error: 'Readings unavailable.', onRetry: () => undefined }}
      />
    </Box>
  );
}

export default { Playground, 'All states': AllStates };
