import type { ReactNode } from 'react';
import Alert from '@mui/material/Alert';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import LinearProgress from '@mui/material/LinearProgress';
import Skeleton from '@mui/material/Skeleton';
import Typography from '@mui/material/Typography';
import type { AsyncState } from '../api/state';

export type AsyncContentProps = {
  /** Where the data is in its lifecycle (`AsyncState` from `src/api/state`): `ready` and `fetching` show `children`, every other status shows its own view in their place. */
  state: AsyncState;
  /** What the data draws once it's there: a chart, a number, a table. */
  children: ReactNode;
  /** The height `children` take, in pixels, inset included, held by every state so the card doesn't jump as the data arrives. Default none: each state takes its own height. */
  height?: number;
  /** The padding at the sides and bottom of every state but `ready` and `fetching`, in theme spacing units, so a state lines up with what it stands in for: `2` (16px) under a chart, which pads itself the same (`inset`); `0` inside `CardContent`, which already pads. Default `2`. */
  inset?: 0 | 1 | 2;
  /** What the loading bar and skeleton are waiting for, for screen readers: "Loading energy use". Default `'Loading'`. */
  loadingLabel?: string;
  /** What the empty state says: what has no data, in a sentence. Default `'No data for this period.'`. */
  emptyText?: string;
  /** What the idle state says: what to do before there's anything to show. Default `'Choose what to show.'`. */
  idleText?: string;
};

/**
 * The view of every `AsyncState` in the space the data will take. `loading` shows a `Skeleton`;
 * `fetching` keeps the data on screen under a thin `LinearProgress`, with `children` still mounted,
 * so focus, scroll position and charts survive a refetch; `empty` and `idle` say why there's nothing to show; `error` shows an `Alert` with the message and a Retry button when the state has
 * `onRetry`; `forbidden` shows an `Alert` saying the account doesn't include the data. Each state
 * holds `height` and pads itself by `inset`, like a chart, so a card keeps its size and alignment from loading
 * to loaded. Changes are announced politely.
 *
 * @summary Shows loading, empty, error and no-access states for data, in the space the data will take.
 * @import import { AsyncContent } from 'src/components/AsyncContent';
 */
export function AsyncContent({
  state,
  children,
  height,
  inset = 2,
  loadingLabel = 'Loading',
  emptyText = 'No data for this period.',
  idleText = 'Choose what to show.',
}: AsyncContentProps) {
  const { status, error, onRetry } = state;
  const busy = status === 'loading' || status === 'fetching';
  // Every state but the data's own sits in the data's space: its height, and the inset a chart pads itself with.
  const space = (content: ReactNode) => (
    <Box sx={{ minHeight: height, px: inset, pb: inset, boxSizing: 'border-box', display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
      {content}
    </Box>
  );
  const message = (text: string) =>
    space(
      <Typography variant="body2" sx={{ color: 'text.secondary', maxWidth: '60ch', mx: 'auto', textAlign: 'center' }}>
        {text}
      </Typography>,
    );
  const alert = (severity: 'error' | 'info', text: string, retry?: () => void) =>
    space(
      <Alert
        severity={severity}
        action={
          retry && (
            <Button color="inherit" onClick={retry}>
              Retry
            </Button>
          )
        }
      >
        {text}
      </Alert>,
    );

  let view: ReactNode;
  switch (status) {
    case 'loading':
      view = space(<Skeleton variant="rounded" role="progressbar" aria-label={loadingLabel} sx={{ flex: 1, height: 'auto', minHeight: 120 }} />);
      break;
    case 'empty':
      view = message(emptyText);
      break;
    case 'idle':
      view = message(idleText);
      break;
    case 'error':
      view = alert('error', error ?? 'Something went wrong.', onRetry);
      break;
    case 'forbidden':
      view = alert('info', error ?? 'You don’t have access to this data.');
      break;
    default:
      view = children;
  }

  // `ready` and `fetching` share this tree, so `children` stay mounted when only the bar comes and goes.
  return (
    <Box aria-live="polite" aria-busy={busy} sx={{ position: 'relative' }}>
      {status === 'fetching' && <LinearProgress aria-label={loadingLabel} sx={{ position: 'absolute', top: 0, left: 0, right: 0 }} />}
      {view}
    </Box>
  );
}
