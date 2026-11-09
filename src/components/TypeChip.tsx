import Box from '@mui/material/Box';
import Chip from '@mui/material/Chip';
import { alpha, type SxProps, type Theme } from '@mui/material/styles';
import { Icon, type IconName } from '../icons';
import { createSchemeTheme } from '../mui/theme';
import { useResolvedScheme } from '../mui/useResolvedScheme';

/** One palette per scheme: a tint needs the color itself, and the theme's CSS variables carry only references to it. */
const palettes = { light: createSchemeTheme('light').palette, dark: createSchemeTheme('dark').palette };

/**
 * A `chart.series` slot's color in the color scheme on screen, for an icon that stands alone in a type's color (a list
 * row, a menu item).
 *
 * @param slot - The series slot, 0 to 5: a product meaning's, such as `workspaceTypeSlots.Report` from `src/charts/meanings`.
 */
export function useSlotColor(slot: number): string {
  const palette = palettes[useResolvedScheme() ?? 'light'];
  return palette.chart.series[slot % palette.chart.series.length];
}

export type TypeChipProps = {
  /** The type's `chart.series` slot, from its meaning: `workspaceTypeSlots.Dashboard`. */
  slot: number;
  /** The type's icon: `dashboard`. */
  icon: IconName;
  /** Overrides for the square, such as its margin. Default none. */
  sx?: SxProps<Theme>;
};

/**
 * A type's color-coded icon chip: a 32px square holding the type's icon in the type's color, the square in a tint of it.
 * The color is a `chart.series` slot, as Rules → Charts asks of a product meaning (`workspaceTypeSlots`: Dashboard,
 * Report and Plan take slots 0 to 2), never a palette color of its own. The tint is the slot's color at MUI's
 * `action.selectedOpacity`, so no opacity of Kilowatt's own enters the code. It's decorative: put the type's name beside
 * it, since the color rides on the icon, never on the name alone.
 *
 * @summary A type's icon in its series color on a tint of it, for cards, rows and menus of mixed types.
 * @import import { TypeChip } from 'src/components/TypeChip';
 */
export function TypeChip({ slot, icon, sx }: TypeChipProps) {
  const color = useSlotColor(slot);
  return (
    <Box
      aria-hidden
      sx={[
        { width: 32, height: 32, flex: 'none', display: 'grid', placeItems: 'center', borderRadius: 1, color, bgcolor: (t) => alpha(color, t.palette.action.selectedOpacity) },
        ...(Array.isArray(sx) ? sx : [sx]),
      ]}
    >
      <Icon name={icon} fontSize="small" />
    </Box>
  );
}

export type TypeFilterChipProps = {
  /** The filter's name, plural: `Dashboards`. */
  label: string;
  /** The type's `chart.series` slot. */
  slot: number;
  /** The type's icon. */
  icon: IconName;
  /** Whether this type is the filter chosen. Default `false`. */
  selected?: boolean;
  /** Chooses this type. */
  onClick: () => void;
};

/**
 * A type's filter chip, in a row of chips that filters a gallery by type: MUI's `Chip` with the type's icon in its
 * color and, chosen, filled with the color's tint. The label stays in the text color, so the color rides on the icon and
 * the fill, never on the words. An All chip has no type and stays MUI's plain chip.
 *
 * @summary A filter chip for one type, its icon in the type's series color, tinted when chosen.
 * @import import { TypeFilterChip } from 'src/components/TypeChip';
 */
export function TypeFilterChip({ label, slot, icon, selected = false, onClick }: TypeFilterChipProps) {
  const color = useSlotColor(slot);
  return (
    <Chip
      label={label}
      icon={<Icon name={icon} fontSize="small" />}
      variant={selected ? 'filled' : 'outlined'}
      onClick={onClick}
      aria-pressed={selected}
      sx={{ '& .MuiChip-icon': { color }, ...(selected && { bgcolor: (t) => alpha(color, t.palette.action.selectedOpacity) }) }}
    />
  );
}
