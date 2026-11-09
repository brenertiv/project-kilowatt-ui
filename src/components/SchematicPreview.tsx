import Box from '@mui/material/Box';
import { createSchemeTheme } from '../mui/theme';
import { useResolvedScheme } from '../mui/useResolvedScheme';

/** What a block stands for: a headline figure, a chart (columns, a line, ranked bars), a table, a list, prose, a map, a progress bar. */
export type SchematicGlyph = 'figure' | 'column' | 'line' | 'bars' | 'table' | 'list' | 'text' | 'map' | 'progress';
/** One block on the canvas: its glyph and its width in twelfths, as MUI's `Grid` counts them. */
export type SchematicBlock = { glyph: SchematicGlyph; span: 3 | 4 | 6 | 8 | 12 };
/** What a template or workspace opens on, in miniature. */
export type Schematic = {
  /** The page's frame: a dashboard's canvas of cards, a report's centred document, or a plan's canvas under a timeline. */
  frame: 'dashboard' | 'report' | 'plan';
  /** The blocks in canvas order, packed into rows of twelve; none for a blank page, which draws an Add plus in a dashed frame. */
  blocks: SchematicBlock[];
  /** A report that opens on a hero image. Default `false`. */
  hero?: boolean;
};

export type SchematicPreviewProps = {
  /** The frame and blocks to draw. */
  preview: Schematic;
};

/** The canvas: 3:1, as the review of 2026-10-26 cropped the preview area. */
const W = 300;
const H = 100;
/** The preview's proportions, for a card without one that must stand as tall as one with it. */
export const previewAspect = { width: W, height: H };
const pad = 8;
const gap = 5;
/** A report's page: a document narrower than the canvas, centred as a report's column is. */
const page = { x: 40, w: 220, inset: 10 };

const blockHeight: Record<SchematicGlyph, number> = { figure: 22, column: 38, line: 38, bars: 38, map: 38, table: 34, list: 28, text: 18, progress: 10 };

type Placed = { block: SchematicBlock; x: number; y: number; w: number; h: number };

/** Packs blocks into rows of twelve columns, each row as tall as its tallest block. */
function pack(blocks: SchematicBlock[], x0: number, y0: number, width: number): Placed[] {
  const col = (width - gap * 11) / 12;
  const placed: Placed[] = [];
  let x = 0;
  let y = y0;
  let rowHeight = 0;
  for (const block of blocks) {
    if (x + block.span > 12) {
      x = 0;
      y += rowHeight + gap;
      rowHeight = 0;
    }
    const h = blockHeight[block.glyph];
    placed.push({ block, x: x0 + x * (col + gap), y, w: block.span * col + (block.span - 1) * gap, h });
    rowHeight = Math.max(rowHeight, h);
    x += block.span;
    if (y > H) break;
  }
  return placed;
}

const columns = [0.5, 0.7, 0.6, 0.9, 0.8, 0.55, 0.75, 1, 0.65, 0.85];
const linePoints = [0.7, 0.6, 0.65, 0.45, 0.5, 0.35, 0.4, 0.25, 0.2];
const bars = [1, 0.8, 0.65, 0.5, 0.35];

/**
 * One palette per scheme, as the map theme builds them: SVG fills take a color, not a palette key, and
 * `useTheme().palette` is the light scheme's whatever is on screen.
 */
const palettes = { light: createSchemeTheme('light').palette, dark: createSchemeTheme('dark').palette };

/**
 * A template's or workspace's preview as a schematic of its page: the top of the page it opens on, in miniature, with a
 * shape per component (a headline figure, columns, a line, ranked bars, a table, a list, prose, a map, a progress bar).
 * It's drawn as SVG from the palette's roles (surfaces, borders, text, the first series color and `chart.neutral`, the
 * map's land), so it follows the color scheme as the page does, and it shows what the page holds rather than anyone's
 * data. It's decorative (`aria-hidden`): the card's name and description carry the meaning. 3:1, edge to edge at the
 * top of a card.
 *
 * @summary A schematic of a page's layout, for the preview on a template or workspace card.
 * @import import { SchematicPreview } from 'src/components/SchematicPreview';
 */
