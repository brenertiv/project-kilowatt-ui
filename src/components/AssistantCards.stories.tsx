import { useState, type ReactNode } from 'react';
import Stack from '@mui/material/Stack';
import type { Meta, StoryObj } from '@storybook/react-vite';
import { expect, fn, waitFor } from 'storybook/test';
import { AnswerChartCard, ConfirmCard, NotBoughtCard, type AnswerChart, type ConfirmRequest } from 'src/components/AssistantCards';

/** A synthetic request: the thread is about to create a work order. */
const request: ConfirmRequest = {
  action: 'Create a work order at Harbor Point',
  detail: 'A new work order for Chiller 2’s high discharge pressure, assigned to Dana Okafor, due Friday.',
  confirmLabel: 'Create Work Order',
  cancelLabel: 'Don’t Create',
  doneText: 'Work order 4823 created and assigned to Dana Okafor.',
};

const kWh = new Intl.NumberFormat('en-US');

/** A synthetic answer's chart: six months of one building's electricity use, and the total the answer cites. */
const useByMonth = [
  { month: 'May', value: 41200 },
  { month: 'Jun', value: 46850 },
  { month: 'Jul', value: 52300 },
  { month: 'Aug', value: 53940 },
  { month: 'Sep', value: 47610 },
  { month: 'Oct', value: 42480 },
];
const answerChart: AnswerChart = {
  title: 'Electricity Use',
  figure: {
    label: 'Electricity Use',
    value: kWh.format(useByMonth.reduce((sum, { value }) => sum + value, 0)),
    unit: 'kWh',
    provenance: {
      builtFrom: [{ label: 'Harbor Point electricity bills', detail: '6 of 6 bills received', to: '/sites/harbor-point/bills' }],
      period: 'May–October 2026',
      calculation: 'The sum of every electricity bill whose service period falls in the six months, in kilowatt-hours',
      updated: Date.UTC(2026, 10, 4),
    },
  },
  data: useByMonth,
  series: 'Electricity use',
  unit: 'kWh',
  summary: `Harbor Point used ${kWh.format(useByMonth.reduce((sum, { value }) => sum + value, 0))} kWh of electricity from May to October 2026, peaking in August at ${kWh.format(53940)} kWh.`,
};

/** A thread's column: cards sit in a drawer's width. */
const inThread = (Story: () => ReactNode) => (
  <Stack sx={{ maxWidth: 360 }}>
    <Story />
  </Stack>
);

/**
 * Kilowatt's assistant cards, the message kinds beyond plain text in an assistant's thread: `ConfirmCard` before
 * anything is written, `NotBoughtCard` for a question about a product outside the account, and `AnswerChartCard`
 * for a chart an answer embeds. Each story shows one card in a thread's column, with synthetic data.
 */
const meta = {
  title: 'Surfaces/Assistant cards',
  component: ConfirmCard,
  tags: ['!autodocs'],
  // The MUI components this page documents; docs.test.ts checks its MUI departures section against them.
  parameters: { muiComponents: ['Card', 'CardHeader', 'CardContent', 'CardActions', 'Button', 'Typography', 'Stack'] },
  decorators: [inThread],
} satisfies Meta<typeof ConfirmCard>;

export default meta;
type Story = StoryObj<typeof meta>;

/** The card as it asks: the action, what will change, a contained Confirm and a text Cancel. Settling it drops the buttons and records the outcome. */
export const Confirm: Story = {
  args: { request, onSettle: fn() },
  render: function Render(args) {
    // The owner keeps the outcome on the request, as a thread's store would.
    const [outcome, setOutcome] = useState(args.request.outcome);
    return (
      <ConfirmCard
        request={{ ...args.request, outcome }}
        onSettle={(next) => {
          setOutcome(next);
          args.onSettle?.(next);
        }}
      />
    );
  },
  play: async ({ args, canvas, userEvent }) => {
    await userEvent.click(canvas.getByRole('button', { name: 'Create Work Order' }));
    await expect(args.onSettle).toHaveBeenCalledWith('confirmed');
    await expect(canvas.queryByRole('button')).toBeNull();
    await expect(canvas.getByText('Work order 4823 created and assigned to Dana Okafor.')).toBeVisible();
  },
};

/** Settled as confirmed: the buttons are gone and the card says what happened, with a check. */
export const Confirmed: Story = {
  args: { request: { ...request, outcome: 'confirmed' } },
};

/** Settled as cancelled: the buttons are gone and the card says nothing changed, with a cross. */
export const Cancelled: Story = {
  args: { request: { ...request, outcome: 'cancelled' } },
  play: async ({ canvas }) => {
    await expect(canvas.getByText('Cancelled. Nothing changed.')).toBeVisible();
  },
};

/** Without `onSettle` the buttons are disabled: a thread that's read-only, or a card from someone else's session. */
export const ReadOnly: Story = {
  name: 'Read-only',
  args: { request },
  play: async ({ canvas }) => {
    await expect(canvas.getByRole('button', { name: 'Create Work Order' })).toBeDisabled();
  },
};

/** `NotBoughtCard`: the product isn't in the company's account, with one action, See What It Does, that opens the product's own page. */
export const NotBought: StoryObj<typeof NotBoughtCard> = {
  name: 'Not bought',
  args: { product: 'Carbon Planning', company: 'Northwind Holdings', onSeeWhatItDoes: fn() },
  render: (args) => <NotBoughtCard {...args} />,
  play: async ({ args, canvas, userEvent }) => {
    await userEvent.click(canvas.getByRole('button', { name: 'See What It Does' }));
    await expect(args.onSeeWhatItDoes).toHaveBeenCalledOnce();
  },
};

/** Without `onSeeWhatItDoes` the card has no action: a product with no page of its own to open. */
export const NotBoughtNoAction: StoryObj<typeof NotBoughtCard> = {
  name: 'Not bought, no action',
  args: { product: 'Carbon Planning', company: 'Northwind Holdings' },
  render: (args) => <NotBoughtCard {...args} />,
  play: async ({ canvas }) => {
    await expect(canvas.getByText('Carbon Planning isn’t part of Northwind Holdings’s account.')).toBeVisible();
    await expect(canvas.queryByRole('button')).toBeNull();
  },
};

/** `AnswerChartCard`: a chart an answer embeds. A title, the figure first, opening where it comes from, then the months behind it as columns. */
export const AnswerChartStory: StoryObj<typeof AnswerChartCard> = {
  name: 'Answer chart',
  args: { chart: answerChart, onNavigate: fn() },
  render: (args) => <AnswerChartCard {...args} />,
  play: async ({ canvas }) => {
    const card = canvas.getByRole('region', { name: 'Electricity Use' });
    await waitFor(() => expect(card.querySelector('canvas')).not.toBeNull());
    await expect(canvas.getByRole('button', { name: /Electricity Use/ })).toBeVisible();
    await expect(canvas.getByRole('figure', { name: /peaking in August/ })).toBeVisible();
  },
};
