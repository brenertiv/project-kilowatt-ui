import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';
import {
  ActionPriorityChip,
  ActionStatusChip,
  AlertStateChip,
  DataState,
  DateRangeText,
  DateText,
  EntityCard,
  EntityList,
  RelationLink,
  RelativeTime,
  StatCard,
  StatusChip,
} from '../components/data';
import { actionPriorities, actionSets, actionStatuses, portfolio, propertyAlertSets } from '../fixtures/data';
import type { Demo } from './demos';

const now = new Date('2026-10-13T12:00:00-04:00');
const action = actionSets.one[0]!;
const building = portfolio.buildings[0]!;

function StatCardDemo() {
  return (
    <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 3 }}>
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
    </Box>
  );
}

function EntityCardDemo() {
  return (
    <EntityCard
      title={action.name}
      noun="work order"
      subtitle={action.description}
      status={
        <>
          <ActionStatusChip status={action.action_status} lookup={actionStatuses} />
          <ActionPriorityChip priority={action.action_priority} lookup={actionPriorities} />
        </>
      }
      meta={[
        {
          label: 'Building',
          value: <RelationLink value={building} label={(row) => row.name} to={(id) => `/buildings/${id}`} />,
        },
        { label: 'Scheduled', value: <DateRangeText range={action.schedule_date} /> },
        { label: 'Due', value: <DateText value={action.due_date} /> },
      ]}
    />
  );
}

function EntityListDemo() {
  return (
    <Card>
      <EntityList
        aria-label="Property alerts"
        dense
        items={propertyAlertSets.few.slice(0, 3).map((alert) => ({
          id: alert.id,
          primary: alert.name,
          secondary: (
            <>
              Evaluated <RelativeTime value={alert.time_evaluated} now={now} />
            </>
          ),
          trailing: <AlertStateChip alert={alert} />,
        }))}
      />
    </Card>
  );
}

function StatusChipDemo() {
  return (
    <Stack direction="row" spacing={2} useFlexGap sx={{ flexWrap: 'wrap' }}>
      {actionStatuses.map((status) => (
        <ActionStatusChip key={status.id} status={status.id} lookup={actionStatuses} />
      ))}
      <StatusChip label="Unresolved id" />
    </Stack>
  );
}

function DataStateDemo() {
  return (
    <Card>
      <DataState state={{ status: 'error', error: 'Meters could not be loaded.', onRetry: () => undefined }}>
        <span />
      </DataState>
    </Card>
  );
}

function PageNote({ children }: { children: string }) {
  return (
    <Typography variant="body2" color="text.secondary">
      {children} Open it in Cosmos to drive every state from the control panel.
    </Typography>
  );
}

export const dataDemos: Demo[] = [
  {
    id: 'stat-card',
    title: 'Stat card',
    group: 'Data components',
    render: StatCardDemo,
    fixture: { path: 'src/components/data/StatCard.fixture.tsx', name: 'Playground' },
  },
  {
    id: 'entity-card',
    title: 'Entity card',
    group: 'Data components',
    render: EntityCardDemo,
    fixture: { path: 'src/components/data/EntityCard.fixture.tsx', name: 'Playground' },
  },
  {
    id: 'entity-list',
    title: 'Entity list',
    group: 'Data components',
    render: EntityListDemo,
    fixture: { path: 'src/components/data/EntityList.fixture.tsx', name: 'Playground' },
  },
  {
    id: 'status-chip',
    title: 'Status chips',
    group: 'Data components',
    render: StatusChipDemo,
    fixture: { path: 'src/components/data/StatusChip.fixture.tsx', name: null },
  },
  {
    id: 'data-state',
    title: 'Data state',
    group: 'Data components',
    render: DataStateDemo,
    fixture: { path: 'src/components/data/DataState.fixture.tsx', name: 'Playground' },
  },
  {
    id: 'page-header',
    title: 'Page header',
    group: 'Data components',
    render: () => <PageNote>Title, eyebrow, breadcrumbs, actions and meta for the top of a view.</PageNote>,
    fixture: { path: 'src/components/data/PageHeader.fixture.tsx', name: 'Playground' },
  },
  {
    id: 'list-controls',
    title: 'Filter bar + pagination',
    group: 'Data components',
    render: () => <PageNote>Search, sort and cursor paging over a live query.</PageNote>,
    fixture: { path: 'src/components/data/ListControls.fixture.tsx', name: 'Work orders' },
  },
  {
    id: 'page-portfolio',
    title: 'Portfolio overview',
    group: 'Pages',
    render: () => <PageNote>Portfolio name, counts, buildings and open alerts.</PageNote>,
    fixture: { path: 'src/pages/PortfolioOverview.fixture.tsx', name: null },
  },
  {
    id: 'page-building',
    title: 'Building detail',
    group: 'Pages',
    render: () => <PageNote>One building with its meters, equipment, work orders and bills.</PageNote>,
    fixture: { path: 'src/pages/BuildingDetail.fixture.tsx', name: 'Playground' },
  },
  {
    id: 'page-work-orders',
    title: 'Work orders',
    group: 'Pages',
    render: () => <PageNote>Searchable, sortable, cursor-paged work orders with a status filter.</PageNote>,
    fixture: { path: 'src/pages/WorkOrders.fixture.tsx', name: null },
  },
];
