import { useEffect, useId, useRef, useState, type KeyboardEvent, type ReactNode } from 'react';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Checkbox from '@mui/material/Checkbox';
import Chip from '@mui/material/Chip';
import Dialog from '@mui/material/Dialog';
import DialogActions from '@mui/material/DialogActions';
import DialogContent from '@mui/material/DialogContent';
import DialogContentText from '@mui/material/DialogContentText';
import DialogTitle from '@mui/material/DialogTitle';
import Divider from '@mui/material/Divider';
import IconButton from '@mui/material/IconButton';
import InputAdornment from '@mui/material/InputAdornment';
import List from '@mui/material/List';
import ListItem from '@mui/material/ListItem';
import ListItemText from '@mui/material/ListItemText';
import MenuItem from '@mui/material/MenuItem';
import Stack from '@mui/material/Stack';
import Tab from '@mui/material/Tab';
import Table from '@mui/material/Table';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import TableRow from '@mui/material/TableRow';
import Tabs from '@mui/material/Tabs';
import TextField from '@mui/material/TextField';
import Tooltip from '@mui/material/Tooltip';
import Typography from '@mui/material/Typography';
import { Icon } from '../icons';

/** How a field is edited, when it is: a text, number or date field, a select, or a multiple select. */
export type RecordFieldInput =
  | { kind: 'text' }
  | { kind: 'number'; unit?: string; min?: number }
  | { kind: 'date' }
  | { kind: 'select'; options: { value: string; label: string }[] }
  | { kind: 'multi'; options: { value: string; label: string }[] };

/** A field's value as recorded: a string (a date as `YYYY-MM-DD`), a number, the chosen values of a multiple select, or `null` for nothing on record. */
export type RecordFieldValue = string | number | string[] | null;

export type RecordField = {
  id: string;
  label: string;
  /** The value as recorded, for the form. */
  value: RecordFieldValue;
  /** The value as it reads: formatted for the locale, with its unit, or a dash for nothing on record. */
  display: string;
  /** The line under the value, saying where it came from: `Surveyed Mar 4, 2025`, `Changed by Avery Lin, Oct 2, 2025, 3:14 PM`. */
  provenance: string;
  /** How the field is edited; a field without one is read only, and shows as text in the group's form. */
  input?: RecordFieldInput;
  /** Asks whoever may edit to confirm or correct the value, with Confirm and Correct on its row. */
  confirm?: boolean;
};

export type RecordGroup = {
  id: string;
  /** The group's heading, in sentence case: `Building details`. */
  label: string;
  fields: RecordField[];
  /** Whether the person may edit this group. A group they can't edit keeps a disabled Edit with `cannotEditReason` in its tooltip. */
  editable: boolean;
  /** Why the group can't be edited, for the disabled Edit's tooltip. */
  cannotEditReason?: string;
  /** A destructive warning before the form opens, for a group whose values editing replaces (values recorded on a survey). */
  editWarning?: { title: string; text: string; confirmLabel: string };
};

export type RecordActivityEntry = {
  /** When, in milliseconds since the epoch. */
  at: number;
  /** Who. */
  by: string;
  /** What happened, as a sentence. */
  text: string;
};

/** The object the drawer shows: its name, what kind it is, its groups of fields and its history. */
export type RecordDrawerRecord = {
  id: string;
  name: string;
  /** The kind of object, for the chip beside the name: `Property`. */
  kind: string;
  groups: RecordGroup[];
  /** The record's history, newest first. */
  activity: RecordActivityEntry[];
};

/** One field's new value, from a group's Save. */
export type RecordChange = { fieldId: string; value: RecordFieldValue };

export type RecordDrawerProps = {
  /** The object to show. Pass the updated record after a save, with the changed values and their new provenance. */
  record: RecordDrawerRecord;
  /** Called by Close, and by Escape, after the person decides about unsaved changes. */
  onClose: () => void;
  /** Called with a group and the fields that changed, none if nothing did. Say what the save reaches elsewhere in a `Snackbar`. */
  onSave: (group: RecordGroup, changes: RecordChange[]) => void;
  /** Called by a field's Confirm. Default none: fields marked `confirm` show no Confirm and Correct. */
  onConfirm?: (field: RecordField) => void;
  /** A button in the header that goes to where the object's figures are shown: `{ label: 'View Property', onClick }`. Default none. */
  action?: { label: string; onClick: () => void };
  /** Content above the groups, such as an `Alert` that edits are simulated. Default none. */
  notice?: ReactNode;
  /** A group's id to open ready to edit, for a link that goes straight to a value to fix. Default none. */
  initialEdit?: string;
};

