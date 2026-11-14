/**
 * Small patterns a page repeats: an action whose destination isn't built, a widget at a scope it can't take,
 * a table row's action, and a page's Export and Share. Each is stock MUI composed the way the Rules ask
 * (a reason in words beside a disabled control, never color alone; a disabled button's reason in a `Tooltip`
 * around a `span`), so pages share one answer rather than each building its own.
 */
import Button from '@mui/material/Button';
import Stack from '@mui/material/Stack';
import Tooltip from '@mui/material/Tooltip';
import Typography from '@mui/material/Typography';
import { AsyncContent } from './AsyncContent';

export type NotBuiltYetProps = {
  /** The action's label, in Title Case: "Open Carbon Plan". */
  label: string;
  /** What isn't built, named as the person would: "Carbon Plan". The text beside the button reads "{template} isn’t built yet". */
  template: string;
};

/**
 * An action whose destination isn't built: the button, disabled, with why beside it in words, so the reason
 * never rests on the disabled color alone. For a reason that doesn't fit beside the control, use `RowAction`,
 * which puts it in a tooltip.
 *
 * @summary A disabled action with "{Thing} isn’t built yet" beside it in words.
 * @import import { NotBuiltYet } from 'src/components/patterns';
 */
export function NotBuiltYet({ label, template }: NotBuiltYetProps) {
  return (
    <Stack direction="row" spacing={1} sx={{ alignItems: 'center' }}>
      <Button disabled>{label}</Button>
      <Typography variant="body2" sx={{ color: 'text.secondary' }}>{`${template} isn’t built yet`}</Typography>
    </Stack>
  );
}

/** What a widget says at a scope it can't take; one sentence, the same on every page. */
export const widgetScopeText = 'This chart works for a portfolio, group or single property.';

export type WidgetScopeIdleProps = {
  /** The height the widget's chart takes, inset included, so the card keeps its size at every scope. Default none. */
  height?: number;
};

/**
 * A widget's card body at a scope it can't take (a property's chart while the page is on a group of
 * groups, say): `AsyncContent`'s idle state with `widgetScopeText`, in the chart's space, so the card
 * keeps its place and size and says why it's empty.
 *
 * @summary The idle card body of a widget at a scope it can't take.
 * @import import { WidgetScopeIdle } from 'src/components/patterns';
 */
export function WidgetScopeIdle({ height }: WidgetScopeIdleProps) {
  return (
    <AsyncContent state={{ status: 'idle' }} idleText={widgetScopeText} height={height}>
      {null}
    </AsyncContent>
  );
}

export type RowActionProps = {
  /** The action's label, in Title Case: "Assign". */
  label: string;
  /** What the action does. The click doesn't reach the row, so a clickable row stays closed. */
  onClick: () => void;
  /** Why the action isn't available, when it isn't: "Only an admin can assign." Set, it disables the button and shows in a tooltip over it. Default none: the button is enabled. */
  disabledReason?: string;
};

/**
 * A table row's action: a text button whose click stops at the button, so a row that opens on click
 * doesn't open too. When the role or the row's state doesn't allow the action, `disabledReason`
 * disables the button and puts the reason in a `Tooltip` around a `span`, since a disabled button
 * fires no pointer events of its own.
 *
 * @summary A row's action button, disabled with its reason in a tooltip when it isn't allowed.
 * @import import { RowAction } from 'src/components/patterns';
 */
export function RowAction({ label, onClick, disabledReason }: RowActionProps) {
  const button = (
    <Button
      onClick={(event) => {
        event.stopPropagation();
        onClick();
      }}
      disabled={Boolean(disabledReason)}
    >
      {label}
    </Button>
  );
  return disabledReason ? (
    <Tooltip title={disabledReason}>
      <span>{button}</span>
    </Tooltip>
  ) : (
    button
  );
}

/** Rows as CSV text: a value with a comma, a quote or a line break is quoted, a quote doubled, a missing value blank. */
export function toCsv(rows: (string | number | undefined)[][]): string {
  return rows
    .map((row) =>
      row
        .map((value) => {
          const text = value === undefined ? '' : String(value);
          return /[",\n]/.test(text) ? `"${text.replace(/"/g, '""')}"` : text;
        })
        .join(','),
    )
    .join('\n');
}

export type ExportShareProps = {
  /** What Export CSV downloads: the file name and the rows, header first. Called on click, so it reads the table as it is then. Default none: no Export CSV button. */
  csv?: () => { filename: string; rows: (string | number | undefined)[][] };
  /** Whether the page exports to PDF, through the browser's print. Default `false`: no Export PDF button. */
  pdf?: boolean;
  /** Where each result is reported ("report.csv downloaded.", "Link copied…"): a `Snackbar`, usually. */
  notify: (message: string) => void;
  /** Disables the exports (not Share) while there's nothing to export: the table is loading or empty. Default `false`. */
  disabled?: boolean;
  /** Whether to show Share, which copies the page's link. Default `true`; turn it off where the page already has its own Share. */
  share?: boolean;
};

/**
 * A page's Export and Share: Export CSV downloads the rows `csv` returns (through `toCsv`), Export PDF
 * opens the browser's print dialog, and Share copies the page's URL, which carries its scope, period and
 * filters, to the clipboard. Each reports what happened through `notify`, so the page can show it in a
 * `Snackbar`. Text buttons in a row, for a page header's right side or a card's actions.
 *
 * @summary Export CSV, Export PDF and Share buttons for a page, reporting through `notify`.
 * @import import { ExportShare } from 'src/components/patterns';
 */
export function ExportShare({ csv, pdf, notify, disabled, share: withShare = true }: ExportShareProps) {
  const exportCsv = () => {
    if (!csv) return;
    const { filename, rows } = csv();
    const url = URL.createObjectURL(new Blob([toCsv(rows)], { type: 'text/csv' }));
    const link = Object.assign(document.createElement('a'), { href: url, download: filename });
    link.click();
    URL.revokeObjectURL(url);
    notify(`${filename} downloaded.`);
  };
  const share = async () => {
    try {
      await navigator.clipboard.writeText(window.location.href);
      notify('Link copied, with this page’s scope, period and filters.');
    } catch {
      notify('The link couldn’t be copied. Copy it from the address bar.');
    }
  };
  return (
    <Stack direction="row" spacing={1}>
      {csv && (
        <Button onClick={exportCsv} disabled={disabled}>
          Export CSV
        </Button>
      )}
      {pdf && (
        <Button onClick={() => window.print()} disabled={disabled}>
          Export PDF
        </Button>
      )}
      {withShare && <Button onClick={share}>Share</Button>}
    </Stack>
  );
}
