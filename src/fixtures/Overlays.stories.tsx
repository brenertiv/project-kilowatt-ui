import { AlertDialog } from '@base-ui/react/alert-dialog';
import { Button } from '@base-ui/react/button';
import { Dialog } from '@base-ui/react/dialog';
import { Menu } from '@base-ui/react/menu';
import { Popover } from '@base-ui/react/popover';
import { Toast } from '@base-ui/react/toast';
import { Tooltip } from '@base-ui/react/tooltip';
import type { Meta, StoryObj } from '@storybook/react-vite';

/** Recipes for content that floats over the page, over Base UI. There are no wrapper components: copy the markup and classes. */
const meta = {
  title: 'Primitives/Overlays',
  tags: ['!autodocs'],
} satisfies Meta;

export default meta;

type MenuArgs = { itemCount: number; separatorBeforeLast: boolean; disabledFirst: boolean };
type TooltipArgs = { text: string; side: 'top' | 'bottom' | 'left' | 'right' };
type TextArgs = { title: string; description: string };
type DialogArgs = TextArgs & { primaryAction: string };
type ToastArgs = TextArgs & { timeout: number };

/** A list of actions behind one button: `ui-positioner` > `ui-popup` of `ui-item`, with `ui-separator` before a destructive or rare action. */
export const MenuRecipe: StoryObj<MenuArgs> = {
  name: 'Menu',
  args: { itemCount: 3, separatorBeforeLast: true, disabledFirst: false },
  argTypes: { itemCount: { control: { type: 'range', min: 1, max: 8 } } },
  render: ({ itemCount, separatorBeforeLast, disabledFirst }) => {
    const items = Array.from({ length: Math.max(1, itemCount) }, (_, index) => `Action ${index + 1}`);
    return (
      <Menu.Root>
        <Menu.Trigger className="ui-btn">Actions</Menu.Trigger>
        <Menu.Portal>
          <Menu.Positioner className="ui-positioner" sideOffset={4}>
            <Menu.Popup className="ui-popup">
              {items.map((item, index) => (
                <div key={item}>
                  {separatorBeforeLast && index === items.length - 1 && items.length > 1 ? <Menu.Separator className="ui-separator" /> : null}
                  <Menu.Item className="ui-item" disabled={disabledFirst && index === 0}>
                    {item}
                  </Menu.Item>
                </div>
              ))}
            </Menu.Popup>
          </Menu.Positioner>
        </Menu.Portal>
      </Menu.Root>
    );
  },
};

/** A short, non-essential hint on hover or focus: `ui-tooltip`. Never put the only copy of important information in one. */
export const TooltipRecipe: StoryObj<TooltipArgs> = {
  name: 'Tooltip',
  args: { text: 'Last 15-minute interval: 412 kW', side: 'top' },
  argTypes: { side: { control: 'inline-radio', options: ['top', 'bottom', 'left', 'right'] } },
  render: ({ text, side }) => (
    <Tooltip.Root>
      <Tooltip.Trigger className="ui-btn">Demand peak</Tooltip.Trigger>
      <Tooltip.Portal>
        <Tooltip.Positioner className="ui-positioner" side={side} sideOffset={6}>
          <Tooltip.Popup className="ui-tooltip">{text}</Tooltip.Popup>
        </Tooltip.Positioner>
      </Tooltip.Portal>
    </Tooltip.Root>
  ),
};

/** Extra detail the user opens on click and can interact with: `ui-popup ui-popup-padded` with an arrow, title and description. */
export const PopoverRecipe: StoryObj<TextArgs> = {
  name: 'Popover',
  args: { title: 'Queue', description: '3 open tickets, none past SLA.' },
  render: ({ title, description }) => (
    <Popover.Root>
      <Popover.Trigger className="ui-btn">Notifications</Popover.Trigger>
      <Popover.Portal>
        <Popover.Positioner className="ui-positioner" sideOffset={8}>
          <Popover.Popup className="ui-popup ui-popup-padded">
            <Popover.Arrow className="ui-arrow" />
            <Popover.Title className="ui-popup-title">{title}</Popover.Title>
            <Popover.Description className="ui-description">{description}</Popover.Description>
          </Popover.Popup>
        </Popover.Positioner>
      </Popover.Portal>
    </Popover.Root>
  ),
};

/** A focused task that blocks the page until done or cancelled: `ui-backdrop`, `ui-dialog-viewport` and `ui-dialog`. */
export const DialogRecipe: StoryObj<DialogArgs> = {
  name: 'Dialog',
  args: {
    title: 'Confirm export',
    description: 'Export the last 30 days of interval data for 120 Broadway.',
    primaryAction: 'Export',
  },
  render: ({ title, description, primaryAction }) => (
    <Dialog.Root>
      <Dialog.Trigger className="ui-btn">Open dialog</Dialog.Trigger>
      <Dialog.Portal>
        <Dialog.Backdrop className="ui-backdrop" />
        <Dialog.Viewport className="ui-dialog-viewport">
          <Dialog.Popup className="ui-dialog">
            <Dialog.Title className="ui-dialog-title">{title}</Dialog.Title>
            <Dialog.Description className="ui-description">{description}</Dialog.Description>
            <div className="ui-dialog-actions">
              <Dialog.Close className="ui-btn">Cancel</Dialog.Close>
              <Dialog.Close className="ui-btn ui-btn-solid">{primaryAction}</Dialog.Close>
            </div>
          </Dialog.Popup>
        </Dialog.Viewport>
      </Dialog.Portal>
    </Dialog.Root>
  ),
};

/** Confirming a destructive or irreversible action: `AlertDialog` with the same classes as a dialog; it does not close on outside click. */
export const AlertDialogRecipe: StoryObj<TextArgs> = {
  name: 'Alert dialog',
  args: { title: 'Delete T-1842?', description: 'This removes the AHU-3 vibration ticket. This cannot be undone.' },
  render: ({ title, description }) => (
    <AlertDialog.Root>
      <AlertDialog.Trigger className="ui-btn">Delete ticket</AlertDialog.Trigger>
      <AlertDialog.Portal>
        <AlertDialog.Backdrop className="ui-backdrop" />
        <AlertDialog.Viewport className="ui-dialog-viewport">
          <AlertDialog.Popup className="ui-dialog">
            <AlertDialog.Title className="ui-dialog-title">{title}</AlertDialog.Title>
            <AlertDialog.Description className="ui-description">{description}</AlertDialog.Description>
            <div className="ui-dialog-actions">
              <AlertDialog.Close className="ui-btn">Keep</AlertDialog.Close>
              <AlertDialog.Close className="ui-btn ui-btn-solid">Delete</AlertDialog.Close>
            </div>
          </AlertDialog.Popup>
        </AlertDialog.Viewport>
      </AlertDialog.Portal>
    </AlertDialog.Root>
  ),
};

/** Brief confirmation that something happened in the background: call `Toast.useToastManager().add()`; the app's toast outlet renders it. */
export const ToastRecipe: StoryObj<ToastArgs> = {
  name: 'Toast',
  args: { title: 'Export queued', description: '30-day interval CSV for 120 Broadway.', timeout: 5000 },
  render: function ShowToast({ title, description, timeout }) {
    const toastManager = Toast.useToastManager();
    return (
      <Button className="ui-btn" onClick={() => toastManager.add({ title, description, timeout })}>
        Show toast
      </Button>
    );
  },
};
