import type { GridProSlotsComponent } from '@mui/x-data-grid-pro';
import { Icon, type IconName, type IconProps } from '../icons';

/** What the Data Grid passes an icon slot: MUI's size and color, and a title Kilowatt's icons don't take (the control names itself). */
type SlotIconProps = { fontSize?: 'small' | 'medium' | 'large' | 'inherit'; color?: string; className?: string; titleAccess?: string };

/** The slot's props as `Icon` takes them: its size, color and class, without the title. */
const iconProps = ({ fontSize, color, className }: SlotIconProps): Pick<IconProps, 'fontSize' | 'color' | 'className'> => ({
  fontSize,
  color: color as IconProps['color'],
  className,
});

/** A Data Grid icon slot that draws one Material Symbol through Kilowatt's `Icon`. */
const slotIcon = (name: IconName) =>
  function DataGridIcon(props: SlotIconProps) {
    return <Icon name={name} {...iconProps(props)} />;
  };

/** The arrow an unsorted column shows on hover: the direction its first click sorts in, as MUI's own does. */
function UnsortedIcon({ sortingOrder, ...props }: SlotIconProps & { sortingOrder: readonly ('asc' | 'desc' | null | undefined)[] }) {
  const next = sortingOrder[0];
  if (!next) return null;
  return <Icon name={next === 'asc' ? 'arrow_upward' : 'arrow_downward'} {...iconProps(props)} />;
}

/**
 * The Data Grid's icon slots in Material Symbols, set as the grid's default `slots` by the `data-grid-icons`
 * departure. The column resize handle, the loading spinner and the long-text cell's arrows aren't icons from the set,
 * so they stay MUI's.
 */
export const dataGridIconSlots = {
  booleanCellTrueIcon: slotIcon('check'),
  booleanCellFalseIcon: slotIcon('close'),
  undoIcon: slotIcon('undo'),
  redoIcon: slotIcon('redo'),
  columnMenuIcon: slotIcon('more_vert'),
  openFilterButtonIcon: slotIcon('filter_list'),
  columnFilteredIcon: slotIcon('filter_alt'),
  columnSelectorIcon: slotIcon('view_column'),
  columnUnsortedIcon: UnsortedIcon,
  columnSortedAscendingIcon: slotIcon('arrow_upward'),
  columnSortedDescendingIcon: slotIcon('arrow_downward'),
  densityCompactIcon: slotIcon('density_small'),
  densityStandardIcon: slotIcon('density_medium'),
  densityComfortableIcon: slotIcon('density_large'),
  exportIcon: slotIcon('download'),
  moreActionsIcon: slotIcon('more_vert'),
  treeDataExpandIcon: slotIcon('chevron_right'),
  treeDataCollapseIcon: slotIcon('expand_more'),
  groupingCriteriaExpandIcon: slotIcon('chevron_right'),
  groupingCriteriaCollapseIcon: slotIcon('expand_more'),
  detailPanelExpandIcon: slotIcon('add'),
  detailPanelCollapseIcon: slotIcon('remove'),
  filterPanelAddIcon: slotIcon('add'),
  filterPanelDeleteIcon: slotIcon('close'),
  filterPanelRemoveAllIcon: slotIcon('delete_forever'),
  rowReorderIcon: slotIcon('drag_indicator'),
  columnReorderIcon: slotIcon('drag_indicator'),
  quickFilterIcon: slotIcon('search'),
  quickFilterClearIcon: slotIcon('close'),
  columnMenuHideIcon: slotIcon('visibility_off'),
  columnMenuSortAscendingIcon: slotIcon('arrow_upward'),
  columnMenuSortDescendingIcon: slotIcon('arrow_downward'),
  columnMenuFilterIcon: slotIcon('filter_alt'),
  columnMenuManageColumnsIcon: slotIcon('view_column'),
  columnMenuClearIcon: slotIcon('close'),
  columnMenuPinLeftIcon: slotIcon('push_pin'),
  columnMenuPinRightIcon: slotIcon('push_pin'),
  menuItemCheckIcon: slotIcon('check'),
} satisfies Partial<GridProSlotsComponent>;
