import { createTheme, type Theme, type ThemeOptions } from '@mui/material/styles';
import { shadowScale, typeScale, type ColorScheme, type ThemeValues } from '../tokens';

/**
 * The Material UI theme bridge. Material UI reads the same resolved token
 * values the stylesheet receives, so a change in the Theme editor or a scheme
 * switch rebuilds this theme and every Material component follows. Nothing in
 * here is a literal of its own: every color, size, radius and curve is a token.
 */

const curve = 'cubic-bezier(0.2, 0, 0, 1)';
const stateMs = 150;
const sequenceMs = 300;

function stepRem(id: string): string {
  const step = typeScale.find((candidate) => candidate.id === id);
  if (!step) throw new Error(`Unknown type step ${id}`);
  return `${step.rem}rem`;
}

function px(value: string | undefined, fallback: number): number {
  const parsed = Number.parseFloat(value ?? '');
  return Number.isFinite(parsed) ? parsed : fallback;
}

const heading = { fontWeight: 400, lineHeight: 1.2, letterSpacing: '-0.02em' } as const;

/** Material's 25 elevation steps folded onto the four Figma shadow steps. */
function shadows(): Theme['shadows'] {
  const pick = (index: number) => {
    if (index === 0) return 'none';
    if (index < 4) return shadowScale.sm;
    if (index < 8) return shadowScale.md;
    if (index < 16) return shadowScale.lg;
    return shadowScale.xl;
  };
  return Array.from({ length: 25 }, (_, index) => pick(index)) as Theme['shadows'];
}

export function themeOptions(values: ThemeValues, scheme: ColorScheme): ThemeOptions {
  const radiusControl = px(values.radiusControl, 8);
  const controlHeight = px(values.controlHeight, 36);
  const radiusInner = Math.max(2, Math.round(radiusControl / 2));

  return {
    palette: {
      mode: scheme,
      primary: {
        main: values.primaryMain,
        light: values.primaryLight,
        dark: values.primaryDark,
        contrastText: values.primaryContrastText,
      },
      secondary: {
        main: values.secondaryMain,
        light: values.secondaryLight,
        dark: values.secondaryDark,
        contrastText: values.secondaryContrastText,
      },
      success: {
        main: values.successMain,
        light: values.successLight,
        dark: values.successDark,
        contrastText: values.successContrastText,
      },
      error: {
        main: values.errorMain,
        light: values.errorLight,
        dark: values.errorDark,
        contrastText: values.errorContrastText,
      },
      warning: {
        main: values.warningMain,
        light: values.warningLight,
        dark: values.warningDark,
        contrastText: values.warningContrastText,
      },
      info: {
        main: values.infoMain,
        light: values.infoLight,
        dark: values.infoDark,
        contrastText: values.infoContrastText,
      },
      background: { default: values.backgroundDefault, paper: values.backgroundPaper },
      text: { primary: values.textPrimary, secondary: values.textSecondary, disabled: values.textDisabled },
      divider: values.divider,
      action: {
        active: values.textPrimary,
        hover: values.actionHover,
        selected: values.secondaryTint,
        focus: values.secondaryTint,
        disabled: values.textDisabled,
        disabledBackground: values.backgroundLevel1,
      },
    },
    typography: {
      fontFamily: values.fontSans,
      fontSize: 14,
      fontWeightLight: 400,
      fontWeightRegular: 400,
      fontWeightMedium: 500,
      fontWeightBold: 700,
      h1: { ...heading, fontSize: stepRem('4xl') },
      h2: { ...heading, fontSize: stepRem('3xl') },
      h3: { ...heading, fontSize: stepRem('2xl') },
      h4: { ...heading, fontSize: stepRem('xl') },
      h5: { fontWeight: 400, lineHeight: 1.3, fontSize: stepRem('lg') },
      h6: { fontWeight: 400, lineHeight: 1.3, fontSize: stepRem('md') },
      subtitle1: { fontWeight: 400, lineHeight: 1.3, fontSize: stepRem('md') },
      subtitle2: { fontWeight: 400, lineHeight: 1.3, fontSize: stepRem('sm') },
      body1: { fontWeight: 400, lineHeight: 1.5, fontSize: stepRem('sm') },
      body2: { fontWeight: 400, lineHeight: 1.4, fontSize: stepRem('xs') },
      caption: { fontWeight: 400, lineHeight: 1.4, fontSize: stepRem('xs') },
      overline: {
        fontWeight: 500,
        lineHeight: 1.4,
        fontSize: stepRem('xs'),
        letterSpacing: '0.15em',
        textTransform: 'uppercase',
      },
      button: { fontWeight: 500, lineHeight: 1.4, fontSize: stepRem('sm'), textTransform: 'none' },
    },
    shape: { borderRadius: radiusControl },
    spacing: 4,
    shadows: shadows(),
    transitions: {
      easing: { easeInOut: curve, easeOut: curve, easeIn: curve, sharp: curve },
      duration: {
        shortest: stateMs,
        shorter: stateMs,
        short: stateMs,
        standard: stateMs,
        complex: sequenceMs,
        enteringScreen: stateMs,
        leavingScreen: stateMs,
      },
    },
    components: {
      MuiButtonBase: { defaultProps: { disableRipple: true } },
      MuiButton: {
        defaultProps: { disableElevation: true },
        styleOverrides: {
          root: {
            minHeight: controlHeight,
            borderRadius: radiusControl,
            paddingInline: 12,
            transition: `background-color ${stateMs}ms ${curve}, border-color ${stateMs}ms ${curve}, color ${stateMs}ms ${curve}, transform ${stateMs}ms ${curve}`,
            '&:active': { transform: 'scale(0.96)' },
            '@media (prefers-reduced-motion: reduce)': { transition: 'none', '&:active': { transform: 'none' } },
          },
        },
      },
      MuiIconButton: { styleOverrides: { root: { borderRadius: radiusControl } } },
      MuiPaper: { styleOverrides: { root: { backgroundImage: 'none' } } },
      MuiCard: { defaultProps: { variant: 'outlined' } },
      MuiChip: { styleOverrides: { root: { borderRadius: radiusInner } } },
      MuiLink: { defaultProps: { underline: 'hover' }, styleOverrides: { root: { color: values.infoMain } } },
      MuiOutlinedInput: {
        styleOverrides: {
          root: { borderRadius: radiusControl, minHeight: controlHeight },
          notchedOutline: { borderColor: values.divider },
        },
      },
      MuiTooltip: {
        styleOverrides: {
          tooltip: {
            background: values.primaryMain,
            color: values.primaryContrastText,
            fontSize: stepRem('xs'),
            borderRadius: radiusInner,
          },
        },
      },
      MuiSkeleton: { defaultProps: { animation: 'wave' } },
      MuiAlert: { styleOverrides: { root: { borderRadius: radiusControl } } },
    },
  };
}

export function createKilowattTheme(values: ThemeValues, scheme: ColorScheme): Theme {
  return createTheme(themeOptions(values, scheme));
}
