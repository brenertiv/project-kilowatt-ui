import { useId, useState, type ReactNode } from 'react';
import Divider from '@mui/material/Divider';
import IconButton from '@mui/material/IconButton';
import ListItemIcon from '@mui/material/ListItemIcon';
import ListItemText from '@mui/material/ListItemText';
import Menu from '@mui/material/Menu';
import MenuItem from '@mui/material/MenuItem';
import { MoreIcon } from '../icons';

/** One entry in a `CardMenu`. */
export type CardMenuItem = {
  /** Stable key for the item. Must be unique within the menu. */
  id: string;
  /** Menu item text. */
  label: ReactNode;
  /** Called when the item is chosen. The menu closes first. */
  onSelect: () => void;
  /** A leading icon from `src/icons.tsx`, e.g. `<DownloadIcon />`. Optional; omit it on every item or give it to all of them. */
  icon?: ReactNode;
  /** Draw in the error color, after a divider, for irreversible actions. Put destructive items last. Defaults to false. */
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
 * The "more" control that sits in a card's top-right corner: a small MUI
 * `IconButton` opening a `Menu`, aligned to the button's right edge. Items are
 * plain callbacks so cards decide what their actions mean. Put it in the
 * `action` slot of a `CardHeader`. For per-row actions in a table, use
 * `ActionsCell` instead.
 *
 * @summary A card's top-right overflow menu of actions.
 * @import import { CardMenu } from 'src/components/CardMenu';
 */
export function CardMenu({ label, items }: CardMenuProps) {
  const id = useId();
  const [anchor, setAnchor] = useState<HTMLElement | null>(null);
  const open = anchor !== null;
  const firstDestructive = items.findIndex((item) => item.destructive);

  return (
    <>
      <IconButton
        size="small"
        aria-label={label}
        aria-haspopup="menu"
        aria-controls={open ? `${id}-menu` : undefined}
        aria-expanded={open || undefined}
        onClick={(event) => setAnchor(event.currentTarget)}
      >
        <MoreIcon />
      </IconButton>
      <Menu
        id={`${id}-menu`}
        anchorEl={anchor}
        open={open}
        onClose={() => setAnchor(null)}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
        transformOrigin={{ vertical: 'top', horizontal: 'right' }}
      >
        {/* MenuList needs direct children, not fragments, for keyboard focus. */}
        {items.flatMap((item, index) => [
          ...(index > 0 && index === firstDestructive ? [<Divider key={`${item.id}-divider`} />] : []),
          <MenuItem
            key={item.id}
            disabled={item.disabled}
            sx={item.destructive ? { color: 'error.main' } : undefined}
            onClick={() => {
              setAnchor(null);
              item.onSelect();
            }}
          >
            {item.icon ? <ListItemIcon sx={{ color: 'inherit' }}>{item.icon}</ListItemIcon> : null}
            <ListItemText>{item.label}</ListItemText>
          </MenuItem>,
        ])}
      </Menu>
    </>
  );
}