const dateTime = new Intl.DateTimeFormat(undefined, { dateStyle: 'medium', timeStyle: 'short' });
const same = (a: RecordFieldValue, b: RecordFieldValue) => JSON.stringify(a) === JSON.stringify(b);

type Draft = Record<string, RecordFieldValue>;

/**
 * One object as a record: groups of fields, each value with the line saying where it came from, and an Activity tab
 * with its history. Each group has an Edit that turns only that group into a form, with Cancel and Save under it. One
 * group edits at a time; closing, switching tabs or editing another group with unsaved changes asks first, and a group
 * with an `editWarning` (values recorded on a survey) asks before the form opens. Opening it moves focus to the name;
 * Escape closes it. Put it in `AppShell`'s `detail`, which floats it over the page inside the frame, or in a `Drawer`.
 *
 * @summary An object's record beside the page: grouped fields with their provenance, edited one group at a time.
 * @import import { RecordDrawer } from 'src/components/RecordDrawer';
 */
export function RecordDrawer({ record, onClose, onSave, onConfirm, action, notice, initialEdit }: RecordDrawerProps) {
  const id = useId();
  const [tab, setTab] = useState<'record' | 'activity'>('record');
  const [editing, setEditing] = useState<string | null>(null);
  const [draft, setDraft] = useState<Draft>({});
  const [warning, setWarning] = useState<RecordGroup | null>(null);
  /** What to do once the person decides about their unsaved changes. */
  const [pending, setPending] = useState<(() => void) | null>(null);
  const heading = useRef<HTMLHeadingElement>(null);

  // Opened: focus moves to the record's name, so the page's focus doesn't stay behind the drawer.
  useEffect(() => {
    heading.current?.focus();
  }, [record.id]);

  const startEdit = (group: RecordGroup) => {
    setDraft(Object.fromEntries(group.fields.filter((f) => f.input).map((f) => [f.id, f.value])));
    setEditing(group.id);
  };
  const dirty = () => {
    const group = record.groups.find((g) => g.id === editing);
    return Boolean(group && group.fields.some((f) => f.input && !same(draft[f.id] ?? null, f.value)));
  };
  /** Runs `then` now, or after the person decides about unsaved changes. */
  const guard = (then: () => void) => {
    if (editing && dirty()) setPending(() => then);
    else then();
  };
  const requestEdit = (group: RecordGroup) => guard(() => (group.editWarning ? setWarning(group) : startEdit(group)));

  // The deep link's group opens ready to edit, once per record and group named, set while rendering as React
  // recommends for state that follows a prop, not on every rerender of the record.
  const editKey = initialEdit && `${record.id}:${initialEdit}`;
  const [openedKey, setOpenedKey] = useState<string | undefined>(undefined);
  if (editKey && editKey !== openedKey) {
    setOpenedKey(editKey);
    const group = record.groups.find((g) => g.id === initialEdit);
    if (group?.editable) (group.editWarning ? setWarning : startEdit)(group);
  }

  const cancel = () => {
    setEditing(null);
    setDraft({});
  };
  const save = (group: RecordGroup) => {
    const changes = group.fields.filter((f) => f.input && !same(draft[f.id] ?? null, f.value)).map((f) => ({ fieldId: f.id, value: draft[f.id] ?? null }));
    cancel();
    onSave(group, changes);
  };
  const requestClose = () => guard(onClose);

  const onKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    if (event.key === 'Escape' && !warning && !pending) {
      event.stopPropagation();
      requestClose();
    }
  };

  return (
    <Stack onKeyDown={onKeyDown} sx={{ flex: 1, minWidth: 0, minHeight: 0 }}>
      <Stack direction="row" sx={{ alignItems: 'center', gap: 1, px: 2, pt: 1.5, pb: 1 }}>
        <Typography ref={heading} variant="h6" component="h2" tabIndex={-1} noWrap sx={{ minWidth: 0, outline: 'none' }}>
          {record.name}
        </Typography>
        {/* A small chip beside a heading, one-off (Rules → Component size). */}
        <Chip size="small" variant="outlined" label={record.kind} />
        <Box sx={{ flex: 1 }} />
        {action && (
          <Button onClick={() => guard(action.onClick)} sx={{ flexShrink: 0 }}>
            {action.label}
          </Button>
        )}
        <IconButton aria-label="Close Record" onClick={requestClose}>
          <Icon name="close" />
        </IconButton>
      </Stack>
      <Tabs value={tab} onChange={(_, next: 'record' | 'activity') => guard(() => setTab(next))} aria-label="Record Sections" sx={{ px: 2 }}>
        <Tab value="record" label="Record" id={`${id}-tab-record`} aria-controls={`${id}-panel-record`} />
        <Tab value="activity" label="Activity" id={`${id}-tab-activity`} aria-controls={`${id}-panel-activity`} />
      </Tabs>
      <Divider />
      <Box role="tabpanel" id={`${id}-panel-${tab}`} aria-labelledby={`${id}-tab-${tab}`} sx={{ flex: 1, minHeight: 0, overflowY: 'auto', p: 2 }}>
        {tab === 'record' ? (
          <Stack sx={{ gap: 3 }}>
            {notice}
            {record.groups.map((group) => (
              <GroupView
                key={group.id}
                group={group}
                editing={editing === group.id}
                draft={draft}
                setDraft={setDraft}
                onEdit={() => requestEdit(group)}
                onSave={() => save(group)}
                onCancel={cancel}
                onConfirm={onConfirm}
              />
            ))}
          </Stack>
        ) : (
          <ActivityView entries={record.activity} />
        )}
      </Box>
      <ConfirmDialog
        open={Boolean(warning)}
        title={warning?.editWarning?.title ?? ''}
        text={warning?.editWarning?.text ?? ''}
        cancelLabel="Cancel"
        confirmLabel={warning?.editWarning?.confirmLabel ?? ''}
        onCancel={() => setWarning(null)}
        onConfirm={() => {
          if (warning) startEdit(warning);
          setWarning(null);
        }}
      />
      <ConfirmDialog
        open={Boolean(pending)}
        title="Discard unsaved changes?"
        text="What you changed in this group hasn’t been saved."
        cancelLabel="Keep Editing"
        confirmLabel="Discard"
        onCancel={() => setPending(null)}
        onConfirm={() => {
          const then = pending;
          setPending(null);
          cancel();
          then?.();
        }}
      />
    </Stack>
  );
}

