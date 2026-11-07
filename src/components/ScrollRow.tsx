import { useEffect, useState, type ReactNode } from 'react';
import Box from '@mui/material/Box';
import IconButton from '@mui/material/IconButton';
import Stack from '@mui/material/Stack';
import { Icon } from 'src/icons';

/** Where a row stands, from `useScrollRow`: pass it to `ScrollRow` and `ScrollArrows`. */
export type ScrollRowState = {
  /** Attaches the list; `ScrollRow` passes it as the list's `ref`. */
  attach: (element: HTMLElement | null) => void;
  /** Whether the row is wider than its view, so the arrows have a job. */
  overflows: boolean;
  /** Whether the row is scrolled to its start, so Back has nowhere to go. */
  atStart: boolean;
  /** Whether the row is scrolled to its end, so Forward has nowhere to go. */
  atEnd: boolean;
  /** Moves the row one view less the gap, back (`-1`) or forward (`1`). */
  scroll: (direction: -1 | 1) => void;
};

type Ends = Pick<ScrollRowState, 'overflows' | 'atStart' | 'atEnd'>;

/**
 * Watches a row that scrolls sideways and says which way it can still go. It measures on mount, on
 * every scroll, when the row's box resizes and when its cards change, so the arrows follow the window,
 * a docked panel and a card being added.
 *
 * @summary The state a sideways-scrolling row and its arrows share.
 * @import import { useScrollRow } from 'src/components/ScrollRow';
 */
export function useScrollRow(): ScrollRowState {
  const [element, attach] = useState<HTMLElement | null>(null);
  const [ends, setEnds] = useState<Ends>({ overflows: false, atStart: true, atEnd: true });
  useEffect(() => {
    if (!element) return;
    const measure = () => {
      const max = element.scrollWidth - element.clientWidth;
      const next = { overflows: max > 1, atStart: element.scrollLeft <= 1, atEnd: element.scrollLeft >= max - 1 };
      setEnds((prev) => (prev.overflows === next.overflows && prev.atStart === next.atStart && prev.atEnd === next.atEnd ? prev : next));
    };
    element.addEventListener('scroll', measure, { passive: true });
    // A ResizeObserver reports once when it starts observing, so this also measures on mount; the MutationObserver
    // catches cards being added or removed, which change the row's scroll width but not its box.
    const resize = new ResizeObserver(measure);
    resize.observe(element);
    const mutation = new MutationObserver(measure);
    mutation.observe(element, { childList: true });
    return () => {
      element.removeEventListener('scroll', measure);
      resize.disconnect();
      mutation.disconnect();
    };
  }, [element]);
  const scroll = (direction: -1 | 1) => {
    if (!element) return;
    // One view's width less the row's gap (read from the element, since the theme's spacing is a CSS variable), so the
    // card cut off at the edge leads the next view; at once under reduced motion.
    const gap = parseFloat(getComputedStyle(element).columnGap) || 0;
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    element.scrollBy({ left: direction * (element.clientWidth - gap), behavior: reduced ? 'auto' : 'smooth' });
  };
  return { attach, ...ends, scroll };
}

export type ScrollArrowsProps = {
  /** The row's state, from `useScrollRow`. */
  row: ScrollRowState;
  /** The row's name, as its title reads: the group is named "Scroll" and this ("Scroll Recent Reports"). */
  label: string;
};

/**
 * A sideways-scrolling row's Back and Forward arrows, for the row's header. As MUI `Tabs`'
 * `scrollButtons="auto"`, they show only while the row overflows, and each is disabled at its end.
 *
 * @summary The Back and Forward arrows in a scrolling row's header, shown only while it overflows.
 * @import import { ScrollArrows } from 'src/components/ScrollRow';
 */
export function ScrollArrows({ row, label }: ScrollArrowsProps) {
  if (!row.overflows) return null;
  return (
    <Stack direction="row" role="group" aria-label={`Scroll ${label}`}>
      <IconButton aria-label="Back" onClick={() => row.scroll(-1)} disabled={row.atStart}>
        <Icon name="chevron_left" />
      </IconButton>
      <IconButton aria-label="Forward" onClick={() => row.scroll(1)} disabled={row.atEnd}>
        <Icon name="chevron_right" />
      </IconButton>
    </Stack>
  );
}

export type ScrollRowProps = {
  /** The row's state, from `useScrollRow`. */
  row: ScrollRowState;
  /** The list's accessible name, usually the row's title. */
  label: string;
  /** The cells: one `ScrollRowItem` per card. */
  children: ReactNode;
};

/**
 * A row of cards that scrolls sideways, with arrows in its header (`ScrollArrows`). The list is a
 * named `ul` that snaps to a card, with a 16px gap; wheel, trackpad, touch and keyboard scroll it as
 * any overflowing box. Its state comes from `useScrollRow`, which the arrows share.
 *
 * @summary A row of fixed-width cards that scrolls sideways, with Back and Forward arrows in its header.
 * @import import { ScrollArrows, ScrollRow, ScrollRowItem, useScrollRow } from 'src/components/ScrollRow';
 */
export function ScrollRow({ row: { attach }, label, children }: ScrollRowProps) {
  return (
    <Stack
      ref={attach}
      component="ul"
      direction="row"
      aria-label={label}
      sx={{ listStyle: 'none', p: 0, m: 0, gap: 2, overflowX: 'auto', scrollSnapType: 'x proximity', alignItems: 'stretch', pb: 1 }}
    >
      {children}
    </Stack>
  );
}

export type ScrollRowItemProps = {
  /** The cell's card. */
  children: ReactNode;
};

/**
 * One cell of a `ScrollRow`: a fixed width (264px, theme spacing 33), so the row reads the same at any
 * page width, and a snap point at its start.
 *
 * @summary One fixed-width cell of a `ScrollRow`.
 * @import import { ScrollRowItem } from 'src/components/ScrollRow';
 */
export function ScrollRowItem({ children }: ScrollRowItemProps) {
  return (
    <Box component="li" sx={{ flex: '0 0 auto', width: (theme) => theme.spacing(33), scrollSnapAlign: 'start' }}>
      {children}
    </Box>
  );
}
