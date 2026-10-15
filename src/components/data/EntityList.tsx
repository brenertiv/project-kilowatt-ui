import type { ReactNode } from 'react';
import Box from '@mui/material/Box';
import List from '@mui/material/List';
import ListItem from '@mui/material/ListItem';
import ListItemButton from '@mui/material/ListItemButton';
import ListItemText from '@mui/material/ListItemText';
import { Link as RouterLink } from 'react-router';
import type { AsyncState } from '../../api/state';
import { DataState } from './DataState';
import type { EmptyStateProps } from './EmptyState';
import { ListSkeleton } from './Skeletons';

/** One row of an `EntityList`. */
export type EntityListItem = {
  /** Stable key for the row, usually the record's id. */
  id: string | number;
  /** The main line, usually the record's name through `EntityName`. */
  primary: ReactNode;
  /** A muted second line: the parent, a date, a short description. */
  secondary?: ReactNode;
  /** Right-aligned content: a chip, a value, a menu. Wraps under the text on narrow screens. */
  trailing?: ReactNode;
  /** A route path. Makes the whole row a link; takes precedence over `onClick`. */
  to?: string;
  /** Makes the whole row a button, e.g. to select it for a side panel. Ignored when `to` is set. */
  onClick?: () => void;
  /** Highlights the row as the current selection. Only shows on rows with `to` or `onClick`. */
  selected?: boolean;
};

export type EntityListProps = {
  /** The rows to show, in order. */
  items: EntityListItem[];
  /** The async state of the list. Loading shows a list skeleton, fetching dims the rows, empty and error replace them. Defaults to ready. */
  state?: AsyncState;
  /** Title, description and action for the empty state. Defaults to "Nothing here yet". */
  empty?: EmptyStateProps;
  /** Tighter rows, for a list inside a card or a side panel. */
  dense?: boolean;
  /** Rows in the loading skeleton. Match the expected page size. Defaults to 5. */
  skeletonRows?: number;
  /** Names the list for assistive tech, e.g. "Open alerts". Set it when there is no visible heading tied to the list. */
  'aria-label'?: string;
};

const rowSx = { display: 'flex', flexWrap: 'wrap', alignItems: 'center', columnGap: 1.5, rowGap: 0.5 } as const;

function Row({ item, dense }: { item: EntityListItem; dense?: boolean }) {
  const text = (
    <ListItemText
      primary={item.primary}
      secondary={item.secondary}
      sx={{ flex: '1 1 240px', minWidth: 0, my: dense ? 0 : undefined }}
      slotProps={{ primary: { sx: { overflowWrap: 'anywhere' } }, secondary: { sx: { overflowWrap: 'anywhere' } } }}
    />
  );
  const trailing = item.trailing ? (
    <Box sx={{ display: 'flex', gap: 0.5, alignItems: 'center', flexShrink: 0, ml: 'auto' }}>{item.trailing}</Box>
  ) : null;
  if (item.to) {
    return (
      <ListItemButton component={RouterLink} to={item.to} selected={item.selected} sx={rowSx}>
        {text}
        {trailing}
      </ListItemButton>
    );
  }
  if (item.onClick) {
    return (
      <ListItemButton onClick={item.onClick} selected={item.selected} sx={rowSx}>
        {text}
        {trailing}
      </ListItemButton>
    );
  }
  return (
    <>
      {text}
      {trailing}
    </>
  );
}

/**
 * Rows of records with a primary line, a secondary line and something on the right. Rows link or click when asked to.
 * Use it for a short list of records in a card or a list page, paired with `FilterBar` and `CursorPagination`. When
 * readers need to compare fields across columns, sort or export, use `DataTable`; for one record, `EntityCard`.
 *
 * @summary A list of record rows with primary, secondary and trailing content, optionally linked or clickable.
 * @import import { EntityList } from 'src/components/data';
 */
export function EntityList({ items, state, empty, dense, skeletonRows = 5, 'aria-label': label }: EntityListProps) {
  return (
    <DataState state={state ?? { status: 'ready' }} skeleton={<ListSkeleton rows={skeletonRows} />} empty={empty}>
      <List dense={dense} disablePadding aria-label={label}>
        {items.map((item) => {
          const interactive = Boolean(item.to || item.onClick);
          return (
            <ListItem key={item.id} divider disablePadding={interactive} sx={interactive ? undefined : rowSx}>
              <Row item={item} dense={dense} />
            </ListItem>
          );
        })}
      </List>
    </DataState>
  );
}
