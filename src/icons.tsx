import MuiIcon, { type IconProps as MuiIconProps } from '@mui/material/Icon';
import type { SxProps, Theme } from '@mui/material/styles';

/**
 * The icon names Kilowatt uses: Material Symbols ligatures. Add a name here to
 * use a new icon; `name` only accepts these, so a typo is a type error rather
 * than a word on screen. Browse the set at https://fonts.google.com/icons.
 */
export const iconNames = [
  'add',
  'apartment',
  'arrow_downward',
  'arrow_outward',
  'arrow_upward',
  'bar_chart',
  'bolt',
  'check',
  'check_circle',
  'chevron_left',
  'chevron_right',
  'close',
  'content_copy',
  'dark_mode',
  'delete',
  'density_medium',
  'density_small',
  'devices',
  'download',
  'edit',
  'error',
  'expand_more',
  'filter_alt_off',
  'fit_screen',
  'fullscreen',
  'fullscreen_exit',
  'inbox',
  'info',
  'laptop',
  'left_panel_close',
  'left_panel_open',
  'light_mode',
  'link',
  'more_horiz',
  'refresh',
  'remove',
  'restart_alt',
  'right_panel_close',
  'right_panel_open',
  'save',
  'schedule',
  'search',
  'show_chart',
  'smartphone',
  'table_rows',
  'tablet',
  'trending_down',
  'trending_up',
  'tune',
  'unfold_more',
  'view_column',
  'warning',
] as const;

export type IconName = (typeof iconNames)[number];

/** The `wght` axis every icon renders at unless it passes `weight`. Set in the theme (src/mui/departures.ts). */
export const iconWeight = 300;

export type IconProps = Omit<MuiIconProps, 'children' | 'baseClassName'> & {
  /** The Material Symbols ligature to show. */
  name: IconName;
  /** Filled glyph (the `FILL` axis). Unset, the icon is outlined, or filled when its control is selected. */
  fill?: boolean;
  /** Weight on the `wght` axis. Defaults to 300. */
  weight?: 100 | 200 | 300 | 400 | 500 | 600 | 700;
};

/**
 * An icon from Material Symbols Outlined, Google's variable icon font, rendered
 * by MUI's `Icon`. The theme sets the font and its default axes, so size and
 * color are MUI's own props: `fontSize` (`small`, `medium`, `large`, `inherit`)
 * and `color` (a palette intent). Decorative (`aria-hidden`); an icon-only
 * control needs its own `aria-label`.
 *
 * @summary A Material Symbols icon by name, with fill and weight.
 * @import import { Icon } from 'src/icons';
 */
export function Icon({ name, fill, weight, sx, ...props }: IconProps) {
  const axes: SxProps<Theme> = {
    ...(fill === undefined ? {} : { '--icon-fill': fill ? 1 : 0 }),
    ...(weight === undefined ? {} : { '--icon-weight': weight }),
  };
  return (
    <MuiIcon translate="no" sx={[axes, ...(Array.isArray(sx) ? sx : [sx])]} {...props}>
      {name}
    </MuiIcon>
  );
}
