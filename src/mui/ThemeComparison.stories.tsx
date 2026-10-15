import type { ReactNode } from 'react';
import Alert from '@mui/material/Alert';
import Button from '@mui/material/Button';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import CardHeader from '@mui/material/CardHeader';
import Checkbox from '@mui/material/Checkbox';
import Chip from '@mui/material/Chip';
import FormControlLabel from '@mui/material/FormControlLabel';
import Link from '@mui/material/Link';
import Stack from '@mui/material/Stack';
import Switch from '@mui/material/Switch';
import TextField from '@mui/material/TextField';
import Typography from '@mui/material/Typography';
import { ThemeProvider } from '@mui/material/styles';
import type { Meta, StoryObj } from '@storybook/react-vite';
import { tokenContrast } from 'src/stories/a11y';
import { useTheme } from 'src/theme/ThemeProvider';
import { stockTheme } from './themeDiff';

/**
 * The same Material UI components under stock MUI and under Kilowatt's theme,
 * side by side in the current scheme. Every difference you see should be an
 * entry on Foundations → MUI departures; anything else is a bug in the theme.
 * Kept out of the manifest: agents read the departures page instead.
 */
const meta = {
  title: 'Foundations/MUI comparison',
  tags: ['!manifest', '!autodocs'],
  parameters: { layout: 'fullscreen' },
} satisfies Meta;

export default meta;
type Story = StoryObj<typeof meta>;

function Column({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div style={{ flex: '1 1 320px', minWidth: 0 }}>
      <Typography variant="overline" component="h2" color="text.secondary" sx={{ display: 'block', mb: 2 }}>
        {label}
      </Typography>
      {children}
    </div>
  );
}

/** Renders `children` twice: once under stock MUI, once under the Kilowatt theme already in scope. */
function SideBySide({ children }: { children: ReactNode }) {
  const { colorScheme } = useTheme();
  return (
    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 32, padding: 24 }}>
      <Column label="Stock MUI">
        <ThemeProvider theme={stockTheme(colorScheme)}>{children}</ThemeProvider>
      </Column>
      <Column label="Kilowatt">{children}</Column>
    </div>
  );
}

/** Type variants: Kilowatt's headings are all regular weight on its own scale, and body text is a step smaller. */
export const TypeVariants: Story = {
  render: () => (
    <SideBySide>
      <Stack spacing={1}>
        {(['h1', 'h2', 'h3', 'h4', 'h5', 'h6'] as const).map((variant) => (
          <Typography key={variant} variant={variant}>
            {variant} Portfolio energy
          </Typography>
        ))}
        <Typography variant="subtitle1">subtitle1 Last 30 days</Typography>
        <Typography variant="body1">body1 Consumption fell 4.2% against the same period last year.</Typography>
        <Typography variant="body2">body2 Readings from 3 meters, updated hourly.</Typography>
        <Typography variant="caption">caption Updated 5 minutes ago</Typography>
        <Typography variant="overline">overline Section eyebrow</Typography>
      </Stack>
    </SideBySide>
  ),
};

/** Buttons in each variant and brand color. Kilowatt keeps sentence-case labels. */
export const Buttons: Story = {
  // Contrast off, deliberately: the comparison shows both themes as they are. Kilowatt's secondary
  // (brand blue) as text on white is 2.7:1, and stock MUI's blue on Kilowatt's page gray is under
  // 4.5:1. The secondary-as-text fix is CMP-COLOR-05. See src/stories/a11y.ts.
  parameters: { a11y: tokenContrast },
  render: () => (
    <SideBySide>
      <Stack spacing={2}>
        {(['primary', 'secondary'] as const).map((color) => (
          <Stack key={color} direction="row" spacing={1} useFlexGap sx={{ flexWrap: 'wrap' }}>
            <Button variant="contained" color={color}>
              Dispatch ticket
            </Button>
            <Button variant="outlined" color={color}>
              Dispatch ticket
            </Button>
            <Button variant="text" color={color}>
              Dispatch ticket
            </Button>
          </Stack>
        ))}
        <Stack direction="row" spacing={1}>
          <Button variant="contained" disabled>
            Disabled
          </Button>
          <Link href="#comparison">Open building</Link>
        </Stack>
      </Stack>
    </SideBySide>
  ),
};

/** Status colors on alerts and chips. */
export const Status: Story = {
  // Contrast off: successMain and warningMain chip text on the surface. See src/stories/a11y.ts.
  parameters: { a11y: tokenContrast },
  render: () => (
    <SideBySide>
      <Stack spacing={1}>
        <Alert severity="success">Meter readings are up to date.</Alert>
        <Alert severity="info">A new utility bill is ready to review.</Alert>
        <Alert severity="warning">Two meters have not reported today.</Alert>
        <Alert severity="error">The building feed failed. Retrying.</Alert>
        <Stack direction="row" spacing={1} useFlexGap sx={{ flexWrap: 'wrap' }}>
          <Chip label="Resolved" color="success" variant="outlined" />
          <Chip label="In review" color="info" variant="outlined" />
          <Chip label="Open" color="warning" variant="outlined" />
          <Chip label="Overdue" color="error" />
          <Chip label="Retired" />
        </Stack>
      </Stack>
    </SideBySide>
  ),
};

/** Form controls: a text field, a switch and a checkbox. */
export const Inputs: Story = {
  render: () => (
    <SideBySide>
      <Stack spacing={2} sx={{ maxWidth: 360 }}>
        <TextField label="Building name" defaultValue="120 Broadway" size="small" />
        <FormControlLabel control={<Switch defaultChecked />} label="Notify on critical alerts" />
        <FormControlLabel control={<Checkbox defaultChecked />} label="Include tenants" />
      </Stack>
    </SideBySide>
  ),
};

/** A card on the page surface, for the surface, text and divider colors. */
export const Surfaces: Story = {
  render: () => (
    <SideBySide>
      <Card>
        <CardHeader title="120 Broadway" subheader="Lebanon, TN · 3 meters" />
        <CardContent>
          <Typography variant="h3" component="p" sx={{ fontVariantNumeric: 'tabular-nums' }}>
            12,853 kWh
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Last 30 days, 4.2% below baseline
          </Typography>
        </CardContent>
      </Card>
    </SideBySide>
  ),
};
