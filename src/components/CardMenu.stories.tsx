import type { Meta, StoryObj } from '@storybook/react-vite';
import { fn } from 'storybook/test';
import { CardMenu } from './CardMenu';

const meta = {
  title: 'Menus/CardMenu',
  component: CardMenu,
  decorators: [
    (Story) => (
      // The menu lives in a card header's top-right corner.
      <article className="card" style={{ width: 320 }}>
        <header className="card-head">
          <h3>Monthly consumption</h3>
          <div className="card-actions">
            <Story />
          </div>
        </header>
        <div className="card-body">
          <p className="ui-description">Open the menu to pick an action.</p>
        </div>
      </article>
    ),
  ],
  args: {
    label: 'Monthly consumption actions',
    items: [
      { id: 'edit', label: 'Edit', onSelect: fn() },
      { id: 'duplicate', label: 'Duplicate', onSelect: fn() },
      { id: 'export', label: 'Export CSV', onSelect: fn() },
    ],
  },
} satisfies Meta<typeof CardMenu>;

export default meta;
type Story = StoryObj<typeof meta>;

/** A card's "more" menu with everyday actions. Every item is a plain `onSelect` callback. */
export const Default: Story = {};

/** An irreversible action goes last and is marked `destructive` so it draws in the negative color. */
export const WithDestructive: Story = {
  args: {
    items: [
      { id: 'edit', label: 'Edit', onSelect: fn() },
      { id: 'duplicate', label: 'Duplicate', onSelect: fn() },
      { id: 'remove', label: 'Remove card', onSelect: fn(), destructive: true },
    ],
  },
};

/** An action that is unavailable right now stays listed but `disabled`, so people know it exists. */
export const WithDisabled: Story = {
  args: {
    items: [
      { id: 'edit', label: 'Edit', onSelect: fn(), disabled: true },
      { id: 'duplicate', label: 'Duplicate', onSelect: fn() },
      { id: 'export', label: 'Export CSV', onSelect: fn() },
    ],
  },
};

/** A card with one action still uses the menu, so every card header lines up. */
export const SingleItem: Story = {
  args: { items: [{ id: 'export', label: 'Export CSV', onSelect: fn() }] },
};
