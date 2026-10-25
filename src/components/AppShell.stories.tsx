import { useState } from 'react';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import IconButton from '@mui/material/IconButton';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';
import useMediaQuery from '@mui/material/useMediaQuery';
import { useTheme } from '@mui/material/styles';
import type { Meta, StoryObj } from '@storybook/react-vite';
import { expect, screen, waitFor, within } from 'storybook/test';
import { AppShell, type AppShellCompany, type AppShellSection } from 'src/components/AppShell';
import { Icon } from 'src/icons';

/** The sections, each with its pages. Tenant Billing and Maintenance have no pages of their own, so no panel, and are left out on phones. */
const sections: AppShellSection[] = [
  {
    id: 'workspace',
    label: 'Workspace',
    icon: 'table_rows',
    panel: {
      actions: (
        <Button variant="outlined" fullWidth startIcon={<Icon name="add" />} sx={{ justifyContent: 'flex-start' }}>
          New
        </Button>
      ),
      items: [
        { id: 'reporting-readiness', label: 'Reporting readiness', secondary: 'Dashboard', icon: 'table_rows' },
        { id: 'energy-esg-summary', label: 'Energy and ESG summary', secondary: 'Report', icon: 'bar_chart' },
        { id: 'emissions-energy', label: 'Emissions and energy', secondary: 'Dashboard', icon: 'table_rows' },
        { id: 'decarbonization-plan', label: 'Decarbonization plan', secondary: 'Plan', icon: 'trending_down' },
      ],
    },
  },
  {
    id: 'property-info',
    label: 'Property Info',
    icon: 'apartment',
    panel: {
      items: [
        { id: 'overview', label: 'Overview', icon: 'table_rows' },
        { id: 'coverage', label: 'Coverage', icon: 'view_column' },
        { id: 'data-health', label: 'Data Health', icon: 'check_circle', count: 90 },
        { id: 'sources', label: 'Sources', icon: 'link' },
        { id: 'bills', label: 'Bills', icon: 'table_rows' },
        { id: 'properties', label: 'Properties', icon: 'apartment', count: 48 },
        { id: 'equipment', label: 'Equipment', icon: 'devices' },
        { id: 'meters', label: 'Meters', icon: 'bolt' },
        { id: 'files', label: 'Files', icon: 'inbox' },
      ],
    },
  },
  {
    id: 'people',
    label: 'People',
    icon: 'devices',
    panel: {
      items: [
        { id: 'team', label: 'Team', icon: 'devices' },
        { id: 'tenants', label: 'Tenants', icon: 'apartment' },
        { id: 'partners', label: 'Partners', icon: 'link' },
        { id: 'contacts', label: 'Property contacts', icon: 'inbox' },
      ],
    },
  },
  { id: 'tenant-billing', label: 'Tenant Billing', icon: 'bar_chart', badge: 'Upgrade available', hideOnPhone: true },
  { id: 'maintenance', label: 'Maintenance', icon: 'tune', badge: 'Upgrade available', hideOnPhone: true },
  {
    id: 'notifications',
    label: 'Notifications',
    icon: 'inbox',
    placement: 'end',
    count: 10,
    badge: '10 unread',
    panel: {
      items: [
        { id: 'all', label: 'All unread', icon: 'inbox' },
        { id: 'insights', label: 'Insights', icon: 'bolt' },
        { id: 'activity', label: 'Activity', icon: 'schedule' },
        { id: 'property-alerts', label: 'Property alerts', icon: 'warning' },
        { id: 'data-alerts', label: 'Data alerts', icon: 'error' },
        { id: 'app-updates', label: 'App updates', icon: 'info' },
      ],
    },
  },
  {
    id: 'account',
    label: 'My account',
    initials: 'MC',
    placement: 'end',
    panel: {
      colorScheme: true,
      items: [
        { id: 'profile', label: 'Profile', icon: 'devices' },
        { id: 'preferences', label: 'Preferences', icon: 'tune' },
        { id: 'notification-settings', label: 'Notification preferences', icon: 'inbox' },
        { id: 'entitlements', label: 'Modules and entitlements', icon: 'view_column' },
        { id: 'help', label: 'Help and support', icon: 'info' },
      ],
    },
  },
];

/** The companies the person belongs to; the first is the one they're in. */
const companies: AppShellCompany[] = [
  { id: 'ridgeline', name: 'Ridgeline Logistics REIT', detail: 'Admin' },
  { id: 'harbor-point', name: 'Harbor Point Residential', detail: 'Member' },
  { id: 'summit', name: 'Summit Office Partners', detail: 'Member' },
];

