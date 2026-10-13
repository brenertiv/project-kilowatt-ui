import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';
import { portfolio } from '../../fixtures/data';
import { RelationLink } from './RelationLink';

const building = portfolio.buildings[0]!;

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
      <Case title="Expanded, linked">
        <RelationLink value={building} label={(row) => row.name} to={(id) => `/buildings/${id}`} />
      </Case>
      <Case title="Expanded, plain">
        <RelationLink value={building} label={(row) => row.name} />
      </Case>
      <Case title="Bare id, linked">
        <RelationLink value={building.id} label={(row: typeof building) => row.name} to={(id) => `/buildings/${id}`} />
      </Case>
      <Case title="Bare id, plain">
        <RelationLink value={building.id} label={(row: typeof building) => row.name} />
      </Case>
      <Case title="Integer id (utility bill)">
        <RelationLink value={2723} label={(row: { id: number }) => `Bill ${row.id}`} to={(id) => `/bills/${id}`} />
      </Case>
      <Case title="Null">
        <RelationLink value={null} label={(row: typeof building) => row.name} />
      </Case>
    </Stack>
  );
}
