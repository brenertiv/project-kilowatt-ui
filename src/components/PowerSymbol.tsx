import Box from '@mui/material/Box';

/** The one-line diagram's six symbols: what each node on the diagram is. */
export type PowerSymbolKind = 'utility' | 'transformer' | 'meter' | 'disconnect' | 'panel' | 'bus';

/** The six kinds, in the order power flows through them, for a legend. */
export const powerSymbolKinds: PowerSymbolKind[] = ['utility', 'transformer', 'bus', 'meter', 'disconnect', 'panel'];

export type PowerSymbolProps = {
  /** Which symbol to draw: the utility's supply, a transformer, a utility meter, a disconnect, a panel or a bus trough. */
  kind: PowerSymbolKind;
  /** For a meter: draws its current transformer on the wire above it. Default `false`. */
  ct?: boolean;
  /** Draws the symbol dashed, for a node nobody has confirmed on site. Say so in words beside it too. Default `false`. */
  dashed?: boolean;
  /** The symbol's height in pixels; its width follows, two thirds of it. Default `84`, a node's slot on the diagram; a legend uses `32`. */
  size?: number;
  /** The surface level the symbol sits on, which fills its closed shapes so the diagram's wire shows behind them, not through them. Default `'level3'`, a card. */
  surface?: 'level0' | 'level1' | 'level2' | 'level3' | 'level4' | 'level5';
};

/** The symbol's own box: a slot 56 wide and 84 tall, the wire running down its middle. */
const width = 56;
const height = 84;
const mid = width / 2;
const y = height / 2;

/** One kind's shapes. A shape with the `surface` class is filled with the surface it sits on. */
function shape(kind: PowerSymbolKind, ct: boolean) {
  switch (kind) {
    case 'utility':
      return (
        <>
          <rect className="surface" x={mid - 20} y={y - 16} width={40} height={32} />
          <path d={`M${mid - 12} ${y} q6 -12 12 0 t12 0`} />
        </>
      );
    case 'transformer':
      return (
        <>
          <rect className="surface" x={mid - 16} y={y - 18} width={32} height={36} stroke="none" />
          <path d={`M${mid - 14} ${y - 12} a7 7 0 0 0 14 0 a7 7 0 0 0 14 0`} />
          <line x1={mid - 16} y1={y - 2} x2={mid + 16} y2={y - 2} />
          <line x1={mid - 16} y1={y + 2} x2={mid + 16} y2={y + 2} />
          <path d={`M${mid - 14} ${y + 12} a7 7 0 0 1 14 0 a7 7 0 0 1 14 0`} />
        </>
      );
    case 'meter':
      return (
        <>
          {ct && <path d={`M${mid + 5} ${y - 28} a6 6 0 0 1 0 12 a6 6 0 0 1 0 12`} />}
          <circle className="surface" cx={mid} cy={y + 14} r={13} />
          <path d={`M${mid - 6} ${y + 20} v-12 l6 8 l6 -8 v12`} />
        </>
      );
    case 'disconnect':
      return (
        <>
          <rect className="surface" x={mid - 16} y={y - 14} width={32} height={28} stroke="none" />
          <circle className="surface" cx={mid} cy={y - 12} r={3} />
          <circle className="surface" cx={mid} cy={y + 12} r={3} />
          <line x1={mid - 1} y1={y + 9} x2={mid - 14} y2={y - 10} />
        </>
      );
    case 'panel':
      return <rect className="surface" x={mid - 14} y={y - 22} width={28} height={44} strokeWidth={2} />;
    case 'bus':
      return <line x1={mid - 18} y1={y} x2={mid + 18} y2={y} strokeWidth={3} />;
  }
}

/**
 * One symbol of an electrical one-line diagram: the utility's supply, a transformer, a utility meter
 * (with its current transformer, `ct`), a disconnect, a panel or a bus trough. They are diagram marks, not
 * icons: the icon font has none of them, so they are the one set Kilowatt draws (Rules → Icons), each as an
 * inline SVG in `currentColor`, with its closed shapes filled with the surface it sits on (`surface`) so the
 * diagram's wire passes behind them. Each is drawn in a slot two thirds as wide as it is tall, the wire
 * running down the middle; `size` sets the height. `dashed` draws one for a node nobody has confirmed on
 * site. Decorative (`aria-hidden`): name the node in text beside it. The diagram's layout, its wires and the
 * power model are the page's, not this component's.
 *
 * @summary A one-line diagram symbol, drawn in currentColor: utility, transformer, meter, disconnect, panel or bus trough.
 * @import import { PowerSymbol } from 'src/components/PowerSymbol';
 */
export function PowerSymbol({ kind, ct = false, dashed = false, size = height, surface = 'level3' }: PowerSymbolProps) {
  return (
    <Box
      component="svg"
      viewBox={`0 0 ${width} ${height}`}
      width={(size * width) / height}
      height={size}
      fill="none"
      stroke="currentColor"
      strokeWidth={1.5}
      strokeDasharray={dashed ? '4 3' : undefined}
      aria-hidden
      sx={{ display: 'block', flexShrink: 0, '& .surface': { fill: (theme) => (theme.vars ?? theme).palette.background[surface] } }}
    >
      {shape(kind, ct)}
    </Box>
  );
}