/** A destructive confirmation: MUI's `Dialog` as documented, the safe choice first and the destructive one in `error`. */
function ConfirmDialog({ open, title, text, cancelLabel, confirmLabel, onCancel, onConfirm }: { open: boolean; title: string; text: string; cancelLabel: string; confirmLabel: string; onCancel: () => void; onConfirm: () => void }) {
  const id = useId();
  return (
    <Dialog open={open} onClose={onCancel} aria-labelledby={`${id}-title`} aria-describedby={`${id}-text`} maxWidth="xs" fullWidth>
      <DialogTitle id={`${id}-title`}>{title}</DialogTitle>
      <DialogContent>
        <DialogContentText id={`${id}-text`}>{text}</DialogContentText>
      </DialogContent>
      <DialogActions>
        <Button onClick={onCancel}>{cancelLabel}</Button>
        <Button color="error" variant="contained" onClick={onConfirm}>
          {confirmLabel}
        </Button>
      </DialogActions>
    </Dialog>
  );
}

type GroupViewProps = {
  group: RecordGroup;
  editing: boolean;
  draft: Draft;
  setDraft: (next: Draft) => void;
  onEdit: () => void;
  onSave: () => void;
  onCancel: () => void;
  onConfirm?: (field: RecordField) => void;
};

function GroupView({ group, editing, draft, setDraft, onEdit, onSave, onCancel, onConfirm }: GroupViewProps) {
  const hasInputs = group.fields.some((f) => f.input);
  const editButton = (
    <Button startIcon={<Icon name="edit" />} disabled={!group.editable} onClick={onEdit} aria-label={`Edit ${group.label}`}>
      Edit
    </Button>
  );
  return (
    <Stack component="section" aria-label={group.label} sx={{ gap: 1 }}>
      <Stack direction="row" sx={{ alignItems: 'center', justifyContent: 'space-between', gap: 1 }}>
        <Typography variant="subtitle1" component="h3">
          {group.label}
        </Typography>
        {hasInputs &&
          !editing &&
          // A disabled button fires no events, so the tooltip wraps it (MUI → Tooltip → Disabled elements).
          (group.editable || !group.cannotEditReason ? (
            editButton
          ) : (
            <Tooltip title={group.cannotEditReason}>
              <span>{editButton}</span>
            </Tooltip>
          ))}
      </Stack>
      {editing ? (
        <Stack
          component="form"
          onSubmit={(event) => {
            event.preventDefault();
            onSave();
          }}
          sx={{ gap: 2 }}
        >
          {group.fields.map((field) =>
            field.input ? (
              <FieldInput key={field.id} field={field} input={field.input} value={draft[field.id] ?? null} onChange={(value) => setDraft({ ...draft, [field.id]: value })} />
            ) : (
              <div key={field.id}>
                <Typography variant="caption" component="p" color="text.secondary">
                  {field.label}
                </Typography>
                <Typography variant="body2" component="p">
                  {field.display}
                </Typography>
              </div>
            ),
          )}
          <Stack direction="row" sx={{ gap: 1, justifyContent: 'flex-end' }}>
            <Button onClick={onCancel}>Cancel</Button>
            <Button type="submit" variant="contained">
              Save
            </Button>
          </Stack>
        </Stack>
      ) : (
        <Table aria-label={group.label} size="small">
          <TableBody>
            {group.fields.map((field) => (
              <TableRow key={field.id}>
                <TableCell component="th" scope="row" sx={{ color: 'text.secondary', width: '38%', verticalAlign: 'top', pl: 0 }}>
                  {field.label}
                </TableCell>
                <TableCell sx={{ pr: 0 }}>
                  <Typography variant="body2" component="p" sx={{ fontVariantNumeric: 'tabular-nums' }}>
                    {field.display}
                  </Typography>
                  <Typography variant="caption" component="p" color="text.secondary">
                    {field.provenance}
                  </Typography>
                  {field.confirm && group.editable && onConfirm && (
                    // Confirm or correct, on the value's own row. Small: a one-off pair inside a table cell (Rules → Component size).
                    <Stack direction="row" sx={{ gap: 1, mt: 0.5 }}>
                      <Button size="small" variant="outlined" startIcon={<Icon name="check" />} onClick={() => onConfirm(field)}>
                        Confirm
                      </Button>
                      <Button size="small" startIcon={<Icon name="edit" />} onClick={onEdit}>
                        Correct
                      </Button>
                    </Stack>
                  )}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      )}
    </Stack>
  );
}

function FieldInput({ field, input, value, onChange }: { field: RecordField; input: RecordFieldInput; value: RecordFieldValue; onChange: (value: RecordFieldValue) => void }) {
  switch (input.kind) {
    case 'text':
      return <TextField label={field.label} value={typeof value === 'string' ? value : ''} onChange={(event) => onChange(event.target.value)} fullWidth />;
    case 'number':
      return (
        <TextField
          label={field.label}
          type="number"
          value={typeof value === 'number' ? value : ''}
          onChange={(event) => onChange(event.target.value === '' ? null : Number(event.target.value))}
          fullWidth
          slotProps={{
            htmlInput: { min: input.min, inputMode: 'numeric' },
            input: input.unit ? { endAdornment: <InputAdornment position="end" sx={{ '& .MuiTypography-root': { whiteSpace: 'nowrap' } }}>{input.unit}</InputAdornment> } : undefined,
          }}
        />
      );
    case 'date':
      return <TextField label={field.label} type="date" value={typeof value === 'string' ? value : ''} onChange={(event) => onChange(event.target.value)} fullWidth slotProps={{ inputLabel: { shrink: true } }} />;
    case 'select':
      return (
        <TextField select label={field.label} value={typeof value === 'string' ? value : ''} onChange={(event) => onChange(event.target.value)} fullWidth>
          {input.options.map((option) => (
            <MenuItem key={option.value} value={option.value}>
              {option.label}
            </MenuItem>
          ))}
        </TextField>
      );
    case 'multi': {
      const chosen = Array.isArray(value) ? value : [];
      return (
        <TextField
          select
          label={field.label}
          value={chosen}
          onChange={(event) => {
            const next = event.target.value as unknown as string | string[];
            onChange(typeof next === 'string' ? next.split(',').filter(Boolean) : next);
          }}
          fullWidth
          slotProps={{ select: { multiple: true, renderValue: (selected) => (selected as string[]).map((v) => input.options.find((o) => o.value === v)?.label ?? v).join(', ') || 'None' } }}
        >
          {input.options.map((option) => (
            <MenuItem key={option.value} value={option.value}>
              <Checkbox checked={chosen.includes(option.value)} sx={{ ml: -1 }} />
              {option.label}
            </MenuItem>
          ))}
        </TextField>
      );
    }
  }
}

function ActivityView({ entries }: { entries: RecordActivityEntry[] }) {
  if (entries.length === 0) {
    return (
      <Typography variant="body2" color="text.secondary">
        Nothing has happened to this record yet.
      </Typography>
    );
  }
  return (
    <List disablePadding aria-label="Activity">
      {entries.map((entry, index) => (
        <ListItem key={`${entry.at}-${index}`} disableGutters divider={index < entries.length - 1} sx={{ alignItems: 'flex-start' }}>
          <ListItemText primary={entry.text} secondary={`${entry.by} · ${dateTime.format(new Date(entry.at))}`} slotProps={{ primary: { variant: 'body2' }, secondary: { variant: 'caption' } }} />
        </ListItem>
      ))}
    </List>
  );
}
