import Button from '@mui/material/Button';
import type { Meta, StoryObj } from '@storybook/react-vite';
import { FilterOffIcon, PlusIcon } from 'src/icons';
import { EmptyState } from 'src/components/data/EmptyState';

const meta = {
  title: 'Data/EmptyState',
  component: EmptyState,
  args: {
    title: 'No work orders',
    description: 'Work orders you create or are assigned to show up here.',
  },
  argTypes: {
    title: { control: 'text' },
    description: { control: 'text' },
    compact: { control: 'boolean' },
    icon: { control: false },
    action: { control: false },
  },
} satisfies Meta<typeof EmptyState>;

export default meta;
type Story = StoryObj<typeof meta>;

/** The request succeeded with nothing in it: say what would be here and why it is empty. Use full size for a page body. */
export const Default: Story = {};

/** With a call to action, when the user can fix the emptiness themselves, such as creating the first record. */
export const WithAction: Story = {
  args: {
    action: (
      <Button variant="contained" startIcon={<PlusIcon />}>
        New work order
      </Button>
    ),
  },
};

/** Compact, inside a card body or a list, where the full-height version would dominate. */
export const Compact: Story = {
  args: { compact: true, title: 'No alerts', description: 'Every meter is reporting on schedule.' },
};

/** A custom icon that says why it is empty, such as filters matching nothing. */
export const NoMatches: Story = {
  args: {
    icon: <FilterOffIcon size={32} />,
    title: 'No work orders match',
    description: 'Try a different search or clear the filters.',
  },
};

/** No props: the default "nothing here" copy. Prefer writing a specific title. */
export const DefaultCopy: Story = {
  args: { title: undefined, description: undefined },
};
