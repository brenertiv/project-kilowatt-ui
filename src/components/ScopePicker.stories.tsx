import { useState } from 'react';
import Box from '@mui/material/Box';
import type { Meta, StoryObj } from '@storybook/react-vite';
import { expect, fn, screen, waitFor, within } from 'storybook/test';
import { ScopePicker, type Scope, type ScopeGroup, type ScopeProperty } from 'src/components/ScopePicker';
import highpoint1 from 'src/fixtures/images/highpoint-1.jpg';

/** The properties the user can access. */
const properties: ScopeProperty[] = [
  { id: 'highpoint-1', name: 'Highpoint 1', city: 'Denver, CO', address: '1600 Wynkoop Street', image: highpoint1 },
  { id: 'highpoint-2', name: 'Highpoint 2', city: 'Denver, CO', address: '1650 Wynkoop Street' },
  { id: 'mesa-commons', name: 'Mesa Commons', city: 'Phoenix, AZ', address: '40 East Washington Street' },
  { id: 'harbor-point', name: 'Harbor Point', city: 'Seattle, WA', address: '2001 Western Avenue' },
  { id: '120-broadway', name: '120 Broadway', city: 'New York, NY', address: '120 Broadway' },
  { id: '350-park', name: '350 Park Avenue', city: 'New York, NY', address: '350 Park Avenue' },
  { id: '55-water', name: '55 Water Street', city: 'New York, NY', address: '55 Water Street' },
  { id: 'lebanon-dc', name: 'Lebanon Distribution Center', city: 'Lebanon, TN', address: '1000 Darrell Waltrip Drive' },
];

/** Three groups; Harbor Point and 120 Broadway sit in two of them. */
const groups: ScopeGroup[] = [
  { id: 'west', name: 'West Region', propertyIds: ['highpoint-1', 'highpoint-2', 'mesa-commons', 'harbor-point'] },
  { id: 'east', name: 'East Region', propertyIds: ['120-broadway', '350-park', '55-water', 'lebanon-dc'] },
  { id: 'fund-2', name: 'Fund II', propertyIds: ['harbor-point', '120-broadway'] },
];

/**
 * Kilowatt's `ScopePicker`: the global scope as breadcrumbs of split buttons for AppShell's
 * `headerStart`, and the Change scope dialog its chevron opens. Each story holds the scope in state,
 * so choosing one updates the crumbs.
 */
const meta = {
  title: 'Navigation/ScopePicker',
  component: ScopePicker,
  tags: ['!autodocs'],
  // The MUI components this page documents; docs.test.ts checks its MUI departures section against them.
  parameters: { muiComponents: ['Breadcrumbs', 'Divider', 'Button', 'IconButton', 'Avatar', 'Dialog', 'TextField', 'List', 'ListItemButton', 'Chip', 'Tooltip'] },
  args: { groups, properties, value: { level: 'portfolio' }, onChange: () => {} },
  render: function Render(args) {
    const [value, setValue] = useState<Scope>(args.value);
    return (
      <ScopePicker
        {...args}
        value={value}
        onChange={(scope) => {
          setValue(scope);
          args.onChange(scope);
        }}
      />
    );
  },
} satisfies Meta<typeof ScopePicker>;

export default meta;
type Story = StoryObj<typeof meta>;

/** The whole portfolio: “All properties”. The chevron opens Change scope, on the current scope. */
export const Portfolio: Story = {
  play: async ({ canvas, userEvent }) => {
    await userEvent.click(canvas.getByRole('button', { name: 'Change portfolio' }));
    const dialog = await screen.findByRole('dialog', { name: 'Change scope' });
    await expect(within(dialog).getByRole('textbox', { name: 'Search by name, address or city' })).toHaveFocus();
  },
};

/** One group: “Portfolio” above its name. Click the name or the chevron to change scope. */
export const Group: Story = {
  args: { value: { level: 'group', id: 'west' } },
};

/** One property: its crumb, on the highest surface with the building's photo, after its portfolio's. The close button goes back to the portfolio. */
export const Property: Story = {
  args: { value: { level: 'property', id: 'highpoint-1', groupId: 'west' }, onChange: fn() },
  play: async ({ args, canvas, userEvent }) => {
    await userEvent.click(canvas.getByRole('button', { name: 'Back to West Region' }));
    await expect(args.onChange).toHaveBeenCalledWith({ level: 'group', id: 'west' });
    await expect(canvas.getByRole('button', { name: /^Portfolio West Region/ })).toHaveAttribute('aria-current', 'location');
  },
};

