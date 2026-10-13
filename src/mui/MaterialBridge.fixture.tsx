import Alert from '@mui/material/Alert';
import Badge from '@mui/material/Badge';
import Button from '@mui/material/Button';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import CardHeader from '@mui/material/CardHeader';
import Chip from '@mui/material/Chip';
import List from '@mui/material/List';
import ListItem from '@mui/material/ListItem';
import ListItemText from '@mui/material/ListItemText';
import Pagination from '@mui/material/Pagination';
import Skeleton from '@mui/material/Skeleton';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';
import { Button as BaseButton } from '@base-ui/react/button';
import { useFixtureInput, useFixtureSelect } from '../workbench/inputs';

/** Proves the Material UI theme bridge: tokens drive every Material part, beside the Base UI button for comparison. */

function Playground() {
  const [variant] = useFixtureSelect('variant', { options: ['contained', 'outlined', 'text'] as const });
  const [color] = useFixtureSelect('color', {
    options: ['primary', 'secondary', 'success', 'error', 'warning', 'info'] as const,
  });
  const [label] = useFixtureInput('label', 'Dispatch ticket');
  const [disabled] = useFixtureInput('disabled', false);
  return (
    <Stack direction="row" spacing={3} sx={{ alignItems: 'center' }}>
      <Button variant={variant} color={color} disabled={disabled}>
        {label}
      </Button>
      <BaseButton className="ui-btn ui-btn-solid" disabled={disabled}>
        {label} (Base UI)
      </BaseButton>
    </Stack>
  );
}

function AllStates() {
  return (
    <Stack spacing={5} sx={{ maxWidth: 720 }}>
      <Stack direction="row" spacing={3} useFlexGap sx={{ flexWrap: 'wrap' }}>
        <Button variant="contained">Contained</Button>
        <Button variant="outlined">Outlined</Button>
        <Button variant="text">Text</Button>
        <Button variant="contained" disabled>
          Disabled
        </Button>
        <BaseButton className="ui-btn ui-btn-solid">Base UI solid</BaseButton>
        <BaseButton className="ui-btn">Base UI outline</BaseButton>
      </Stack>

      <Stack direction="row" spacing={2} useFlexGap sx={{ flexWrap: 'wrap' }}>
        <Chip label="Open" color="warning" variant="outlined" />
        <Chip label="In review" color="info" variant="outlined" />
        <Chip label="Resolved" color="success" variant="outlined" />
        <Chip label="Overdue" color="error" />
        <Chip label="Retired" />
        <Badge badgeContent={4} color="primary">
          <Chip label="Alerts" />
        </Badge>
      </Stack>

      <Card>
        <CardHeader title="120 Broadway" subheader="Lebanon, TN · 3 meters" />
        <CardContent>
          <Typography variant="h3" sx={{ fontVariantNumeric: 'tabular-nums' }}>
            12,853 kWh
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Last 30 days, 4.2% below baseline
          </Typography>
        </CardContent>
      </Card>

      <Stack spacing={2}>
        <Alert severity="success">Utility bill matched to account 4000121279001.</Alert>
        <Alert severity="warning">Meter consumption has a short cycle length of 13 days.</Alert>
        <Alert severity="error">Meters could not be loaded.</Alert>
      </Stack>

      <Card>
        <CardHeader title={<Skeleton width="40%" />} subheader={<Skeleton width="25%" />} />
        <CardContent>
          <Skeleton height={40} width="60%" />
          <Skeleton />
          <Skeleton width="80%" />
        </CardContent>
      </Card>

      <Card>
        <List dense>
          {['AHU-3 vibration alarm', 'Chiller setpoint drift', 'Steam trap blow-through'].map((item) => (
            <ListItem key={item} divider>
              <ListItemText primary={item} secondary="Opened 14 Sep 2026" />
            </ListItem>
          ))}
        </List>
      </Card>

      <Pagination count={12} page={3} shape="rounded" />
    </Stack>
  );
}

export default {
  Playground,
  'All states': AllStates,
};
