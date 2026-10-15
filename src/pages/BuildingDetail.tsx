import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Card from '@mui/material/Card';
import CardHeader from '@mui/material/CardHeader';
import Typography from '@mui/material/Typography';
import { useEntity, useEntityList, useLookup } from '../api/queries';
import { fromQuery, isNotFound } from '../api/state';
import { isExpanded } from '../api/types';
import { BuildingIcon, PlusIcon } from '../icons';
import { formatUnit } from '../lib/format';
import {
  ActionStatusChip,
  DateRangeText,
  DateText,
  EntityList,
  EmptyState,
  EntityName,
  ErrorState,
  PageHeader,
  StatCard,
  StatusChip,
} from '../components/data';
import { activeActionStatuses, countOf } from './shared';

const pageSize = 50;

export type BuildingDetailProps = {
  /** The building's location id. An id that matches no building shows a not-found state; any other failure shows the error state with a retry. */
  id: string;
};

/**
 * One building: where it is, what is in it, and what is happening to it: address and type, headline
 * counts, meters, active work orders, recent bills and equipment. Use it as the reference for a
 * detail page built from `PageHeader`, `StatCard` and `EntityList`; for the whole portfolio, see
 * `PortfolioOverview`.
 *
 * @summary Building detail page: header, headline StatCards, meters, work orders, bills, equipment.
 * @import import { BuildingDetail } from 'src/pages/BuildingDetail';
 */
