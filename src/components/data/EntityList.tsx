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

export type EntityListItem = {
  id: string | number;
  primary: ReactNode;
  secondary?: ReactNode;
  /** Right-aligned content: a chip, a value, a menu. Wraps under the text on narrow screens. */
  trailing?: ReactNode;
  to?: string;
  onClick?: () => void;
  selected?: boolean;
};

export type EntityListProps = {
  items: EntityListItem[];
  state?: AsyncState;
  empty?: EmptyStateProps;
  dense?: boolean;
  skeletonRows?: number;
  'aria-label'?: string;
};

const rowSx = { display: 'flex', flexWrap: 'wrap', alignItems: 'center', columnGap: 3, rowGap: 1 } as const;

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
    <Box sx={{ display: 'flex', gap: 1, alignItems: 'center', flexShrink: 0, ml: 'auto' }}>{item.trailing}</Box>
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

/** Rows of records with a primary line, a secondary line and something on the right. Rows link or click when asked to. */
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
