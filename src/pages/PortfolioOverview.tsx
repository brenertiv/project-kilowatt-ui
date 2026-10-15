import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import CardHeader from '@mui/material/CardHeader';
import { useEntityList } from '../api/queries';
import { fromQuery } from '../api/state';
import { BuildingIcon, ScheduleIcon, WarningIcon } from '../icons';
import { AlertStateChip, EntityList, EntityName, PageHeader, RelativeTime, StatCard } from '../components/data';
import { activeActionStatuses, countOf, latestMonthSpend } from './shared';

const pageSize = 50;

/**
 * The portfolio at a glance: who it is, how many buildings, what needs attention, and what the
 * latest bills came to. Everything on it is a query against the entity endpoints, so the page is the
 * integration test for the data layer. Use it as the reference for a dashboard page built from
 * `PageHeader`, `StatCard` and `EntityList`; for one building, see `BuildingDetail`.
 *
 * @summary Portfolio dashboard page: header, four headline StatCards, buildings and open alerts.
 * @import import { PortfolioOverview } from 'src/pages/PortfolioOverview';
 */
export function PortfolioOverview() {
  const clients = useEntityList('client', { parent_client__isnull: true, page_size: 1 });
  const buildings = useEntityList('location', { parent_location__isnull: true, page_size: pageSize, ordering: 'name' });
  const alerts = useEntityList('property_alert', { fixed: false, page_size: pageSize, ordering: '-time_evaluated' });
  const workOrders = useEntityList('action', {
    action_status__in: activeActionStatuses,
    page_size: pageSize,
    ordering: 'due_date',
  });
  const bills = useEntityList('utility_bill', { page_size: pageSize, ordering: '-end_date' });

  const portfolio = clients.data?.results[0];
  const buildingCount = countOf(buildings.data);
  const alertCount = countOf(alerts.data);
  const workOrderCount = countOf(workOrders.data);
  const spend = latestMonthSpend(bills.data?.results);

  return (
    <Box component="main">
      <PageHeader
        eyebrow="Portfolio"
        title={portfolio?.name ?? ''}
        description={
          portfolio ? [portfolio.address_1, portfolio.city, portfolio.state].filter(Boolean).join(', ') : undefined
        }
        state={fromQuery(clients)}
      />

      <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: 4, mb: 6 }}>
        <StatCard
          label="Buildings"
          value={buildingCount.value}
          unit="count"
          icon={<BuildingIcon />}
          period={buildingCount.more ? `first ${pageSize} shown` : undefined}
          state={fromQuery(buildings)}
        />
        <StatCard
          label="Open alerts"
          value={alertCount.value}
          unit="count"
          icon={<WarningIcon />}
          period={alertCount.more ? `first ${pageSize} shown` : undefined}
          state={fromQuery(alerts)}
        />
        <StatCard
          label="Active work orders"
          value={workOrderCount.value}
          unit="count"
          icon={<ScheduleIcon />}
          period={workOrderCount.more ? `first ${pageSize} shown` : undefined}
          state={fromQuery(workOrders)}
        />
        <StatCard
          label="Latest month's bills"
          value={spend.value}
          unit="USD"
          compact
          period={spend.month ?? undefined}
          state={fromQuery(bills)}
        />
      </Box>

      <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: '1fr 1fr' }, gap: 4 }}>
        <Card>
          <CardHeader title="Buildings" slotProps={{ title: { variant: 'h6' } }} />
          <EntityList
            aria-label="Buildings"
            state={fromQuery(buildings)}
            empty={{ title: 'No buildings yet' }}
            items={(buildings.data?.results ?? []).map((building) => ({
              id: building.id,
              primary: <EntityName name={building.name} noun="building" />,
              secondary: [building.city, building.state].filter(Boolean).join(', ') || undefined,
              to: `/buildings/${building.id}`,
            }))}
          />
        </Card>
        <Card>
          <CardHeader title="Open alerts" slotProps={{ title: { variant: 'h6' } }} />
          <EntityList
            aria-label="Open alerts"
            state={fromQuery(alerts)}
            empty={{ title: 'No open alerts', description: 'Every meter is reporting on schedule.' }}
            items={(alerts.data?.results ?? []).slice(0, 8).map((alert) => ({
              id: alert.id,
              primary: alert.name,
              secondary: (
                <>
                  Evaluated <RelativeTime value={alert.time_evaluated} />
                </>
              ),
              trailing: <AlertStateChip alert={alert} />,
              to: `/alerts/${alert.id}`,
            }))}
          />
        </Card>
      </Box>
    </Box>
  );
}
