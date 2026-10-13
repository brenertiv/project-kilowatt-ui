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

export function CardSkeleton({ lines = 3, title = true }: { lines?: number; title?: boolean }) {
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

export function ListSkeleton({ rows = 5, secondary = true }: { rows?: number; secondary?: boolean }) {
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