export function BuildingDetail({ id }: BuildingDetailProps) {
  const building = useEntity('location', id, { expand: 'location_type' });
  const rooms = useEntityList('sublocation', { location: id, page_size: pageSize });
  const roomIds = rooms.data?.results.map((room) => room.id).join(',');
  const meters = useEntityList(
    'meter',
    { sublocation__in: roomIds, page_size: pageSize, ordering: 'name' },
    { enabled: Boolean(roomIds) },
  );
  const equipment = useEntityList(
    'equipment',
    { sublocation__in: roomIds, page_size: pageSize, ordering: 'name' },
    { enabled: Boolean(roomIds) },
  );
  const workOrders = useEntityList('action', {
    location_id: id,
    action_status__in: activeActionStatuses,
    page_size: pageSize,
    ordering: 'due_date',
  });
  const bills = useEntityList('utility_bill', {
    location: id,
    page_size: 6,
    ordering: '-end_date',
    expand: 'utility_bill_type',
  });
  const statuses = useLookup('action_status');

  if (building.status === 'error' && isNotFound(building.error)) {
    return (
      <Box component="main">
        <EmptyState
          icon={<BuildingIcon size={32} />}
          title="Building not found"
          description="No building matches this link. It may have been removed, or the link may be wrong."
        />
      </Box>
    );
  }
  if (building.status === 'error') {
    return <ErrorState message={fromQuery(building).error} onRetry={() => void building.refetch()} />;
  }

  const record = building.data;
  const type = record && isExpanded(record.location_type) ? record.location_type : undefined;
  const meterCount = countOf(meters.data);
  const equipmentCount = countOf(equipment.data);
  const workOrderCount = countOf(workOrders.data);
  const latestBill = bills.data?.results[0];
  const assetState = (query: typeof meters) =>
    roomIds === undefined && rooms.status !== 'error' ? { status: 'loading' as const } : fromQuery(query);

  return (
    <Box component="main">
      <PageHeader
        eyebrow="Building"
        title={record ? <EntityName name={record.name} noun="building" /> : ''}
        description={
          record
            ? [record.address_1, record.city, record.state, record.zip].filter(Boolean).join(', ') || undefined
            : undefined
        }
        breadcrumbs={[
          { label: 'Portfolio', to: '/' },
          { label: 'Buildings', to: '/buildings' },
          { label: record?.name ?? '' },
        ]}
        actions={
          <Button variant="contained" startIcon={<PlusIcon />}>
            New work order
          </Button>
        }
        meta={
          record ? (
            <>
              {type ? <StatusChip label={type.name} /> : null}
              {record.three_sixty_enabled ? <StatusChip label="360° enabled" tone="info" /> : null}
              {record.latitude === null ? <StatusChip label="No coordinates" tone="warning" /> : null}
              <Typography variant="body2" color="text.secondary">
                Updated <DateText value={record.modified} time={false} />
              </Typography>
            </>
          ) : undefined
        }
        state={fromQuery(building)}
      />

      <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: 2, mb: 3 }}>
        <StatCard label="Meters" value={meterCount.value} unit="count" state={assetState(meters)} />
        <StatCard label="Equipment" value={equipmentCount.value} unit="count" state={assetState(equipment)} />
        <StatCard label="Active work orders" value={workOrderCount.value} unit="count" state={fromQuery(workOrders)} />
        <StatCard
          label="Latest bill"
          value={latestBill?.total_cost ?? null}
          unit="USD"
          period={
            latestBill ? (
              <DateRangeText range={{ lower: latestBill.start_date, upper: latestBill.end_date, bounds: '[]' }} />
            ) : undefined
          }
          state={fromQuery(bills)}
        />
      </Box>

      <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: '1fr 1fr' }, gap: 2 }}>
        <Card>
          <CardHeader title="Meters" slotProps={{ title: { variant: 'h6' } }} />
          <EntityList
            aria-label="Meters"
            state={assetState(meters)}
            empty={{ title: 'No meters', description: 'Add a meter to start collecting readings.' }}
            items={(meters.data?.results ?? []).map((meter) => ({
              id: meter.id,
              primary: <EntityName name={meter.name} noun="meter" />,
              secondary: meter.description || undefined,
              trailing: meter.retired ? <StatusChip label="Retired" /> : undefined,
              to: `/meters/${meter.id}`,
            }))}
          />
        </Card>
        <Card>
          <CardHeader title="Active work orders" slotProps={{ title: { variant: 'h6' } }} />
          <EntityList
            aria-label="Active work orders"
            state={fromQuery(workOrders)}
            empty={{ title: 'Nothing scheduled', description: 'No active work orders for this building.' }}
            items={(workOrders.data?.results ?? []).map((action) => ({
              id: action.id,
              primary: <EntityName name={action.name} noun="work order" />,
              secondary: (
                <>
                  #{action.work_order_number} · due <DateText value={action.due_date} />
                </>
              ),
              trailing: <ActionStatusChip status={action.action_status} lookup={statuses.data} />,
              to: `/work-orders/${action.id}`,
            }))}
          />
        </Card>
        <Card>
          <CardHeader title="Recent bills" slotProps={{ title: { variant: 'h6' } }} />
          <EntityList
            aria-label="Recent bills"
            state={fromQuery(bills)}
            empty={{ title: 'No bills yet' }}
            items={(bills.data?.results ?? []).map((bill) => ({
              id: bill.id,
              primary: `${isExpanded(bill.utility_bill_type) ? bill.utility_bill_type.name : 'Bill'} · ${bill.clean_utility_account_number}`,
              secondary: <DateRangeText range={{ lower: bill.start_date, upper: bill.end_date, bounds: '[]' }} />,
              trailing: (
                <Typography variant="body2" sx={{ fontVariantNumeric: 'tabular-nums' }}>
                  {formatUnit(bill.total_cost, 'USD')}
                </Typography>
              ),
            }))}
          />
        </Card>
        <Card>
          <CardHeader title="Equipment" slotProps={{ title: { variant: 'h6' } }} />
          <EntityList
            aria-label="Equipment"
            state={assetState(equipment)}
            empty={{ title: 'No equipment' }}
            items={(equipment.data?.results ?? []).map((asset) => ({
              id: asset.id,
              primary: <EntityName name={asset.name} noun="asset" />,
              secondary: asset.description || undefined,
              trailing: asset.retired ? <StatusChip label="Retired" /> : undefined,
              to: `/equipment/${asset.id}`,
            }))}
          />
        </Card>
      </Box>
    </Box>
  );
}
