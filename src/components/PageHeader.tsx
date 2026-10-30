import { useState, type ReactNode } from 'react';
import Box from '@mui/material/Box';
import Fade from '@mui/material/Fade';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';
import { useTheme } from '@mui/material/styles';
import { usePageScroll, usePinned } from './pageScroll';
import { TruncatedText } from './TruncatedText';

export type PageHeaderProps = {
  /** The page's title, as an `h1`, and the condensed line once the header has scrolled away. */
  title: string;
  /** The page's own controls: at the header's right, and at the condensed line's right once it's pinned. Default none. */
  actions?: ReactNode;
  /** The page's filters row (`FilterBar`), which pins under the condensed line. Default none. */
  filters?: ReactNode;
};

/** The condensed line's height, in theme spacing units; the band overlaps the header's foot by it. */
const line = 6;

/**
 * A page's title that shrinks on scroll. The full header scrolls away with the page, and as it goes a
 * one-line condensed title pins at the top of the page, with the page's filters under it. The line and
 * the filters share one sticky band that overlaps the header's foot by the line's height, so the line
 * has room without moving anything, and it shows only once the band is pinned. Neither the page nor the
 * band changes height on scroll, so nothing jumps and the trigger can't flicker. Use it inside `AppShell`,
 * which says what scrolls the page.
 *
 * @summary A page's title that shrinks to one pinned line, with the page's filters under it, as the page scrolls.
 * @import import { PageHeader } from 'src/components/PageHeader';
 */
export function PageHeader({ title, actions, filters }: PageHeaderProps) {
  const theme = useTheme();
  const { top, inset } = usePageScroll();
  const [sentinel, setSentinel] = useState<HTMLElement | null>(null);
  const [lineElement, setLineElement] = useState<HTMLElement | null>(null);
  const pinned = usePinned(sentinel, lineElement);

  return (
    <>
      <Stack direction={{ xs: 'column', sm: 'row' }} sx={{ gap: 2, alignItems: { sm: 'flex-start' }, justifyContent: 'space-between', mb: 3 }}>
        <Typography variant="h3" component="h1" sx={{ minWidth: 0, maxWidth: '65ch' }}>
          {title}
        </Typography>
        {actions && <Stack direction="row" sx={{ gap: 1, flexShrink: 0, flexWrap: 'wrap' }}>{actions}</Stack>}
      </Stack>
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
              <TruncatedText>{title}</TruncatedText>
            </Typography>
            {actions && <Stack direction="row" sx={{ gap: 1, flexShrink: 0 }}>{actions}</Stack>}
          </Stack>
        </Fade>
        {filters && <Box sx={{ pointerEvents: 'auto' }}>{filters}</Box>}
      </Box>
    </>
  );
}
