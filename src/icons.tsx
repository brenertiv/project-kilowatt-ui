import type { ComponentType, CSSProperties, HTMLAttributes } from 'react';

/**
 * The one icon set for the whole surface: Material Symbols Outlined, Google's
 * variable icon font. Each icon is a ligature rendered by the font, so a glyph
 * costs no SVG and recolors with `currentColor`. The variable axes are set in
 * CSS on `.ui-icon`: weight 300 (`--icon-weight`), optical size matches 16px,
 * and `FILL` marks the active state.
 *
 * Add icons here by ligature name, never write a ligature elsewhere.
 */

export type IconProps = Omit<HTMLAttributes<HTMLSpanElement>, 'children'> & {
  /** Filled variant, for the active state of a toggle or tab. */
  fill?: boolean;
  /** Font weight on the `wght` axis. Defaults to `--icon-weight` (300). */
  weight?: 100 | 200 | 300 | 400 | 500 | 600 | 700;
  /** Rendered size. The `.ui-icon` class pins 16px; pass a size only off-grid. */
  size?: number;
};

function define(ligature: string): ComponentType<IconProps> {
  function Icon({ className, fill, weight, size, style, ...props }: IconProps) {
    const variation: CSSProperties | undefined =
      fill || weight || size
        ? {
            ...(size ? { width: size, height: size, fontSize: size } : {}),
            fontVariationSettings: [
              `'FILL' ${fill ? 1 : 0}`,
              `'wght' ${weight ?? 'var(--icon-weight)'}`,
              `'GRAD' var(--icon-grade)`,
              `'opsz' ${size && size >= 40 ? 48 : size && size >= 24 ? 24 : 20}`,
            ].join(', '),
          }
        : undefined;
    return (
      <span
        className={['ui-icon', 'material-symbols-outlined', className].filter(Boolean).join(' ')}
        aria-hidden="true"
        translate="no"
        data-fill={fill || undefined}
        style={variation ? { ...variation, ...style } : style}
        {...props}
      >
        {ligature}
      </span>
    );
  }
  Icon.displayName = `Icon(${ligature})`;
  return Icon;
}

export const CheckIcon = define('check');
export const ChevronDownIcon = define('expand_more');
export const ChevronUpDownIcon = define('unfold_more');
export const PlusIcon = define('add');
export const MinusIcon = define('remove');
export const XIcon = define('close');
export const SearchIcon = define('search');
export const CopyIcon = define('content_copy');
export const ResetIcon = define('restart_alt');
export const SaveIcon = define('save');
export const DeleteIcon = define('delete');
export const TrendUpIcon = define('trending_up');
export const WarningIcon = define('warning');
export const ArrowOutwardIcon = define('arrow_outward');
export const TuneIcon = define('tune');
export const ArrowUpIcon = define('arrow_upward');
export const ArrowDownIcon = define('arrow_downward');
export const ChevronLeftIcon = define('chevron_left');
export const ChevronRightIcon = define('chevron_right');
export const MoreIcon = define('more_horiz');
export const ColumnsIcon = define('view_column');
export const DownloadIcon = define('download');
export const DensityComfortableIcon = define('density_medium');
export const DensityCompactIcon = define('density_small');
export const ErrorIcon = define('error');
export const BuildingIcon = define('apartment');
export const InboxIcon = define('inbox');
export const RefreshIcon = define('refresh');
export const ScheduleIcon = define('schedule');
export const CheckCircleIcon = define('check_circle');
export const InfoIcon = define('info');
export const TrendDownIcon = define('trending_down');
export const LinkIcon = define('link');
export const FilterOffIcon = define('filter_alt_off');
export const DevicesIcon = define('devices');
export const FitScreenIcon = define('fit_screen');
export const PhoneIcon = define('smartphone');
export const TabletIcon = define('tablet');
export const LaptopIcon = define('laptop');
export const FullscreenIcon = define('fullscreen');
export const FullscreenExitIcon = define('fullscreen_exit');
export const LightModeIcon = define('light_mode');
export const DarkModeIcon = define('dark_mode');
export const LeftPanelOpenIcon = define('left_panel_open');
export const LeftPanelCloseIcon = define('left_panel_close');
export const RightPanelOpenIcon = define('right_panel_open');
export const RightPanelCloseIcon = define('right_panel_close');

