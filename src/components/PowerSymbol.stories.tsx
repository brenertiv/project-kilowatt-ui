import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import CardHeader from '@mui/material/CardHeader';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';
import type { Meta, StoryObj } from '@storybook/react-vite';
import { expect } from 'storybook/test';
import { PowerSymbol, powerSymbolKinds, type PowerSymbolKind } from 'src/components/PowerSymbol';
import { TruncatedText } from 'src/components/TruncatedText';

/** What a legend calls each symbol. */
const names: Record<PowerSymbolKind, string> = {
  utility: 'Utility',
  transformer: 'Transformer',
  bus: 'Bus Trough',
  meter: 'Utility Meter',
  disconnect: 'Disconnect',
  panel: 'Panel',
};

/** A made-up service, from the utility down to a panel: the nodes of one branch of a one-line diagram. */
const branch: { kind: PowerSymbolKind; name: string; rating: string; ct?: boolean; unconfirmed?: boolean }[] = [
  { kind: 'utility', name: 'Utility Service', rating: '13.2 kV' },
  { kind: 'transformer', name: 'Transformer T-1', rating: '1,500 kVA, 480/277 V' },
  { kind: 'meter', name: 'Utility Meter M-1', rating: 'With current transformer', ct: true },
  { kind: 'disconnect', name: 'Main Disconnect', rating: '2,000 A' },
  { kind: 'panel', name: 'Panel DP-1', rating: 'Not confirmed on site', unconfirmed: true },
];

/**
 * Kilowatt's `PowerSymbol`: the six symbols of an electrical one-line diagram, drawn in `currentColor`.
 * They are diagram marks, the one drawn set beside the icon font (Rules → Icons). Each story shows them
 * on a card, the surface a diagram sits on.
 */
const meta = {
  title: 'Data display/PowerSymbol',
  component: PowerSymbol,
  tags: ['!autodocs'],
  // The MUI components this page documents; docs.test.ts checks its MUI departures section against them.
  parameters: { muiComponents: ['Box'] },
  args: { kind: 'transformer' },
  decorators: [
    // On a card, the surface a diagram sits on, titled when the story's `parameters.card` gives a title.
    (Story, { parameters }) => {
      const { title } = (parameters.card ?? {}) as { title?: string };
      return (
        <Card variant="outlined" sx={{ maxWidth: 480 }}>
          {title && <CardHeader title={<TruncatedText>{title}</TruncatedText>} />}
          <CardContent sx={{ color: 'text.secondary', ...(title && { pt: 0 }) }}>
            <Story />
          </CardContent>
        </Card>
      );
    },
  ],
} satisfies Meta<typeof PowerSymbol>;

export default meta;
type Story = StoryObj<typeof meta>;

/** The six symbols as a diagram's legend, each 32px tall beside its name: utility, transformer, bus trough, utility meter, disconnect and panel. */
export const Legend: Story = {
  render: () => (
    <Stack component="ul" direction="row" useFlexGap sx={{ listStyle: 'none', m: 0, p: 0, flexWrap: 'wrap', columnGap: 3, rowGap: 1 }}>
      {powerSymbolKinds.map((kind) => (
        <Stack key={kind} component="li" direction="row" sx={{ alignItems: 'center', gap: 1 }}>
          <PowerSymbol kind={kind} size={32} />
          <Typography variant="body2" sx={{ color: 'text.primary' }}>
            {names[kind]}
          </Typography>
        </Stack>
      ))}
    </Stack>
  ),
  play: async ({ canvas, canvasElement }) => {
    await expect(canvas.getAllByRole('listitem')).toHaveLength(6);
    const symbols = canvasElement.querySelectorAll('svg');
    await expect(symbols).toHaveLength(6);
    // Decorative: each is named by the text beside it.
    for (const symbol of symbols) await expect(symbol).toHaveAttribute('aria-hidden', 'true');
  },
};

/** One symbol at a node's size, 84px tall, the default. */
export const Symbol: Story = {};

/** A utility meter with its current transformer: `ct` draws it on the wire above the meter. */
export const MeterWithCurrentTransformer: Story = {
  name: 'Meter with current transformer',
  args: { kind: 'meter', ct: true },
};

/** A node nobody has confirmed on site is drawn dashed (`dashed`), and says so in words beside it. */
export const Dashed: Story = {
  args: { kind: 'panel', dashed: true },
  render: (args) => (
    <Stack direction="row" sx={{ alignItems: 'center', gap: 1 }}>
      <PowerSymbol {...args} />
      <div>
        <Typography variant="body2" sx={{ color: 'text.primary' }}>
          Panel DP-1
        </Typography>
        <Typography variant="caption">Not confirmed on site</Typography>
      </div>
    </Stack>
  ),
  play: async ({ canvas, canvasElement }) => {
    await expect(canvasElement.querySelector('svg')).toHaveAttribute('stroke-dasharray', '4 3');
    await expect(canvas.getByText('Not confirmed on site')).toBeVisible();
  },
};

/** On a wire: each symbol's closed shapes are filled with the surface it sits on (`surface`, a card's `level3` by default), so the wire passes behind them. The wire and the layout are the page's. */
export const OnAWire: Story = {
  name: 'On a wire',
  parameters: { card: { title: 'One-Line Diagram' } },
  render: () => (
    <Box component="ol" sx={{ listStyle: 'none', m: 0, p: 0, position: 'relative' }}>
      {/* The wire: one line down the middle of the symbols' slot, behind them. */}
      <Box aria-hidden sx={{ position: 'absolute', top: 42, bottom: 42, left: 28, borderLeft: 1, borderColor: 'currentColor' }} />
      {branch.map(({ kind, name, rating, ct, unconfirmed }) => (
        <Stack key={name} component="li" direction="row" sx={{ alignItems: 'center', gap: 1.5, position: 'relative' }}>
          <PowerSymbol kind={kind} ct={ct} dashed={unconfirmed} />
          <div>
            <Typography variant="body2" sx={{ color: 'text.primary' }}>
              {name}
            </Typography>
            <Typography variant="caption">{rating}</Typography>
          </div>
        </Stack>
      ))}
    </Box>
  ),
  play: async ({ canvas }) => {
    await expect(canvas.getAllByRole('listitem')).toHaveLength(5);
    await expect(canvas.getByText('Transformer T-1')).toBeVisible();
  },
};
