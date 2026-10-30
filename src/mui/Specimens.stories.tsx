import { useState, type ReactNode } from 'react';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Paper from '@mui/material/Paper';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';
import { useTheme } from '@mui/material/styles';
import ToggleButton from '@mui/material/ToggleButton';
import ToggleButtonGroup from '@mui/material/ToggleButtonGroup';
import type { Meta, StoryObj } from '@storybook/react-vite';
import { expect, within } from 'storybook/test';
import { Icon, iconNames } from 'src/icons';

/**
 * Live specimens of the theme, built only from MUI components reading the running
 * theme. The Foundations pages embed them under their tables. Hidden from the
 * sidebar (the `specimen` tag, filtered in .storybook/manager.ts) and from the
 * manifest: the tables are what agents read, these are what people look at.
 */
const meta = {
  title: 'Foundations/Specimens',
  tags: ['specimen', '!autodocs', '!manifest'],
  parameters: { layout: 'fullscreen' },
} satisfies Meta;

export default meta;
type Story = StoryObj;

/**
 * A surface in the current scheme, so a specimen shows its own background in dark.
 * Flat Paper with no border: the docs Canvas around it is the frame.
 */
function Surface({ children }: { children: ReactNode }) {
  return (
    <Paper elevation={0} sx={{ p: 3 }}>
      {children}
    </Paper>
  );
}

function Swatch({ color, label }: { color: string; label: string }) {
  return (
    <Stack spacing={0.5} sx={{ minWidth: 96 }}>
      <Box sx={{ height: 48, bgcolor: color, border: 1, borderColor: 'divider', borderRadius: 1 }} />
      <Typography variant="caption" color="text.secondary">
        {label}
      </Typography>
    </Stack>
  );
}

const intents = ['primary', 'secondary', 'error', 'warning', 'info', 'success'] as const;
/** Button labels are written in Title Case (the `button-text-case` departure). */
const intentLabels = { primary: 'Primary', secondary: 'Secondary', error: 'Error', warning: 'Warning', info: 'Info', success: 'Success' };

/** The palette: each intent's four values, the surface levels, the border levels on every surface, and text. */
export const Color: Story = {
  render: () => (
    <Surface>
      <Stack spacing={3}>
        {intents.map((intent) => (
          <Stack key={intent} spacing={1}>
            <Typography variant="subtitle2">{intent}</Typography>
            <Stack direction="row" spacing={2} useFlexGap sx={{ flexWrap: 'wrap' }}>
              {(['main', 'light', 'dark', 'contrastText'] as const).map((key) => (
                <Swatch key={key} color={`${intent}.${key}`} label={key} />
              ))}
            </Stack>
          </Stack>
        ))}
        <Stack spacing={1}>
          <Typography variant="subtitle2">surfaces, level0 (background) to level5</Typography>
          <Stack direction="row" spacing={2} useFlexGap sx={{ flexWrap: 'wrap' }}>
            {['level0', 'level1', 'level2', 'level3', 'level4', 'level5'].map((level) => (
              <Swatch key={level} color={`background.${level}`} label={level} />
            ))}
          </Stack>
        </Stack>
        <Stack spacing={1}>
          <Typography variant="subtitle2">borders, level0 (faintest) to level3 (strongest, for outlines on interactive elements), on each surface</Typography>
          <Stack spacing={1}>
            {['level0', 'level1', 'level2', 'level3', 'level4', 'level5'].map((surface) => (
              <Stack key={surface} direction="row" spacing={2} sx={{ bgcolor: `background.${surface}`, p: 1.5, borderRadius: 1, alignItems: 'center' }}>
                <Typography variant="caption" color="text.secondary" sx={{ width: 56 }}>
                  {surface}
                </Typography>
                {['level0', 'level1', 'level2', 'level3'].map((border) => (
                  <Box key={border} sx={{ width: 96, height: 32, border: 2, borderColor: `border.${border}`, borderRadius: 1 }} />
                ))}
              </Stack>
            ))}
          </Stack>
        </Stack>
        <Stack spacing={1}>
          <Typography variant="subtitle2">text</Typography>
          <Stack direction="row" spacing={2} useFlexGap sx={{ flexWrap: 'wrap' }}>
            {['text.primary', 'text.secondary', 'text.disabled'].map((path) => (
              <Swatch key={path} color={path} label={path} />
            ))}
          </Stack>
        </Stack>
      </Stack>
    </Surface>
  ),
};

const surfaces = ['level0', 'level1', 'level2', 'level3', 'level4', 'level5'] as const;

/** Each intent as text and as a contained button on every surface level. The story's axe check holds every pair to 4.5:1. */
export const IntentsOnSurfaces: Story = {
  render: () => (
    <Stack spacing={1}>
      {surfaces.map((level) => (
        <Stack key={level} direction="row" spacing={2} useFlexGap sx={{ bgcolor: `background.${level}`, p: 1.5, borderRadius: 1, alignItems: 'center', flexWrap: 'wrap' }}>
          <Typography variant="caption" color="text.secondary" sx={{ width: 56 }}>
            {level}
          </Typography>
          {intents.map((intent) => (
            <Typography key={intent} variant="body2" sx={{ width: 80, color: `${intent}.main` }}>
              {intent}
            </Typography>
          ))}
          {intents.map((intent) => (
            <Button key={intent} size="small" variant="contained" color={intent}>
              {intentLabels[intent]}
            </Button>
          ))}
        </Stack>
      ))}
    </Stack>
  ),
};

/** The same pairs in the dark scheme, so the story tests check both. */
export const IntentsOnSurfacesDark: Story = { ...IntentsOnSurfaces, globals: { scheme: 'dark' } };

