import { useId, useState, type ReactNode } from 'react';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Drawer from '@mui/material/Drawer';
import IconButton from '@mui/material/IconButton';
import InputAdornment from '@mui/material/InputAdornment';
import ListItemIcon from '@mui/material/ListItemIcon';
import ListItemText from '@mui/material/ListItemText';
import Menu from '@mui/material/Menu';
import MenuItem from '@mui/material/MenuItem';
import Stack from '@mui/material/Stack';
import TextField from '@mui/material/TextField';
import Tooltip from '@mui/material/Tooltip';
import Typography from '@mui/material/Typography';
import { Icon, type IconName } from '../icons';
import { useContentUp } from './contentWidth';
import { PeriodPicker, type PeriodPickerProps } from './PeriodPicker';

/** One way to show a page's content, offered in the view menu. */
export type FilterBarView<T extends string> = {
  /** Identifies the view. */
  value: T;
  /** Its name, in the menu and in the button's name and tooltip: "Cards". */
  label: string;
  /** Its icon, on the button while it's chosen and in the menu. */
  icon: IconName;
};

export type FilterBarFilters = {
  /** How many filter controls there are, for the width the bar needs. */
  count: number;
  /** How many are set away from their default, for the Filters field's value. */
  set: number;
  /** Draws the filters at the small size: inline on one row (`fullWidth` false, each at least `filterWidth` wide), or full width in the sheet. */
  render: (fullWidth: boolean) => ReactNode;
  /** Sets every filter back to its default, from the sheet's Clear All. */
  onClear: () => void;
};

export type FilterBarProps<T extends string> = {
  /** The bar's accessible name. Default `'Filters'`. */
  label?: string;
  /** The page's filters, on the left. Default none. */
  filters?: FilterBarFilters;
  /** The period, on the right: `PeriodPicker`'s props, which the bar sizes itself. Default none. */
  period?: Omit<PeriodPickerProps, 'fullWidth' | 'size'>;
  /** The chosen view and every view it offers, to the right of the period. Default none. */
  view?: { value: T; options: FilterBarView<T>[]; onChange: (next: T) => void };
};

/** The least a filter takes on the bar's one row. Set it as each filter's `minWidth` when `render` draws them inline. */
export const filterWidth = 220;

// The widths the full bar needs on one row: each filter at its minimum, the period field (it holds its width whatever
// it names), the view's icon button and the bar's 16px gaps.
const periodWidth = 260;
const viewWidth = 40;
const filtersFieldWidth = 140;
const barGap = 16;
/** Below this page width the period takes a row of its own: the period at its narrowest, the Filters field and the view. */
const compactRow = 200 + barGap + filtersFieldWidth + barGap + viewWidth;

/** The Filters field: a read-only field, as the period's is, so the row is one height. Its value says how many are set. */
function FiltersField({ set, onOpen, grow }: { set: number; onOpen: () => void; grow: boolean }) {
  return (
    <TextField
      // Small with the rest of the bar (Rules → Component size: a filter bar may take small, together).
      size="small"
      label="Filters"
      value={set === 0 ? 'None' : `${new Intl.NumberFormat().format(set)} set`}
      onClick={onOpen}
      onKeyDown={(event) => {
        if (event.key === 'Enter' || event.key === ' ' || event.key === 'ArrowDown') {
          event.preventDefault();
          onOpen();
        }
      }}
      slotProps={{
        input: {
          readOnly: true,
          endAdornment: (
            <InputAdornment position="end">
              <Icon name="tune" />
            </InputAdornment>
          ),
          sx: { cursor: 'pointer' },
        },
        htmlInput: { 'aria-haspopup': 'dialog', sx: { cursor: 'pointer' } },
      }}
      sx={{ width: filtersFieldWidth, flexShrink: 0, flexGrow: grow ? 1 : 0 }}
    />
  );
}

/** The view: an icon button showing the chosen view's icon, which opens a menu of every view; a menu rather than a toggle, so there can be more than two. */
function ViewMenu<T extends string>({ value, options, onChange }: NonNullable<FilterBarProps<T>['view']>) {
  const [anchor, setAnchor] = useState<HTMLElement | null>(null);
  const menuId = useId();
  const current = options.find((option) => option.value === value) ?? options[0];
  return (
    <>
      <Tooltip title={`View: ${current.label}`}>
        <IconButton
          aria-label={`View: ${current.label}`}
          aria-haspopup="menu"
          aria-controls={anchor ? menuId : undefined}
          aria-expanded={Boolean(anchor)}
          onClick={(event) => setAnchor(event.currentTarget)}
          sx={{ flexShrink: 0 }}
        >
          <Icon name={current.icon} />
        </IconButton>
      </Tooltip>
      <Menu
        id={menuId}
        anchorEl={anchor}
        open={Boolean(anchor)}
        onClose={() => setAnchor(null)}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
        transformOrigin={{ vertical: 'top', horizontal: 'right' }}
      >
        {options.map((option) => (
          <MenuItem
            key={option.value}
            selected={option.value === value}
            onClick={() => {
              onChange(option.value);
              setAnchor(null);
            }}
          >
            <ListItemIcon>
              <Icon name={option.icon} />
            </ListItemIcon>
            <ListItemText primary={option.label} />
          </MenuItem>
        ))}
      </Menu>
    </>
  );
}