const firstPage = (section: string) => sections.find((item) => item.id === section)?.panel?.items[0].id;

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
      'Badge',
      'Tooltip',
      'Avatar',
      'ToggleButton',
      'ToggleButtonGroup',
      'Menu',
      'MenuItem',
      'Slide',
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
    const [section, setSection] = useState(args.section);
    const [page, setPage] = useState(firstPage(args.section));
    const [assistantOpen, setAssistantOpen] = useState(args.asideOpen ?? false);
    const [company, setCompany] = useState(args.company);
    // On phones the header has room for an icon, not the label.
    const phone = useMediaQuery(useTheme().breakpoints.down('md'));
    const current = sections.find((item) => item.id === section);
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
          <Button
            startIcon={<Icon name="view_column" />}
            endIcon={<Icon name="expand_more" />}
            aria-label="Change scope: Portfolio, 48 properties"
          >
            Portfolio
            <Typography
              component="span"
              variant="caption"
              color="text.secondary"
              sx={{ ml: 1, fontVariantNumeric: 'tabular-nums' }}
            >
              48 properties
            </Typography>
          </Button>
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
            <Stack direction="row" sx={{ alignItems: 'center', justifyContent: 'space-between', p: 2, pr: 1 }}>
              <Typography variant="h5" component="h2">
                Ask Enertiv
              </Typography>
              <IconButton aria-label="Close Ask Enertiv" onClick={() => setAssistantOpen(false)}>
                <Icon name="close" />
              </IconButton>
            </Stack>
            <Typography variant="body2" color="text.secondary" sx={{ px: 2 }}>
              Placeholder for the assistant.
            </Typography>
          </Stack>
        }
        asideOpen={assistantOpen}
        asideLabel="Ask Enertiv"
        onAsideClose={() => setAssistantOpen(false)}
      >
        <Box sx={{ maxWidth: '65ch' }}>
          <Typography variant="h3" component="h1" gutterBottom>
            {title}
          </Typography>
          <Typography color="text.secondary">
            Placeholder for the {title} page at {company.name}.
          </Typography>
        </Box>
      </AppShell>
    );
  },
} satisfies Meta<typeof AppShell>;

export default meta;
type Story = StoryObj<typeof meta>;

/** A section with pages: the rail, the section panel with search and a New action, the header and the page. */
export const Default: Story = {
  play: async ({ canvas, userEvent }) => {
    await userEvent.click(canvas.getByRole('button', { name: /^Energy and ESG summary/ }));
    await expect(canvas.getByRole('button', { name: /^Energy and ESG summary/ })).toHaveAttribute(
      'aria-current',
      'page',
    );
    await expect(canvas.getByRole('heading', { level: 1 })).toHaveTextContent('Energy and ESG summary');
  },
};

/** Panel rows can carry a count, such as open data issues; choosing a section in the rail swaps the panel. */
export const PanelCounts: Story = {
  args: { section: 'property-info' },
  play: async ({ canvas, userEvent }) => {
    await expect(canvas.getByRole('navigation', { name: 'Property Info' })).toHaveTextContent('90');
    await userEvent.click(canvas.getByRole('button', { name: 'People' }));
    await expect(canvas.getByRole('navigation', { name: 'People' })).toBeVisible();
  },
};

/** Notifications is a section like the others, placed at the bottom of the rail with its unread count; its panel groups notifications by kind. */
export const Notifications: Story = {
  play: async ({ canvas, userEvent }) => {
    await userEvent.click(canvas.getByRole('button', { name: 'Notifications, 10 unread' }));
    await expect(canvas.getByRole('button', { name: 'Notifications, 10 unread' })).toHaveAttribute(
      'aria-current',
      'page',
    );
    await userEvent.click(
      within(canvas.getByRole('navigation', { name: 'Notifications' })).getByRole('button', { name: 'Data alerts' }),
    );
    await expect(canvas.getByRole('heading', { level: 1 })).toHaveTextContent('Data alerts');
  },
};

/** My account follows the same pattern at the very bottom of the rail, with the person's initials for its icon; its panel holds the Light, Dark and System appearance control. */
export const Account: Story = {
  play: async ({ canvas, userEvent }) => {
    await userEvent.click(canvas.getByRole('button', { name: 'My account' }));
    const panel = canvas.getByRole('navigation', { name: 'My account' });
    await expect(within(panel).getByRole('button', { name: /^Profile/ })).toHaveAttribute('aria-current', 'page');
    await userEvent.click(within(panel).getByRole('button', { name: 'Dark' }));
    await expect(within(panel).getByRole('button', { name: 'Dark' })).toHaveAttribute('aria-pressed', 'true');
    await expect(document.documentElement).toHaveClass('dark');
    await userEvent.click(within(panel).getByRole('button', { name: 'Light' }));
    await expect(document.documentElement).toHaveClass('light');
  },
};

