import FormControl from '@mui/material/FormControl';
import FormHelperText from '@mui/material/FormHelperText';
import InputLabel from '@mui/material/InputLabel';
import MenuItem from '@mui/material/MenuItem';
import Select from '@mui/material/Select';
import Stack from '@mui/material/Stack';
import TextField from '@mui/material/TextField';
import type { Meta, StoryObj } from '@storybook/react-vite';
import { expect, fn, screen } from 'storybook/test';

/**
 * MUI's `Select` with `MenuItem` options, used as MUI documents them. Kilowatt has no
 * wrapper: the theme's departures (Foundations → MUI departures) are the only differences
 * from stock MUI.
 */
const meta = {
  title: 'Components/Select',
  component: Select,
  tags: ['!autodocs'],
  // The MUI components this page documents; docs.test.ts checks its MUI departures section against them.
  parameters: { muiComponents: ['Select', 'MenuItem'] },
  argTypes: {
    size: { control: 'inline-radio', options: ['small', 'medium'] },
    onChange: { control: false },
  },
} satisfies Meta<typeof Select>;

export default meta;
type Story = StoryObj<typeof meta>;

const statuses = ['Open', 'In Progress', 'On Hold', 'Closed'];

/** One choice from a short fixed list: `FormControl`, `InputLabel` and `Select`, with the same `label` on both. */
export const Basic: Story = {
  args: { onChange: fn() },
  render: (args) => (
    <FormControl sx={{ minWidth: 200 }}>
      <InputLabel id="status-label">Status</InputLabel>
      <Select {...args} labelId="status-label" label="Status" defaultValue="Open">
        {statuses.map((status) => (
          <MenuItem key={status} value={status}>
            {status}
          </MenuItem>
        ))}
      </Select>
    </FormControl>
  ),
  play: async ({ args, canvas, userEvent }) => {
    await userEvent.click(canvas.getByRole('combobox', { name: 'Status' }));
    await userEvent.click(await screen.findByRole('option', { name: 'On Hold' }));
    await expect(args.onChange).toHaveBeenCalledOnce();
    await expect(canvas.getByRole('combobox', { name: 'Status' })).toHaveTextContent('On Hold');
  },
};

/** The same select through `TextField` with `select`: one component for the label, the select and helper text. */
export const TextFieldSelect: Story = {
  name: 'TextField select',
  render: () => (
    <TextField
      select
      label="Status"
      defaultValue="Open"
      helperText="Who can see the ticket depends on its status."
      sx={{ minWidth: 200 }}
    >
      {statuses.map((status) => (
        <MenuItem key={status} value={status}>
          {status}
        </MenuItem>
      ))}
    </TextField>
  ),
};

/** Several choices from a short list: `multiple`, with an array value. Show the choices joined in `renderValue`. */
export const Multiple: Story = {
  render: () => (
    <FormControl sx={{ width: 300 }}>
      <InputLabel id="statuses-label">Statuses</InputLabel>
      <Select
        labelId="statuses-label"
        label="Statuses"
        multiple
        defaultValue={['Open', 'In Progress']}
        renderValue={(selected) => selected.join(', ')}
      >
        {statuses.map((status) => (
          <MenuItem key={status} value={status}>
            {status}
          </MenuItem>
        ))}
      </Select>
    </FormControl>
  ),
};

/** A required choice nobody made: `error` on the `FormControl`, with `FormHelperText` that says what to pick. */
export const Failed: Story = {
  render: () => (
    <FormControl error required sx={{ minWidth: 200 }}>
      <InputLabel id="priority-label">Priority</InputLabel>
      <Select labelId="priority-label" label="Priority" defaultValue="">
        <MenuItem value="low">Low</MenuItem>
        <MenuItem value="medium">Medium</MenuItem>
        <MenuItem value="high">High</MenuItem>
      </Select>
      <FormHelperText>Choose a priority to dispatch the ticket.</FormHelperText>
    </FormControl>
  ),
};

/** A choice that can't be changed here: `disabled` on the `FormControl`. Say nearby why it's locked. */
export const Disabled: Story = {
  render: () => (
    <FormControl disabled sx={{ minWidth: 200 }}>
      <InputLabel id="locked-label">Status</InputLabel>
      <Select labelId="locked-label" label="Status" defaultValue="Closed">
        {statuses.map((status) => (
          <MenuItem key={status} value={status}>
            {status}
          </MenuItem>
        ))}
      </Select>
    </FormControl>
  ),
};

/** MUI's two sizes, set on the `FormControl`. Keep `medium`, the default; `small` is for a one-off instance. */
export const Sizes: Story = {
  render: () => (
    <Stack direction="row" spacing={2} sx={{ alignItems: 'center' }}>
      {(['small', 'medium'] as const).map((size) => (
        <FormControl key={size} size={size} sx={{ minWidth: 160 }}>
          <InputLabel id={`size-${size}-label`}>{size === 'small' ? 'Small' : 'Medium'}</InputLabel>
          <Select labelId={`size-${size}-label`} label={size === 'small' ? 'Small' : 'Medium'} defaultValue="Open">
            {statuses.map((status) => (
              <MenuItem key={status} value={status}>
                {status}
              </MenuItem>
            ))}
          </Select>
        </FormControl>
      ))}
    </Stack>
  ),
};