const variants = ['brand', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'subtitle1', 'subtitle2', 'body1', 'body2', 'button', 'caption', 'overline'] as const;

/** Every Typography variant, each labelled with its name. */
export const Typography_: Story = {
  render: () => (
    <Surface>
      <Stack spacing={2}>
        {variants.map((variant) => (
          <Stack key={variant} direction="row" spacing={3} sx={{ alignItems: 'baseline' }}>
            <Typography variant="caption" color="text.secondary" sx={{ width: 80, flexShrink: 0 }}>
              {variant}
            </Typography>
            <Typography variant={variant} component="p" noWrap>
              Portfolio energy use
            </Typography>
          </Stack>
        ))}
      </Stack>
    </Surface>
  ),
};

/** Spacing multiples drawn to scale. */
export const Spacing: Story = {
  render: function Render() {
    const theme = useTheme();
    return (
      <Surface>
        <Stack spacing={1}>
          {[0.5, 1, 1.5, 2, 3, 4, 5, 6, 8, 10, 12].map((step) => (
            <Stack key={step} direction="row" spacing={2} sx={{ alignItems: 'center' }}>
              <Typography variant="caption" color="text.secondary" sx={{ width: 96, flexShrink: 0 }}>
                {step} = {theme.spacing(step)}
              </Typography>
              <Box sx={{ width: theme.spacing(step), height: 16, bgcolor: 'primary.main' }} />
            </Stack>
          ))}
        </Stack>
      </Surface>
    );
  },
};

/** The theme radius at one, two and four times, as `sx` `borderRadius` multiplies it. */
export const Shape: Story = {
  render: function Render() {
    const theme = useTheme();
    return (
      <Surface>
        <Stack direction="row" spacing={3}>
          {[1, 2, 4].map((multiple) => (
            <Stack key={multiple} spacing={0.5} sx={{ alignItems: 'center' }}>
              <Box sx={{ width: 72, height: 72, border: 1, borderColor: 'text.secondary', borderRadius: multiple }} />
              <Typography variant="caption" color="text.secondary">
                {multiple} = {Number(theme.shape.borderRadius) * multiple}px
              </Typography>
            </Stack>
          ))}
        </Stack>
      </Surface>
    );
  },
};

/** Paper at the elevations MUI's own components use, each on the surface level its elevation maps to. */
export const Elevation: Story = {
  render: () => (
    <Box sx={{ p: 3, bgcolor: 'background.default', borderRadius: 1 }}>
      <Stack direction="row" spacing={3} useFlexGap sx={{ flexWrap: 'wrap' }}>
        {[0, 1, 2, 4, 6, 8, 12, 16, 24].map((elevation) => (
          <Paper key={elevation} elevation={elevation} sx={{ width: 88, height: 72, display: 'grid', placeItems: 'center' }}>
            <Typography variant="body2">{elevation}</Typography>
          </Paper>
        ))}
      </Stack>
    </Box>
  ),
};

const easings = ['easeInOut', 'easeOut', 'easeIn', 'sharp'] as const;

/** Each easing curve at the standard duration. Press Play to run them. */
export const Motion: Story = {
  render: function Render() {
    const theme = useTheme();
    const [moved, setMoved] = useState(false);
    return (
      <Surface>
        <Stack spacing={2}>
          {easings.map((easing) => (
            <Stack key={easing} direction="row" spacing={2} sx={{ alignItems: 'center' }}>
              <Typography variant="caption" color="text.secondary" sx={{ width: 72, flexShrink: 0 }}>
                {easing}
              </Typography>
              <Box sx={{ flex: 1, position: 'relative', height: 16 }}>
                <Box
                  sx={{
                    position: 'absolute',
                    left: moved ? 'calc(100% - 16px)' : 0,
                    width: 16,
                    height: 16,
                    borderRadius: '50%',
                    bgcolor: 'primary.main',
                    transition: theme.transitions.create('left', {
                      duration: theme.transitions.duration.complex,
                      easing: theme.transitions.easing[easing],
                    }),
                  }}
                />
              </Box>
            </Stack>
          ))}
          <Box>
            <Button variant="outlined" onClick={() => setMoved((value) => !value)}>
              Play
            </Button>
          </Box>
        </Stack>
      </Surface>
    );
  },
};

/** Every icon at the default weight, labelled with its name, then a toggle group whose selected button fills its icon. */
export const Icons: Story = {
  render: function Render() {
    const [view, setView] = useState('search');
    return (
      <Surface>
        <Stack spacing={3}>
          <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))', gap: 2 }}>
            {iconNames.map((name) => (
              <Stack key={name} direction="row" spacing={1} sx={{ alignItems: 'center' }}>
                <Icon name={name} />
                <Typography variant="caption" color="text.secondary">
                  {name}
                </Typography>
              </Stack>
            ))}
          </Box>
          <ToggleButtonGroup value={view} exclusive onChange={(_, next: string | null) => next && setView(next)} aria-label="Selected state">
            <ToggleButton value="search" aria-label="Search">
              <Icon name="search" />
            </ToggleButton>
            <ToggleButton value="info" aria-label="Info">
              <Icon name="info" />
            </ToggleButton>
            <ToggleButton value="schedule" aria-label="Schedule">
              <Icon name="schedule" />
            </ToggleButton>
          </ToggleButtonGroup>
        </Stack>
      </Surface>
    );
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const axes = (label: string) => getComputedStyle(canvas.getByRole('button', { name: label }).querySelector('.MuiIcon-root')!).fontVariationSettings;
    await expect(axes('Search')).toContain('"FILL" 1');
    await expect(axes('Info')).toContain('"FILL" 0');
    await expect(axes('Info')).toContain('"wght" 300');
  },
};
