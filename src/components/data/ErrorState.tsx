import type { ReactNode } from 'react';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';
import { useTranslation } from 'react-i18next';
import { ErrorIcon, RefreshIcon } from '../../icons';

export type ErrorStateProps = {
  /** The heading. Defaults to "Something went wrong". */
  title?: ReactNode;
  /** The API's message, already made readable by `errorMessage` (or `state.error` from `fromQuery`). Omitted when not set. */
  message?: ReactNode;
  /** Shows a Retry button that calls this. Pass it whenever the request can be repeated, usually `state.onRetry`. */
  onRetry?: () => void;
  /** Less vertical room, for a card body or a list. Defaults to the full-page spacing. */
  compact?: boolean;
};

/**
 * The request failed. Names the problem and offers a retry when the caller can make one. It is announced as an
 * alert. Usually you get it through `DataState` from an error `AsyncState`; render it directly only where there
 * is no async state to switch on. For an empty but successful response use `EmptyState`; in a table, `TableError`.
 *
 * @summary A centered error message with the API's reason and an optional Retry button.
 * @import import { ErrorState } from 'src/components/data';
 */
export function ErrorState({ title, message, onRetry, compact }: ErrorStateProps) {
  const { t } = useTranslation();
  return (
    <Stack
      role="alert"
      spacing={2}
      sx={{ alignItems: 'center', textAlign: 'center', py: compact ? 4 : 8, px: 4, color: 'text.secondary' }}
    >
      <Box sx={{ color: 'error.main', display: 'flex' }}>
        <ErrorIcon size={32} />
      </Box>
      <Typography variant="subtitle1" color="text.primary">
        {title ?? t('data.error.title')}
      </Typography>
      {message ? <Typography variant="body2">{message}</Typography> : null}
      {onRetry ? (
        <Box sx={{ pt: 1 }}>
          <Button variant="outlined" color="inherit" startIcon={<RefreshIcon />} onClick={onRetry}>
            {t('data.retry')}
          </Button>
        </Box>
      ) : null}
    </Stack>
  );
}
