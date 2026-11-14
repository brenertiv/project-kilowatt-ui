import { useState, type ReactNode } from 'react';
import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import Fade from '@mui/material/Fade';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';
import { useTheme } from '@mui/material/styles';
import { Icon } from '../icons';
import { usePageScroll, usePinned } from './pageScroll';
import { TruncatedText } from './TruncatedText';

/** The property a page at property scope is about, as its header shows it. */
export type PageHeaderProperty = {
  /** The property's name. */
  name: string;
  /** The property's address, after its name. */
  details: string;
  /** The property's photo, as an image URL. Without one the bar shows the building icon. Default none. */
  photo?: string;
};

export type PageHeaderProps = {
  /** The page's title, as an `h1`, and the condensed line once the header has scrolled away. */
  title: string;
  /** The title's type style: `'h3'` for a page, `'brand'` for a report, which sets the serif at `h1`'s size (`h2`'s below `sm`). The condensed line is the same either way. Default `'h3'`. */
  titleVariant?: 'h3' | 'brand';
  /** The page's own controls: at the header's right, and at the condensed line's right once it's pinned. Default none. */
  actions?: ReactNode;
  /** The page's filters row (`FilterBar`), which pins under the condensed line. Default none. */
  filters?: ReactNode;
  /** A report's description, under the title, in `body1` and `text.secondary`. Default none. */
  description?: ReactNode;
  /** At property scope, the property the page is about: one outlined bar under the title with its photo, name and address, and in the condensed line "Title — Property · address". Default none. */
  property?: PageHeaderProperty;
  /** A report's or dashboard's byline (its author, date and scope as a chip or a line), under the header; it scrolls away with it. Default none. */
  byline?: ReactNode;
  /** A node on the title's line, after the title, such as the page's AI summary chip; it scrolls away with the title. Default none. */
  summary?: ReactNode;
};

/** The condensed line's height, in theme spacing units; the band overlaps the header's foot by it. */
const line = 6;

/**
 * The property bar: one outlined card under the title with the property's photo, its name and, quieter, its address.
 * The photo is decorative, since the name is beside it; without one the frame holds the building icon.
 */
function PropertyBar({ property }: { property: PageHeaderProperty }) {
  const theme = useTheme();
  const frame = { width: theme.spacing(5), flexShrink: 0, aspectRatio: '1', borderRadius: 1 } as const;
  return (
    <Card variant="outlined" sx={{ mb: 3 }}>
      <Stack direction="row" sx={{ gap: 2, alignItems: 'center', p: 1.5 }}>
        {property.photo ? (
          <Box component="img" src={property.photo} alt="" sx={{ ...frame, objectFit: 'cover', display: 'block' }} />
        ) : (
          <Box sx={{ ...frame, bgcolor: 'background.level2', color: 'text.secondary', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Icon name="apartment" />
          </Box>
        )}
        <Typography variant="subtitle1" component="p" sx={{ minWidth: 0 }}>
          {property.name}{' '}
          <Box component="span" sx={{ color: 'text.secondary', fontWeight: 'fontWeightRegular' }}>
            {property.details}
          </Box>
        </Typography>
      </Stack>
    </Card>
  );
}

/**
 * A page's title that shrinks on scroll. The full header scrolls away with the page, and as it goes a
 * one-line condensed title pins at the top of the page, with the page's filters under it. The line and
 * the filters share one sticky band that overlaps the header's foot by the line's height, so the line
 * has room without moving anything, and it shows only once the band is pinned. Neither the page nor the
 * band changes height on scroll, so nothing jumps and the trigger can't flicker. A `summary` sits on the
 * title's line, a `description` under it, and at property scope a `property` bar and a `byline` under
 * the header; all of them scroll away with it. Use it inside `AppShell`, which says what scrolls the page.
 *
 * @summary A page's title that shrinks to one pinned line, with the page's filters under it, as the page scrolls.
 * @import import { PageHeader } from 'src/components/PageHeader';
 */
export function PageHeader({ title, titleVariant = 'h3', actions, filters, description, property, byline, summary }: PageHeaderProps) {
  const theme = useTheme();
  const { top, inset } = usePageScroll();
  const [sentinel, setSentinel] = useState<HTMLElement | null>(null);
  const [lineElement, setLineElement] = useState<HTMLElement | null>(null);
  const pinned = usePinned(sentinel, lineElement);
  // A report's title: the brand serif a step under its own size, at the theme's `h1` size, and `h2`'s on a phone.
  const titleSize = titleVariant === 'brand' ? { fontSize: { xs: theme.typography.h2.fontSize, sm: theme.typography.h1.fontSize } } : {};
  // At property scope the condensed line reads "Page title — Property name · address".
  const condensed = property ? `${title} — ${property.name} · ${property.details}` : title;

  return (
    <>
      <Stack direction={{ xs: 'column', sm: 'row' }} sx={{ gap: 2, alignItems: { sm: 'flex-start' }, justifyContent: 'space-between', mb: 3 }}>
        <Box sx={{ minWidth: 0, maxWidth: '65ch' }}>
          {summary ? (
            // The summary sits on the title's line, centred on it, and widens into the space after it.
            <Stack direction="row" sx={{ gap: 1, alignItems: 'center', mb: description ? 1 : 0 }}>
              <Typography variant={titleVariant} component="h1" sx={{ minWidth: 0, ...titleSize }}>
                {title}
              </Typography>
              {summary}
            </Stack>
          ) : (
            <Typography variant={titleVariant} component="h1" gutterBottom={Boolean(description)} sx={titleSize}>
              {title}
            </Typography>
          )}
          {description && (
            <Typography variant="body1" color="text.secondary" component="div">
              {description}
            </Typography>
          )}
        </Box>
        {actions && <Stack direction="row" sx={{ gap: 1, flexShrink: 0, flexWrap: 'wrap' }}>{actions}</Stack>}
      </Stack>
      {property && <PropertyBar property={property} />}
      {byline && <Box sx={{ mt: -1.5, mb: 3 }}>{byline}</Box>}
      <Box ref={setSentinel} />
      <Box
        sx={{
          position: 'sticky',
          // Until it's pinned the band sits a line higher, so the line stays above the edge, where nothing shows.
          top: pinned ? top : `calc(${top} - ${theme.spacing(line)})`,
          zIndex: 'appBar',
          mt: -line,
          mx: -inset,
          px: inset,
          // The band covers the header's foot only once it's pinned; until then clicks reach the header under it.
          pointerEvents: pinned ? 'auto' : 'none',
          bgcolor: pinned ? 'background.level2' : 'transparent',
          borderBottom: pinned ? 1 : 0,
          borderColor: 'divider',
        }}
      >
        <Fade in={pinned}>
          <Stack ref={setLineElement} direction="row" sx={{ height: (t) => t.spacing(line), gap: 1, alignItems: 'center' }}>
            <Typography variant="subtitle1" component="p" sx={{ flex: 1, minWidth: 0 }}>
              <TruncatedText>{condensed}</TruncatedText>
            </Typography>
            {actions && <Stack direction="row" sx={{ gap: 1, flexShrink: 0 }}>{actions}</Stack>}
          </Stack>
        </Fade>
        {filters && <Box sx={{ pointerEvents: 'auto' }}>{filters}</Box>}
      </Box>
    </>
  );
}
