import Card from '@mui/material/Card';
import CardHeader from '@mui/material/CardHeader';
import IconButton from '@mui/material/IconButton';
import type { Meta, StoryObj } from '@storybook/react-vite';
import { expect, screen, waitFor } from 'storybook/test';
import { TruncatedText } from 'src/components/TruncatedText';
import { Icon } from 'src/icons';

/**
 * Kilowatt's `TruncatedText`: one line that truncates, with MUI's `Tooltip` showing the full text only
 * when it's cut off. Each story shows it as a `CardHeader` title, where it's used most.
 */
const meta = {
  title: 'Data display/TruncatedText',
  component: TruncatedText,
  tags: ['!autodocs'],
  // The MUI components this page documents; docs.test.ts checks its MUI departures section against them.
  parameters: { muiComponents: ['Tooltip', 'Typography'] },
  args: { children: 'Energy Use' },
  render: (args) => (
    <Card variant="outlined" sx={{ maxWidth: 280 }}>
      <CardHeader
        title={<TruncatedText {...args} />}
        action={
          <IconButton aria-label="Chart options">
            <Icon name="more_horiz" fontSize="inherit" />
          </IconButton>
        }
      />
    </Card>
  ),
} satisfies Meta<typeof TruncatedText>;

export default meta;
type Story = StoryObj<typeof meta>;

/** Text that fits: it reads as plain text, with no tooltip and no tab stop. */
export const Fits: Story = {
  play: async ({ canvas, userEvent }) => {
    const title = canvas.getByText('Energy Use');
    await expect(title).not.toHaveAttribute('tabindex');
    await userEvent.hover(title);
    await expect(screen.queryByRole('tooltip')).toBeNull();
  },
};

/** Text that doesn't fit: an ellipsis, and the full text in a tooltip on hover and keyboard focus. */
export const Truncated: Story = {
  args: { children: 'Energy Use by Floor, Tenant Submeters and Common Areas' },
  play: async ({ args, canvas, userEvent }) => {
    const title = canvas.getByText(args.children);
    await waitFor(() => expect(title).toHaveAttribute('tabindex', '0'));
    await userEvent.tab();
    await expect(title).toHaveFocus();
    await expect(await screen.findByRole('tooltip')).toHaveTextContent(args.children);
  },
};