/** A section with no pages of its own: no panel, and no panel toggle. A dot marks sections with news, read with the label. */
export const NoPanel: Story = {
  args: { section: 'tenant-billing' },
  play: async ({ canvas }) => {
    await expect(canvas.queryByRole('navigation', { name: 'Tenant Billing' })).toBeNull();
    await expect(canvas.queryByRole('button', { name: 'Dock navigation' })).toBeNull();
    await expect(canvas.getByRole('button', { name: 'Maintenance, Upgrade available' })).toBeVisible();
  },
};

/** The panel undocked, for more room: hovering a rail item floats that section's panel inside the frame, and Dock navigation puts it back. */
export const PanelUndocked: Story = {
  args: { defaultPanelOpen: false },
  play: async ({ canvas, userEvent }) => {
    await expect(canvas.queryByRole('navigation', { name: 'Workspace' })).toBeNull();
    await userEvent.hover(canvas.getByRole('button', { name: 'Property Info' }));
    const panel = await canvas.findByRole('navigation', { name: 'Property Info' });
    await userEvent.click(within(panel).getByRole('button', { name: 'Meters' }));
    await expect(canvas.getByRole('heading', { level: 1 })).toHaveTextContent('Meters');
    await expect(canvas.queryByRole('navigation', { name: 'Property Info' })).toBeNull();
    await userEvent.click(canvas.getByRole('button', { name: 'Dock navigation' }));
    await expect(canvas.getByRole('navigation', { name: 'Property Info' })).toBeVisible();
    await userEvent.click(canvas.getByRole('button', { name: 'Collapse navigation' }));
    await expect(canvas.queryByRole('navigation', { name: 'Property Info' })).toBeNull();
  },
};

/** Search narrows the panel's pages as you type, and says so when nothing matches. */
export const PanelSearch: Story = {
  args: { section: 'property-info' },
  play: async ({ canvas, userEvent }) => {
    await userEvent.type(canvas.getByRole('textbox', { name: 'Search Property Info' }), 'me');
    await expect(canvas.getByRole('button', { name: 'Meters' })).toBeVisible();
    await expect(canvas.queryByRole('button', { name: 'Bills' })).toBeNull();
    await userEvent.type(canvas.getByRole('textbox', { name: 'Search Property Info' }), 'xx');
    await expect(canvas.getByRole('status')).toHaveTextContent('No pages match “mexx”.');
  },
};

/** The panel resizes between 220px and 380px by dragging its edge, or with the arrow keys, Home and End once it's focused. */
export const PanelResize: Story = {
  play: async ({ canvas, userEvent }) => {
    const handle = canvas.getByRole('separator', { name: 'Resize navigation' });
    handle.focus();
    await userEvent.keyboard('{ArrowRight}{ArrowRight}');
    await expect(handle).toHaveAttribute('aria-valuenow', '272');
    await userEvent.keyboard('{End}');
    await expect(handle).toHaveAttribute('aria-valuenow', '380');
  },
};

/** A side column for the assistant, opened from the header. Below the `lg` breakpoint it opens as a bottom sheet. */
export const AssistantOpen: Story = {
  args: { asideOpen: true },
  play: async ({ canvas, userEvent }) => {
    await expect(canvas.getByRole('complementary', { name: 'Ask Enertiv' })).toBeVisible();
    await userEvent.click(canvas.getByRole('button', { name: 'Close Ask Enertiv' }));
    await expect(canvas.queryByRole('complementary', { name: 'Ask Enertiv' })).toBeNull();
  },
};

const phoneViewport = { viewport: { value: 'phone', isRotated: false } };

/** On a phone, the menu is one column that opens on the current section's pages; choosing a page closes it. The page scrolls the document under a sticky header. */
export const Phone: Story = {
  globals: phoneViewport,
  play: async ({ canvas, userEvent }) => {
    await userEvent.click(canvas.getByRole('button', { name: /^Open menu/ }));
    const menu = await screen.findByRole('navigation', { name: 'Menu' });
    await expect(within(menu).getByRole('heading', { name: 'Workspace' })).toBeVisible();
    await userEvent.click(within(menu).getByRole('button', { name: /^Emissions and energy/ }));
    await waitFor(() => expect(screen.queryByRole('navigation', { name: 'Menu' })).toBeNull());
    await expect(canvas.getByRole('heading', { level: 1 })).toHaveTextContent('Emissions and energy');
  },
};

