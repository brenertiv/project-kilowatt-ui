import { useState } from 'react';
import Alert from '@mui/material/Alert';
import Paper from '@mui/material/Paper';
import Snackbar from '@mui/material/Snackbar';
import type { Meta, StoryObj } from '@storybook/react-vite';
import { expect, fn, screen, waitFor, within } from 'storybook/test';
import highpoint1 from 'src/fixtures/images/highpoint-1.jpg';
import { RecordDrawer, type HoursException, type RecordChange, type RecordDrawerProps, type RecordDrawerRecord, type RecordGroup } from 'src/components/RecordDrawer';
import { sampleRecord } from 'src/fixtures/records';

/** Applies a group's changes to the record, as the app would after saving, with the new provenance. */
function applied(record: RecordDrawerRecord, group: RecordGroup, changes: RecordChange[]): RecordDrawerRecord {
  return {
    ...record,
    groups: record.groups.map((g) =>
      g.id !== group.id
        ? g
        : {
            ...g,
            fields: g.fields.map((field) => {
              const change = changes.find(({ fieldId }) => fieldId === field.id);
              if (!change) return field;
              const option = field.input?.kind === 'select' ? field.input.options.find((o) => o.value === change.value) : undefined;
              const unit = field.input?.kind === 'number' && field.input.unit ? ` ${field.input.unit}` : '';
              const display = option?.label ?? (typeof change.value === 'number' ? `${change.value.toLocaleString('en-US')}${unit}` : typeof change.value === 'string' ? change.value : (field.display ?? '—'));
              return { ...field, value: change.value, display, provenance: 'Changed by you, just now' };
            }),
          },
    ),
  };
}

/** Stands in for opening another record or a page; the Field links story's play function checks it. */
const follow = fn();

/** A synthetic space's record: values that link to other records and a page, and the property's photos under a value. */
const spaceRecord: RecordDrawerRecord = {
  id: 'space-1201',
  name: 'Suite 1201',
  kind: 'Space',
  groups: [
    {
      id: 'details',
      label: 'Space details',
      editable: false,
      fields: [
        { id: 'property', label: 'Property', value: 'Harbor Point', display: 'Harbor Point', provenance: 'Recorded at setup, Feb 3, 2025', link: { label: 'Harbor Point', onOpen: () => follow('prop-harbor-point') }, media: [{ src: highpoint1, alt: 'Harbor Point from the street' }] },
        { id: 'tenant', label: 'Tenant', value: 'Northwind Logistics', display: 'Northwind Logistics', provenance: 'From the lease, Jan 1, 2026', links: [{ label: 'Northwind Logistics', onOpen: () => follow('tenant-northwind') }] },
        { id: 'meters', label: 'Meters', value: ['m-1', 'm-2'], display: '2 meters', provenance: 'From the metering plan', links: [{ label: 'Electricity · Suite 1201', onOpen: () => follow('meter-m-1') }, { label: 'Water · Suite 1201', onOpen: () => follow('meter-m-2') }] },
      ],
    },
  ],
  activity: [],
};

const exceptions: HoursException[] = [{ date: '2026-11-26', name: 'Thanksgiving', hours: null }];

/** A synthetic property's occupied hours: the standing week as text, and its one-off exceptions, editable. */
const hoursRecord: RecordDrawerRecord = {
  id: 'prop-harbor-point',
  name: 'Harbor Point',
  kind: 'Property',
  groups: [
    {
      id: 'hours',
      label: 'Occupied hours',
      editable: true,
      fields: [
        { id: 'weekly', label: 'Weekly hours', value: 'Mon–Thu 8:00–18:00, Fri 8:00–17:00, closed weekends', display: 'Mon–Thu 8:00–18:00, Fri 8:00–17:00, closed weekends', provenance: 'Recorded at setup, Feb 3, 2025' },
        { id: 'exceptions', label: 'Exceptions', value: exceptions, display: '1 exception: Thanksgiving, closed', provenance: 'Changed by Avery Lin, Oct 2, 2025, 3:14 PM', input: { kind: 'exceptions' } },
      ],
    },
  ],
  activity: [],
};

