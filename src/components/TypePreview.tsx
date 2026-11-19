import Box from '@mui/material/Box';
import { alpha, useTheme } from '@mui/material/styles';
import { workspaceTypeSlots } from '../charts/meanings';
import { previewAspect } from './SchematicPreview';
import { useSlotColor } from './TypeChip';

/** A workspace's type: a dashboard, a report or a plan. */
export type WorkspaceType = 'dashboard' | 'report' | 'plan';

export type TypePreviewProps = {
  /** The workspace's or template's type: it picks the motif and the color. */
  type: WorkspaceType;
  /** A blank template: a plus in place of the type's motif, still in the type's color. Default `false`. */
  blank?: boolean;
};

/** Each type's name in `workspaceTypeSlots`, the meaning its color comes from. */
const meaning: Record<WorkspaceType, string> = { dashboard: 'Dashboard', report: 'Report', plan: 'Plan' };

const { width: W, height: H } = previewAspect;
/** A dashboard's columns, by height. */
const columns = [28, 44, 36, 56, 48];
/** A report's lines of text under its heading, by width. */
const lines = [100, 100, 64];
/** A plan's falling path, point by point. */
const path = [
  [96, 32],
  [132, 44],
  [168, 54],
  [204, 70],
] as const;

/**
 * The picture at the top of a workspace or template card: one quiet motif per type on a tint of the type's color, the
 * color and tint its `TypeChip` has. Columns for a dashboard, lines of text for a report, a falling path for a plan,
 * and a plus for a blank template. It says which type the card is and nothing about its contents, which the title
 * carries, so a gallery's titles lead and its pictures sort it by type at a glance. The shapes are the type's color at
 * MUI's `action.disabledOpacity` and the tint is the color at `action.selectedOpacity`, so no opacity of Kilowatt's own
 * enters the code. It's decorative (`aria-hidden`). 3:1, edge to edge at the top of a card, the shape `SchematicPreview` has.
 *
 * @summary A motif for a workspace's type on a tint of the type's color, for the picture on a workspace or template card.
 * @import import { TypePreview } from 'src/components/TypePreview';
 */
export function TypePreview({ type, blank = false }: TypePreviewProps) {
  const color = useSlotColor(workspaceTypeSlots[meaning[type]]);
  const { action } = useTheme().palette;
  // The shapes sit back from the title: the type's color at MUI's disabled opacity, on the chip's tint of it.
  const quiet = action.disabledOpacity;
  let motif;
  if (blank) {
    motif = (
      <g stroke="currentColor" strokeWidth={3} strokeLinecap="round" strokeOpacity={quiet}>
        <line x1={W / 2 - 10} y1={H / 2} x2={W / 2 + 10} y2={H / 2} />
        <line x1={W / 2} y1={H / 2 - 10} x2={W / 2} y2={H / 2 + 10} />
      </g>
    );
  } else if (type === 'dashboard') {
    motif = columns.map((h, i) => (
      <rect key={i} x={90 + i * 26} y={78 - h} width={16} height={h} rx={2} fill="currentColor" fillOpacity={quiet} />
    ));
  } else if (type === 'report') {
    motif = (
      <g fill="currentColor" fillOpacity={quiet}>
        <rect x={100} y={28} width={70} height={7} rx={2} />
        {lines.map((w, i) => (
          <rect key={i} x={100} y={46 + i * 10} width={w} height={4} rx={2} />
        ))}
      </g>
    );
  } else {
    motif = (
      <g strokeOpacity={quiet} fillOpacity={quiet}>
        <polyline
          points={path.map((p) => p.join(',')).join(' ')}
          fill="none"
          stroke="currentColor"
          strokeWidth={3}
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        {path.map(([x, y]) => (
          <circle key={x} cx={x} cy={y} r={5} fill="currentColor" />
        ))}
      </g>
    );
  }
  return (
    <Box
      component="svg"
      viewBox={`0 0 ${W} ${H}`}
      aria-hidden
      sx={{
        display: 'block',
        width: '100%',
        aspectRatio: `${W} / ${H}`,
        color,
        bgcolor: alpha(color, action.selectedOpacity),
      }}
    >
      {motif}
    </Box>
  );
}
