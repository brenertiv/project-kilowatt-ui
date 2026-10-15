import type { ReactNode } from 'react';
import Box from '@mui/material/Box';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';
import { useTranslation } from 'react-i18next';
import { InboxIcon } from '../../icons';

export type EmptyStateProps = {
  /** What is missing, e.g. "No alerts". Defaults to "Nothing here yet". */
  title?: ReactNode;
  /** One sentence on why it is empty or what would fill it. Omitted when not set. */
  description?: ReactNode;
  /** A 32px icon from `src/icons.tsx` that names the subject. Defaults to the inbox icon. */
  icon?: ReactNode;
  /** A call to action, usually a button, for when the user can fix the emptiness (add, clear filters). */
  action?: ReactNode;
  /** Less vertical room, for a card body or a list. Defaults to the full-page spacing. */
  compact?: boolean;
};

/**
 * The request succeeded and there is nothing in it. Says so, and offers the next step when there is one.
 * Usually you get it through `DataState` (or the `empty` prop of `EntityList`); render it directly only where
 * there is no async state to switch on. For a failed request use `ErrorState`; for an empty table, `TableEmptyRow`.
 *
 * @summary A centered "nothing here" message with an icon, optional description and call to action.
 * @import import { EmptyState } from 'src/components/data';
 */
export function EmptyState({ title, description, icon, action, compact }: EmptyStateProps) {
  const { t } = useTranslation();
  return (
    <Stack
      role="status"
      spacing={2}
      sx={{ alignItems: 'center', textAlign: 'center', py: compact ? 4 : 8, px: 4, color: 'text.secondary' }}
    >
      <Box sx={{ color: 'text.disabled', display: 'flex' }}>{icon ?? <InboxIcon size={32} />}</Box>
      <Typography variant="subtitle1" color="text.primary">
        {title ?? t('data.empty.title')}
      </Typography>
      {description ? <Typography variant="body2">{description}</Typography> : null}
      {action ? <Box sx={{ pt: 1 }}>{action}</Box> : null}
    </Stack>
  );
}