/** The drawer as an app holds it: the record in state, updated on Save, with a snackbar saying what was saved. */
function Stateful(props: RecordDrawerProps) {
  const [record, setRecord] = useState(props.record);
  const [message, setMessage] = useState<string | null>(null);
  return (
    <>
      <RecordDrawer
        {...props}
        record={record}
        onSave={(group, changes) => {
          props.onSave(group, changes);
          setRecord(applied(record, group, changes));
          setMessage(changes.length ? 'Saved. The new values show on every page that uses them.' : 'Nothing changed.');
        }}
      />
      <Snackbar open={Boolean(message)} message={message} autoHideDuration={4000} onClose={() => setMessage(null)} />
    </>
  );
}

/**
 * Kilowatt's `RecordDrawer`: one object as a record, its groups of fields with their provenance, edited one group at a
 * time. Each story shows it in a floating `Paper`, the size `AppShell`'s `detail` gives it.
 */
const meta = {
  title: 'Navigation/Record drawer',
  component: RecordDrawer,
  tags: ['!autodocs'],
  // The MUI components this page documents; docs.test.ts checks its MUI departures section against them.
  parameters: { muiComponents: ['Tabs', 'Tab', 'Table', 'TextField', 'Dialog', 'Link', 'Switch'] },
  decorators: [
    (Story) => (
      <Paper component="aside" elevation={2} aria-label="Harbor Point" sx={{ display: 'flex', width: 440, height: 640, borderRadius: 1, overflow: 'hidden' }}>
        <Story />
      </Paper>
    ),
  ],
  args: { record: sampleRecord, onClose: fn(), onSave: fn() },
  render: (args) => <Stateful {...args} />,
} satisfies Meta<typeof RecordDrawer>;

export default meta;
type Story = StoryObj<typeof meta>;

/** The record: each group's fields with where each value came from, and an Edit per group. Focus starts on the name. */
export const Fields: Story = {
  play: async ({ canvas }) => {
    await waitFor(() => expect(canvas.getByRole('heading', { name: 'Harbor Point' })).toHaveFocus());
    await expect(canvas.getAllByText('Surveyed Mar 4, 2025')).toHaveLength(2);
    await expect(canvas.getByRole('button', { name: 'Edit Billing' })).toBeDisabled();
  },
};

/** Edit turns only that group into a form; Save sends the changed fields and the value shows its new provenance. */
export const EditAGroup: Story = {
  play: async ({ args, canvas, userEvent }) => {
    await userEvent.click(canvas.getByRole('button', { name: 'Edit Building details' }));
    const name = canvas.getByRole('textbox', { name: 'Name' });
    await userEvent.clear(name);
    await userEvent.type(name, 'Harbor Point Tower');
    await userEvent.click(canvas.getByRole('button', { name: 'Save' }));
    await expect(args.onSave).toHaveBeenCalledWith(expect.objectContaining({ id: 'details' }), [{ fieldId: 'name', value: 'Harbor Point Tower' }]);
    await expect(canvas.getByText('Harbor Point Tower')).toBeVisible();
    await expect(canvas.getByText('Changed by you, just now')).toBeVisible();
  },
};

/** `editWarning`: a surveyed group asks before its form opens, since the edit replaces what the survey recorded. */
export const EditWarning: Story = {
  play: async ({ canvas, userEvent }) => {
    await userEvent.click(canvas.getByRole('button', { name: 'Edit Size' }));
    const dialog = await screen.findByRole('dialog', { name: 'Overwrite the surveyed value?' });
    await userEvent.click(within(dialog).getByRole('button', { name: 'Overwrite' }));
    await expect(await canvas.findByRole('spinbutton', { name: 'Gross floor area' })).toBeVisible();
  },
};

