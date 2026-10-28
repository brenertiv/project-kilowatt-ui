import { useId, useState, type KeyboardEvent, type MouseEvent } from 'react';
import Button from '@mui/material/Button';
import Dialog from '@mui/material/Dialog';
import Divider from '@mui/material/Divider';
import IconButton from '@mui/material/IconButton';
import InputAdornment from '@mui/material/InputAdornment';
import List from '@mui/material/List';
import ListItemButton from '@mui/material/ListItemButton';
import ListItemText from '@mui/material/ListItemText';
import MenuItem from '@mui/material/MenuItem';
import Popover from '@mui/material/Popover';
import Stack from '@mui/material/Stack';
import TextField from '@mui/material/TextField';
import Typography from '@mui/material/Typography';
import useMediaQuery from '@mui/material/useMediaQuery';
import { useTheme } from '@mui/material/styles';
import { Icon } from '../icons';

/** A range of whole months, inclusive, each as `YYYY-MM`. */
export type MonthRange = {
  /** The first month, `YYYY-MM`. */
  from: string;
  /** The last month, `YYYY-MM`; the same as `from` for a single month. */
  to: string;
};

/** A standard period the picker lists, such as year to date. */
export type PeriodPreset = MonthRange & {
  /** Identifies the preset in a `Period`. */
  id: string;
  /** The period's name, shown in the list and in the field: "Year to date". Its months show under it. */
  label: string;
};

/** The period a page shows: a preset's `id`, or a custom range of whole months. */
export type Period = string | MonthRange;

export type PeriodPickerProps = {
  /** The standard periods, in the order they're listed. */
  presets: PeriodPreset[];
  /** The current period. */
  value: Period;
  /** Called with the period the user chose: a preset's `id`, or the custom range they applied. */
  onChange: (period: Period) => void;
  /** The earliest month a custom range can start, `YYYY-MM`: the first month the data covers. */
  firstMonth: string;
  /** The latest month a custom range can end, `YYYY-MM`: usually the last complete month. */
  lastMonth: string;
  /** The field's label. Default `'Period'`. */
  label?: string;
  /** Stretches the field to its container's width. Default `false`. */
  fullWidth?: boolean;
  /** The field's size, passed to `TextField`. Leave it at the default, `'medium'`; set `'small'` only to match a one-off bar of small fields (Rules → Component size). */
  size?: 'small' | 'medium';
};

/** A `YYYY-MM` month as the date of its first day, in local time. */
function monthDate(month: string) {
  const [year, index] = month.split('-').map(Number);
  return new Date(year, index - 1, 1);
}

/** Every month from `first` to `last`, inclusive, as `YYYY-MM`. */
function monthsBetween(first: string, last: string) {
  const months: string[] = [];
  const end = monthDate(last);
  for (let date = monthDate(first); date <= end; date = new Date(date.getFullYear(), date.getMonth() + 1, 1)) {
    months.push(`${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`);
  }
  return months;
}

/** Month names in the viewer's locale (Rules → Content and layout). */
const shortMonth = new Intl.DateTimeFormat(undefined, { month: 'short', year: 'numeric' });
const longMonth = new Intl.DateTimeFormat(undefined, { month: 'long', year: 'numeric' });

/** The months a range spans, as the locale writes a range: "Jan – Sep 2026". */
function rangeLabel({ from, to }: MonthRange) {
  return shortMonth.formatRange(monthDate(from), monthDate(to));
}

/**
 * A period picker for a page's or dashboard's period: a read-only `TextField` naming the current
 * period opens a `Popover` with the standard periods as a `List` and a custom range of whole months,
 * chosen with two month selects and applied with a button. Below `md` it opens as a full-screen
 * `Dialog` instead. Each preset shows its months under its name, and a custom range is named by its
 * months, written with `Intl` in the viewer's locale.
 *
 * @summary A field naming the period that opens standard periods and a custom range of whole months.
 * @import import { PeriodPicker } from 'src/components/PeriodPicker';
 */
