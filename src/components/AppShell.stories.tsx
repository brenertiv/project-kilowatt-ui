import { useState } from 'react';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Card from '@mui/material/Card';
import CardHeader from '@mui/material/CardHeader';
import Grid from '@mui/material/Grid';
import IconButton from '@mui/material/IconButton';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';
import useMediaQuery from '@mui/material/useMediaQuery';
import { useTheme } from '@mui/material/styles';
import type { Meta, StoryObj } from '@storybook/react-vite';
import { expect, fireEvent, fn, screen, waitFor, within } from 'storybook/test';
import { AppShell, type AppShellCompany, type AppShellItemAction, type AppShellSection } from 'src/components/AppShell';
import { useContentUp } from 'src/components/contentWidth';
import { ScopePicker, type Scope, type ScopeGroup, type ScopeProperty } from 'src/components/ScopePicker';
import { Icon } from 'src/icons';
import highpoint1 from 'src/fixtures/images/highpoint-1.jpg';

/** The portfolio the scope picker in the header chooses from. */
const scopeProperties: ScopeProperty[] = [
  { id: '120-broadway', name: '120 Broadway', city: 'New York, NY' },
  { id: '350-park', name: '350 Park Avenue', city: 'New York, NY' },
  { id: '55-water', name: '55 Water Street', city: 'New York, NY' },
  { id: 'highpoint-1', name: 'Highpoint 1', city: 'Denver, CO', image: highpoint1 },
  { id: 'mesa-commons', name: 'Mesa Commons', city: 'Phoenix, AZ' },
];
const scopeGroups: ScopeGroup[] = [
  { id: 'east', name: 'East Region', propertyIds: ['120-broadway', '350-park', '55-water'] },
  { id: 'west', name: 'West Region', propertyIds: ['highpoint-1', 'mesa-commons'] },
];

/** The sections, each with its pages, in the rail's order: Notifications first, My Account alone at the end. Tenant Billing and Maintenance are Missing: the account doesn't have them, so no panel; they're left out on phones. */
const sections: AppShellSection[] = [
  {
    id: 'notifications',
    label: 'Notifications',
    icon: 'notifications',
    count: 10,
    badge: '10 unread',
    panel: {
      headerAction: { label: 'Notification Preferences', icon: 'settings', onClick: () => {} },
      items: [
        { id: 'all', label: 'All Unread', icon: 'inbox' },
        { id: 'insights', label: 'Insights', icon: 'lightbulb' },
        { id: 'activity', label: 'Activity', icon: 'schedule' },
        { id: 'property-alerts', label: 'Property Alerts', icon: 'warning' },
        { id: 'data-health', label: 'Data Health', icon: 'error' },
        { id: 'app-updates', label: 'App Updates', icon: 'info' },
      ],
    },
  },
  {
    id: 'workspace',
    label: 'Home',
    icon: 'home',
    panel: {
      actions: (
        <Button variant="outlined" fullWidth startIcon={<Icon name="add" />} sx={{ justifyContent: 'flex-start' }}>
          New
        </Button>
      ),
      filter: {
        label: 'Filter by Type',
        options: [
          { value: 'dashboard', label: 'Dashboards' },
          { value: 'report', label: 'Reports' },
          { value: 'plan', label: 'Plans' },
        ],
      },
      items: [
        {
          id: 'reporting-readiness',
          label: 'Reporting Readiness',
          secondary: 'Dashboard',
          kind: 'dashboard',
          icon: 'table_rows',
        },
        {
          id: 'energy-esg-summary',
          label: 'Energy and ESG Summary',
          secondary: 'Report',
          kind: 'report',
          icon: 'bar_chart',
        },
        {
          id: 'emissions-energy',
          label: 'Emissions and Energy',
          secondary: 'Dashboard',
          kind: 'dashboard',
          icon: 'table_rows',
        },
        {
          id: 'decarbonization-plan',
          label: 'Decarbonization Plan',
          secondary: 'Plan',
          kind: 'plan',
          icon: 'trending_down',
        },
      ],
    },
  },
  {
    id: 'assets',
    label: 'Assets',
    icon: 'apartment',
    panel: {
      items: [
        { id: 'overview', label: 'Overview', icon: 'dashboard' },
        { id: 'portfolio', label: 'Portfolio', icon: 'apartment', count: 48 },
        { id: 'areas', label: 'Areas', icon: 'layers' },
        { id: 'equipment', label: 'Equipment', icon: 'devices' },
        { id: 'utilities', label: 'Utilities', icon: 'receipt_long' },
        { id: 'analysis', label: 'Analysis', icon: 'bar_chart' },
        { id: 'files', label: 'Files', icon: 'folder' },
      ],
    },
  },
  {
    id: 'data-sources',
    label: 'Data Sources',
    icon: 'database',
    panel: {
      items: [
        { id: 'overview', label: 'Overview', icon: 'dashboard' },
        { id: 'meters', label: 'Meters', icon: 'speed' },
        { id: 'utility-accounts', label: 'Utility Accounts', icon: 'link' },
        { id: 'sensors', label: 'Sensors', icon: 'sensors' },
        { id: 'energy-star', label: 'ENERGY STAR', icon: 'verified' },
        { id: 'weather', label: 'Weather', icon: 'partly_cloudy_day' },
      ],
    },
  },
  {
    id: 'people',
    label: 'People',
    icon: 'group',
    panel: {
      items: [
        { id: 'team', label: 'Team', icon: 'group' },
        { id: 'tenants', label: 'Tenants', icon: 'apartment' },
        { id: 'partners', label: 'Partners', icon: 'link' },
        { id: 'contacts', label: 'Property Contacts', icon: 'contact_page' },
      ],
    },
  },
  { id: 'tenant-billing', label: 'Tenant Billing', icon: 'receipt_long', missing: true, hideOnPhone: true },
  { id: 'maintenance', label: 'Maintenance', icon: 'handyman', missing: true, hideOnPhone: true },
  {
    id: 'account',
    label: 'My Account',
    initials: 'MC',
    placement: 'end',
    panel: {
      colorScheme: true,
      items: [
        { id: 'profile', label: 'Profile', icon: 'person' },
        { id: 'preferences', label: 'Preferences', icon: 'tune' },
        { id: 'notification-settings', label: 'Notification Preferences', icon: 'notifications' },
        { id: 'entitlements', label: 'Modules and Entitlements', icon: 'view_column' },
        { id: 'help', label: 'Help and Support', icon: 'help' },
      ],
    },
  },
];