/**
 * The one filters bar every page uses: filters on the left, the period on the right, the view to the
 * right of the period. Any part can be missing: filters alone stay on the left, and the period and the
 * view alone stay on the right. By the page's width, not the window's (`useContentUp`), it folds
 * rather than wraps: where every control no longer fits on one row, the filters become one Filters
 * field saying how many are set, which opens them in a bottom sheet with Clear All and Done; narrower
 * still, the period takes a row of its own. Every control is small, together, so the bar is 40px tall.
 *
 * @summary The page's filters, period and view on one row, folding into one Filters field by the page's width.
 * @import import { FilterBar } from 'src/components/FilterBar';
 */
export function FilterBar<T extends string = string>({ label = 'Filters', filters, period, view }: FilterBarProps<T>) {
  const [sheetOpen, setSheetOpen] = useState(false);
  const sheetTitleId = useId();
  const needed = (filters ? filters.count * (filterWidth + barGap) : 0) + (period ? periodWidth + barGap : 0) + (view ? viewWidth : 0);
  const compact = !useContentUp(needed);
  const periodOwnRow = !useContentUp(compactRow);
  const viewMenu = view && <ViewMenu {...view} />;

  if (compact) {
    return (
      <>
        <Stack
          direction="row"
          role="group"
          aria-label={label}
          sx={{ gap: 2, rowGap: 1.5, flexWrap: periodOwnRow ? 'wrap' : 'nowrap', alignItems: 'center', justifyContent: 'flex-end', mb: 3 }}
        >
          {period && (
            <Box sx={{ flex: periodOwnRow ? '1 0 100%' : 1, minWidth: 0 }}>
              <PeriodPicker {...period} fullWidth size="small" />
            </Box>
          )}
          {filters && <FiltersField set={filters.set} onOpen={() => setSheetOpen(true)} grow={periodOwnRow || !period} />}
          {viewMenu}
        </Stack>
        {filters && (
          <Drawer
            anchor="bottom"
            open={sheetOpen}
            onClose={() => setSheetOpen(false)}
            slotProps={{
              paper: {
                'aria-labelledby': sheetTitleId,
                sx: {
                  maxHeight: '80dvh',
                  borderRadius: 'calc(2 * var(--mui-shape-borderRadius)) calc(2 * var(--mui-shape-borderRadius)) 0 0',
                  // Clear of the home indicator, and scrolling to its end doesn't scroll the page behind.
                  pb: 'env(safe-area-inset-bottom)',
                  overscrollBehavior: 'contain',
                },
              },
            }}
          >
            <Stack direction="row" sx={{ alignItems: 'center', gap: 1, p: 1, pl: 3 }}>
              <Typography id={sheetTitleId} variant="h5" component="h2" sx={{ flex: 1 }}>
                Filters
              </Typography>
              <IconButton aria-label="Close" onClick={() => setSheetOpen(false)}>
                <Icon name="close" />
              </IconButton>
            </Stack>
            {/* pt leaves room for the first field's floating label, which the scroll area would clip. */}
            <Stack sx={{ px: 3, pt: 1, pb: 3, gap: 2, minHeight: 0, overflowY: 'auto' }}>
              {filters.render(true)}
              <Stack direction="row" sx={{ gap: 1, justifyContent: 'flex-end' }}>
                <Button onClick={filters.onClear} disabled={filters.set === 0}>
                  Clear All
                </Button>
                <Button variant="contained" onClick={() => setSheetOpen(false)}>
                  Done
                </Button>
              </Stack>
            </Stack>
          </Drawer>
        )}
      </>
    );
  }
  return (
    <Stack direction="row" role="group" aria-label={label} sx={{ gap: 2, alignItems: 'center', mb: 3 }}>
      {/* The filters take the row's free width, so the period and the view stay at the right whether or not there are filters. */}
      <Stack direction="row" sx={{ gap: 2, alignItems: 'center', flex: 1, minWidth: 0 }}>
        {filters?.render(false)}
      </Stack>
      {period && <PeriodPicker {...period} size="small" />}
      {viewMenu}
    </Stack>
  );
}
