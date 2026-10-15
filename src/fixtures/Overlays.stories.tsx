import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Dialog from '@mui/material/Dialog';
import DialogActions from '@mui/material/DialogActions';
import DialogContent from '@mui/material/DialogContent';
import DialogContentText from '@mui/material/DialogContentText';
import DialogTitle from '@mui/material/DialogTitle';
import Divider from '@mui/material/Divider';
import IconButton from '@mui/material/IconButton';
import Menu from '@mui/material/Menu';
import MenuItem from '@mui/material/MenuItem';
import Popover from '@mui/material/Popover';
import Snackbar from '@mui/material/Snackbar';
import Tooltip from '@mui/material/Tooltip';
import Typography from '@mui/material/Typography';
import type { Meta, StoryObj } from '@storybook/react-vite';
import { Fragment, useId, useState } from 'react';
import { fn } from 'storybook/test';
import { XIcon } from 'src/icons';

/** Content that floats over the page: MUI's Menu, Tooltip, Popover, Dialog and Snackbar as themed. There are no wrapper components. */
const meta = {
  title: 'Primitives/Overlays',
  tags: ['!autodocs'],
} satisfies Meta;

export default meta;

type MenuArgs = { itemCount: number; dividerBeforeLast: boolean; disabledFirst: boolean; onSelect: (item: string) => void };
type TooltipArgs = { text: string; placement: 'top' | 'bottom' | 'left' | 'right' };
type TextArgs = { title: string; description: string };
type DialogArgs = TextArgs & { primaryAction: string; onConfirm: () => void };
type SnackbarArgs = { message: string; autoHideDuration: number };

const callback = { control: false } as const;

function MenuDemo({ itemCount, dividerBeforeLast, disabledFirst, onSelect }: MenuArgs) {
  const id = useId();
  const [anchor, setAnchor] = useState<HTMLElement | null>(null);
  const items = Array.from({ length: Math.max(1, itemCount) }, (_, index) => `Action ${index + 1}`);
  const close = () => setAnchor(null);
  return (
    <>
      <Button
        variant="outlined"
        id={`${id}-button`}
        aria-controls={anchor ? `${id}-menu` : undefined}
        aria-haspopup="true"
        aria-expanded={anchor ? 'true' : undefined}
        onClick={(event) => setAnchor(event.currentTarget)}
      >
        Actions
      </Button>
      <Menu
        id={`${id}-menu`}
        anchorEl={anchor}
        open={Boolean(anchor)}
        onClose={close}
        slotProps={{ list: { 'aria-labelledby': `${id}-button` } }}
      >
        {items.map((item, index) => (
          <Fragment key={item}>
            {dividerBeforeLast && index === items.length - 1 && items.length > 1 ? <Divider /> : null}
            <MenuItem
              disabled={disabledFirst && index === 0}
              onClick={() => {
                onSelect(item);
                close();
              }}
            >
              {item}
            </MenuItem>
          </Fragment>
        ))}
      </Menu>
    </>
  );
}

/** A list of actions behind one button: `Menu` anchored to the button, with a `Divider` before a destructive or rare action. */
export const MenuRecipe: StoryObj<MenuArgs> = {
  name: 'Menu',
  args: { itemCount: 3, dividerBeforeLast: true, disabledFirst: false, onSelect: fn() },
  argTypes: { itemCount: { control: { type: 'range', min: 1, max: 8 } }, onSelect: callback },
  render: (args) => <MenuDemo {...args} />,
};

/** A short, non-essential hint on hover or focus: `Tooltip` around the element. Never put the only copy of important information in one. */
export const TooltipRecipe: StoryObj<TooltipArgs> = {
  name: 'Tooltip',
  args: { text: 'Last 15-minute interval: 412 kW', placement: 'top' },
  argTypes: { placement: { control: 'inline-radio', options: ['top', 'bottom', 'left', 'right'] } },
  render: ({ text, placement }) => (
    <Box sx={{ p: 6 }}>
      <Tooltip title={text} placement={placement} arrow describeChild>
        <Button variant="outlined">Demand peak</Button>
      </Tooltip>
    </Box>
  ),
};

function PopoverDemo({ title, description }: TextArgs) {
  const id = useId();
  const [anchor, setAnchor] = useState<HTMLElement | null>(null);
  return (
    <>
      <Button variant="outlined" aria-describedby={anchor ? id : undefined} onClick={(event) => setAnchor(event.currentTarget)}>
        Notifications
      </Button>
      <Popover
        id={id}
        open={Boolean(anchor)}
        anchorEl={anchor}
        onClose={() => setAnchor(null)}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'left' }}
      >
        <Box sx={{ p: 2, maxWidth: 320 }}>
          <Typography variant="subtitle2" component="h2">
            {title}
          </Typography>
          <Typography variant="body2" color="text.secondary">
            {description}
          </Typography>
        </Box>
      </Popover>
    </>
  );
}

