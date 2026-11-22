import { useState, type ReactNode } from 'react';
import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import CardHeader from '@mui/material/CardHeader';
import Stack from '@mui/material/Stack';
import ToggleButton from '@mui/material/ToggleButton';
import ToggleButtonGroup from '@mui/material/ToggleButtonGroup';
import Typography from '@mui/material/Typography';
import {
  DataGridPro,
  type DataGridProProps,
  type GridColDef,
  type GridListViewColDef,
  type GridRenderCellParams,
} from '@mui/x-data-grid-pro';
import type { Meta, StoryObj } from '@storybook/react-vite';
import { expect, userEvent, waitFor, within } from 'storybook/test';
import { Icon } from 'src/icons';
import { TruncatedText } from 'src/components/TruncatedText';
import { appAccessLabels, memberRoleLabels, memberStatusLabels, members, owner, teams, type Member } from 'src/fixtures/people';
import 'src/mui/dataGridLicense';

const mediumDate = new Intl.DateTimeFormat('en-US', { dateStyle: 'medium' });
const whole = new Intl.NumberFormat('en-US');

/** When a member was last active: the date, or in words when they never signed in. */
const lastActive = (value: Date | undefined) => (value ? mediumDate.format(value) : 'Never');

/** The Team Members columns of the People section, as prototype 04 lists them. */
const memberColumns: GridColDef<Member>[] = [
  { field: 'name', headerName: 'Name', flex: 1, minWidth: 160, hideable: false },
  { field: 'title', headerName: 'Title', flex: 1, minWidth: 180 },
  { field: 'firm', headerName: 'Firm', flex: 1, minWidth: 180 },
  { field: 'email', headerName: 'Email', flex: 1, minWidth: 240 },
  { field: 'role', headerName: 'Role', width: 120, type: 'singleSelect', valueOptions: Object.entries(memberRoleLabels).map(([value, label]) => ({ value, label })) },
  { field: 'appAccess', headerName: 'App access', width: 160, type: 'singleSelect', valueOptions: Object.entries(appAccessLabels).map(([value, label]) => ({ value, label })) },
  { field: 'properties', headerName: 'Properties', width: 120, type: 'number', valueFormatter: (value: number) => whole.format(value) },
  { field: 'status', headerName: 'Status', width: 150, type: 'singleSelect', valueOptions: Object.entries(memberStatusLabels).map(([value, label]) => ({ value, label })) },
  { field: 'lastActive', headerName: 'Last active', width: 140, type: 'date', valueFormatter: lastActive },
];

/** The card every story's grid sits in: the grid straight in an outlined `Card` under a `CardHeader`, with no `CardContent`. */
function GridCard({ title, action, children }: { title: string; action?: ReactNode; children: ReactNode }) {
  return (
    <Card variant="outlined">
      <CardHeader title={<TruncatedText>{title}</TruncatedText>} action={action} />
      <Box sx={{ display: 'flex', flexDirection: 'column' }}>{children}</Box>
    </Card>
  );
}

/**
 * MUI X's Data Grid (`DataGridPro` from `@mui/x-data-grid-pro`), used as MUI documents it, for a table people
 * work in: choose columns, filter, export, switch to a list, or open a tree. Kilowatt has no wrapper. Every story
 * shows the grid as it ships, straight in an outlined `Card` under a `CardHeader`, with no `CardContent`.
 */
const meta = {
  title: 'Data display/DataGrid',
  component: DataGridPro,
  tags: ['!autodocs'],
  // The MUI components this page documents; docs.test.ts checks its MUI departures section against them.
  parameters: {
    muiComponents: ['DataGrid'],
    // Without a license key (src/mui/dataGridLicense.ts) MUI X draws a "Missing license key" watermark over the grid,
    // in MUI's own grey. It isn't Kilowatt's to fix and goes with the key, so the axe check leaves it out.
    a11y: { context: { exclude: ['.MuiDataGrid-main > div[style*="pointer-events: none"]'] } },
  },
  args: { columns: [] },
} satisfies Meta<typeof DataGridPro>;

export default meta;
type Story = StoryObj<typeof meta>;

/** A member as one list row: the name over the title and firm, with the role and status at the end. */
function MemberListCell({ row }: GridRenderCellParams<Member>) {
  return (
    <Stack direction="row" spacing={2} sx={{ alignItems: 'center', height: '100%', minWidth: 0 }}>
      <Box sx={{ flex: 1, minWidth: 0 }}>
        <Typography variant="body2" noWrap sx={{ fontWeight: 'fontWeightMedium' }}>
          {row.name}
        </Typography>
        <Typography variant="body2" color="textSecondary" noWrap>
          {row.title}, {row.firm}
        </Typography>
      </Box>
      <Box sx={{ textAlign: 'right', flexShrink: 0 }}>
        <Typography variant="body2" noWrap>
          {memberRoleLabels[row.role]}
        </Typography>
        <Typography variant="body2" color="textSecondary" noWrap>
          {memberStatusLabels[row.status]}
        </Typography>
      </Box>
    </Stack>
  );
}

const memberListColumn: GridListViewColDef<Member> = { field: 'listColumn', renderCell: MemberListCell };

type View = 'table' | 'list';