/** Home's workspaces as their panel shows them: the type by its named icon, one generating, one pinned, each with its actions. */
const workspaceActions = (pinned: boolean): AppShellItemAction[] => [
  pinned
    ? { id: 'unpin', label: 'Unpin', icon: 'keep_off', onClick: () => {} }
    : { id: 'pin', label: 'Pin to Top', icon: 'push_pin', onClick: () => {} },
  { id: 'archive', label: 'Archive', icon: 'archive', onClick: () => {} },
  { id: 'delete', label: 'Delete', icon: 'delete', destructive: true, onClick: () => {} },
];
const homeSections: AppShellSection[] = sections.map((section) =>
  section.id === 'workspace' && section.panel
    ? {
        ...section,
        panel: {
          ...section.panel,
          filter: {
            label: 'Type',
            inline: true,
            options: [
              { value: 'dashboard', label: 'Dashboards' },
              { value: 'report', label: 'Reports' },
              { value: 'plan', label: 'Plans' },
            ],
          },
          items: [
            { id: 'energy-overview', label: 'Energy Overview', kind: 'dashboard', icon: 'dashboard', iconLabel: 'Dashboard', pinned: true, actions: workspaceActions(true) },
            { id: 'quarterly-report', label: 'Quarterly Report', kind: 'report', icon: 'description', iconLabel: 'Report', busy: true, actions: workspaceActions(false) },
            { id: 'emissions-tracker', label: 'Emissions Tracker', kind: 'dashboard', icon: 'dashboard', iconLabel: 'Dashboard', actions: workspaceActions(false) },
            { id: 'decarbonization-plan', label: 'Decarbonization Plan', kind: 'plan', icon: 'trending_down', iconLabel: 'Plan', actions: workspaceActions(false) },
          ],
        },
      }
    : section,
);

/** The companies the person belongs to; the first is the one they're in. */
const companies: AppShellCompany[] = [
  { id: 'ridgeline', name: 'Ridgeline Logistics REIT', detail: 'Admin' },
  { id: 'harbor-point', name: 'Harbor Point Residential', detail: 'Member' },
  { id: 'summit', name: 'Summit Office Partners', detail: 'Member' },
];



/**
 * Kilowatt's `AppShell`: the frame every Enertiv page sits in, built from MUI's `List`, `Drawer`,
 * `AppBar` and `IconButton`, with a drill-down menu on phones (the Phone stories). The stories hold the
 * current section, page and company in state, as an app's router would, and fill the page with a placeholder.
 */
