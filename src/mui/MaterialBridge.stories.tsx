import { Button as BaseButton } from '@base-ui/react/button';
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
import type { Meta, StoryObj } from '@storybook/react-vite';
import { tokenContrast } from 'src/stories/a11y';

/**
 * Proves the Material UI theme bridge: design tokens drive every Material part,
 * shown beside the Base UI recipes for comparison. Internal: a theme check, not
 * a pattern to copy, so it stays out of the manifest agents read.
 */
const meta = {
  title: 'Internal/MaterialBridge',
  tags: ['!manifest'],
} satisfies Meta;

export default meta;

type ButtonArgs = {
  variant: 'contained' | 'outlined' | 'text';
  color: 'primary' | 'secondary' | 'success' | 'error' | 'warning' | 'info';
  label: string;
  disabled: boolean;
};

/** One Material button beside the Base UI solid button, to compare them under any variant and color. */
export const ButtonComparison: StoryObj<ButtonArgs> = {
  args: { variant: 'contained', color: 'primary', label: 'Dispatch ticket', disabled: false },
  argTypes: {
    variant: { control: 'inline-radio', options: ['contained', 'outlined', 'text'] },
    color: { control: 'select', options: ['primary', 'secondary', 'success', 'error', 'warning', 'info'] },
  },
  render: ({ variant, color, label, disabled }) => (
    <Stack direction="row" spacing={3} sx={{ alignItems: 'center' }}>
      <Button variant={variant} color={color} disabled={disabled}>
        {label}
      </Button>
      <BaseButton className="ui-btn ui-btn-solid" disabled={disabled}>
        {label} (Base UI)
      </BaseButton>
    </Stack>
  ),
};

/** Every Material button variant next to the Base UI solid and outline buttons. */
export const Buttons: StoryObj = {
  render: () => (
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
  ),
};

/** Status chips in each semantic color, and a badge count. */
export const Chips: StoryObj = {
  // Contrast off: successMain and warningMain chip text on backgroundDefault. See src/stories/a11y.ts.
  parameters: { a11y: tokenContrast },
  render: () => (
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
  ),
};

/** A card with a header and a large tabular figure, for surface, border and type tokens. */
export const CardWithFigure: StoryObj = {
  render: () => (
    <Card sx={{ maxWidth: 720 }}>
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
  ),
};

/** Success, warning and error alerts, for the status color tokens. */
export const Alerts: StoryObj = {
  render: () => (
    <Stack spacing={2} sx={{ maxWidth: 720 }}>
      <Alert severity="success">Utility bill matched to account 4000121279001.</Alert>
      <Alert severity="warning">Meter consumption has a short cycle length of 13 days.</Alert>
      <Alert severity="error">Meters could not be loaded.</Alert>
    </Stack>
  ),
};

/** A card in its loading state, built from skeletons. */
export const SkeletonCard: StoryObj = {
  render: () => (
    <Card sx={{ maxWidth: 720 }}>
      <CardHeader title={<Skeleton width="40%" />} subheader={<Skeleton width="25%" />} />
      <CardContent>
        <Skeleton height={40} width="60%" />
        <Skeleton />
        <Skeleton width="80%" />
      </CardContent>
    </Card>
  ),
};

/** A dense list with dividers inside a card. */
export const DenseList: StoryObj = {
  render: () => (
    <Card sx={{ maxWidth: 720 }}>
      <List dense>
        {['AHU-3 vibration alarm', 'Chiller setpoint drift', 'Steam trap blow-through'].map((item) => (
          <ListItem key={item} divider>
            <ListItemText primary={item} secondary="Opened 14 Sep 2026" />
          </ListItem>
        ))}
      </List>
    </Card>
  ),
};

/** Rounded pagination with the current page selected. */
export const PaginationControl: StoryObj = {
  name: 'Pagination',
  render: () => <Pagination count={12} page={3} shape="rounded" />,
};