function TeamMembers() {
  const [view, setView] = useState<View>('table');
  return (
    <GridCard
      title="Team Members"
      action={
        <ToggleButtonGroup exclusive value={view} onChange={(_, next: View | null) => next && setView(next)} aria-label="View">
          <ToggleButton value="table" aria-label="Table">
            <Icon name="table_rows" />
          </ToggleButton>
          <ToggleButton value="list" aria-label="List">
            <Icon name="format_list_bulleted" />
          </ToggleButton>
        </ToggleButtonGroup>
      }
    >
      <DataGridPro
        aria-label="Team members"
        rows={members}
        columns={memberColumns}
        listView={view === 'list'}
        listViewColumn={memberListColumn}
        rowHeight={view === 'list' ? 64 : undefined}
        disableRowSelectionOnClick
        hideFooter
      />
    </GridCard>
  );
}

/**
 * The People section's Team Members as a table or a list: `listView` swaps the columns for one `listViewColumn`,
 * whose `renderCell` draws each row, and a `ToggleButtonGroup` in the card's header switches between them. Sorting
 * and filters carry across the switch.
 */
export const TableAndList: Story = {
  render: () => <TeamMembers />,
  play: async ({ canvas }) => {
    const grid = canvas.getByRole('grid', { name: 'Team members' });
    await expect(within(grid).getByRole('columnheader', { name: 'Name' })).toBeVisible();
    await userEvent.click(canvas.getByRole('button', { name: 'List' }));
    await waitFor(() => expect(within(grid).queryByRole('columnheader', { name: 'Title' })).toBeNull());
    await expect(within(grid).getByText('VP Operations, Meridian Property Trust')).toBeVisible();
    await userEvent.click(canvas.getByRole('button', { name: 'Table' }));
    await waitFor(() => expect(within(grid).getByRole('columnheader', { name: 'Title' })).toBeVisible());
  },
};

/**
 * `showToolbar` adds the grid's toolbar: Columns to show and hide columns, Filters to filter rows, Export to
 * download a CSV or print, and a search. `slotProps.toolbar.csvOptions` names the downloaded file.
 */
export const Toolbar: Story = {
  render: () => (
    <GridCard title="Team Members">
      <DataGridPro
        aria-label="Team members"
        rows={members}
        columns={memberColumns}
        showToolbar
        slotProps={{ toolbar: { csvOptions: { fileName: 'team-members', utf8WithBom: true, escapeFormulas: true } } }}
        initialState={{ columns: { columnVisibilityModel: { email: false } } }}
        disableRowSelectionOnClick
        hideFooter
      />
    </GridCard>
  ),
  play: async ({ canvas }) => {
    await expect(canvas.getByRole('button', { name: 'Columns' })).toBeVisible();
    await expect(canvas.getByRole('button', { name: 'Filters' })).toBeVisible();
    await userEvent.click(canvas.getByRole('button', { name: 'Export' }));
    const menu = await within(document.body).findByRole('menu');
    await waitFor(() => expect(within(menu).getByRole('menuitem', { name: 'Download as CSV' })).toBeVisible());
    await expect(within(menu).getByRole('menuitem', { name: 'Print' })).toBeVisible();
    await userEvent.keyboard('{Escape}');
  },
};

/** A row of the tree: a team, or a member under it. `path` is the row's place in the tree, its team then its name. */
type TreeRow = { id: string; path: string[]; title: string; role: string; properties: number };

const treeRows: TreeRow[] = [
  ...teams.map((team) => ({
    id: team.id,
    path: [team.name],
    title: team.firm === owner ? 'Owner’s team' : 'Third-party firm',
    role: `${memberRoleLabels[team.defaultRole]} by default`,
    properties: team.properties,
  })),
  ...members.map((member) => ({
    id: member.id,
    path: [member.team, member.name],
    title: member.title,
    role: memberRoleLabels[member.role],
    properties: member.properties,
  })),
];

const treeColumns: GridColDef<TreeRow>[] = [
  { field: 'title', headerName: 'Title', flex: 1, minWidth: 200 },
  { field: 'role', headerName: 'Role', width: 180 },
  { field: 'properties', headerName: 'Properties', width: 120, type: 'number', valueFormatter: (value: number) => whole.format(value) },
];

// Kept outside the component: a new function each render rebuilds the tree and collapses every row.
const getTreeDataPath: DataGridProProps<TreeRow>['getTreeDataPath'] = (row) => row.path;

/**
 * Tree data: teams with their members under them. `treeData` with `getTreeDataPath` builds the tree from each row's
 * path, `groupingColDef` names the column that holds the tree, and `defaultGroupingExpansionDepth` opens the first
 * level. Each team's row counts its members.
 */
export const TreeData: Story = {
  render: () => (
    <GridCard title="Teams">
      <DataGridPro
        aria-label="Teams and their members"
        rows={treeRows}
        columns={treeColumns}
        treeData
        getTreeDataPath={getTreeDataPath}
        groupingColDef={{ headerName: 'Team', flex: 1, minWidth: 260, hideable: false }}
        defaultGroupingExpansionDepth={1}
        disableRowSelectionOnClick
        hideFooter
      />
    </GridCard>
  ),
  play: async ({ canvas }) => {
    const grid = canvas.getByRole('treegrid', { name: 'Teams and their members' });
    await expect(within(grid).getByText('Priya Shah')).toBeVisible();
    const collapse = within(grid).getAllByRole('button', { name: /hide children/i });
    await userEvent.click(collapse[0]);
    await waitFor(() => expect(within(grid).queryByText('Priya Shah')).toBeNull());
    await userEvent.click(within(grid).getAllByRole('button', { name: /see children/i })[0]);
    await waitFor(() => expect(within(grid).getByText('Priya Shah')).toBeVisible());
  },
};
