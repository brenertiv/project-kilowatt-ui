import Box from '@mui/material/Box';
import Skeleton from '@mui/material/Skeleton';
import Stack from '@mui/material/Stack';
import { useTranslation } from 'react-i18next';

/**
 * Loading shapes that match the component they stand in for. Widths repeat
 * in a fixed pattern so a skeleton reads as content, not as stripes.
 */

const lineWidths = ['92%', '68%', '80%', '54%', '74%'];

function useBusyProps() {
  const { t } = useTranslation();
  return { role: 'status', 'aria-busy': true, 'aria-label': t('data.loading') } as const;
}

export type CardSkeletonProps = {
  /** Body lines under the title. Match the card's meta rows. Defaults to 3. */
  lines?: number;
  /** Draws a wider title line first. Turn it off when the card's title is already on screen. Defaults to true. */
  title?: boolean;
};

/**
 * Stands in for a card while it loads: a title line and a few body lines, announced as loading. It is the
 * default skeleton of `DataState` and `EntityCard`; pass it yourself only to change `lines` or `title`. For a
 * list use `ListSkeleton`, for a metric `StatSkeleton`, for a table `TableSkeleton`.
 *
 * @summary A loading placeholder shaped like a card: a title line and body lines.
 * @import import { CardSkeleton } from 'src/components/data';
 */
export function CardSkeleton({ lines = 3, title = true }: CardSkeletonProps) {
  const busy = useBusyProps();
  return (
    <Stack spacing={1.5} sx={{ p: 4 }} {...busy}>
      {title ? <Skeleton variant="text" width="45%" sx={{ fontSize: '1.125rem' }} /> : null}
      {Array.from({ length: lines }, (_, index) => (
        <Skeleton key={index} variant="text" width={lineWidths[index % lineWidths.length]} />
      ))}
    </Stack>
  );
}

export type ListSkeletonProps = {
  /** Rows to draw. Match the expected page size. Defaults to 5. */
  rows?: number;
  /** Draws a smaller second line in each row, for lists with secondary text. Defaults to true. */
  secondary?: boolean;
};

/**
 * Stands in for an entity list while it loads, one divided row per expected record, announced as loading.
 * `EntityList` uses it already; pass it as `DataState`'s `skeleton` for a hand-built list.
 *
 * @summary A loading placeholder shaped like a list: divided rows with primary and secondary lines.
 * @import import { ListSkeleton } from 'src/components/data';
 */
export function ListSkeleton({ rows = 5, secondary = true }: ListSkeletonProps) {
  const busy = useBusyProps();
  return (
    <Stack {...busy} sx={{ '& > *': { px: 4, py: 2.5, borderBottom: 1, borderColor: 'divider' } }}>
      {Array.from({ length: rows }, (_, index) => (
        <Box key={index}>
          <Skeleton variant="text" width={lineWidths[(index * 2) % lineWidths.length]} />
          {secondary ? (
            <Skeleton
              variant="text"
              width={lineWidths[(index * 2 + 1) % lineWidths.length]}
              sx={{ fontSize: '0.75rem' }}
            />
          ) : null}
        </Box>
      ))}
    </Stack>
  );
}

/**
 * Stands in for a `StatCard`'s body while it loads: label, value and period lines, announced as loading.
 * `StatCard` uses it already when its `state` is loading; use it directly only for a hand-built metric tile.
 *
 * @summary A loading placeholder shaped like a metric: label, large value and period lines.
 * @import import { StatSkeleton } from 'src/components/data';
 */
export function StatSkeleton() {
  const busy = useBusyProps();
  return (
    <Stack spacing={1} {...busy}>
      <Skeleton variant="text" width="40%" sx={{ fontSize: '0.75rem' }} />
      <Skeleton variant="text" width="60%" sx={{ fontSize: '1.75rem' }} />
      <Skeleton variant="text" width="50%" sx={{ fontSize: '0.75rem' }} />
    </Stack>
  );
}