/** At group scope the close button goes back to all properties; at all properties there's none. */
export const UpToAllProperties: Story = {
  name: 'Up to all properties',
  args: { value: { level: 'group', id: 'west' }, onChange: fn() },
  play: async ({ args, canvas, userEvent }) => {
    await userEvent.click(canvas.getByRole('button', { name: 'Back to all properties' }));
    await expect(args.onChange).toHaveBeenCalledWith({ level: 'portfolio' });
    await expect(canvas.queryByRole('button', { name: /^Back to/ })).toBeNull();
  },
};

/** A property reached without a group (a deep link, a recent scope) sits under All properties, never a guessed group. */
export const PropertyWithoutGroup: Story = {
  name: 'Property without a group',
  args: { value: { level: 'property', id: 'harbor-point' } },
  play: async ({ canvas }) => {
    await expect(canvas.getByRole('button', { name: /^Portfolio All properties/ })).toBeVisible();
    await expect(canvas.getByRole('button', { name: 'Back to all properties' })).toBeVisible();
  },
};

/** The property's chevron opens on its portfolio's properties, to move to a neighbouring property. */
export const ChangeProperty: Story = {
  name: 'Change property',
  args: { value: { level: 'property', id: 'highpoint-1', groupId: 'west' }, onChange: fn() },
  play: async ({ args, canvas, userEvent }) => {
    await userEvent.click(canvas.getByRole('button', { name: 'Change property' }));
    const dialog = await screen.findByRole('dialog', { name: 'Change scope' });
    await userEvent.click(within(within(dialog).getByRole('list', { name: 'West Region' })).getByRole('button', { name: /Highpoint 2/ }));
    await expect(args.onChange).toHaveBeenCalledWith({ level: 'property', id: 'highpoint-2', groupId: 'west' });
  },
};

/** At property scope, the group's crumb is a way up: its name sets the group as the scope. */
export const UpToGroup: Story = {
  name: 'Up to the group',
  args: { value: { level: 'property', id: 'highpoint-1', groupId: 'west' }, onChange: fn() },
  play: async ({ args, canvas, userEvent }) => {
    await userEvent.click(canvas.getByRole('button', { name: /^Portfolio West Region/ }));
    await expect(args.onChange).toHaveBeenCalledWith({ level: 'group', id: 'west' });
  },
};

/** Browse, then choose: a portfolio's chevron lists its properties without changing scope; a property is chosen at once. */
export const Browse: Story = {
  args: { onChange: fn() },
  play: async ({ args, canvas, userEvent }) => {
    await userEvent.click(canvas.getByRole('button', { name: 'Change portfolio' }));
    const dialog = await screen.findByRole('dialog', { name: 'Change scope' });
    await userEvent.click(within(dialog).getByRole('button', { name: 'Browse East Region' }));
    await expect(args.onChange).not.toHaveBeenCalled();
    await userEvent.click(within(within(dialog).getByRole('list', { name: 'East Region' })).getByRole('button', { name: /350 Park Avenue/ }));
    await expect(args.onChange).toHaveBeenCalledWith({ level: 'property', id: '350-park', groupId: 'east' });
  },
};

/** A whole portfolio in one click: a portfolio row's name selects it, as a crumb's name does. */
export const ChoosePortfolio: Story = {
  name: 'Choose a portfolio',
  args: { onChange: fn() },
  play: async ({ args, canvas, userEvent }) => {
    await userEvent.click(canvas.getByRole('button', { name: 'Change portfolio' }));
    const dialog = await screen.findByRole('dialog', { name: 'Change scope' });
    await userEvent.click(within(within(dialog).getByRole('list', { name: 'Portfolios' })).getByRole('button', { name: /^Fund II/ }));
    await expect(args.onChange).toHaveBeenCalledWith({ level: 'group', id: 'fund-2' });
  },
};

/** Search by name, address or city. A property in two groups is one result per group, each with its path. */
export const Search: Story = {
  play: async ({ canvas, userEvent }) => {
    await userEvent.click(canvas.getByRole('button', { name: 'Change portfolio' }));
    const dialog = await screen.findByRole('dialog', { name: 'Change scope' });
    await userEvent.type(within(dialog).getByRole('textbox'), 'Harbor');
    await expect(within(dialog).getByRole('status')).toHaveTextContent('2 results');
    const results = within(dialog).getByRole('list', { name: 'Results' });
    await expect(within(results).getByRole('button', { name: /West Region/ })).toBeInTheDocument();
    await expect(within(results).getByRole('button', { name: /Fund II/ })).toBeInTheDocument();
  },
};

/** No match says so in words, and offers nothing to choose until the search changes. */
export const NoResults: Story = {
  name: 'No results',
  play: async ({ canvas, userEvent }) => {
    await userEvent.click(canvas.getByRole('button', { name: 'Change portfolio' }));
    const dialog = await screen.findByRole('dialog', { name: 'Change scope' });
    await userEvent.type(within(dialog).getByRole('textbox'), 'Boston');
    await expect(within(dialog).getByRole('status')).toHaveTextContent('No group or property matches “Boston”.');
  },
};

