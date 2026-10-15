import type { ReactNode } from 'react';
import Box from '@mui/material/Box';
import Breadcrumbs from '@mui/material/Breadcrumbs';
import Link from '@mui/material/Link';
import Skeleton from '@mui/material/Skeleton';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';
import { useTranslation } from 'react-i18next';
import { Link as RouterLink } from 'react-router';
import type { AsyncState } from '../../api/state';

/** One step in a `PageHeader`'s breadcrumb trail. */
export type Crumb = {
  /** The step's name, e.g. the portfolio or building. */
  label: ReactNode;
  /** A route path. Makes the step a link; leave it off the current page, the last crumb. */
  to?: string;
};

export type PageHeaderProps = {
  /** The page's name, rendered as the page's one `h1`. */
  title: ReactNode;
  /** Small caps line above the title, e.g. the entity type. */
  eyebrow?: ReactNode;
  /** One or two sentences under the title on what the page is for. */
  description?: ReactNode;
  /** The trail from the top of the app to this page, current page last. Omit or pass an empty array to hide it. */
  breadcrumbs?: Crumb[];
  /** Buttons, right-aligned. Put the page's primary action last. */
  actions?: ReactNode;
  /** Chips or key facts under the title, such as a `StatusChip`. Hidden while loading. */
  meta?: ReactNode;
  /** The async state of the record the page shows. While loading, the title and description are skeletons and meta is hidden; other states render normally. Defaults to ready. */
  state?: AsyncState;
};

/**
 * The top of a page: where you are, what this is, and what you can do. One per view, as the first thing in
 * the page, and it holds the page's only `h1`. For a heading inside a card or section use a `Typography`
 * heading; for a record's summary below the header, use `EntityCard`.
 *
 * @summary The page heading: breadcrumbs, eyebrow, h1 title, description, meta chips and actions.
 * @import import { PageHeader } from 'src/components/data';
 */
export function PageHeader({ title, eyebrow, description, breadcrumbs, actions, meta, state }: PageHeaderProps) {
  const { t } = useTranslation();
  const loading = state?.status === 'loading';
  return (
    <Box component="header" sx={{ mb: 6 }}>
      {breadcrumbs && breadcrumbs.length > 0 ? (
        <Breadcrumbs aria-label={t('data.breadcrumb')} sx={{ mb: 2, fontSize: '0.75rem' }}>
          {breadcrumbs.map((crumb, index) =>
            crumb.to ? (
              <Link key={index} component={RouterLink} to={crumb.to} color="text.secondary">
                {crumb.label}
              </Link>
            ) : (
              <Typography key={index} variant="caption" color="text.primary">
                {crumb.label}
              </Typography>
            ),
          )}
        </Breadcrumbs>
      ) : null}
      <Stack
        direction="row"
        spacing={4}
        useFlexGap
        sx={{ alignItems: 'flex-start', justifyContent: 'space-between', flexWrap: 'wrap' }}
      >
        <Box sx={{ minWidth: 0, flex: '1 1 320px' }}>
          {eyebrow ? (
            <Typography variant="overline" component="p" color="text.secondary">
              {eyebrow}
            </Typography>
          ) : null}
          <Typography variant="h4" component="h1" sx={{ overflowWrap: 'anywhere' }}>
            {loading ? <Skeleton width="40%" /> : title}
          </Typography>
          {description || loading ? (
            <Typography variant="body1" color="text.secondary" sx={{ mt: 1, maxWidth: 720 }}>
              {loading ? <Skeleton width="60%" /> : description}
            </Typography>
          ) : null}
          {meta && !loading ? (
            <Stack direction="row" spacing={2} useFlexGap sx={{ mt: 3, flexWrap: 'wrap', alignItems: 'center' }}>
              {meta}
            </Stack>
          ) : null}
        </Box>
        {actions ? (
          <Stack direction="row" spacing={2} useFlexGap sx={{ flexWrap: 'wrap', flexShrink: 0 }}>
            {actions}
          </Stack>
        ) : null}
      </Stack>
    </Box>
  );
}
