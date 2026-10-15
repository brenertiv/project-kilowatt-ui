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
  /** The relation as the API returned it: a bare id or the expanded record. `null` or `undefined` shows the no-value dash. */
  value: Expandable<T> | null | undefined;
  /** The text for an expanded record, e.g. `(location) => location.name`. Not called for a bare id. */
  label: (record: T) => ReactNode;
  /** Builds the route for the record's id. Without it the relation is plain text. Bare ids link in the secondary text color, expanded records in the primary color. */
  to?: (id: T['id']) => string;
};

/**
 * A relation that renders either way the API sends it. Expanded records show
 * their name; bare ids show a short id in mono with the full id on hover, so a
 * request that skipped `expand` still yields something you can click. Use it
 * for every relation field (`location`, `meter`, `client`); never assume the
 * request expanded it. For the record's own name, use `EntityName`.
 *
 * @summary A relation as a link: the record's name when expanded, a short mono id when bare.
 * @import import { RelationLink } from 'src/components/data';
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
