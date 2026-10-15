import type { ReactNode } from 'react';
import Box from '@mui/material/Box';
import { useTranslation } from 'react-i18next';
import type { AsyncState } from '../../api/state';
import { FilterOffIcon } from '../../icons';
import { EmptyState, type EmptyStateProps } from './EmptyState';
import { ErrorState } from './ErrorState';
import { CardSkeleton } from './Skeletons';

export type DataStateProps = {
  /** The async state to render. Pages derive it from a query with `fromQuery`; stories set it directly. */
  state: AsyncState;
  /** What to show while loading, shaped like the content it stands in for (`ListSkeleton`, `StatSkeleton`, `TableSkeleton`). Defaults to a `CardSkeleton`. */
  skeleton?: ReactNode;
  /** Title, description, icon and action for the empty state. Defaults to "Nothing here yet" with the inbox icon. Name what is missing, e.g. "No alerts". */
  empty?: EmptyStateProps;
  /** Overrides for the idle state, shown before a required filter is set. Defaults to "Choose a filter to begin" with the filter icon. */
  idle?: EmptyStateProps;
  /** Heading for the error state. Defaults to "Something went wrong"; the message comes from `state.error` and the retry from `state.onRetry`. */
  errorTitle?: ReactNode;
  /** The content to show when ready. While fetching it stays on screen, dimmed and marked busy. */
  children: ReactNode;
};

/**
 * Renders one of the async states around some content. Loading shows the
 * skeleton, fetching dims the previous content, error and empty replace it,
 * idle asks for a filter, ready shows it. Wrap any content that comes from the
 * API in it instead of hand-rolling a spinner, empty message or error block.
 * `EntityCard`, `EntityList` and `StatCard` already take a `state` of their
 * own; tables use `DataTable`'s states.
 *
 * @summary Switches between skeleton, dimmed refresh, empty, error, idle and ready content from one AsyncState.
 * @import import { DataState } from 'src/components/data';
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
        // A generic div may not carry aria-label, so "Updating" is hidden text beside the busy content.
        <Box aria-busy="true" sx={{ opacity: 0.6, transition: 'opacity 150ms' }}>
          <span className="ui-sr-only">{t('data.updating')}</span>
          {children}
        </Box>
      );
    default:
      return <>{children}</>;
  }
}
