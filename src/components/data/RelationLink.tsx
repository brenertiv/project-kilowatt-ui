import type { ReactNode } from 'react';
import Box from '@mui/material/Box';
import Link from '@mui/material/Link';
import Tooltip from '@mui/material/Tooltip';
import { useTranslation } from 'react-i18next';
import { Link as RouterLink } from 'react-router';
import { isExpanded, type Expandable } from '../../api/types';
import { noValue } from './dateFormat';
import { shortId } from './placeholder';

export type RelationLinkProps<T extends { id: string | number }> = {
  /** The relation as the API returned it: a bare id or the expanded record. */
  value: Expandable<T> | null | undefined;
  /** The text for an expanded record. */
  label: (record: T) => ReactNode;
  /** Where the record lives. Without it the relation is plain text. */
  to?: (id: T['id']) => string;
};

/**
 * A relation that renders either way the API sends it. Expanded records show
 * their name; bare ids show a short id in mono with the full id on hover, so a
 * request that skipped `expand` still yields something you can click.
 */
export function RelationLink<T extends { id: string | number }>({ value, label, to }: RelationLinkProps<T>) {
  const { t } = useTranslation();
  if (value === null || value === undefined) return <>{noValue}</>;
  const id = isExpanded(value) ? value.id : value;
  const text = isExpanded(value) ? (
    label(value)
  ) : (
    <Tooltip title={t('data.bareIdHint', { id: String(id) })}>
      <Box
        component="span"
        sx={{ fontFamily: 'var(--font-mono)', fontSize: '0.75rem' }}
        aria-label={t('data.bareId', { id: String(id) })}
      >
        {shortId(id)}
      </Box>
    </Tooltip>
  );
  if (!to) return <>{text}</>;
  return (
    <Link component={RouterLink} to={to(id)} color={isExpanded(value) ? 'primary' : 'text.secondary'}>
      {text}
    </Link>
  );
}