const meta = {
  title: 'Layout/AppShell',
  component: AppShell,
  tags: ['!autodocs'],
  parameters: {
    // The MUI components this page documents; docs.test.ts checks its MUI departures section against them.
    muiComponents: [
      'AppBar',
      'Drawer',
      'Paper',
      'List',
      'ListItemButton',
      'IconButton',
      'TextField',
      'Dialog',
      'Badge',
      'Tooltip',
      'Avatar',
      'ToggleButton',
      'ToggleButtonGroup',
      'Menu',
      'MenuItem',
      'Slide',
      'Select',
      'CircularProgress',
    ],
    layout: 'fullscreen',
    // The shell fills the viewport, so the docs page shows each story in its own frame.
    docs: { story: { inline: false, height: '640px' } },
  },
  args: {
    company: companies[0],
    companies,
    sections,
    section: 'workspace',
    children: null,
  },
  render: function Render(args) {
    const firstPage = (id: string) => args.sections.find((item) => item.id === id)?.panel?.items[0].id;
    const [section, setSection] = useState(args.section);
    const [page, setPage] = useState(firstPage(args.section));
    const [assistantOpen, setAssistantOpen] = useState(args.asideOpen ?? false);
    const [assistantDocked, setAssistantDocked] = useState(args.asideDocked ?? true);
    // The aside docks or floats beside the page, at `md` and up; on phones it's a bottom sheet.
    const wide = useMediaQuery(useTheme().breakpoints.up('md'));
    const [company, setCompany] = useState(args.company);
    const [scope, setScope] = useState<Scope>({ level: 'portfolio' });
    // On phones the header has room for an icon, not the label.
    const phone = useMediaQuery(useTheme().breakpoints.down('md'));
    const current = args.sections.find((item) => item.id === section);
    const title = current?.panel?.items.find((item) => item.id === page)?.label ?? current?.label;
    return (
      <AppShell
        {...args}
        company={company}
        onCompanyChange={(id) => setCompany(companies.find((item) => item.id === id) ?? company)}
        section={section}
        page={page}
        onSectionChange={(id) => {
          setSection(id);
          setPage(firstPage(id));
        }}
        onPageChange={(id, sectionId) => {
          setSection(sectionId);
          setPage(id);
        }}
        headerStart={
          <ScopePicker groups={scopeGroups} properties={scopeProperties} value={scope} onChange={setScope} />
        }
        headerEnd={
          phone ? (
            <IconButton
              aria-label="Ask Enertiv"
              aria-pressed={assistantOpen}
              onClick={() => setAssistantOpen(!assistantOpen)}
            >
              <Icon name="bolt" />
            </IconButton>
          ) : (
            <Button
              variant={assistantOpen ? 'contained' : 'text'}
              startIcon={<Icon name="bolt" />}
              aria-pressed={assistantOpen}
              onClick={() => setAssistantOpen(!assistantOpen)}
            >
              Ask Enertiv
            </Button>
          )
        }
        aside={
          <Stack sx={{ height: '100%' }}>
            {/* Floating, the header is the drag handle. */}
            <Stack
              direction="row"
              data-drag-handle={wide && !assistantDocked ? '' : undefined}
              sx={{ alignItems: 'center', justifyContent: 'space-between', p: 2, pr: 1 }}
            >
              <Typography variant="h5" component="h2">
                Ask Enertiv
              </Typography>
              <Stack direction="row">
                {wide && (
                  <IconButton
                    aria-label={assistantDocked ? 'Undock Ask Enertiv' : 'Dock Ask Enertiv'}
                    onClick={() => setAssistantDocked(!assistantDocked)}
                  >
                    <Icon name={assistantDocked ? 'zoom_out_map' : 'zoom_in_map'} />
                  </IconButton>
                )}
                <IconButton aria-label="Close Ask Enertiv" onClick={() => setAssistantOpen(false)}>
                  <Icon name="close" />
                </IconButton>
              </Stack>
            </Stack>
            <Typography variant="body2" color="text.secondary" sx={{ px: 2 }}>
              Placeholder for the assistant.
            </Typography>
          </Stack>
        }
        asideOpen={assistantOpen}
        asideDocked={assistantDocked}
        asideLabel="Ask Enertiv"
        onAsideClose={() => setAssistantOpen(false)}
      >
        {args.children ?? (
          <Box sx={{ maxWidth: '65ch' }}>
            <Typography variant="h3" component="h1" gutterBottom>
              {title}
            </Typography>
            <Typography color="text.secondary">
              Placeholder for the {title} page at {company.name}.
            </Typography>
          </Box>
        )}
      </AppShell>
    );
  },
} satisfies Meta<typeof AppShell>;

export default meta;
type Story = StoryObj<typeof meta>;

