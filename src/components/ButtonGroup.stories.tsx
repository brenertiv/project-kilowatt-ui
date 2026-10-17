import Button from '@mui/material/Button';
import ButtonGroup from '@mui/material/ButtonGroup';
import Menu from '@mui/material/Menu';
import MenuItem from '@mui/material/MenuItem';
import Stack from '@mui/material/Stack';
import type { Meta, StoryObj } from '@storybook/react-vite';
import { useRef, useState } from 'react';
import { expect, screen } from 'storybook/test';
import { Icon } from 'src/icons';

/**
 * MUI's `ButtonGroup`, used as MUI documents it. Kilowatt has no wrapper: the theme's
 * departures (Foundations → MUI departures) are the only differences from stock MUI. The
 * buttons inside are `Button`s and follow the Button page.
 */
const meta = {
  title: 'Components/ButtonGroup',
  component: ButtonGroup,
  tags: ['!autodocs'],
  // The MUI components this page documents; docs.test.ts checks its MUI departures section against them.
  parameters: { muiComponents: ['ButtonGroup'] },
  args: { 'aria-label': 'Report actions' },
  argTypes: {
    variant: { control: 'inline-radio', options: ['contained', 'outlined', 'text'] },
    orientation: { control: 'inline-radio', options: ['horizontal', 'vertical'] },
    size: { control: 'inline-radio', options: ['small', 'medium', 'large'] },
  },
} satisfies Meta<typeof ButtonGroup>;

export default meta;
type Story = StoryObj<typeof meta>;

const actions = (
  <>
    <Button>Preview</Button>
    <Button>Download</Button>
    <Button>Share</Button>
  </>
);

/** Related actions of equal weight side by side: MUI's default `outlined` variant. */
export const Outlined: Story = {
  args: { children: actions },
};

/** The same group at high emphasis: `variant="contained"`. Use it only for the view's main actions. */
export const Contained: Story = {
  args: { variant: 'contained', children: actions },
};

/** A low-emphasis group for toolbars: `variant="text"`. */
export const Text: Story = {
  args: { variant: 'text', children: actions },
};

/** A stacked group: `orientation="vertical"`. */
export const Vertical: Story = {
  args: { orientation: 'vertical', children: actions },
};

/** MUI's three sizes, set once on the group. Keep `medium`, the default; another size is for a one-off instance. */
export const Sizes: Story = {
  render: (args) => (
    <Stack spacing={2} sx={{ alignItems: 'flex-start' }}>
      {(['small', 'medium', 'large'] as const).map((size) => (
        <ButtonGroup key={size} {...args} size={size} aria-label={`Report actions (${size})`}>
          {actions}
        </ButtonGroup>
      ))}
    </Stack>
  ),
};

const exports = ['Export CSV', 'Export PDF', 'Export XLSX'];

/** A main action with alternatives: a split button, a `Button` beside an icon-only one that opens a `Menu`. */
export const SplitButton: Story = {
  name: 'Split button',
  render: function Render(args) {
    const anchor = useRef<HTMLDivElement>(null);
    const [open, setOpen] = useState(false);
    const [selected, setSelected] = useState(0);
    return (
      <>
        <ButtonGroup {...args} ref={anchor} variant="contained" aria-label="Export">
          <Button>{exports[selected]}</Button>
          <Button
            aria-label="Choose export format"
            aria-haspopup="menu"
            aria-expanded={open}
            onClick={() => setOpen(true)}
          >
            <Icon name="expand_more" />
          </Button>
        </ButtonGroup>
        <Menu anchorEl={anchor.current} open={open} onClose={() => setOpen(false)}>
          {exports.map((label, index) => (
            <MenuItem
              key={label}
              selected={index === selected}
              onClick={() => {
                setSelected(index);
                setOpen(false);
              }}
            >
              {label}
            </MenuItem>
          ))}
        </Menu>
      </>
    );
  },
  play: async ({ canvas, userEvent }) => {
    await userEvent.click(canvas.getByRole('button', { name: 'Choose export format' }));
    await userEvent.click(await screen.findByRole('menuitem', { name: 'Export PDF' }));
    await expect(canvas.getByRole('button', { name: 'Export PDF' })).toBeVisible();
  },
};

/** A group that isn't available: `disabled` on the group disables every button. Say nearby why. */
export const Disabled: Story = {
  args: { disabled: true, children: actions },
};
