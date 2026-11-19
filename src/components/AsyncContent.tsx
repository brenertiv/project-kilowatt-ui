import { createContext, useCallback, useContext, useEffect, useState, type ReactNode } from 'react';
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

/** How long a load runs, in milliseconds, before it says it is still loading: 3 seconds. */
export const stillLoadingAfter = 3000;

/**
 * True once a load has run past `stillLoadingAfter`, and false again when it ends. `AsyncContent` uses it; a
 * loading region of your own (a skeleton in the content's shape) can use it to say the same line.
 *
 * @summary True once a load has run past 3 seconds.
 * @import import { useStillLoading } from 'src/components/AsyncContent';
 */
export function useStillLoading(loading: boolean): boolean {
  const [slow, setSlow] = useState(false);
  // A load that starts or ends is no longer slow: state that follows a prop, set while rendering.
  const [was, setWas] = useState(loading);
  if (was !== loading) {
    setWas(loading);
    setSlow(false);
  }
  useEffect(() => {
    if (!loading) return undefined;
    const timer = setTimeout(() => setSlow(true), stillLoadingAfter);
    return () => clearTimeout(timer);
  }, [loading]);
  return loading && slow;
}

/**
 * What a still-loading line says: the loading label's words after "Still", with no time given.
 * "Loading energy use" gives "Still loading energy use.".
 *
 * @summary The still-loading line for a loading label.
 * @import import { stillLoadingText } from 'src/components/AsyncContent';
 */
export const stillLoadingText = (loadingLabel: string) => `Still ${loadingLabel.charAt(0).toLowerCase()}${loadingLabel.slice(1)}.`;

/**
 * The mail link Email Support opens, given when the error came: the app provides it once, prefilled with what its
 * support needs (the page, the scope, the time of the error). Kilowatt holds no address, so without a provider
 * there is no Email Support. Default none.
 *
 * @summary The app's support mail link, for the Email Support action after a second failed retry.
 * @import import { SupportLink } from 'src/components/AsyncContent';
 */
export const SupportLink = createContext<((failedAt: Date) => string) | undefined>(undefined);

/**
 * Counts the Retry presses since the last load that worked. After a second failed retry `repeated` is true, and
 * `supportHref` is the `SupportLink` provider's mail link for when the error came, where there is a provider.
 * `retry` wraps `onRetry` so the presses are counted; it is undefined without `onRetry`.
 *
 * @summary Tells when an error has outlasted two retries, and gives the Email Support link.
 * @import import { useRepeatedFailure } from 'src/components/AsyncContent';
 */
export function useRepeatedFailure(status: AsyncState['status'], onRetry?: () => void) {
  const [retries, setRetries] = useState(0);
  const [failedAt, setFailedAt] = useState<Date>();
  const support = useContext(SupportLink);
  // The count and the error's time follow the status: set while rendering, when it changes.
  const [seen, setSeen] = useState<AsyncState['status']>();
  if (seen !== status) {
    setSeen(status);
    if (status === 'error') setFailedAt(new Date());
    else if (status !== 'loading' && status !== 'fetching') setRetries(0);
  }
  const retry = useCallback(() => {
    setRetries((n) => n + 1);
    onRetry?.();
  }, [onRetry]);
  const repeated = status === 'error' && retries >= 2;
  return { retry: onRetry ? retry : undefined, repeated, supportHref: repeated && support ? support(failedAt ?? new Date()) : undefined };
}

/**
 * The view of every `AsyncState` in the space the data will take. `loading` shows a `Skeleton`;
 * `fetching` keeps the data on screen under a thin `LinearProgress`, with `children` still mounted,
 * so focus, scroll position and charts survive a refetch; `empty` and `idle` say why there's nothing to show; `error` shows an `Alert` with the message and a Retry button when the state has
 * `onRetry`; `forbidden` shows an `Alert` saying the account doesn't include the data. Each state
 * holds `height` and pads itself by `inset`, like a chart, so a card keeps its size and alignment from loading
 * to loaded. A load past 3 seconds says "Still loading …" under the skeleton, with no time given; after a second
 * failed retry the error says so and adds Email Support, where the app provides a `SupportLink`. Changes are
 * announced politely.
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
  const slow = useStillLoading(status === 'loading');
  const failure = useRepeatedFailure(status, onRetry);
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
  const alert = (severity: 'error' | 'info', text: string, retry?: () => void, supportHref?: string) =>
    space(
      <Alert
        severity={severity}
        action={
          (retry || supportHref) && (
            <>
              {retry && (
                <Button color="inherit" onClick={retry}>
                  Retry
                </Button>
              )}
              {supportHref && (
                <Button color="inherit" href={supportHref}>
                  Email Support
                </Button>
              )}
            </>
          )
        }
      >
        {text}
      </Alert>,
    );

  let view: ReactNode;
  switch (status) {
    case 'loading':
      view = space(
        <>
          <Skeleton variant="rounded" role="progressbar" aria-label={loadingLabel} sx={{ flex: 1, height: 'auto', minHeight: 120 }} />
          {slow && (
            <Typography variant="body2" sx={{ color: 'text.secondary', pt: 1, textAlign: 'center' }}>
              {stillLoadingText(loadingLabel)}
            </Typography>
          )}
        </>,
      );
      break;
    case 'empty':
      view = message(emptyText);
      break;
    case 'idle':
      view = message(idleText);
      break;
    case 'error':
      view = alert('error', `${error ?? 'Something went wrong.'}${failure.repeated ? ' It failed again after two retries.' : ''}`, failure.retry, failure.supportHref);
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
