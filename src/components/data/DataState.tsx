import type { ReactNode } from 'react';
import Box from '@mui/material/Box';
import { useTranslation } from 'react-i18next';
import type { AsyncState } from '../../api/state';
import { FilterOffIcon } from '../../icons';
import { EmptyState, type EmptyStateProps } from './EmptyState';
import { ErrorState } from './ErrorState';
import { CardSkeleton } from './Skeletons';

export type DataStateProps = {
  state: AsyncState;
  /** What to show while loading. Defaults to a card skeleton. */
  skeleton?: ReactNode;
  /** Copy for the empty state. */
  empty?: EmptyStateProps;
  /** Copy for the idle state, before a required filter is set. */
  idle?: EmptyStateProps;
  errorTitle?: ReactNode;
  children: ReactNode;
};

/**
 * Renders one of the async states around some content. Loading shows the
 * skeleton, fetching dims the previous content, error and empty replace it,
 * ready shows it. Every data component is built on this so the states look
 * and behave the same everywhere.
 */
export function DataState({ state, skeleton, empty, idle, errorTitle, children }: DataStateProps) {
  const { t } = useTranslation();
  switch (state.status) {
    case 'loading':
      return <>{skeleton ?? <CardSkeleton />}</>;
    case 'error':
      return <ErrorState title={errorTitle} message={state.error} onRetry={state.onRetry} compact />;
    case 'empty':
      return <EmptyState compact {...empty} />;
    case 'idle':
      return (
        <EmptyState
          compact
          icon={<FilterOffIcon size={32} />}
          title={t('data.idle.title')}
          description={t('data.idle.description')}
          {...idle}
        />
      );
    case 'fetching':
      return (
        <Box aria-busy="true" aria-label={t('data.updating')} sx={{ opacity: 0.6, transition: 'opacity 150ms' }}>
          {children}
        </Box>
      );
    default:
      return <>{children}</>;
  }
}
