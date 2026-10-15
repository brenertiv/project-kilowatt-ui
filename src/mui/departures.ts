import type { ThemeOptions } from '@mui/material/styles';
import { typeScale, type ColorScheme, type ThemeValues } from '../tokens';

/**
 * Every way Kilowatt's theme departs from stock Material UI, and nothing else.
 *
 * The theme (`theme.ts`) is MUI's defaults with these entries merged on top, so
 * this list and the running theme cannot disagree, and `departures.test.ts`
 * fails if the theme differs from MUI anywhere a departure doesn't claim.
 * Foundations → MUI departures in Storybook is generated from this file.
 *
 * To depart from MUI, add an entry here with the reason. Anything not listed is
 * MUI's default, on purpose.
 */

export type DepartureArea = 'Theme' | 'Palette' | 'Typography' | 'Components' | 'Icons';

export type Departure = {
  id: string;
  area: DepartureArea;
  title: string;
  /** Why Kilowatt differs from MUI here, in one or two sentences. */
  why: string;
  /** The spec requirement this implements, when there is one (CMP-…). */
  spec?: string;
  /** The theme options this departure sets. Absent for conventions outside the theme. */
  options?: (values: ThemeValues, scheme: ColorScheme) => ThemeOptions;
  /** For a convention outside the theme: what MUI does, what Kilowatt does instead, and where. */
  convention?: { muiDefault: string; kilowatt: string; where: string };
};

function rem(id: string): string {
  const step = typeScale.find((candidate) => candidate.id === id);
  if (!step) throw new Error(`Unknown type step ${id}`);
  return `${step.rem}rem`;
}

const heading = (step: string) => ({ fontWeight: 400, lineHeight: 1.2, letterSpacing: '-0.02em', fontSize: rem(step) });
const text = (step: string, lineHeight: number) => ({ fontWeight: 400, lineHeight, fontSize: rem(step) });

export const departures: Departure[] = [
  {
    id: 'css-variables',
    area: 'Theme',
    title: 'CSS theme variables and color schemes',
    why: "MUI's opt-in CSS variables mode, with light and dark as built-in color schemes. MUI writes --mui-* variables and switches schemes with a class on <html>, the same `dark` class the token stylesheet keys on, so MUI and the plain CSS components change scheme together.",
    convention: {
      muiDefault: 'Theme values in JavaScript, one palette mode per theme',
      kilowatt: 'cssVariables with colorSchemeSelector: class; light and dark colorSchemes; scheme managed by MUI, not persisted',
      where: 'src/mui/theme.ts (createKilowattTheme), src/mui/MuiProvider.tsx',
    },
  },
  {
    id: 'palette-brand',
    area: 'Palette',
    title: 'Brand colors',
    why: "Primary is Enertiv navy and secondary the brand blue, in place of MUI's blue and purple. Values come from the tokens, per scheme.",
    options: (values) => ({
      palette: {
        primary: { main: values.primaryMain, light: values.primaryLight, dark: values.primaryDark, contrastText: values.primaryContrastText },
        secondary: {
          main: values.secondaryMain,
          light: values.secondaryLight,
          dark: values.secondaryDark,
          contrastText: values.secondaryContrastText,
        },
      },
    }),
  },
  {
    id: 'palette-status',
    area: 'Palette',
    title: 'Status colors',
    why: 'Success, warning, error and info use the Kilowatt status ramps, so status reads the same in MUI components and in charts, tables and chips.',
    options: (values) => ({
      palette: {
        success: { main: values.successMain, light: values.successLight, dark: values.successDark, contrastText: values.successContrastText },
        warning: { main: values.warningMain, light: values.warningLight, dark: values.warningDark, contrastText: values.warningContrastText },
        error: { main: values.errorMain, light: values.errorLight, dark: values.errorDark, contrastText: values.errorContrastText },
        info: { main: values.infoMain, light: values.infoLight, dark: values.infoDark, contrastText: values.infoContrastText },
      },
    }),
  },
  {
    id: 'palette-surfaces',
    area: 'Palette',
    title: 'Surfaces, text and divider',
    why: "The page, raised surface, text emphasis and divider follow Kilowatt's slate and navy ramps in both schemes, in place of MUI's white and gray.",
    options: (values) => ({
      palette: {
        background: { default: values.backgroundDefault, paper: values.backgroundPaper },
        text: { primary: values.textPrimary, secondary: values.textSecondary, disabled: values.textDisabled },
        divider: values.divider,
      },
    }),
  },
  {
    id: 'type-headings',
    area: 'Typography',
    title: 'Headings',
    why: "No bold and no light display weights: every heading is 400, sized from Kilowatt's type scale with tight tracking. Hierarchy comes from size.",
    options: () => ({
      typography: {
        h1: heading('4xl'),
        h2: heading('3xl'),
        h3: heading('2xl'),
        h4: heading('xl'),
        h5: { ...text('lg', 1.3) },
        h6: { ...text('md', 1.3) },
      },
    }),
  },
  {
    id: 'type-text',
    area: 'Typography',
    title: 'Body, subtitle and caption sizes',
    why: "Kilowatt sets body text at 14px and secondary text at 12px, a step smaller than MUI's 16px and 14px, for dense operational screens.",
    options: () => ({
      typography: {
        subtitle1: text('md', 1.3),
        subtitle2: text('sm', 1.3),
        body1: text('sm', 1.5),
        body2: text('xs', 1.4),
        caption: text('xs', 1.4),
      },
    }),
  },
  {
    id: 'type-overline',
    area: 'Typography',
    title: 'Overline (section eyebrow)',
    why: 'The eyebrow above a title or metric is 12px, medium weight and widely tracked, so it reads as a label rather than body text.',
    options: () => ({
      typography: {
        overline: { fontWeight: 500, lineHeight: 1.4, fontSize: rem('xs'), letterSpacing: '0.15em', textTransform: 'uppercase' },
      },
    }),
  },
  {
    id: 'type-button-case',
    area: 'Typography',
    title: 'Button text case',
    why: 'Buttons use sentence case, as written. Uppercase labels are harder to read and shout in dense toolbars.',
    options: () => ({ typography: { button: { textTransform: 'none' } } }),
  },
  {
    id: 'card-outlined',
    area: 'Components',
    title: 'Flat, outlined cards',
    why: 'Cards sit flat on the page with a 1px divider border and no shadow, so dense dashboards stay calm and surfaces separate by border and color rather than elevation.',
    options: () => ({ components: { MuiCard: { defaultProps: { variant: 'outlined' } } } }),
  },
  {
    id: 'icons',
    area: 'Icons',
    title: 'Icon set',
    why: 'One icon set across the product: Google\'s Material Symbols, a variable font, at weight 300 so icons sit a step lighter than text.',
    spec: 'CMP-ICON-01',
    convention: {
      muiDefault: 'SVG icons from @mui/icons-material',
      kilowatt: 'Material Symbols Outlined, weight 300, 16px, through the components in src/icons.tsx',
      where: 'src/icons.tsx; @mui/icons-material is not installed',
    },
  },
];
