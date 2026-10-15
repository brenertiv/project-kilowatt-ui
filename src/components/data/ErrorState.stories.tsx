import type { Meta, StoryObj } from '@storybook/react-vite';
import { fn } from 'storybook/test';
import { ErrorState } from './ErrorState';

const meta = {
  title: 'Data/ErrorState',
  component: ErrorState,
  args: {
    message: 'Work orders could not be loaded.',
    onRetry: fn(),
  },
  argTypes: {
    title: { control: 'text' },
    message: { control: 'text' },
    compact: { control: 'boolean' },
  },
} satisfies Meta<typeof ErrorState>;

export default meta;
type Story = StoryObj<typeof meta>;

/** The request failed and can be retried: the default title, the API's message, and a retry button. */
export const Default: Story = {};

/** No `onRetry`, when retrying cannot help, such as a permission error. Only the message shows. */
export const WithoutRetry: Story = {
  args: { onRetry: undefined, message: 'You do not have access to this building.' },
};

/** A specific title naming what failed, when the default title is too vague for the context. */
export const CustomTitle: Story = {
  args: { title: 'Readings unavailable', message: 'The meter has not reported since Monday.' },
};

/** Compact, inside a card body or a list, where the full-height version would dominate. */
export const Compact: Story = {
  args: { compact: true },
};
