import { useState } from 'react';
import Box from '@mui/material/Box';
import type { Meta, StoryObj } from '@storybook/react-vite';
import { expect, fn, screen, waitFor, within } from 'storybook/test';
import { ScopePicker, type Scope, type ScopeFilter, type ScopeGroup, type ScopeProperty } from 'src/components/ScopePicker';
import { emptyFilter } from 'src/components/scopeFilterModel';
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

/** Made-up properties with what the filter narrows by. Pine Court has no floor area on record. */
const filterProperties: ScopeProperty[] = [
  { id: 'harbor-tower', name: 'Harbor Tower', city: 'Austin, TX', state: 'TX', type: 'Office', area: 120000 },
  { id: 'elm-plaza', name: 'Elm Plaza', city: 'Austin, TX', state: 'TX', type: 'Office', area: 40000 },
  { id: 'dallas-yard', name: 'Dallas Yard', city: 'Dallas, TX', state: 'TX', type: 'Industrial', area: 300000 },
  { id: 'lake-works', name: 'Lake Works', city: 'Columbus, OH', state: 'OH', type: 'Retail', area: 60000 },
  { id: 'pine-court', name: 'Pine Court', city: 'Denver, CO', state: 'CO', type: 'Industrial' },
  { id: 'bay-point', name: 'Bay Point', city: 'Miami, FL', state: 'FL', type: 'Retail', area: 50000 },
];
const filterGroups: ScopeGroup[] = [
  { id: 'south', name: 'South Region', propertyIds: ['harbor-tower', 'elm-plaza', 'dallas-yard', 'bay-point'] },
  { id: 'north', name: 'North Region', propertyIds: ['lake-works', 'pine-court'] },
];
const savedPortfolio: ScopeGroup = { id: 'saved-1', name: 'Austin offices', propertyIds: ['harbor-tower', 'elm-plaza'] };

/** Holds the scope, the filter and the saved portfolios in state, as an app would: the filter for the browser session, the portfolios per user and Company. */
function FilterableScopePicker({ initialFilter = emptyFilter, initialPortfolios = [], onChange }: { initialFilter?: ScopeFilter; initialPortfolios?: ScopeGroup[]; onChange?: (scope: Scope) => void }) {
  const [value, setValue] = useState<Scope>({ level: 'portfolio' });
  const [filter, setFilter] = useState(initialFilter);
  const [portfolios, setPortfolios] = useState(initialPortfolios);
  return (
    <ScopePicker
      groups={filterGroups}
      properties={filterProperties}
      value={value}
      onChange={(scope) => {
        setValue(scope);
        onChange?.(scope);
      }}
      portfolios={portfolios}
      filter={filter}
      onFilterChange={setFilter}
      onSavePortfolio={(name, propertyIds) => {
        const id = `saved-${portfolios.length + 2}`;
        setPortfolios([{ id, name, propertyIds }, ...portfolios]);
        return id;
      }}
      onUpdatePortfolio={(id, patch) => setPortfolios(portfolios.map((portfolio) => (portfolio.id === id ? { ...portfolio, ...patch } : portfolio)))}
      onDeletePortfolio={(id) => {
        setPortfolios(portfolios.filter((portfolio) => portfolio.id !== id));
        // Deleting the portfolio in scope goes up to all properties.
        if (value.level === 'saved' && value.id === id) setValue({ level: 'portfolio' });
      }}
    />
  );
}

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
  parameters: { muiComponents: ['Breadcrumbs', 'Divider', 'Button', 'IconButton', 'Avatar', 'Dialog', 'TextField', 'List', 'ListItemButton', 'Chip', 'Tooltip', 'Autocomplete', 'Select', 'Table', 'Checkbox', 'Menu', 'MenuItem'] },
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

/** `onFilterChange` adds a Filter button beside the search: a table of properties, narrowed by location, type and area or picked by hand. Choosing Done goes back to browsing with the filter on. */
export const Filter: Story = {
  render: () => <FilterableScopePicker />,
  play: async ({ canvas, userEvent }) => {
    await userEvent.click(canvas.getByRole('button', { name: 'Change portfolio' }));
    let dialog = await screen.findByRole('dialog', { name: 'Change scope' });
    await userEvent.click(within(dialog).getByRole('button', { name: 'Filter' }));
    dialog = await screen.findByRole('dialog', { name: 'Filter properties' });
    await userEvent.click(within(dialog).getByRole('checkbox', { name: 'Harbor Tower' }));
    await userEvent.click(within(dialog).getByRole('checkbox', { name: 'Elm Plaza' }));
    await expect(within(dialog).getByText('2 picked')).toBeVisible();
    await userEvent.click(within(dialog).getByRole('button', { name: 'Done' }));
    dialog = await screen.findByRole('dialog', { name: 'Change scope' });
    await expect(within(dialog).getByRole('button', { name: 'Filter · 2' })).toBeVisible();
    await expect(within(dialog).getByRole('status')).toHaveTextContent('Filtered to 2 of 6 properties');
  },
};

