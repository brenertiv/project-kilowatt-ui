import type { ReactNode } from 'react';
import Grid from '@mui/material/Grid';
import type { SxProps, Theme } from '@mui/material/styles';
import { useContentUp } from './contentWidth';

/** What a card holds, which sets how much of the row it takes: a chart (half), a single figure or text (a third), or one of a wrapping set of like cards that each open something (a third). */
export type CardKind = 'chart' | 'figure' | 'collection';

/** Row sizes for `count` cards at most `perRow` to a row, spread so rows differ by one at most, fullest first. */
function rowSizes(count: number, perRow: number) {
  const rows = Math.ceil(count / perRow);
  const base = Math.floor(count / rows);
  const extra = count % rows;
  return Array.from({ length: rows }, (_, i) => base + (i < extra ? 1 : 0));
}

/**
 * Each card's span in twelfths, in order, for `count` cards of `kind` with at most `perRow` to a row: rows rebalanced
 * fullest first (4 → 2 + 2, 7 → 3 + 2 + 2), no card alone beside empty columns, an odd chart across the row.
 * `useCardGrid` reads `perRow` from the page's width; this is the pure part, for a test or a server.
 *
 * @summary Each card's twelfths for a row of cards, rebalanced so none sits alone.
 * @import import { cardSpans } from 'src/components/cardGrid';
 */
export function cardSpans(kind: CardKind, count: number, perRow: number): number[] {
  if (count <= 0) return [];
  let sizes = rowSizes(count, perRow);
  // A figure alone beside empty columns: stack the row's cards instead (pairs that can't come out even stay stacked).
  if (kind !== 'chart' && count > 1 && sizes.some((n) => n === 1)) sizes = rowSizes(count, 1);
  // A chart alone in its row spans it (its size is 1, so 12 / 1).
  return sizes.flatMap((n) => Array.from({ length: n }, () => 12 / n));
}

/**
 * The card grid's default layouts (Rules → Content and layout), read from the page's own width through `useContentUp`,
 * so a docked panel or the assistant narrows every page alike. A chart card takes half the row from `md`; a figure or
 * text card, or one of a collection, a third from `md` and half from `sm`; rows rebalance so no card sits alone.
 *
 * @summary The spans for a row of cards by what they hold, from the page's width.
 * @import import { useCardGrid } from 'src/components/cardGrid';
 */
export function useCardGrid() {
  const sm = useContentUp('sm');
  const md = useContentUp('md');
  const spans = (kind: CardKind, count: number) => cardSpans(kind, count, kind === 'chart' ? (md ? 2 : 1) : md ? 3 : sm ? 2 : 1);
  return {
    /** Each card's span, in order, for a row of `count` cards of `kind`. */
    spans,
    /** The span of card `index` in a row of `count` cards of `kind`. */
    span: (kind: CardKind, count: number, index: number) => spans(kind, count)[index] ?? 12,
    /** Two wide cards side by side from `md` that aren't charts (a details list beside a table). */
    half: md ? 6 : 12,
    /** Report text beside its card, or a detail beside its panel: 8 + 4 from `md`. */
    main: md ? 8 : 12,
    side: md ? 4 : 12,
    /** Whether cards sit side by side at all (from `md`), for a page that fills the height it has with its first row. */
    sideBySide: md,
  };
}

export type FeatureRowProps = {
  /** The lead card: six columns wide and two rows high from `md`, full width first below it. */
  lead: ReactNode;
  /** The four figure or text cards beside it, in a 2 × 2, three columns each from `md`, two pairs below it. */
  cells: [ReactNode, ReactNode, ReactNode, ReactNode];
  /** Styles for the outer `Grid`. Default none. */
  sx?: SxProps<Theme>;
};

/**
 * The feature row: a lead card six columns wide across two rows, with four figure or text cards in a 2 × 2 beside it,
 * three columns each, the one place a card takes a quarter of the row. Below `md` the lead goes first at full width
 * and the cells follow as two pairs. Give each child `height: '100%'`, so it fills its cell.
 *
 * @summary A lead card two rows high beside a 2 × 2 of figure cards.
 * @import import { FeatureRow } from 'src/components/cardGrid';
 */
export function FeatureRow({ lead, cells, sx }: FeatureRowProps) {
  const md = useContentUp('md');
  return (
    <Grid container spacing={2} sx={sx}>
      <Grid size={md ? 6 : 12}>{lead}</Grid>
      <Grid size={md ? 6 : 12}>
        {/* Two lines of two that stretch to the lead's height. */}
        <Grid container spacing={2} sx={{ height: '100%' }}>
          {cells.map((cell, i) => (
            <Grid key={i} size={6}>
              {cell}
            </Grid>
          ))}
        </Grid>
      </Grid>
    </Grid>
  );
}