export function PeriodPicker({
  presets,
  value,
  onChange,
  firstMonth,
  lastMonth,
  label = 'Period',
  fullWidth = false,
  size,
}: PeriodPickerProps) {
  const theme = useTheme();
  const phone = !useMediaQuery(theme.breakpoints.up('md'), { noSsr: true });
  const titleId = useId();
  const [anchor, setAnchor] = useState<HTMLElement | null>(null);
  const [from, setFrom] = useState('');
  const [to, setTo] = useState('');
  const months = monthsBetween(firstMonth, lastMonth);
  const preset = typeof value === 'string' ? presets.find(({ id }) => id === value) : undefined;
  const shown = typeof value === 'string' ? (preset?.label ?? '') : rangeLabel(value);

  const open = (element: HTMLElement) => {
    setAnchor(element);
    setFrom(typeof value === 'string' ? '' : value.from);
    setTo(typeof value === 'string' ? '' : value.to);
  };
  const close = () => setAnchor(null);
  // `YYYY-MM` strings sort as the months do.
  const valid = Boolean(from && to && from <= to);
  const apply = () => {
    if (!valid) return;
    onChange({ from, to });
    close();
  };
  const choose = (id: string) => {
    onChange(id);
    close();
  };
  const changeFrom = (month: string) => {
    setFrom(month);
    if (to && to < month) setTo('');
  };

  const body = (
    <Stack direction={{ xs: 'column', sm: 'row' }}>
      <List aria-label="Standard periods" sx={{ minWidth: 220 }}>
        {presets.map((period) => (
          <ListItemButton key={period.id} selected={value === period.id} onClick={() => choose(period.id)}>
            <ListItemText primary={period.label} secondary={rangeLabel(period)} />
          </ListItemButton>
        ))}
      </List>
      <Divider orientation="vertical" flexItem sx={{ display: { xs: 'none', sm: 'block' } }} />
      <Divider sx={{ display: { sm: 'none' } }} />
      <Stack role="group" aria-label="Custom range" sx={{ p: 2, gap: 2, minWidth: 260 }}>
        <Typography variant="body2" color="text.secondary">
          Custom range, whole months
        </Typography>
        <TextField select label="From" value={from} onChange={(event) => changeFrom(event.target.value)}>
          {months.map((month) => (
            <MenuItem key={month} value={month}>
              {longMonth.format(monthDate(month))}
            </MenuItem>
          ))}
        </TextField>
        <TextField select label="To" value={to} onChange={(event) => setTo(event.target.value)}>
          {months
            .filter((month) => !from || month >= from)
            .map((month) => (
              <MenuItem key={month} value={month}>
                {longMonth.format(monthDate(month))}
              </MenuItem>
            ))}
        </TextField>
        <Stack direction="row" sx={{ gap: 1, justifyContent: 'flex-end' }}>
          <Button onClick={close}>Cancel</Button>
          <Button variant="contained" onClick={apply} disabled={!valid}>
            Apply
          </Button>
        </Stack>
      </Stack>
    </Stack>
  );

  return (
    <>
      {/* A read-only field rather than a button, so it stands the height of the fields beside it in a filter bar and reads as one of them. */}
      <TextField
        size={size}
        label={label}
        value={shown}
        onClick={(event: MouseEvent<HTMLElement>) => open(event.currentTarget)}
        onKeyDown={(event: KeyboardEvent<HTMLElement>) => {
          if (event.key === 'Enter' || event.key === ' ' || event.key === 'ArrowDown') {
            event.preventDefault();
            open(event.currentTarget);
          }
        }}
        slotProps={{
          input: {
            readOnly: true,
            startAdornment: (
              <InputAdornment position="start">
                <Icon name="date_range" />
              </InputAdornment>
            ),
            endAdornment: (
              <InputAdornment position="end">
                <Icon name="arrow_drop_down" />
              </InputAdornment>
            ),
            sx: { cursor: 'pointer' },
          },
          htmlInput: {
            role: 'combobox',
            'aria-haspopup': 'dialog',
            'aria-expanded': Boolean(anchor),
            sx: { cursor: 'pointer' },
          },
        }}
        fullWidth={fullWidth}
        sx={{ minWidth: fullWidth ? 0 : 220 }}
      />
      {phone ? (
        <Dialog open={Boolean(anchor)} onClose={close} fullScreen aria-labelledby={titleId}>
          <Stack direction="row" sx={{ alignItems: 'center', gap: 1, p: 1, pl: 3 }}>
            <Typography id={titleId} variant="h5" component="h2" sx={{ flex: 1 }}>
              {label}
            </Typography>
            <IconButton aria-label="Close" onClick={close}>
              <Icon name="close" />
            </IconButton>
          </Stack>
          {body}
        </Dialog>
      ) : (
        <Popover
          open={Boolean(anchor)}
          anchorEl={anchor}
          onClose={close}
          anchorOrigin={{ vertical: 'bottom', horizontal: 'left' }}
          slotProps={{ paper: { role: 'dialog', 'aria-label': label } }}
        >
          {body}
        </Popover>
      )}
    </>
  );
}
