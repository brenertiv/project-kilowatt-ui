import type { ReactNode } from 'react';
import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import CardActions from '@mui/material/CardActions';
import CardContent from '@mui/material/CardContent';
import Link from '@mui/material/Link';
import Stack from '@mui/material/Stack';
import Tooltip from '@mui/material/Tooltip';
import Typography from '@mui/material/Typography';
import { useTranslation } from 'react-i18next';
import { Link as RouterLink } from 'react-router';
import type { AsyncState } from '../../api/state';
import { InfoIcon } from '../../icons';
import { DataState } from './DataState';
import { CardSkeleton } from './Skeletons';
import { displayName } from './placeholder';

export type EntityMeta = { label: ReactNode; value: ReactNode };

export type EntityCardProps = {
  /** The record's name. Placeholder names such as `???` are replaced with "Unnamed {noun}". */
  title: string | null | undefined;
  /** What the record is, for the fallback name: "meter", "work order". */
  noun: string;
  subtitle?: ReactNode;
  /** A status chip or two, beside the title. */
  status?: ReactNode;
  /** Label and value pairs under the title. */
  meta?: EntityMeta[];
  actions?: ReactNode;
  /** Makes the title a link. */
  to?: string;
  state?: AsyncState;
  children?: ReactNode;
};

/** The name of a record and what you need to know about it, in one card. */
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
            spacing={2}
            useFlexGap
            sx={{ alignItems: 'flex-start', justifyContent: 'space-between', flexWrap: 'wrap' }}
          >
            <Box sx={{ minWidth: 0, flex: '1 1 200px' }}>
              <Stack direction="row" spacing={1} sx={{ alignItems: 'center' }}>
                {heading}
                {name.placeholder ? (
                  <Tooltip title={t('data.placeholderHint', { value: name.raw ?? '∅' })}>
                    <Box
                      component="span"
                      sx={{ display: 'inline-flex', color: 'text.disabled' }}
                      tabIndex={0}
                      aria-label={t('data.placeholderHint', { value: name.raw ?? '∅' })}
                    >
                      <InfoIcon />
                    </Box>
                  </Tooltip>
                ) : null}
              </Stack>
              {subtitle ? (
                <Typography variant="body2" color="text.secondary" sx={{ overflowWrap: 'anywhere' }}>
                  {subtitle}
                </Typography>
              ) : null}
            </Box>
            {status ? (
              <Stack direction="row" spacing={1} useFlexGap sx={{ flexWrap: 'wrap' }}>
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
                columnGap: 4,
                rowGap: 1.5,
                m: 0,
                mt: 3,
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
        {actions ? <CardActions sx={{ px: 4, pb: 3, pt: 0 }}>{actions}</CardActions> : null}
      </DataState>
    </Card>
  );
}
