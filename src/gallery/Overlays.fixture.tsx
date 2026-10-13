import { AlertDialog } from '@base-ui/react/alert-dialog';
import { Button } from '@base-ui/react/button';
import { Dialog } from '@base-ui/react/dialog';
import { Menu } from '@base-ui/react/menu';
import { Popover } from '@base-ui/react/popover';
import { Toast } from '@base-ui/react/toast';
import { Tooltip } from '@base-ui/react/tooltip';
import { useFixtureInput, useFixtureSelect } from 'react-cosmos/client';

function MenuFixture() {
  const [count] = useFixtureInput('item count', 3);
  const [separator] = useFixtureInput('separator before last', true);
  const [disabledFirst] = useFixtureInput('disabled first item', false);
  const items = Array.from({ length: Math.max(1, Math.min(8, count)) }, (_, index) => `Action ${index + 1}`);
  return (
    <Menu.Root>
      <Menu.Trigger className="ui-btn">Actions</Menu.Trigger>
      <Menu.Portal>
        <Menu.Positioner className="ui-positioner" sideOffset={4}>
          <Menu.Popup className="ui-popup">
            {items.map((item, index) => (
              <div key={item}>
                {separator && index === items.length - 1 && items.length > 1 ? <Menu.Separator className="ui-separator" /> : null}
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
}

function TooltipFixture() {
  const [text] = useFixtureInput('text', 'Last 15-minute interval: 412 kW');
  const [side] = useFixtureSelect('side', { options: [...(['top', 'bottom', 'left', 'right'] as const)] });
  const [open, setOpen] = useFixtureInput('open', false);
  return (
    <Tooltip.Root open={open} onOpenChange={setOpen}>
      <Tooltip.Trigger className="ui-btn">Demand peak</Tooltip.Trigger>
      <Tooltip.Portal>
        <Tooltip.Positioner className="ui-positioner" side={side} sideOffset={6}>
          <Tooltip.Popup className="ui-tooltip">{text}</Tooltip.Popup>
        </Tooltip.Positioner>
      </Tooltip.Portal>
    </Tooltip.Root>
  );
}

function PopoverFixture() {
  const [title] = useFixtureInput('title', 'Queue');
  const [description] = useFixtureInput('description', '3 open tickets, none past SLA.');
  const [open, setOpen] = useFixtureInput('open', false);
  return (
    <Popover.Root open={open} onOpenChange={setOpen}>
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
  );
}

function DialogFixture() {
  const [open, setOpen] = useFixtureInput('open', false);
  const [title] = useFixtureInput('title', 'Confirm export');
  const [description] = useFixtureInput('description', 'Export the last 30 days of interval data for 120 Broadway.');
  const [primary] = useFixtureInput('primary action', 'Export');
  return (
    <Dialog.Root open={open} onOpenChange={setOpen}>
      <Dialog.Trigger className="ui-btn">Open dialog</Dialog.Trigger>
      <Dialog.Portal>
        <Dialog.Backdrop className="ui-backdrop" />
        <Dialog.Viewport className="ui-dialog-viewport">
          <Dialog.Popup className="ui-dialog">
            <Dialog.Title className="ui-dialog-title">{title}</Dialog.Title>
            <Dialog.Description className="ui-description">{description}</Dialog.Description>
            <div className="demo-row demo-end">
              <Dialog.Close className="ui-btn">Cancel</Dialog.Close>
              <Dialog.Close className="ui-btn ui-btn-solid">{primary}</Dialog.Close>
            </div>
          </Dialog.Popup>
        </Dialog.Viewport>
      </Dialog.Portal>
    </Dialog.Root>
  );
}

function AlertDialogFixture() {
  const [open, setOpen] = useFixtureInput('open', false);
  const [title] = useFixtureInput('title', 'Delete T-1842?');
  const [description] = useFixtureInput('description', 'This removes the AHU-3 vibration ticket. This cannot be undone.');
  return (
    <AlertDialog.Root open={open} onOpenChange={setOpen}>
      <AlertDialog.Trigger className="ui-btn">Delete ticket</AlertDialog.Trigger>
      <AlertDialog.Portal>
        <AlertDialog.Backdrop className="ui-backdrop" />
        <AlertDialog.Viewport className="ui-dialog-viewport">
          <AlertDialog.Popup className="ui-dialog">
            <AlertDialog.Title className="ui-dialog-title">{title}</AlertDialog.Title>
            <AlertDialog.Description className="ui-description">{description}</AlertDialog.Description>
            <div className="demo-row demo-end">
              <AlertDialog.Close className="ui-btn">Keep</AlertDialog.Close>
              <AlertDialog.Close className="ui-btn ui-btn-solid">Delete</AlertDialog.Close>
            </div>
          </AlertDialog.Popup>
        </AlertDialog.Viewport>
      </AlertDialog.Portal>
    </AlertDialog.Root>
  );
}

function ToastFixture() {
  const toastManager = Toast.useToastManager();
  const [title] = useFixtureInput('title', 'Export queued');
  const [description] = useFixtureInput('description', '30-day interval CSV for 120 Broadway.');
  const [timeout] = useFixtureInput('timeout ms', 5000);
  return (
    <Button className="ui-btn" onClick={() => toastManager.add({ title, description, timeout })}>
      Show toast
    </Button>
  );
}

export default {
  Menu: MenuFixture,
  Tooltip: TooltipFixture,
  Popover: PopoverFixture,
  Dialog: DialogFixture,
  'Alert dialog': AlertDialogFixture,
  Toast: ToastFixture,
};