/** Recent scopes, newest first, above the columns: one click back to where the user just was. */
export const Recent: Story = {
  args: {
    value: { level: 'group', id: 'west' },
    recent: [{ level: 'property', id: 'harbor-point', groupId: 'fund-2' }, { level: 'group', id: 'east' }],
  },
  play: async ({ canvas, userEvent }) => {
    await userEvent.click(canvas.getByRole('button', { name: 'Change portfolio' }));
    const dialog = await screen.findByRole('dialog', { name: 'Change scope' });
    await waitFor(() => expect(within(dialog).getByRole('button', { name: 'Harbor Point' })).toBeVisible());
  },
};

/** A single-property account: the property's name, with nothing to open and no portfolio wording. */
export const SingleProperty: Story = {
  name: 'Single property',
  args: { groups: [], properties: [properties[0]], value: { level: 'property', id: 'highpoint-1' } },
  play: async ({ canvas }) => {
    await expect(canvas.getByText('Highpoint 1')).toBeVisible();
    await expect(canvas.queryByRole('button')).toBeNull();
  },
};

/** A fixed scope, for a report or plan that keeps its own properties: one crumb with a lock, nothing to open, and why in its tooltip. */
export const Locked: Story = {
  args: { value: { level: 'group', id: 'west' }, locked: { type: 'Report scope', reason: 'This report keeps the properties it was written for.' } },
  play: async ({ canvas, userEvent }) => {
    const crumb = canvas.getByRole('group', { name: 'Report scope West Region, locked' });
    await expect(within(crumb).queryByRole('button')).toBeNull();
    await userEvent.tab();
    await expect(crumb).toHaveFocus();
    await expect(await screen.findByRole('tooltip')).toHaveTextContent('This report keeps the properties it was written for.');
  },
};

/** On phones the scope is one button, for AppShell's header, naming the current level. It opens Change scope at that level; the dialog fills the screen and shows one column at a time. */
export const Phone: Story = {
  globals: { viewport: { value: 'phone', isRotated: false } },
  args: { value: { level: 'property', id: 'highpoint-1', groupId: 'west' } },
  play: async ({ canvas, userEvent }) => {
    await expect(canvas.queryByRole('navigation', { name: 'Scope' })).toBeNull();
    await userEvent.click(canvas.getByRole('button', { name: 'Property Highpoint 1, in West Region. Change scope' }));
    const dialog = await screen.findByRole('dialog', { name: 'Change scope' });
    await waitFor(() => expect(within(dialog).getByRole('list', { name: 'West Region' })).toBeVisible());
    await userEvent.click(within(dialog).getByRole('button', { name: 'Back to portfolios' }));
    await waitFor(() => expect(within(dialog).getByRole('list', { name: 'Portfolios' })).toBeVisible());
  },
};

/** On phones a compact header in the dialog names the current scope, and its Back row goes up a level, as the desktop crumb's close button does. */
export const PhoneBack: Story = {
  name: 'Phone back row',
  globals: { viewport: { value: 'phone', isRotated: false } },
  args: { value: { level: 'property', id: 'highpoint-1', groupId: 'west' }, onChange: fn() },
  play: async ({ args, canvas, userEvent }) => {
    await userEvent.click(canvas.getByRole('button', { name: /Change scope$/ }));
    const dialog = await screen.findByRole('dialog', { name: 'Change scope' });
    const current = within(dialog).getByRole('list', { name: 'Current scope' });
    await waitFor(() => expect(within(current).getByText('Property in West Region')).toBeVisible());
    await userEvent.click(within(current).getByRole('button', { name: 'Back to West Region' }));
    await expect(args.onChange).toHaveBeenCalledWith({ level: 'group', id: 'west' });
  },
};

/** A narrow header: the names truncate with an ellipsis, the portfolio's first, never below about six characters. The tooltip then leads with the full name. */
export const Narrow: Story = {
  args: {
    value: { level: 'property', id: 'lebanon-dc', groupId: 'east' },
  },
  render: function Render(args) {
    const [value, setValue] = useState<Scope>(args.value);
    return (
      <Box sx={{ width: 340 }}>
        <ScopePicker {...args} value={value} onChange={setValue} />
      </Box>
    );
  },
  play: async ({ canvas, userEvent }) => {
    const name = canvas.getByText('Lebanon Distribution Center');
    await waitFor(() => expect(name.scrollWidth).toBeGreaterThan(name.clientWidth));
    await userEvent.hover(canvas.getByRole('button', { name: /^Property Lebanon/ }));
    await expect(await screen.findByRole('tooltip')).toHaveTextContent('Lebanon Distribution Center. Change property');
  },
};