/** A section with pages: the rail with Notifications first and Search above My Account in its foot, the section panel with a New action, the header and the page. */
export const Default: Story = {
  play: async ({ canvas, userEvent }) => {
    await userEvent.click(canvas.getByRole('button', { name: /^Energy and ESG Summary/ }));
    await expect(canvas.getByRole('button', { name: /^Energy and ESG Summary/ })).toHaveAttribute(
      'aria-current',
      'page',
    );
    await expect(canvas.getByRole('heading', { level: 1 })).toHaveTextContent('Energy and ESG Summary');
  },
};

/** Panel rows can carry a count, such as the properties in scope; choosing a section in the rail swaps the panel. */
export const PanelCounts: Story = {
  args: { section: 'assets' },
  play: async ({ canvas, userEvent }) => {
    await expect(canvas.getByRole('navigation', { name: 'Assets' })).toHaveTextContent('48');
    await userEvent.click(canvas.getByRole('button', { name: 'People' }));
    await expect(canvas.getByRole('navigation', { name: 'People' })).toBeVisible();
  },
};

/** Notifications is a section like the others, the rail's first, with its unread count; its panel groups notifications by kind, with its preferences as the panel's header action. */
export const Notifications: Story = {
  play: async ({ canvas, userEvent }) => {
    await userEvent.click(canvas.getByRole('button', { name: 'Notifications, 10 unread' }));
    await expect(canvas.getByRole('button', { name: 'Notifications, 10 unread' })).toHaveAttribute(
      'aria-current',
      'page',
    );
    await userEvent.click(
      within(canvas.getByRole('navigation', { name: 'Notifications' })).getByRole('button', { name: 'Data Health' }),
    );
    await expect(canvas.getByRole('heading', { level: 1 })).toHaveTextContent('Data Health');
    await expect(
      within(canvas.getByRole('navigation', { name: 'Notifications' })).getByRole('button', {
        name: 'Notification Preferences',
      }),
    ).toBeVisible();
  },
};

/** My Account follows the same pattern, alone at the bottom of the rail with `placement: 'end'`, with the person's initials for its icon; its panel holds the Light, Dark and System appearance control. */
export const Account: Story = {
  play: async ({ canvas, userEvent }) => {
    await userEvent.click(canvas.getByRole('button', { name: 'My Account' }));
    const panel = canvas.getByRole('navigation', { name: 'My Account' });
    await expect(within(panel).getByRole('button', { name: /^Profile/ })).toHaveAttribute('aria-current', 'page');
    await userEvent.click(within(panel).getByRole('button', { name: 'Dark' }));
    await expect(within(panel).getByRole('button', { name: 'Dark' })).toHaveAttribute('aria-pressed', 'true');
    await expect(document.documentElement).toHaveClass('dark');
    await userEvent.click(within(panel).getByRole('button', { name: 'Light' }));
    await expect(document.documentElement).toHaveClass('light');
  },
};

/** A Missing section, one the account doesn't have: a plus in the disabled color, its name as its tooltip, no badge and no panel; it opens its upgrade page. */
export const Missing: Story = {
  args: { section: 'tenant-billing' },
  play: async ({ canvas, userEvent }) => {
    await expect(canvas.queryByRole('navigation', { name: 'Tenant Billing' })).toBeNull();
    await expect(canvas.queryByRole('button', { name: 'Dock Navigation' })).toBeNull();
    const maintenance = canvas.getByRole('button', { name: 'Maintenance. Opens the upgrade page' });
    await userEvent.hover(maintenance);
    await expect(await screen.findByRole('tooltip')).toHaveTextContent(/^Maintenance$/);
    await userEvent.click(maintenance);
    await expect(maintenance).toHaveAttribute('aria-current', 'page');
  },
};

/** The panel undocked, for more room: hovering a rail item floats that section's panel inside the frame. The header keeps no panel buttons; clicking the current section's rail item opens its panel, whose Dock Navigation puts it back. */
export const PanelUndocked: Story = {
  args: { defaultPanelOpen: false },
  play: async ({ canvas, userEvent }) => {
    await expect(canvas.queryByRole('navigation', { name: 'Home' })).toBeNull();
    await userEvent.hover(canvas.getByRole('button', { name: 'Data Sources' }));
    const panel = await canvas.findByRole('navigation', { name: 'Data Sources' });
    await userEvent.click(within(panel).getByRole('button', { name: 'Meters' }));
    await expect(canvas.getByRole('heading', { level: 1 })).toHaveTextContent('Meters');
    await expect(canvas.queryByRole('navigation', { name: 'Data Sources' })).toBeNull();
    await expect(canvas.queryByRole('button', { name: 'Dock Navigation' })).toBeNull();
    await userEvent.click(canvas.getByRole('button', { name: 'Data Sources' }));
    const pinned = await canvas.findByRole('navigation', { name: 'Data Sources' });
    await userEvent.click(within(pinned).getByRole('button', { name: 'Dock Navigation' }));
    await expect(canvas.getByRole('navigation', { name: 'Data Sources' })).toBeVisible();
    await userEvent.click(canvas.getByRole('button', { name: 'Collapse Navigation' }));
    await expect(canvas.queryByRole('navigation', { name: 'Data Sources' })).toBeNull();
  },
};

