import type { ReactNode } from 'react';
import Box from '@mui/material/Box';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';
import { useTranslation } from 'react-i18next';
import { InboxIcon } from '../../icons';

export type EmptyStateProps = {
  title?: ReactNode;
  description?: ReactNode;
  icon?: ReactNode;
  /** A call to action, usually a button. */
  action?: ReactNode;
  /** Less vertical room, for a card body or a list. */
  compact?: boolean;
};

/** The request succeeded and there is nothing in it. Says so, and offers the next step when there is one. */
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
