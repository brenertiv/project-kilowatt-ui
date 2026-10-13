import type { ReactNode } from 'react';
import Box from '@mui/material/Box';
import Breadcrumbs from '@mui/material/Breadcrumbs';
import Link from '@mui/material/Link';
import Skeleton from '@mui/material/Skeleton';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';
import { Link as RouterLink } from 'react-router';
import type { AsyncState } from '../../api/state';

export type Crumb = { label: ReactNode; to?: string };

export type PageHeaderProps = {
  title: ReactNode;
  /** Small caps line above the title, e.g. the entity type. */
  eyebrow?: ReactNode;
  description?: ReactNode;
  breadcrumbs?: Crumb[];
  /** Buttons, right-aligned. */
  actions?: ReactNode;
  /** Chips or key facts under the title. */
  meta?: ReactNode;
  /** While loading, the title and description are skeletons. */
  state?: AsyncState;
};

/** The top of a page: where you are, what this is, and what you can do. One per view. */
export function PageHeader({ title, eyebrow, description, breadcrumbs, actions, meta, state }: PageHeaderProps) {
  const loading = state?.status === 'loading';
  return (
    <Box component="header" sx={{ mb: 6 }}>
      {breadcrumbs && breadcrumbs.length > 0 ? (
        <Breadcrumbs aria-label="Breadcrumb" sx={{ mb: 2, fontSize: '0.75rem' }}>
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