export function SchematicPreview({ preview }: SchematicPreviewProps) {
  const palette = palettes[useResolvedScheme() ?? 'light'];
  const ink = {
    canvas: palette.background.level2,
    card: palette.background.level3,
    band: palette.background.level1,
    edge: palette.border.level1,
    line: palette.border.level2,
    heading: palette.border.level3,
    figure: palette.text.secondary,
    series: palette.chart.series[0],
    neutral: palette.chart.neutral,
    land: palette.map.land,
  };

  /** The shape inside a block, in the rect under its title line. */
  const glyph = ({ block, x, y, w, h }: Placed) => {
    const cx = x + 4;
    const cy = y + 9;
    const cw = w - 8;
    const ch = h - 13;
    switch (block.glyph) {
      case 'figure':
        return <rect x={cx} y={cy + ch - 6} width={cw * 0.5} height={6} rx={1} fill={ink.figure} />;
      case 'column': {
        const bw = cw / columns.length - 2;
        return (
          <>
            {columns.map((v, i) => (
              <rect key={i} x={cx + i * (bw + 2)} y={cy + ch * (1 - v)} width={bw} height={ch * v} fill={ink.series} />
            ))}
            <line x1={cx} y1={cy + ch} x2={cx + cw} y2={cy + ch} stroke={ink.line} />
          </>
        );
      }
      case 'line': {
        const points = linePoints.map((v, i) => `${cx + (cw * i) / (linePoints.length - 1)},${cy + ch * v}`).join(' ');
        return (
          <>
            <line x1={cx} y1={cy + ch * 0.4} x2={cx + cw} y2={cy + ch * 0.4} stroke={ink.neutral} strokeDasharray="2 2" />
            <polyline points={points} fill="none" stroke={ink.series} strokeWidth={1.5} strokeLinejoin="round" />
          </>
        );
      }
      case 'bars': {
        const step = ch / bars.length;
        return bars.map((v, i) => (
          <g key={i}>
            <rect x={cx} y={cy + i * step + 1} width={14} height={2.5} rx={1} fill={ink.line} />
            <rect x={cx + 18} y={cy + i * step} width={(cw - 18) * v} height={step - 2} fill={ink.series} />
          </g>
        ));
      }
      case 'table': {
        const rows = 4;
        const step = ch / (rows + 1);
        const stubs = (ry: number, color: string) => (
          <>
            <rect x={cx} y={ry} width={cw * 0.3} height={2.5} rx={1} fill={color} />
            <rect x={cx + cw * 0.6} y={ry} width={cw * 0.12} height={2.5} rx={1} fill={color} />
            <rect x={cx + cw * 0.86} y={ry} width={cw * 0.14} height={2.5} rx={1} fill={color} />
          </>
        );
        return (
          <>
            {stubs(cy + step / 2 - 1, ink.heading)}
            {Array.from({ length: rows }, (_, i) => (
              <g key={i}>
                <line x1={cx} y1={cy + (i + 1) * step} x2={cx + cw} y2={cy + (i + 1) * step} stroke={ink.edge} />
                {stubs(cy + (i + 1.5) * step - 1, ink.line)}
              </g>
            ))}
          </>
        );
      }
      case 'list': {
        const rows = 3;
        const step = ch / rows;
        return Array.from({ length: rows }, (_, i) => (
          <g key={i}>
            <circle cx={cx + 2} cy={cy + (i + 0.5) * step} r={1.5} fill={ink.heading} />
            <rect x={cx + 7} y={cy + (i + 0.5) * step - 1.25} width={cw * 0.55} height={2.5} rx={1} fill={ink.line} />
            {i < rows - 1 && <line x1={cx} y1={cy + (i + 1) * step} x2={cx + cw} y2={cy + (i + 1) * step} stroke={ink.edge} />}
          </g>
        ));
      }
      case 'text':
        return [1, 0.92, 0.6].map((v, i) => <rect key={i} x={cx} y={cy + i * 4} width={cw * v} height={2} rx={1} fill={ink.line} />);
      case 'map':
        return (
          <>
            <rect x={x} y={cy - 2} width={w} height={h - 7} fill={ink.land} />
            <polyline points={`${x},${cy + ch * 0.7} ${x + w * 0.3},${cy + ch * 0.5} ${x + w * 0.55},${cy + ch * 0.6} ${x + w},${cy + ch * 0.2}`} fill="none" stroke={ink.line} />
            {[0.2, 0.45, 0.7, 0.85].map((v, i) => (
              <circle key={i} cx={x + w * v} cy={cy + ch * [0.5, 0.3, 0.7, 0.4][i]} r={2.5} fill={ink.series} />
            ))}
          </>
        );
      case 'progress':
        return (
          <>
            <rect x={x} y={y + 3} width={w} height={4} rx={2} fill={ink.edge} />
            <rect x={x} y={y + 3} width={w * 0.6} height={4} rx={2} fill={ink.series} />
          </>
        );
    }
  };

  /** A block's card (a dashboard's, with its surface) or outline (a report's, on the page), its title line, then its shape. */
  const block = (placed: Placed, onPage: boolean) => {
    const { block, x, y, w, h } = placed;
    const bare = block.glyph === 'progress';
    return (
      <g key={`${x}-${y}`}>
        {!bare && <rect x={x} y={y} width={w} height={h} rx={3} fill={onPage ? 'none' : ink.card} stroke={ink.edge} />}
        {!bare && <rect x={x + 4} y={y + 4} width={Math.min(w * 0.4, 40)} height={2.5} rx={1} fill={ink.line} />}
        {glyph(placed)}
      </g>
    );
  };

  /** An empty canvas: an Add plus in a dashed frame. */
  const empty = (x: number, y: number, w: number, h: number) => (
    <>
      <rect x={x} y={y} width={w} height={h} rx={3} fill="none" stroke={ink.line} strokeDasharray="3 2" />
      <line x1={x + w / 2 - 5} y1={y + h / 2} x2={x + w / 2 + 5} y2={y + h / 2} stroke={ink.figure} strokeWidth={1.5} />
      <line x1={x + w / 2} y1={y + h / 2 - 5} x2={x + w / 2} y2={y + h / 2 + 5} stroke={ink.figure} strokeWidth={1.5} />
    </>
  );

  let content;
  if (preview.frame === 'report') {
    const inner = { x: page.x + page.inset, w: page.w - 2 * page.inset };
    let y = pad + page.inset;
    const hero = preview.hero && (
      <>
        <rect x={inner.x} y={y} width={inner.w} height={22} rx={2} fill={ink.band} />
        <circle cx={inner.x + inner.w - 20} cy={y + 7} r={3} fill={ink.line} />
        <polygon points={`${inner.x},${y + 22} ${inner.x + inner.w * 0.3},${y + 10} ${inner.x + inner.w * 0.5},${y + 16} ${inner.x + inner.w * 0.75},${y + 8} ${inner.x + inner.w},${y + 22}`} fill={ink.line} />
      </>
    );
    if (preview.hero) y += 22 + gap;
    const title = (
      <>
        <rect x={inner.x} y={y} width={70} height={4} rx={1} fill={ink.heading} />
        <rect x={inner.x} y={y + 7} width={45} height={2.5} rx={1} fill={ink.line} />
      </>
    );
    y += 14;
    content = (
      <>
        <rect x={page.x} y={pad} width={page.w} height={H} rx={3} fill={ink.card} stroke={ink.edge} />
        {hero}
        {title}
        {preview.blocks.length ? pack(preview.blocks, inner.x, y, inner.w).map((p) => block(p, true)) : empty(inner.x, y, inner.w, H - y - pad)}
      </>
    );
  } else {
    const timeline = preview.frame === 'plan' && (
      <>
        <line x1={pad} y1={pad + 6} x2={W - pad} y2={pad + 6} stroke={ink.heading} />
        {[0, 0.25, 0.5, 0.75].map((v) => (
          <line key={v} x1={pad + (W - 2 * pad) * v} y1={pad + 3} x2={pad + (W - 2 * pad) * v} y2={pad + 9} stroke={ink.heading} />
        ))}
        <circle cx={W - pad} cy={pad + 6} r={3} fill={ink.series} />
      </>
    );
    const y = preview.frame === 'plan' ? pad + 14 : pad;
    content = (
      <>
        {timeline}
        {preview.blocks.length ? pack(preview.blocks, pad, y, W - 2 * pad).map((p) => block(p, false)) : empty(pad, y, W - 2 * pad, H - y - pad)}
      </>
    );
  }

  return (
    <Box component="svg" viewBox={`0 0 ${W} ${H}`} aria-hidden sx={{ display: 'block', width: '100%', aspectRatio: `${W} / ${H}`, bgcolor: 'background.level2' }}>
      {content}
    </Box>
  );
}
