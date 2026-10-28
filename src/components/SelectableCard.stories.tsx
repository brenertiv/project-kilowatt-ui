import { useState } from 'react';
import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import CardHeader from '@mui/material/CardHeader';
import IconButton from '@mui/material/IconButton';
import type { Meta, StoryObj } from '@storybook/react-vite';
import { expect, fn } from 'storybook/test';
import { SelectModeProvider, SelectableCard, type ContextItem } from 'src/components/SelectableCard';
import { PlainFigure } from 'src/components/SourceFigure';
import { TruncatedText } from 'src/components/TruncatedText';
import { Icon } from 'src/icons';

const decimal = new Intl.NumberFormat('en-US', { minimumFractionDigits: 1, maximumFractionDigits: 1 });
const whole = new Intl.NumberFormat('en-US', { maximumFractionDigits: 0 });

/** Two made-up metric cards, each one that can be added to the chat. */
const cards = [
  { title: 'Energy Use Intensity', value: decimal.format(64.2), unit: 'kBtu/ft²' },
  { title: 'Peak Demand', value: whole.format(1240), unit: 'kW' },
];

/** Stands in for the app's handler, which adds a chip to the chat's composer or takes it off. */
const toggled = fn();

/** A page of metric cards inside a `SelectModeProvider`, holding which are in the chat as the app would. */
function Board({ active, initial = [] }: { active: boolean; initial?: ContextItem[] }) {
  const [selected, setSelected] = useState(initial);
  const onToggle = (item: ContextItem) => {
    toggled(item);
    setSelected((items) => (items.some(({ id }) => id === item.id) ? items.filter(({ id }) => id !== item.id) : [...items, item]));
  };
  return (
    <SelectModeProvider active={active} selected={selected} onToggle={onToggle}>
      {/* Room above the cards for the tab on their top edge. */}
      <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))', gap: 2, pt: 3, maxWidth: 720 }}>
        {cards.map((card) => (
          <SelectableCard key={card.title} title={card.title}>
            <Card variant="outlined" sx={{ height: '100%', minHeight: (theme) => theme.spacing(20), display: 'flex', flexDirection: 'column' }}>
              <CardHeader
                title={<TruncatedText>{card.title}</TruncatedText>}
                action={
                  <IconButton aria-label={`${card.title} options`}>
                    <Icon name="more_horiz" fontSize="inherit" />
                  </IconButton>
                }
              />
              <CardContent sx={{ pt: 0, mt: 'auto' }}>
                <PlainFigure value={card.value} unit={card.unit} />
              </CardContent>
            </Card>
          </SelectableCard>
        ))}
      </Box>
    </SelectModeProvider>
  );
}

/**
 * Kilowatt's `SelectableCard` and `SelectModeProvider`: cards that can be added to the chat as context.
 * Each story shows two metric cards on a page, with the provider's `active` and `selected` as the app
 * would pass them.
 */
const meta = {
  title: 'Surfaces/SelectableCard',
  component: SelectableCard,
  tags: ['!autodocs'],
  // The MUI components this page documents; docs.test.ts checks its MUI departures section against them.
  parameters: { muiComponents: ['ButtonBase'] },
  args: { title: 'Energy Use Intensity', children: null },
} satisfies Meta<typeof SelectableCard>;

export default meta;
type Story = StoryObj<typeof meta>;

/** Select mode off, nothing in the chat: the cards render as they are, and their own controls work. */
export const Off: Story = {
  render: () => <Board active={false} />,
  play: async ({ canvas }) => {
    await expect(canvas.queryByRole('button', { name: /to the chat$/ })).toBeNull();
    await expect(canvas.getByRole('button', { name: 'Energy Use Intensity options' })).toBeVisible();
  },
};

/** Select mode on: each card shows a tab with a plus, and a click anywhere on it adds it to the chat; a second click takes it out. */
export const SelectModeOn: Story = {
  render: () => <Board active />,
  play: async ({ canvas, userEvent }) => {
    toggled.mockClear();
    await userEvent.click(canvas.getByRole('button', { name: 'Add Energy Use Intensity to the chat' }));
    await expect(toggled).toHaveBeenCalledWith({ id: 'Energy Use Intensity', title: 'Energy Use Intensity' });
    const remove = canvas.getByRole('button', { name: 'Remove Energy Use Intensity from the chat' });
    await expect(remove).toHaveAttribute('aria-pressed', 'true');
    await userEvent.click(remove);
    await expect(canvas.getByRole('button', { name: 'Add Energy Use Intensity to the chat' })).toHaveAttribute('aria-pressed', 'false');
  },
};

/** A card in the chat, in select mode: a `secondary.main` outline and a check on its tab; a click takes it out. */
export const Selected: Story = {
  render: () => <Board active initial={[{ id: 'Energy Use Intensity', title: 'Energy Use Intensity' }]} />,
  play: async ({ canvas, userEvent }) => {
    const remove = canvas.getByRole('button', { name: 'Remove Energy Use Intensity from the chat' });
    await expect(remove).toHaveAttribute('aria-pressed', 'true');
    await expect(canvas.getByRole('button', { name: 'Add Peak Demand to the chat' })).toHaveAttribute('aria-pressed', 'false');
    await userEvent.click(remove);
    await expect(canvas.getByRole('button', { name: 'Add Energy Use Intensity to the chat' })).toHaveAttribute('aria-pressed', 'false');
  },
};

/** A card in the chat with select mode off: it keeps its outline while its chip is on the composer, and its controls work. */
export const SelectedSelectModeOff: Story = {
  render: () => <Board active={false} initial={[{ id: 'Energy Use Intensity', title: 'Energy Use Intensity' }]} />,
  play: async ({ canvas, canvasElement }) => {
    await expect(canvas.queryByRole('button', { name: /to the chat$/ })).toBeNull();
    await expect(canvas.getByRole('button', { name: 'Energy Use Intensity options' })).toBeVisible();
    await expect(canvasElement.querySelector('[data-context-id="Energy Use Intensity"] > [aria-hidden]')).not.toBeNull();
    await expect(canvasElement.querySelector('[data-context-id="Peak Demand"] > [aria-hidden]')).toBeNull();
  },
};
