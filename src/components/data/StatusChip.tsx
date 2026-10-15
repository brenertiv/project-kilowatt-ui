import type { ReactNode } from 'react';
import Chip, { type ChipProps } from '@mui/material/Chip';
import { useTranslation } from 'react-i18next';
import { isExpanded, type ActionPriority, type ActionStatus, type Expandable, type Lookup } from '../../api/types';

/**
 * Chips for the API's status vocabularies. Status colors are reserved for
 * meaning, so every chip carries its label and a tone, never color alone.
 */

/** What a status means: success for done, warning for waiting, error for blocked or overdue, info for in progress, neutral otherwise. */
export type Tone = 'neutral' | 'info' | 'success' | 'warning' | 'error';

const toneColor: Record<Tone, ChipProps['color']> = {
  neutral: 'default',
  info: 'info',
  success: 'success',
  warning: 'warning',
  error: 'error',
};

export type StatusChipProps = {
  /** The status in words. Always set: a chip never relies on color alone. */
  label: ReactNode;
  /** What the status means, which sets the color. Defaults to neutral. */
  tone?: Tone;
  /** An optional leading icon from `src/icons.tsx` that reinforces the label. */
  icon?: ChipProps['icon'];
  /** Defaults to small, for tables, lists and cards. Use medium beside a page title. */
  size?: ChipProps['size'];
  /** Neutral chips are outlined; toned chips are filled unless told otherwise. */
  variant?: ChipProps['variant'];
};

/**
 * A labeled status chip whose color comes from a tone, never from the caller. Use it for any status or category
 * that has no wrapper; for work-order status and priority use `ActionStatusChip` and `ActionPriorityChip`, for
 * alert flags `AlertStateChip`, for any other lookup-backed field `LookupChip`. In a table use `StatusCell`.
 *
 * @summary A small chip with a label and a meaning-based tone (neutral, info, success, warning, error).
 * @import import { StatusChip } from 'src/components/data';
 */
export function StatusChip({ label, tone = 'neutral', icon, size = 'small', variant }: StatusChipProps) {
  return (
    <Chip
      label={label}
      color={toneColor[tone]}
      icon={icon}
      size={size}
      variant={variant ?? (tone === 'neutral' ? 'outlined' : 'filled')}
    />
  );
}

/** Resolves a bare-id or expanded relation against a lookup table. */
export function resolveLookup<T extends Lookup>(value: Expandable<T> | null | undefined, lookup?: T[]): T | undefined {
  if (value === null || value === undefined) return undefined;
  if (isExpanded(value)) return value;
  return lookup?.find((row) => row.id === value);
}

export const actionStatusTone: Record<string, Tone> = {
  Open: 'neutral',
  'In Progress': 'info',
  'On Hold': 'warning',
  'Requires Attention': 'error',
  Completed: 'success',
  Expired: 'error',
  Cancelled: 'neutral',
};

export const actionPriorityTone: Record<string, Tone> = {
  Lowest: 'neutral',
  Low: 'neutral',
  Medium: 'warning',
  High: 'error',
};

export type LookupChipProps<T extends Lookup> = {
  /** The field as the API returned it: a bare id or the expanded lookup row. `null` or `undefined` renders nothing. */
  value: Expandable<T> | null | undefined;
  /** The lookup table, needed when `value` is a bare id. Usually from `useLookup`. */
  lookup?: T[];
  /** Tone for each lookup `name`, e.g. `actionStatusTone`. Names not in the map are neutral. */
  tones: Record<string, Tone>;
  /** Chip size. Defaults to small. */
  size?: ChipProps['size'];
};

/**
 * A chip for any lookup-backed field. Unresolved ids are shown as such ("Status 7") rather than hidden. Use the
 * wrappers for work-order status and priority; use `LookupChip` for other lookup tables, with a tone map of your own.
 *
 * @summary A StatusChip for a lookup-backed field, resolving bare ids against the lookup table.
 * @import import { LookupChip } from 'src/components/data';
 */
export function LookupChip<T extends Lookup>({ value, lookup, tones, size }: LookupChipProps<T>) {
  const { t } = useTranslation();
  if (value === null || value === undefined) return null;
  const resolved = resolveLookup(value, lookup);
  if (!resolved) return <StatusChip label={t('data.unresolved', { id: String(value) })} tone="neutral" size={size} />;
  return <StatusChip label={resolved.name} tone={tones[resolved.name] ?? 'neutral'} size={size} />;
}

export type ActionStatusChipProps = {
  /** The work order's `status` as the API returned it: a bare id or the expanded status. `null` renders nothing. */
  status: Expandable<ActionStatus> | null;
  /** The status lookup table, needed when `status` is a bare id. Usually `useLookup('action_status')`. */
  lookup?: ActionStatus[];
  /** Chip size. Defaults to small. */
  size?: ChipProps['size'];
};

/**
 * A work order's status as a chip, toned by `actionStatusTone`: In Progress is info, On Hold warning,
 * Requires Attention and Expired error, Completed success, the rest neutral. Use it wherever a work-order
 * status appears instead of a hand-toned `StatusChip`.
 *
 * @summary A work-order status chip with the standard tone for each status.
 * @import import { ActionStatusChip } from 'src/components/data';
 */
export function ActionStatusChip({ status, lookup, size }: ActionStatusChipProps) {
  return <LookupChip value={status} lookup={lookup} tones={actionStatusTone} size={size} />;
}

export type ActionPriorityChipProps = {
  /** The work order's `priority` as the API returned it: a bare id or the expanded priority. `null` renders nothing. */
  priority: Expandable<ActionPriority> | null;
  /** The priority lookup table, needed when `priority` is a bare id. Usually `useLookup('action_priority')`. */
  lookup?: ActionPriority[];
  /** Chip size. Defaults to small. */
  size?: ChipProps['size'];
};

/**
 * A work order's priority as a chip, toned by `actionPriorityTone`: High is error, Medium warning, Low and
 * Lowest neutral. Use it wherever a work-order priority appears instead of a hand-toned `StatusChip`.
 *
 * @summary A work-order priority chip with the standard tone for each priority.
 * @import import { ActionPriorityChip } from 'src/components/data';
 */
export function ActionPriorityChip({ priority, lookup, size }: ActionPriorityChipProps) {
  return <LookupChip value={priority} lookup={lookup} tones={actionPriorityTone} size={size} />;
}

/** The three states a property alert can be in, from its two flags. */
export function alertTone(alert: { fixed: boolean; acknowledged: boolean }): {
  key: 'fixed' | 'acknowledged' | 'open';
  tone: Tone;
} {
  if (alert.fixed) return { key: 'fixed', tone: 'success' };
  if (alert.acknowledged) return { key: 'acknowledged', tone: 'info' };
  return { key: 'open', tone: 'warning' };
}

export type AlertStateChipProps = {
  /** The property alert, or just its two flags. Fixed wins over acknowledged. */
  alert: { fixed: boolean; acknowledged: boolean };
  /** Chip size. Defaults to small. */
  size?: ChipProps['size'];
};

/**
 * A property alert's state as a chip, from its `fixed` and `acknowledged` flags: Fixed (success),
 * Acknowledged (info) or Open (warning). Use it wherever an alert's state appears.
 *
 * @summary A property alert state chip: Open, Acknowledged or Fixed, from the alert's two flags.
 * @import import { AlertStateChip } from 'src/components/data';
 */
export function AlertStateChip({ alert, size }: AlertStateChipProps) {
  const { t } = useTranslation();
  const { key, tone } = alertTone(alert);
  return <StatusChip label={t(`data.alert.${key}`)} tone={tone} size={size} />;
}
