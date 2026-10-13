import { useFixtureInput } from 'react-cosmos/client';
import Button from '@mui/material/Button';
import { PlusIcon } from '../../icons';
import { PageHeader } from './PageHeader';
import { StatusChip } from './StatusChip';

function Playground() {
  const [title] = useFixtureInput('title', '120 Broadway');
  const [eyebrow] = useFixtureInput('eyebrow', 'Building');
  const [description] = useFixtureInput(
    'description',
    'Office tower in Lower Manhattan with 42 metered tenants and a central chiller plant.',
  );
  const [breadcrumbs] = useFixtureInput('breadcrumbs', true);
  const [actions] = useFixtureInput('actions', true);
  const [meta] = useFixtureInput('meta', true);
  const [loading] = useFixtureInput('loading', false);
  return (
    <PageHeader
      title={title}
      eyebrow={eyebrow || undefined}
      description={description || undefined}
      breadcrumbs={
        breadcrumbs
          ? [{ label: 'Portfolio', to: '/' }, { label: 'Buildings', to: '/buildings' }, { label: title }]
          : undefined
      }
      actions={
        actions ? (
          <>
            <Button variant="outlined" color="inherit">
              Export
            </Button>
            <Button variant="contained" startIcon={<PlusIcon />}>
              New work order
            </Button>
          </>
        ) : undefined
      }
      meta={
        meta ? (
          <>
            <StatusChip label="Office" />
            <StatusChip label="3 open alerts" tone="warning" />
            <StatusChip label="Energy Star linked" tone="success" />
          </>
        ) : undefined
      }
      state={loading ? { status: 'loading' } : undefined}
    />
  );
}

export default { Playground };