export const iconCatalog: { name: string; Icon: ComponentType<IconProps> }[] = [
  { name: 'CheckIcon', Icon: CheckIcon },
  { name: 'ChevronDownIcon', Icon: ChevronDownIcon },
  { name: 'ChevronUpDownIcon', Icon: ChevronUpDownIcon },
  { name: 'ChevronLeftIcon', Icon: ChevronLeftIcon },
  { name: 'ChevronRightIcon', Icon: ChevronRightIcon },
  { name: 'ArrowUpIcon', Icon: ArrowUpIcon },
  { name: 'ArrowDownIcon', Icon: ArrowDownIcon },
  { name: 'ArrowOutwardIcon', Icon: ArrowOutwardIcon },
  { name: 'PlusIcon', Icon: PlusIcon },
  { name: 'MinusIcon', Icon: MinusIcon },
  { name: 'XIcon', Icon: XIcon },
  { name: 'MoreIcon', Icon: MoreIcon },
  { name: 'SearchIcon', Icon: SearchIcon },
  { name: 'CopyIcon', Icon: CopyIcon },
  { name: 'ResetIcon', Icon: ResetIcon },
  { name: 'SaveIcon', Icon: SaveIcon },
  { name: 'DeleteIcon', Icon: DeleteIcon },
  { name: 'DownloadIcon', Icon: DownloadIcon },
  { name: 'ColumnsIcon', Icon: ColumnsIcon },
  { name: 'DensityComfortableIcon', Icon: DensityComfortableIcon },
  { name: 'DensityCompactIcon', Icon: DensityCompactIcon },
  { name: 'TuneIcon', Icon: TuneIcon },
  { name: 'TrendUpIcon', Icon: TrendUpIcon },
  { name: 'WarningIcon', Icon: WarningIcon },
  { name: 'ErrorIcon', Icon: ErrorIcon },
  { name: 'BuildingIcon', Icon: BuildingIcon },
  { name: 'InboxIcon', Icon: InboxIcon },
  { name: 'RefreshIcon', Icon: RefreshIcon },
  { name: 'ScheduleIcon', Icon: ScheduleIcon },
  { name: 'CheckCircleIcon', Icon: CheckCircleIcon },
  { name: 'InfoIcon', Icon: InfoIcon },
  { name: 'TrendDownIcon', Icon: TrendDownIcon },
  { name: 'LinkIcon', Icon: LinkIcon },
  { name: 'FilterOffIcon', Icon: FilterOffIcon },
  { name: 'DevicesIcon', Icon: DevicesIcon },
  { name: 'FitScreenIcon', Icon: FitScreenIcon },
  { name: 'PhoneIcon', Icon: PhoneIcon },
  { name: 'TabletIcon', Icon: TabletIcon },
  { name: 'LaptopIcon', Icon: LaptopIcon },
  { name: 'FullscreenIcon', Icon: FullscreenIcon },
  { name: 'FullscreenExitIcon', Icon: FullscreenExitIcon },
  { name: 'LightModeIcon', Icon: LightModeIcon },
  { name: 'DarkModeIcon', Icon: DarkModeIcon },
  { name: 'LeftPanelOpenIcon', Icon: LeftPanelOpenIcon },
  { name: 'LeftPanelCloseIcon', Icon: LeftPanelCloseIcon },
  { name: 'RightPanelOpenIcon', Icon: RightPanelOpenIcon },
  { name: 'RightPanelCloseIcon', Icon: RightPanelCloseIcon },
];
