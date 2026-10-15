import Button from '@mui/material/Button';
import type { Meta, StoryObj } from '@storybook/react-vite';
import { ToastProvider, useToast, type ToastMessage } from 'src/components/Toast';

const meta = {
  title: 'Primitives/Toast',
  component: ToastProvider,
  // AppProviders already mounts a ToastProvider around every story; these call it.
  args: { children: null },
  argTypes: { children: { control: false } },
} satisfies Meta<typeof ToastProvider>;

export default meta;
type Story = StoryObj<typeof meta>;

function Trigger({ toast, label }: { toast: ToastMessage; label: string }) {
  const { add } = useToast();
  return (
    <Button variant="outlined" onClick={() => add(toast)}>
      {label}
    </Button>
  );
}

/** A one-line confirmation after an action that finished in the background. */
export const TitleOnly: Story = {
  render: () => <Trigger label="Copy link" toast={{ title: 'Link copied' }} />,
};

/** A confirmation with one line of detail under the title. */
export const WithDescription: Story = {
  render: () => <Trigger label="Export" toast={{ title: 'Export ready', description: 'meters.csv saved to your downloads.' }} />,
};
