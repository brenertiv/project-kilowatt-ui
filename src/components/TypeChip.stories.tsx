import { useState } from 'react';
import Chip from '@mui/material/Chip';
import List from '@mui/material/List';
import ListItem from '@mui/material/ListItem';
import ListItemIcon from '@mui/material/ListItemIcon';
import ListItemText from '@mui/material/ListItemText';
import Stack from '@mui/material/Stack';
import type { Meta, StoryObj } from '@storybook/react-vite';
import { expect } from 'storybook/test';
import { workspaceTypeSlots } from 'src/charts/meanings';
import { TypeChip, TypeFilterChip } from 'src/components/TypeChip';
import type { IconName } from 'src/icons';

/** The three workspace types, by name, with their icons. */
const types: { name: string; plural: string; icon: IconName }[] = [
  { name: 'Dashboard', plural: 'Dashboards', icon: 'dashboard' },
  { name: 'Report', plural: 'Reports', icon: 'description' },
  { name: 'Plan', plural: 'Plans', icon: 'trending_down' },
];

/**
 * Kilowatt's `TypeChip`: a type's icon in its `chart.series` slot's color, on a tint of it. The workspace types take
 * their slots from `workspaceTypeSlots`.
 */
const meta = {
  title: 'Data display/Type chip',
  component: TypeChip,
  tags: ['!autodocs'],
  // The MUI components this page documents; docs.test.ts checks its MUI departures section against them.
  parameters: { muiComponents: ['Box', 'Chip'] },
  args: { slot: workspaceTypeSlots.Dashboard, icon: 'dashboard' },
} satisfies Meta<typeof TypeChip>;

export default meta;
type Story = StoryObj<typeof meta>;

/** A Dashboard's chip: the first series slot. */
export const Dashboard: Story = {};

/** Every workspace type beside its name, in a list: the color rides on the icon, the name says the type. */
export const InAList: Story = {
  render: () => (
    <List aria-label="Recent workspaces" sx={{ maxWidth: 320 }}>
      {[
        ['Energy Overview', 0],
        ['Monthly Update', 1],
        ['Carbon Plan', 2],
      ].map(([name, i]) => {
        const type = types[i as number];
        return (
          <ListItem key={name}>
            <ListItemIcon>
              <TypeChip slot={workspaceTypeSlots[type.name]} icon={type.icon} />
            </ListItemIcon>
            <ListItemText primary={name} secondary={type.name} />
          </ListItem>
        );
      })}
    </List>
  ),
  play: async ({ canvas }) => {
    await expect(canvas.getByText('Report')).toBeVisible();
  },
};

/** The filter row, holding which type is chosen. */
function TypeFilter() {
  const [kind, setKind] = useState<string>('All');
  return (
    <Stack direction="row" role="group" aria-label="Filter Templates by Type" sx={{ gap: 1, flexWrap: 'wrap' }}>
      <Chip label="All" variant={kind === 'All' ? 'filled' : 'outlined'} onClick={() => setKind('All')} aria-pressed={kind === 'All'} />
      {types.map((type) => (
        <TypeFilterChip key={type.name} label={type.plural} slot={workspaceTypeSlots[type.name]} icon={type.icon} selected={kind === type.name} onClick={() => setKind(type.name)} />
      ))}
    </Stack>
  );
}

/** A gallery's type filter: All as MUI's plain chip, then a `TypeFilterChip` per type, the chosen one tinted. */
export const FilterChips: Story = {
  render: () => <TypeFilter />,
  play: async ({ canvas, userEvent }) => {
    await userEvent.click(canvas.getByRole('button', { name: 'Reports' }));
    await expect(canvas.getByRole('button', { name: 'Reports' })).toHaveAttribute('aria-pressed', 'true');
    await expect(canvas.getByRole('button', { name: 'All' })).toHaveAttribute('aria-pressed', 'false');
  },
};
