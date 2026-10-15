import type { Meta, StoryObj } from '@storybook/react-vite';
import { fn } from 'storybook/test';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import CardHeader from '@mui/material/CardHeader';
import Typography from '@mui/material/Typography';
import { CopyIcon, DeleteIcon, DownloadIcon } from 'src/icons';
import { CardMenu } from 'src/components/CardMenu';

const meta = {
  title: 'Menus/CardMenu',
  component: CardMenu,
  decorators: [
    (Story) => (
      // The menu lives in the action slot of a card header, top right.
      <Card sx={{ width: 320 }}>
        <CardHeader title="Monthly consumption" action={<Story />} slotProps={{ title: { component: 'h3' } }} />
        <CardContent>
          <Typography variant="body2" color="text.secondary">
            Open the menu to pick an action.
          </Typography>
        </CardContent>
      </Card>
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

/** An irreversible action goes last and is marked `destructive`, so it sits after a divider in the error color. */
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

/** Items with a leading `icon` from `src/icons.tsx`. Give every item an icon or none, so labels line up. */
export const WithIcons: Story = {
  args: {
    items: [
      { id: 'duplicate', label: 'Duplicate', icon: <CopyIcon />, onSelect: fn() },
      { id: 'export', label: 'Export CSV', icon: <DownloadIcon />, onSelect: fn() },
      { id: 'remove', label: 'Remove card', icon: <DeleteIcon />, onSelect: fn(), destructive: true },
    ],
  },
};