/** A filter narrows what the navigator shows and never sets the scope: a portfolio with none of its properties stays listed, disabled, and counts read “2 of 4 properties”. */
export const Filtered: Story = {
  render: () => <FilterableScopePicker initialFilter={{ ...emptyFilter, types: ['Office'] }} />,
  play: async ({ canvas, userEvent }) => {
    await userEvent.click(canvas.getByRole('button', { name: 'Change portfolio' }));
    const dialog = await screen.findByRole('dialog', { name: 'Change scope' });
    const column = within(dialog).getByRole('list', { name: 'Portfolios' });
    await expect(within(column).getByRole('button', { name: /^South Region/ })).toHaveTextContent('2 of 4 properties');
    await expect(within(column).getByRole('button', { name: /^North Region/ })).toHaveAttribute('aria-disabled', 'true');
    await userEvent.click(within(dialog).getByRole('button', { name: 'Clear Filter' }));
    await waitFor(() => expect(within(column).getByRole('button', { name: /^North Region/ })).not.toHaveAttribute('aria-disabled'));
  },
};

/** A filter saves as a portfolio of the user's own, under a suggested name that says what its properties share. The dialog then browses it. */
export const SaveAsPortfolio: Story = {
  name: 'Save as portfolio',
  render: () => <FilterableScopePicker initialFilter={{ ...emptyFilter, cities: ['Austin, TX'] }} />,
  play: async ({ canvas, userEvent }) => {
    await userEvent.click(canvas.getByRole('button', { name: 'Change portfolio' }));
    const dialog = await screen.findByRole('dialog', { name: 'Change scope' });
    await userEvent.click(within(dialog).getByRole('button', { name: 'Save as Portfolio' }));
    const naming = await screen.findByRole('dialog', { name: 'Save as portfolio' });
    const name = within(naming).getByRole('textbox', { name: 'Name' });
    await expect(name).toHaveValue('Office properties in Austin, TX');
    await waitFor(() => expect(name).toHaveFocus());
    await userEvent.click(within(naming).getByRole('button', { name: 'Save' }));
    await waitFor(() => expect(screen.queryByRole('dialog', { name: 'Save as portfolio' })).toBeNull());
    await expect(await within(dialog).findByRole('list', { name: 'Office properties in Austin, TX' })).toBeVisible();
  },
};

/** Your portfolios lead the Portfolios column and choose like a group, in the same crumb; More actions has Edit properties, Rename and Delete. */
export const SavedPortfolios: Story = {
  name: 'Saved portfolios',
  args: { onChange: fn() },
  render: (args) => <FilterableScopePicker initialPortfolios={[savedPortfolio]} onChange={args.onChange} />,
  play: async ({ args, canvas, userEvent }) => {
    await userEvent.click(canvas.getByRole('button', { name: 'Change portfolio' }));
    const dialog = await screen.findByRole('dialog', { name: 'Change scope' });
    await waitFor(() => expect(within(dialog).getByText('Your portfolios')).toBeVisible());
    await expect(within(dialog).getByText('Company portfolios')).toBeVisible();
    await userEvent.click(within(dialog).getByRole('button', { name: 'More actions for Austin offices' }));
    await userEvent.click(await screen.findByRole('menuitem', { name: 'Rename' }));
    const naming = await screen.findByRole('dialog', { name: 'Rename portfolio' });
    await userEvent.click(within(naming).getByRole('button', { name: 'Cancel' }));
    await waitFor(() => expect(screen.queryByRole('dialog', { name: 'Rename portfolio' })).toBeNull());
    await userEvent.click(await within(dialog).findByRole('button', { name: /^Austin offices/ }));
    await expect(args.onChange).toHaveBeenCalledWith({ level: 'saved', id: 'saved-1' });
    await expect(await canvas.findByRole('button', { name: /^Portfolio Austin offices/ })).toBeVisible();
  },
};

/** Delete asks first, and says what stays. */
export const DeletePortfolio: Story = {
  name: 'Delete a portfolio',
  render: () => <FilterableScopePicker initialPortfolios={[savedPortfolio]} />,
  play: async ({ canvas, userEvent }) => {
    await userEvent.click(canvas.getByRole('button', { name: 'Change portfolio' }));
    const dialog = await screen.findByRole('dialog', { name: 'Change scope' });
    await userEvent.click(within(dialog).getByRole('button', { name: 'More actions for Austin offices' }));
    await userEvent.click(await screen.findByRole('menuitem', { name: 'Delete' }));
    const confirm = await screen.findByRole('dialog', { name: 'Delete Austin offices?' });
    await userEvent.click(within(confirm).getByRole('button', { name: 'Delete' }));
    await waitFor(() => expect(within(dialog).queryByText('Your portfolios')).toBeNull());
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
