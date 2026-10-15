import Button from '@mui/material/Button';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';
import { useTranslation } from 'react-i18next';
import type { AsyncState } from '../../api/state';
import type { CursorPage } from '../../api/types';
import { ChevronLeftIcon, ChevronRightIcon } from '../../icons';
import { cursorFromUrl } from './cursor';

export type CursorPaginationProps = {
  /** The current list response, `{ next, previous, results }`. `undefined` before the first page arrives: both buttons are disabled and the count reads "No {noun} on this page". */
  page: CursorPage<unknown> | undefined;
  /** Plural noun for the count: "meters", "work orders". */
  noun: string;
  /** Receives the cursor read out of `page.previous` or `page.next` when a button is pressed. Put it in `ListParams.cursor`; `undefined` means the first page. */
  onCursor: (cursor: string | undefined) => void;
  /** The async state of the list. While loading or fetching both buttons are disabled, so a second click cannot skip a page. Defaults to ready. */
  state?: AsyncState;
};

/**
 * Previous and next over a cursor-paged list. The API gives no total and no
 * page number, so this says what is on the page and where it can go. Put it
 * under an `EntityList` or a list card fed by `useEntityList`; `DataTable` in
 * server mode has its own paging.
 *
 * @summary Previous and next buttons over a cursor-paged API list, with an on-page count.
 * @import import { CursorPagination } from 'src/components/data';
 */
export function CursorPagination({ page, noun, onCursor, state }: CursorPaginationProps) {
  const { t } = useTranslation();
  const previous = cursorFromUrl(page?.previous);
  const next = cursorFromUrl(page?.next);
  const busy = state?.status === 'loading' || state?.status === 'fetching';
  const count = page?.results.length ?? 0;
  const hasPrevious = Boolean(page?.previous);

  return (
    <Stack
      component="nav"
      aria-label={t('data.pagination')}
      direction="row"
      spacing={2}
      sx={{ alignItems: 'center', justifyContent: 'space-between', mt: 4 }}
    >
      <Typography variant="body2" color="text.secondary" aria-live="polite">
        {count === 0 ? t('data.showingNone', { noun }) : t('data.showing', { count, noun })}
      </Typography>
      <Stack direction="row" spacing={2}>
        <Button
          variant="outlined"
          color="inherit"
          size="small"
          startIcon={<ChevronLeftIcon />}
          disabled={!hasPrevious || busy}
          onClick={() => onCursor(previous)}
        >
          {t('data.previous')}
        </Button>
        <Button
          variant="outlined"
          color="inherit"
          size="small"
          endIcon={<ChevronRightIcon />}
          disabled={!next || busy}
          onClick={() => onCursor(next)}
        >
          {t('data.next')}
        </Button>
      </Stack>
    </Stack>
  );
}
