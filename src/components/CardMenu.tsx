import type { ReactNode } from 'react';
import { Menu } from '@base-ui/react/menu';
import { MoreIcon } from '../icons';

/** One entry in a `CardMenu`. */
export type CardMenuItem = {
  /** Stable key for the item. Must be unique within the menu. */
  id: string;
  /** Menu item text. */
  label: ReactNode;
  /** Called when the item is chosen. */
  onSelect: () => void;
  /** Draw in the negative color for irreversible actions. Defaults to false. */
  destructive?: boolean;
  /** Shows the item but blocks choosing it. Use when the action exists but is unavailable right now. Defaults to false. */
  disabled?: boolean;
};

export type CardMenuProps = {
  /** Accessible name for the icon-only trigger. Name the card, e.g. "Monthly consumption actions". */
  label: string;
  /** The card's actions, in menu order. */
  items: CardMenuItem[];
};

/**
 * The "more" control that sits in a card's top-right corner: a compact icon
 * button opening a small menu. Items are plain callbacks so cards decide what
 * their actions mean. For per-row actions in a table, use `ActionsCell` instead.
 *
 * @summary A card's top-right overflow menu of actions.
 * @import import { CardMenu } from 'src/components/CardMenu';
 */
export function CardMenu({ label, items }: CardMenuProps) {
  return (
    <Menu.Root>
      <Menu.Trigger className="ui-icon-btn ui-icon-btn-sm card-more" aria-label={label}>
        <MoreIcon />
      </Menu.Trigger>
      <Menu.Portal>
        <Menu.Positioner className="ui-positioner" align="end" sideOffset={4}>
          <Menu.Popup className="ui-popup">
            {items.map((item) => (
              <Menu.Item
                key={item.id}
                className="ui-item"
                data-destructive={item.destructive || undefined}
                disabled={item.disabled}
                onClick={item.onSelect}
              >
                {item.label}
              </Menu.Item>
            ))}
          </Menu.Popup>
        </Menu.Positioner>
      </Menu.Portal>
    </Menu.Root>
  );
}