/** Without hover (keyboard, touch): Enter on the current section's rail item pins its panel open with focus inside, and Escape closes it, back on the rail item. */
export const PanelUndockedKeyboard: Story = {
  name: 'Panel undocked, keyboard',
  args: { defaultPanelOpen: false },
  play: async ({ canvas, userEvent }) => {
    const item = canvas.getByRole('button', { name: 'Home' });
    item.focus();
    await userEvent.keyboard('{Enter}');
    const panel = await canvas.findByRole('navigation', { name: 'Home' });
    await waitFor(() => expect(panel).toContainElement(document.activeElement as HTMLElement));
    await userEvent.keyboard('{Escape}');
    await waitFor(() => expect(canvas.queryByRole('navigation', { name: 'Home' })).toBeNull());
    await expect(item).toHaveFocus();
  },
};

/** Search is in the rail's foot, above My Account, on every page; it opens one dialog that finds a page in any section. */
export const Search: Story = {
  play: async ({ canvas, userEvent }) => {
    await userEvent.click(canvas.getByRole('button', { name: 'Search' }));
    const dialog = await screen.findByRole('dialog', { name: 'Search' });
    await userEvent.type(within(dialog).getByRole('textbox', { name: 'Search Pages' }), 'me');
    await expect(within(dialog).getByRole('status')).toHaveTextContent('3 pages');
    await userEvent.click(within(dialog).getByRole('button', { name: /^Meters/ }));
    await waitFor(() => expect(screen.queryByRole('dialog', { name: 'Search' })).toBeNull());
    await expect(canvas.getByRole('heading', { level: 1 })).toHaveTextContent('Meters');
  },
};

/** Home's filter button narrows its workspaces to one type; a dot on the button shows a filter is on. */
export const PanelFilter: Story = {
  play: async ({ canvas, userEvent }) => {
    await userEvent.click(canvas.getByRole('button', { name: 'Filter by Type' }));
    await userEvent.click(await screen.findByRole('menuitemradio', { name: 'Reports' }));
    const panel = canvas.getByRole('navigation', { name: 'Home' });
    await expect(within(panel).getByRole('button', { name: /^Energy and ESG Summary/ })).toBeVisible();
    await expect(within(panel).queryByRole('button', { name: /^Reporting Readiness/ })).toBeNull();
    await expect(canvas.getByRole('button', { name: 'Filter by Type: Reports' })).toBeVisible();
  },
};

/** Home's panel: the type filter in words under New (`filter.inline`), each type's icon named (`iconLabel`), a workspace being generated (`busy`) and one pinned to the top (`pinned`). */
export const HomePanel: Story = {
  args: { sections: homeSections },
  play: async ({ canvas, userEvent }) => {
    const panel = canvas.getByRole('navigation', { name: 'Home' });
    await expect(within(panel).queryByRole('button', { name: /^Type/ })).toBeNull();
    await expect(within(panel).getByRole('progressbar', { name: 'Generating' })).toBeVisible();
    await expect(within(panel).getByRole('img', { name: 'Pinned' })).toBeVisible();
    await userEvent.hover(within(panel).getAllByRole('img', { name: 'Report' })[0]);
    await expect(await screen.findByRole('tooltip')).toHaveTextContent(/^Report$/);
    await userEvent.click(within(panel).getByRole('combobox', { name: 'Type' }));
    await userEvent.click(await screen.findByRole('option', { name: 'Plans' }));
    // A named icon is part of its row's name: "Plan Decarbonization Plan".
    await expect(within(panel).getByRole('button', { name: /^Plan Decarbonization Plan/ })).toBeVisible();
    await expect(within(panel).queryByRole('button', { name: /Energy Overview/ })).toBeNull();
  },
};

/** A row's actions, in a More Actions button at its end that shows on hover and focus (always on touch); Delete follows a divider, in the error color. */
export const RowActions: Story = {
  args: { sections: homeSections },
  play: async ({ canvas, userEvent }) => {
    const panel = canvas.getByRole('navigation', { name: 'Home' });
    const more = within(panel).getByRole('button', { name: 'More Actions for Quarterly Report' });
    await userEvent.click(more);
    const menu = await screen.findByRole('menu', { name: 'Actions for Quarterly Report' });
    await expect(more).toHaveAttribute('aria-expanded', 'true');
    const items = within(menu).getAllByRole('menuitem');
    await expect(items).toHaveLength(3);
    await expect(items[0]).toHaveTextContent('Pin to Top');
    // Delete comes last, after a divider.
    await expect(items[2]).toHaveTextContent('Delete');
    await expect(items[2].previousElementSibling).toHaveRole('separator');
    await userEvent.click(within(menu).getByRole('menuitem', { name: 'Archive' }));
    await waitFor(() => expect(screen.queryByRole('menu', { name: 'Actions for Quarterly Report' })).toBeNull());
  },
};

