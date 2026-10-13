import type { ReactNode } from 'react';
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
  /** Right-aligned content: a chip, a value, a menu. */
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

/** Rows of records with a primary line, a secondary line and something on the right. Rows link or click when asked to. */
export function EntityList({ items, state, empty, dense, skeletonRows = 5, 'aria-label': label }: EntityListProps) {
  return (
    <DataState state={state ?? { status: 'ready' }} skeleton={<ListSkeleton rows={skeletonRows} />} empty={empty}>
      <List dense={dense} disablePadding aria-label={label}>
        {items.map((item) => {
          const text = (
            <ListItemText
              primary={item.primary}
              secondary={item.secondary}
              slotProps={{
                primary: { sx: { overflowWrap: 'anywhere' } },
                secondary: { sx: { overflowWrap: 'anywhere' } },
              }}
            />
          );
          const interactive = item.to || item.onClick;
          return (
            <ListItem key={item.id} divider disablePadding={Boolean(interactive)} secondaryAction={item.trailing}>
              {interactive ? (
                item.to ? (
                  <ListItemButton
                    component={RouterLink}
                    to={item.to}
                    selected={item.selected}
                    sx={{ pr: item.trailing ? 14 : undefined }}
                  >
                    {text}
                  </ListItemButton>
                ) : (
                  <ListItemButton
                    onClick={item.onClick}
                    selected={item.selected}
                    sx={{ pr: item.trailing ? 14 : undefined }}
                  >
                    {text}
                  </ListItemButton>
                )
              ) : (
                text
              )}
            </ListItem>
          );
        })}
      </List>
    </DataState>
  );
}
