import { useState, type ReactNode } from 'react';
import Stack from '@mui/material/Stack';
import type { Meta, StoryObj } from '@storybook/react-vite';
import { expect, fn } from 'storybook/test';
import { ConfirmCard, NotBoughtCard, type ConfirmRequest } from 'src/components/AssistantCards';

/** A synthetic request: the thread is about to create a work order. */
const request: ConfirmRequest = {
  action: 'Create a work order at Harbor Point',
  detail: 'A new work order for Chiller 2’s high discharge pressure, assigned to Dana Okafor, due Friday.',
  confirmLabel: 'Create Work Order',
  cancelLabel: 'Don’t Create',
  doneText: 'Work order 4823 created and assigned to Dana Okafor.',
};

/** A thread's column: cards sit in a drawer's width. */
const inThread = (Story: () => ReactNode) => (
  <Stack sx={{ maxWidth: 360 }}>
    <Story />
  </Stack>
);

/**
 * Kilowatt's assistant cards, the message kinds beyond plain text in an assistant's thread: `ConfirmCard` before
 * anything is written, and `NotBoughtCard` for a question about a product outside the account. Each story shows
 * one card in a thread's column, with synthetic data.
 */
const meta = {
  title: 'Surfaces/Assistant cards',
  component: ConfirmCard,
  tags: ['!autodocs'],
  // The MUI components this page documents; docs.test.ts checks its MUI departures section against them.
  parameters: { muiComponents: ['Card', 'CardContent', 'CardActions', 'Button', 'Typography', 'Stack'] },
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

/** `NotBoughtCard`: the product isn't in the company's account, with one action that asks the account team. */
export const NotBought: StoryObj<typeof NotBoughtCard> = {
  name: 'Not bought',
  args: { product: 'Carbon Planning', company: 'Northwind Holdings', onRequest: fn() },
  render: (args) => <NotBoughtCard {...args} />,
  play: async ({ args, canvas, userEvent }) => {
    await userEvent.click(canvas.getByRole('button', { name: 'Ask Your Account Team About It' }));
    await expect(args.onRequest).toHaveBeenCalledOnce();
  },
};

/** Once asked, the card says when, and the action is gone. */
export const NotBoughtRequested: StoryObj<typeof NotBoughtCard> = {
  name: 'Not bought, requested',
  args: { product: 'Carbon Planning', company: 'Northwind Holdings', requested: Date.UTC(2026, 10, 9, 12) },
  render: (args) => <NotBoughtCard {...args} />,
  play: async ({ canvas }) => {
    await expect(canvas.getByText(/You asked your account team on /)).toBeVisible();
    await expect(canvas.queryByRole('button')).toBeNull();
  },
};