/** All sections, one level up: Notifications leads with its unread count, and sections hidden on phones (the upgrade pages) are left out. */
export const PhoneSections: Story = {
  globals: phoneViewport,
  play: async ({ canvas, userEvent }) => {
    await expect(canvas.getByRole('button', { name: 'Open menu, 10 unread' })).toBeVisible();
    await userEvent.click(canvas.getByRole('button', { name: /^Open menu/ }));
    const menu = await screen.findByRole('navigation', { name: 'Menu' });
    await userEvent.click(within(menu).getByRole('button', { name: 'All sections' }));
    const rows = within(menu).getAllByRole('listitem');
    await expect(rows[0]).toHaveTextContent('Notifications10 unread');
    await expect(within(menu).queryByText('Tenant Billing')).toBeNull();
    await userEvent.click(within(menu).getByRole('button', { name: 'Property Info' }));
    await userEvent.click(within(menu).getByRole('button', { name: 'Meters' }));
    await waitFor(() => expect(screen.queryByRole('navigation', { name: 'Menu' })).toBeNull());
    await expect(canvas.getByRole('heading', { level: 1 })).toHaveTextContent('Meters');
  },
};

/** The page title is a menu of the section's pages, so a neighbouring page is one tap away without the menu. */
export const PhonePageMenu: Story = {
  globals: phoneViewport,
  play: async ({ canvas, userEvent }) => {
    await userEvent.click(canvas.getByRole('button', { name: 'Reporting readiness' }));
    await userEvent.click(await screen.findByRole('menuitem', { name: /^Decarbonization plan/ }));
    await waitFor(() => expect(screen.queryByRole('menu')).toBeNull());
    await expect(canvas.getByRole('heading', { level: 1 })).toHaveTextContent('Decarbonization plan');
  },
};

/** The browser's Back closes the open menu instead of leaving the page. */
export const PhoneBack: Story = {
  globals: phoneViewport,
  play: async ({ canvas, userEvent }) => {
    await userEvent.click(canvas.getByRole('button', { name: /^Open menu/ }));
    await screen.findByRole('navigation', { name: 'Menu' });
    window.history.back();
    await waitFor(() => expect(screen.queryByRole('navigation', { name: 'Menu' })).toBeNull());
    await expect(canvas.getByRole('heading', { level: 1 })).toHaveTextContent('Reporting readiness');
  },
};

/** My account is pinned at the foot of the menu, with the company; it opens My account's pages and the appearance control. */
export const PhoneAccount: Story = {
  globals: phoneViewport,
  play: async ({ canvas, userEvent }) => {
    await userEvent.click(canvas.getByRole('button', { name: /^Open menu/ }));
    const menu = await screen.findByRole('navigation', { name: 'Menu' });
    await userEvent.click(within(menu).getByRole('button', { name: /My account$/ }));
    await expect(within(menu).getByRole('heading', { name: 'My account' })).toBeVisible();
    await expect(within(menu).getByRole('group', { name: 'Appearance' })).toBeVisible();
  },
};

/** The company button at the foot of the menu opens the companies to switch to; choosing one closes both menus. */
export const PhoneCompany: Story = {
  globals: phoneViewport,
  play: async ({ canvas, userEvent }) => {
    await userEvent.click(canvas.getByRole('button', { name: /^Open menu/ }));
    const menu = await screen.findByRole('navigation', { name: 'Menu' });
    await userEvent.click(within(menu).getByRole('button', { name: 'Ridgeline Logistics REIT, switch company' }));
    await userEvent.click(await screen.findByRole('menuitemradio', { name: /^Harbor Point Residential/ }));
    await waitFor(() => expect(screen.queryByRole('navigation', { name: 'Menu' })).toBeNull());
    await expect(
      canvas.getByText('Placeholder for the Reporting readiness page at Harbor Point Residential.'),
    ).toBeVisible();
  },
};

/** The rail's first button opens the companies to switch to. */
export const CompanySwitch: Story = {
  play: async ({ canvas, userEvent }) => {
    await userEvent.click(canvas.getByRole('button', { name: 'Switch company: Ridgeline Logistics REIT' }));
    await userEvent.click(await screen.findByRole('menuitemradio', { name: /^Summit Office Partners/ }));
    await expect(canvas.getByRole('button', { name: 'Switch company: Summit Office Partners' })).toBeVisible();
  },
};

/** The dark scheme. In the app the person switches it in My account; here the toolbar's Scheme does too. */
export const Dark: Story = {
  globals: { scheme: 'dark' },
};