/** Closing with unsaved changes asks first: Keep Editing returns to the form, Discard closes. */
export const UnsavedChanges: Story = {
  play: async ({ args, canvas, userEvent }) => {
    await userEvent.click(canvas.getByRole('button', { name: 'Edit Building details' }));
    await userEvent.type(canvas.getByRole('textbox', { name: 'Name' }), ' East');
    await userEvent.click(canvas.getByRole('button', { name: 'Close Record' }));
    const dialog = await screen.findByRole('dialog', { name: 'Discard unsaved changes?' });
    await userEvent.click(within(dialog).getByRole('button', { name: 'Discard' }));
    await expect(args.onClose).toHaveBeenCalledOnce();
  },
};

/** `onConfirm`: a value marked `confirm` shows Confirm and Correct on its row, for the person to verify it. */
export const ConfirmAValue: Story = {
  args: { onConfirm: fn() },
  play: async ({ args, canvas, userEvent }) => {
    await userEvent.click(canvas.getByRole('button', { name: 'Confirm' }));
    await expect(args.onConfirm).toHaveBeenCalledWith(expect.objectContaining({ id: 'built' }));
  },
};

/** `notice` and `action`: a note over the groups, and a header button to where the object's figures are shown. */
export const WithNoticeAndAction: Story = {
  args: {
    notice: <Alert severity="info">Edits here are a demo: they last for this session.</Alert>,
    action: { label: 'View Property', onClick: fn() },
  },
};

/** A field's `link` makes its value a link, and `links` list the objects it names under it, each opening another record in the drawer or a page; `media` shows the property's photos under its value. */
export const FieldLinks: Story = {
  name: 'Field links and images',
  args: { record: spaceRecord },
  play: async ({ canvas, userEvent }) => {
    follow.mockClear();
    await expect(canvas.getByRole('img', { name: 'Harbor Point from the street' })).toBeVisible();
    await userEvent.click(canvas.getByRole('button', { name: 'Water · Suite 1201' }));
    await expect(follow).toHaveBeenCalledWith('meter-m-2');
    await userEvent.click(canvas.getByRole('button', { name: 'Harbor Point' }));
    await expect(follow).toHaveBeenCalledWith('prop-harbor-point');
  },
};

/** A weekly-hours group's exceptions: rows of a date, a reason and the hours that day or closed, with Add Exception and a Remove on each. */
export const HoursExceptions: Story = {
  name: 'Hours and exceptions',
  args: { record: hoursRecord },
  play: async ({ args, canvas, userEvent }) => {
    await userEvent.click(canvas.getByRole('button', { name: 'Edit Occupied hours' }));
    await expect(canvas.getByRole('switch', { name: 'Open on 2026-11-26' })).not.toBeChecked();
    await expect(canvas.getByRole('textbox', { name: 'Reason' })).toHaveValue('Thanksgiving');
    await userEvent.click(canvas.getByRole('button', { name: 'Add Exception' }));
    await expect(canvas.getAllByRole('textbox', { name: 'Reason' })).toHaveLength(2);
    await userEvent.type(canvas.getAllByRole('textbox', { name: 'Reason' })[1], 'Inventory day');
    await userEvent.click(canvas.getByRole('button', { name: 'Remove the exception on 2026-11-26' }));
    await expect(canvas.getAllByRole('textbox', { name: 'Reason' })).toHaveLength(1);
    await userEvent.click(canvas.getByRole('button', { name: 'Save' }));
    await expect(args.onSave).toHaveBeenCalledWith(expect.objectContaining({ id: 'hours' }), [expect.objectContaining({ fieldId: 'exceptions', value: [expect.objectContaining({ name: 'Inventory day', hours: null })] })]);
  },
};

/** The Activity tab: the record's history, newest first. */
export const Activity: Story = {
  play: async ({ canvas, userEvent }) => {
    await userEvent.click(canvas.getByRole('tab', { name: 'Activity' }));
    await expect(canvas.getByText('Changed Floors from 11 to 12.')).toBeVisible();
  },
};
