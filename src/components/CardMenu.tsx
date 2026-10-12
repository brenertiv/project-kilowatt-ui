import type { ReactNode } from 'react';
import { Menu } from '@base-ui/react/menu';
import { MoreIcon } from '../icons';

export type CardMenuItem = {
  id: string;
  label: ReactNode;
  onSelect: () => void;
  /** Draw in the negative color for irreversible actions. */
  destructive?: boolean;
  disabled?: boolean;
};

type CardMenuProps = {
  /** Accessible name for the trigger, e.g. "Button card actions". */
  label: string;
  items: CardMenuItem[];
};

/**
 * The "more" control that sits in a card's top-right corner: a compact icon
 * button opening a small menu. Items are plain callbacks so cards decide what
 * their actions mean.
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