/** At 900px with the panel and the assistant docked, the header can't hold the crumbs: the scope is one button, its level's icon alone below 140px, named in its tooltip. Closing the assistant gives the crumbs back. */
export const NarrowHeader: Story = {
  args: { asideOpen: true },
  decorators: [
    (Story) => (
      <Box sx={{ width: 900 }}>
        <Story />
      </Box>
    ),
  ],
  play: async ({ canvas, userEvent }) => {
    const header = canvas.getByRole('banner');
    await expect(within(header).queryByRole('navigation', { name: 'Scope' })).toBeNull();
    const scope = within(header).getByRole('button', { name: 'Portfolio All properties. Change Scope' });
    await expect(scope).not.toHaveTextContent('All properties');
    await userEvent.hover(scope);
    await expect(await screen.findByRole('tooltip')).toHaveTextContent('Portfolio All properties');
    await userEvent.click(canvas.getByRole('button', { name: 'Close Ask Enertiv' }));
    await waitFor(() => expect(within(header).getByRole('navigation', { name: 'Scope' })).toBeVisible());
  },
};

/** The panel resizes between 220px and 380px by dragging its edge, or with the arrow keys, Home and End once it's focused; the hover panel follows it, 8px narrower. */
export const PanelResize: Story = {
  play: async ({ canvas, userEvent }) => {
    const handle = canvas.getByRole('separator', { name: 'Resize Navigation' });
    handle.focus();
    await userEvent.keyboard('{ArrowRight}{ArrowRight}');
    await expect(handle).toHaveAttribute('aria-valuenow', '272');
    await userEvent.keyboard('{End}');
    await expect(handle).toHaveAttribute('aria-valuenow', '380');
    // Undocked, the hover panel follows the docked panel's width, less its 8px inset.
    await userEvent.click(canvas.getByRole('button', { name: 'Collapse Navigation' }));
    await userEvent.hover(canvas.getByRole('button', { name: 'People' }));
    const floating = await canvas.findByRole('navigation', { name: 'People' });
    await expect(floating.getBoundingClientRect().width).toBe(372);
  },
};

/** A side column for the assistant, opened from the header, whose left edge resizes it (280px to 560px). It sits beside the page from `md`; on phones it opens as a bottom sheet. */
export const AssistantOpen: Story = {
  args: { asideOpen: true },
  play: async ({ canvas, userEvent }) => {
    await expect(canvas.getByRole('complementary', { name: 'Ask Enertiv' })).toBeVisible();
    const edge = canvas.getByRole('separator', { name: 'Resize Ask Enertiv' });
    edge.focus();
    await userEvent.keyboard('{ArrowLeft}');
    await expect(edge).toHaveAttribute('aria-valuenow', '352');
    await userEvent.click(canvas.getByRole('button', { name: 'Close Ask Enertiv' }));
    await expect(canvas.queryByRole('complementary', { name: 'Ask Enertiv' })).toBeNull();
  },
};

/** Undocked, at `md` and up, the assistant floats at the bottom right; its header drags it, and a double-click puts it back in the corner. */
export const AssistantFloating: Story = {
  args: { asideOpen: true, asideDocked: false, onAsidePositionChange: fn() },
  play: async ({ args, canvas, userEvent }) => {
    const aside = canvas.getByRole('complementary', { name: 'Ask Enertiv' });
    const title = within(aside).getByRole('heading', { name: 'Ask Enertiv' });
    const start = aside.getBoundingClientRect();
    fireEvent.pointerDown(title, { button: 0, clientX: start.left + 40, clientY: start.top + 20 });
    fireEvent.pointerMove(window, { clientX: start.left - 60, clientY: start.top });
    fireEvent.pointerUp(window);
    await waitFor(() => expect(args.onAsidePositionChange).toHaveBeenLastCalledWith({ right: 116, bottom: 36 }));
    await userEvent.dblClick(title);
    await expect(args.onAsidePositionChange).toHaveBeenLastCalledWith(null);
    await userEvent.click(within(aside).getByRole('button', { name: 'Dock Ask Enertiv' }));
    await expect(canvas.getByRole('separator', { name: 'Resize Ask Enertiv' })).toBeVisible();
  },
};

