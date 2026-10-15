import type { ReactNode } from 'react';
import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import CardActions from '@mui/material/CardActions';
import CardContent from '@mui/material/CardContent';
import Link from '@mui/material/Link';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';
import { useTranslation } from 'react-i18next';
import { Link as RouterLink } from 'react-router';
import type { AsyncState } from '../../api/state';
import { DataState } from './DataState';
import { PlaceholderHint } from './EntityName';
import { CardSkeleton } from './Skeletons';
import { displayName } from './placeholder';

/** One label and value pair in an `EntityCard`, rendered as a description list row. */
export type EntityMeta = {
  /** The field name, e.g. "Due". */
  label: ReactNode;
  /** The field value. Use `DateText`, `RelationLink` or `StatusChip` for API values rather than raw strings. */
  value: ReactNode;
};

export type EntityCardProps = {
  /** The record's name. Placeholder names such as `???` or `0` are replaced with "Unnamed {noun}", shown in italics with a hint naming the raw value. */
  title: string | null | undefined;
  /** What the record is, for the fallback name: "meter", "work order". */
  noun: string;
  /** A secondary line under the title, such as the description or the parent building. */
  subtitle?: ReactNode;
  /** A status chip or two, beside the title. Use `StatusChip` or its wrappers. */
  status?: ReactNode;
  /** Label and value pairs under the title, as a description list. The loading skeleton draws one line per entry. */
  meta?: EntityMeta[];
  /** Buttons along the bottom of the card. */
  actions?: ReactNode;
  /** A route path. Makes the title a link to the record's page. */
  to?: string;
  /** The async state of the record. Loading shows a card skeleton, fetching dims the card, error shows a retry. Defaults to ready. */
  state?: AsyncState;
  /** Extra content below the meta list, inside the card body. */
  children?: ReactNode;
};

/**
 * The name of a record and what you need to know about it, in one card: title, subtitle, status chips,
 * label and value pairs and actions. Use it for a single record on a detail page or a small grid of records.
 * For many records use `EntityList` or `DataTable`; for one headline number use `StatCard`; for a name inline
 * in text use `EntityName`.
 *
 * @summary A card for one record: placeholder-safe title, status chips, label/value pairs and actions.
 * @import import { EntityCard } from 'src/components/data';
 */
export function EntityCard({ title, noun, subtitle, status, meta, actions, to, state, children }: EntityCardProps) {
  const { t } = useTranslation();
  const name = displayName(title, t('data.unnamed', { noun }));
  const heading = (
    <Typography
      variant="h6"
      component="h3"
      sx={{
        overflowWrap: 'anywhere',
        color: name.placeholder ? 'text.secondary' : 'text.primary',
        fontStyle: name.placeholder ? 'italic' : 'normal',
      }}
    >
      {to ? (
        <Link component={RouterLink} to={to} color="inherit">
          {name.text}
        </Link>
      ) : (
        name.text
      )}
    </Typography>
  );

  return (
    <Card>
      <DataState state={state ?? { status: 'ready' }} skeleton={<CardSkeleton lines={meta?.length ?? 2} />}>
        <CardContent>
          <Stack
            direction="row"
            spacing={1}
            useFlexGap
            sx={{ alignItems: 'flex-start', justifyContent: 'space-between', flexWrap: 'wrap' }}
          >
            <Box sx={{ minWidth: 0, flex: '1 1 200px' }}>
              <Stack direction="row" spacing={0.5} sx={{ alignItems: 'center' }}>
                {heading}
                {name.placeholder ? (
                  <PlaceholderHint hint={t('data.placeholderHint', { value: name.raw ?? '∅' })} />
                ) : null}
              </Stack>
              {subtitle ? (
                <Typography variant="body2" color="text.secondary" sx={{ overflowWrap: 'anywhere' }}>
                  {subtitle}
                </Typography>
              ) : null}
            </Box>
            {status ? (
              <Stack direction="row" spacing={0.5} useFlexGap sx={{ flexWrap: 'wrap' }}>
                {status}
              </Stack>
            ) : null}
          </Stack>
          {meta && meta.length > 0 ? (
            <Box
              component="dl"
              sx={{
                display: 'grid',
                gridTemplateColumns: 'minmax(96px, max-content) 1fr',
                columnGap: 2,
                rowGap: 0.75,
                m: 0,
                mt: 1.5,
              }}
            >
              {meta.map((item, index) => (
                <Box key={index} sx={{ display: 'contents' }}>
                  <Typography component="dt" variant="body2" color="text.secondary">
                    {item.label}
                  </Typography>
                  <Typography component="dd" variant="body2" sx={{ m: 0, overflowWrap: 'anywhere' }}>
                    {item.value}
                  </Typography>
                </Box>
              ))}
            </Box>
          ) : null}
          {children}
        </CardContent>
        {actions ? <CardActions sx={{ px: 2, pb: 1.5, pt: 0 }}>{actions}</CardActions> : null}
      </DataState>
    </Card>
  );
}
