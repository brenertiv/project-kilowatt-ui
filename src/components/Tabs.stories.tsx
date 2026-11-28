import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import Tab from '@mui/material/Tab';
import Tabs from '@mui/material/Tabs';
import Typography from '@mui/material/Typography';
import type { Meta, StoryObj } from '@storybook/react-vite';
import { useState } from 'react';
import { expect } from 'storybook/test';
import { Icon } from 'src/icons';

/**
 * MUI's `Tabs` and `Tab`, used as MUI documents them. Kilowatt has no wrapper: the theme's
 * departures (Foundations → MUI departures) draw them as a segmented control.
 */
const meta = {
  title: 'Navigation/Tabs',
  component: Tabs,
  tags: ['!autodocs'],
  // The MUI components this page documents; docs.test.ts checks its MUI departures section against them.
  parameters: { muiComponents: ['Tabs', 'Tab'] },
} satisfies Meta<typeof Tabs>;

export default meta;
type Story = StoryObj<typeof meta>;

/** Switch between views of one thing: each `Tab` controls a `tabpanel`, and the open one sits on the raised segment. */
export const Basic: Story = {
  render: function Render(args) {
    const [tab, setTab] = useState('account');
    return (
      <Box>
        <Tabs {...args} value={tab} onChange={(_, next: string) => setTab(next)} aria-label="Settings Sections">
          <Tab value="account" label="Account" id="settings-tab-account" aria-controls="settings-panel-account" />
          <Tab value="password" label="Password" id="settings-tab-password" aria-controls="settings-panel-password" />
        </Tabs>
        <Box role="tabpanel" id={`settings-panel-${tab}`} aria-labelledby={`settings-tab-${tab}`} sx={{ pt: 2 }}>
          <Typography>{tab === 'account' ? 'Name, email and organization.' : 'Change your password.'}</Typography>
        </Box>
      </Box>
    );
  },
  play: async ({ canvas, userEvent }) => {
    const password = canvas.getByRole('tab', { name: 'Password' });
    await userEvent.click(password);
    await expect(password).toHaveAttribute('aria-selected', 'true');
    await expect(canvas.getByRole('tabpanel')).toHaveTextContent('Change your password.');
  },
};

/** Tabs inside a card, on the card's surface: the recessed track and raised segment hold on every surface level. */
export const InACard: Story = {
  name: 'In a card',
  render: function Render(args) {
    const [tab, setTab] = useState('usage');
    return (
      <Card variant="outlined" sx={{ maxWidth: 480 }}>
        <CardContent>
          <Tabs {...args} value={tab} onChange={(_, next: string) => setTab(next)} aria-label="Building Views">
            <Tab value="usage" label="Usage" />
            <Tab value="cost" label="Cost" />
            <Tab value="emissions" label="Emissions" />
          </Tabs>
        </CardContent>
      </Card>
    );
  },
};

/** Tabs with icons beside their labels: `icon` with `iconPosition="start"`. The open tab's icon fills through the theme. */
export const WithIcons: Story = {
  name: 'With icons',
  render: function Render(args) {
    const [tab, setTab] = useState('list');
    return (
      <Tabs {...args} value={tab} onChange={(_, next: string) => setTab(next)} aria-label="Portfolio Views">
        <Tab value="list" label="List" icon={<Icon name="table_rows" />} iconPosition="start" />
        <Tab value="map" label="Map" icon={<Icon name="map" />} iconPosition="start" />
      </Tabs>
    );
  },
};

/** Tabs that share their container's width equally: `variant="fullWidth"`, the one variant whose track spans its container. */
export const FullWidth: Story = {
  name: 'Full width',
  args: { variant: 'fullWidth' },
  render: function Render(args) {
    const [tab, setTab] = useState('record');
    return (
      <Box sx={{ maxWidth: 400 }}>
        <Tabs {...args} value={tab} onChange={(_, next: string) => setTab(next)} aria-label="Record Sections">
          <Tab value="record" label="Record" />
          <Tab value="activity" label="Activity" />
        </Tabs>
      </Box>
    );
  },
};

/** More tabs than fit: `variant="scrollable"` with `scrollButtons="auto"`, so arrows show only while the tabs overflow. */
export const Scrollable: Story = {
  args: { variant: 'scrollable', scrollButtons: 'auto' },
  render: function Render(args) {
    const [tab, setTab] = useState(0);
    const months = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
    return (
      <Box sx={{ maxWidth: 480 }}>
        <Tabs {...args} value={tab} onChange={(_, next: number) => setTab(next)} aria-label="Months">
          {months.map((month) => (
            <Tab key={month} label={month} />
          ))}
        </Tabs>
      </Box>
    );
  },
};

/** A tab that isn't available yet: `disabled` on the `Tab`. Say why nearby. */
export const Disabled: Story = {
  render: function Render(args) {
    const [tab, setTab] = useState('overview');
    return (
      <Tabs {...args} value={tab} onChange={(_, next: string) => setTab(next)} aria-label="Meter Sections">
        <Tab value="overview" label="Overview" />
        <Tab value="readings" label="Readings" />
        <Tab value="billing" label="Billing" disabled />
      </Tabs>
    );
  },
};