/** Extra detail the user opens on click and can interact with: `Popover` anchored to the button, with a title and description. */
export const PopoverRecipe: StoryObj<TextArgs> = {
  name: 'Popover',
  args: { title: 'Queue', description: '3 open tickets, none past SLA.' },
  render: (args) => <PopoverDemo {...args} />,
};

function DialogDemo({ title, description, primaryAction, onConfirm }: DialogArgs) {
  const id = useId();
  const [open, setOpen] = useState(false);
  const close = () => setOpen(false);
  return (
    <>
      <Button variant="outlined" onClick={() => setOpen(true)}>
        Open dialog
      </Button>
      <Dialog open={open} onClose={close} aria-labelledby={`${id}-title`} aria-describedby={`${id}-description`}>
        <DialogTitle id={`${id}-title`}>{title}</DialogTitle>
        <DialogContent>
          <DialogContentText id={`${id}-description`}>{description}</DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={close}>Cancel</Button>
          <Button
            variant="contained"
            onClick={() => {
              onConfirm();
              close();
            }}
          >
            {primaryAction}
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
}

/** A focused task that blocks the page until done or cancelled: `Dialog` with a title, content and a Cancel and primary action. */
export const DialogRecipe: StoryObj<DialogArgs> = {
  name: 'Dialog',
  args: {
    title: 'Confirm export',
    description: 'Export the last 30 days of interval data for 120 Broadway.',
    primaryAction: 'Export',
    onConfirm: fn(),
  },
  argTypes: { onConfirm: callback },
  render: (args) => <DialogDemo {...args} />,
};

function AlertDialogDemo({ title, description, primaryAction, onConfirm }: DialogArgs) {
  const id = useId();
  const [open, setOpen] = useState(false);
  const close = () => setOpen(false);
  return (
    <>
      <Button variant="outlined" color="error" onClick={() => setOpen(true)}>
        Delete ticket
      </Button>
      <Dialog
        open={open}
        role="alertdialog"
        onClose={(_event, reason) => {
          // The user must choose: an outside click does not close it. Escape still cancels.
          if (reason !== 'backdropClick') close();
        }}
        aria-labelledby={`${id}-title`}
        aria-describedby={`${id}-description`}
      >
        <DialogTitle id={`${id}-title`}>{title}</DialogTitle>
        <DialogContent>
          <DialogContentText id={`${id}-description`}>{description}</DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={close} autoFocus>
            Keep
          </Button>
          <Button
            variant="contained"
            color="error"
            onClick={() => {
              onConfirm();
              close();
            }}
          >
            {primaryAction}
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
}

/** Confirming a destructive or irreversible action: a `Dialog` with `role="alertdialog"` that ignores outside clicks, focus on the safe choice. */
export const AlertDialogRecipe: StoryObj<DialogArgs> = {
  name: 'Alert dialog',
  args: {
    title: 'Delete T-1842?',
    description: 'This removes the AHU-3 vibration ticket. This cannot be undone.',
    primaryAction: 'Delete',
    onConfirm: fn(),
  },
  argTypes: { onConfirm: callback },
  render: (args) => <AlertDialogDemo {...args} />,
};

function SnackbarDemo({ message, autoHideDuration }: SnackbarArgs) {
  const [open, setOpen] = useState(false);
  const close = (_event?: unknown, reason?: string) => {
    if (reason !== 'clickaway') setOpen(false);
  };
  return (
    <>
      <Button variant="outlined" onClick={() => setOpen(true)}>
        Export CSV
      </Button>
      <Snackbar
        open={open}
        autoHideDuration={autoHideDuration}
        onClose={close}
        message={message}
        action={
          <IconButton aria-label="Dismiss" color="inherit" size="small" onClick={() => close()}>
            <XIcon />
          </IconButton>
        }
      />
    </>
  );
}

/** Brief confirmation that something happened in the background: `Snackbar` with a `message`, a dismiss button and `autoHideDuration`. */
export const SnackbarRecipe: StoryObj<SnackbarArgs> = {
  name: 'Snackbar',
  args: { message: 'Export queued: 30-day interval CSV for 120 Broadway.', autoHideDuration: 5000 },
  render: (args) => <SnackbarDemo {...args} />,
};