/** Three cards across while the page, not the window, is at least `md` wide: what `useContentUp` answers for a page beside docked panels. */
function CardsByPageWidth() {
  const across = useContentUp('md');
  return (
    <Grid container spacing={2}>
      {['Energy Use', 'Energy Cost', 'Emissions'].map((title) => (
        <Grid key={title} size={across ? 4 : 12}>
          <Card variant="outlined">
            <CardHeader title={title} />
          </Card>
        </Grid>
      ))}
    </Grid>
  );
}

/** A page beside docked panels sizes its columns by the page's width: `useContentUp` reads `main`, so opening the assistant stacks these cards while the window stays the same. */
export const ColumnsByPageWidth: Story = {
  args: { children: <CardsByPageWidth /> },
  play: async ({ canvas, userEvent }) => {
    const first = canvas.getByText('Energy Use').closest<HTMLElement>('.MuiCard-root')!;
    const second = canvas.getByText('Energy Cost').closest<HTMLElement>('.MuiCard-root')!;
    const sameRow = () => first.getBoundingClientRect().top === second.getBoundingClientRect().top;
    const before = sameRow();
    await userEvent.click(canvas.getByRole('button', { name: 'Ask Enertiv' }));
    await waitFor(() => expect(sameRow()).toBe(false));
    await userEvent.click(canvas.getByRole('button', { name: 'Close Ask Enertiv' }));
    await waitFor(() => expect(sameRow()).toBe(before));
  },
};

/** A page with no scope and no page-wide actions leaves the header out with `hideHeader`; the page starts at the frame's top. */
export const NoHeader: Story = {
  args: { hideHeader: true },
  play: async ({ canvas }) => {
    await expect(canvas.queryByRole('navigation', { name: 'Scope' })).toBeNull();
    await expect(canvas.getByRole('heading', { level: 1 })).toBeVisible();
  },
};

const phoneViewport = { viewport: { value: 'phone', isRotated: false } };

/** On a phone, the menu is one column that opens on the current section's pages; choosing a page closes it. The page scrolls the document under a sticky header. */
export const Phone: Story = {
  globals: phoneViewport,
  play: async ({ canvas, userEvent }) => {
    await userEvent.click(canvas.getByRole('button', { name: /^Open Menu/ }));
    const menu = await screen.findByRole('navigation', { name: 'Menu' });
    await expect(within(menu).getByRole('heading', { name: 'Home' })).toBeVisible();
    await userEvent.click(within(menu).getByRole('button', { name: /^Emissions and Energy/ }));
    await waitFor(() => expect(screen.queryByRole('navigation', { name: 'Menu' })).toBeNull());
    await expect(canvas.getByRole('heading', { level: 1 })).toHaveTextContent('Emissions and Energy');
  },
};

/** All Sections, one level up: Notifications leads with its unread count, and sections hidden on phones (the upgrade pages) are left out. */
export const PhoneSections: Story = {
  globals: phoneViewport,
  play: async ({ canvas, userEvent }) => {
    await expect(canvas.getByRole('button', { name: 'Open Menu, 10 unread' })).toBeVisible();
    await userEvent.click(canvas.getByRole('button', { name: /^Open Menu/ }));
    const menu = await screen.findByRole('navigation', { name: 'Menu' });
    await userEvent.click(within(menu).getByRole('button', { name: 'All Sections' }));
    const rows = within(menu).getAllByRole('listitem');
    await expect(rows[0]).toHaveTextContent('Notifications10 unread');
    await expect(within(menu).queryByText('Tenant Billing')).toBeNull();
    await userEvent.click(within(menu).getByRole('button', { name: 'Data Sources' }));
    await userEvent.click(within(menu).getByRole('button', { name: 'Meters' }));
    await waitFor(() => expect(screen.queryByRole('navigation', { name: 'Menu' })).toBeNull());
    await expect(canvas.getByRole('heading', { level: 1 })).toHaveTextContent('Meters');
  },
};

/** The scope sits in the header, one button between the menu and Ask Enertiv, so it stays in view as the page scrolls; it opens Change Scope. */
export const PhoneScope: Story = {
  globals: phoneViewport,
  play: async ({ canvas, userEvent }) => {
    const header = canvas.getByRole('banner');
    await userEvent.click(within(header).getByRole('button', { name: 'Portfolio All properties. Change Scope' }));
    const dialog = await screen.findByRole('dialog', { name: 'Change Scope' });
    await userEvent.click(within(dialog).getByRole('button', { name: /^East Region/ }));
    await waitFor(() => expect(within(header).getByRole('button', { name: 'Portfolio East Region. Change Scope' })).toBeVisible());
  },
};

/** On a phone, Search sits in the menu's header, beside Close, and opens the same search, filling the screen. The top bar keeps the menu button and the scope. */
export const PhoneSearch: Story = {
  globals: phoneViewport,
  play: async ({ canvas, userEvent }) => {
    await expect(canvas.queryByRole('button', { name: 'Search' })).toBeNull();
    await userEvent.click(canvas.getByRole('button', { name: /^Open Menu/ }));
    const menu = await screen.findByRole('navigation', { name: 'Menu' });
    await userEvent.click(within(menu).getByRole('button', { name: 'Search' }));
    const dialog = await screen.findByRole('dialog', { name: 'Search' });
    await userEvent.type(within(dialog).getByRole('textbox', { name: 'Search Pages' }), 'tenants');
    await userEvent.click(within(dialog).getByRole('button', { name: /^Tenants/ }));
    await waitFor(() => expect(screen.queryByRole('dialog', { name: 'Search' })).toBeNull());
    await expect(canvas.getByRole('heading', { level: 1 })).toHaveTextContent('Tenants');
  },
};

/** The browser's Back closes the open menu instead of leaving the page. */
export const PhoneBack: Story = {
  globals: phoneViewport,
  play: async ({ canvas, userEvent }) => {
    await userEvent.click(canvas.getByRole('button', { name: /^Open Menu/ }));
    await screen.findByRole('navigation', { name: 'Menu' });
    window.history.back();
    await waitFor(() => expect(screen.queryByRole('navigation', { name: 'Menu' })).toBeNull());
    await expect(canvas.getByRole('heading', { level: 1 })).toHaveTextContent('Reporting Readiness');
  },
};

/** My Account is pinned at the foot of the menu, with the company; it opens My Account's pages and the appearance control. */
export const PhoneAccount: Story = {
  globals: phoneViewport,
  play: async ({ canvas, userEvent }) => {
    await userEvent.click(canvas.getByRole('button', { name: /^Open Menu/ }));
    const menu = await screen.findByRole('navigation', { name: 'Menu' });
    await userEvent.click(within(menu).getByRole('button', { name: /My Account$/ }));
    await expect(within(menu).getByRole('heading', { name: 'My Account' })).toBeVisible();
    await expect(within(menu).getByRole('group', { name: 'Appearance' })).toBeVisible();
  },
};

/** The company button at the foot of the menu opens the companies to switch to; choosing one closes both menus. */
export const PhoneCompany: Story = {
  globals: phoneViewport,
  play: async ({ canvas, userEvent }) => {
    await userEvent.click(canvas.getByRole('button', { name: /^Open Menu/ }));
    const menu = await screen.findByRole('navigation', { name: 'Menu' });
    await userEvent.click(within(menu).getByRole('button', { name: 'Switch Company: Ridgeline Logistics REIT' }));
    await userEvent.click(await screen.findByRole('menuitemradio', { name: /^Harbor Point Residential/ }));
    await waitFor(() => expect(screen.queryByRole('navigation', { name: 'Menu' })).toBeNull());
    await expect(
      canvas.getByText('Placeholder for the Reporting Readiness page at Harbor Point Residential.'),
    ).toBeVisible();
  },
};

/** The rail's first button, the company's mark (its initials without one), opens the companies to switch to, each with its mark. */
export const CompanySwitch: Story = {
  play: async ({ canvas, userEvent }) => {
    await userEvent.click(canvas.getByRole('button', { name: 'Switch Company: Ridgeline Logistics REIT' }));
    await userEvent.click(await screen.findByRole('menuitemradio', { name: /^Summit Office Partners/ }));
    await expect(canvas.getByRole('button', { name: 'Switch Company: Summit Office Partners' })).toBeVisible();
  },
};

/** With `onAddCompany`, the company menu ends with an Add Company row; with one company, the menu lists just it. */
export const CompanyAdd: Story = {
  args: { companies: [companies[0]], onAddCompany: fn() },
  play: async ({ args, canvas, userEvent }) => {
    await userEvent.click(canvas.getByRole('button', { name: 'Switch Company: Ridgeline Logistics REIT' }));
    await expect(await screen.findByRole('menuitemradio', { name: /^Ridgeline Logistics REIT/ })).toHaveAttribute(
      'aria-checked',
      'true',
    );
    await userEvent.click(screen.getByRole('menuitem', { name: 'Add Company' }));
    await expect(args.onAddCompany).toHaveBeenCalledOnce();
  },
};

/** The dark scheme. In the app the person switches it in My Account; here the toolbar's Scheme does too. */
export const Dark: Story = {
  globals: { scheme: 'dark' },
};
