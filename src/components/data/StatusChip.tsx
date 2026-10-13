import type { ReactNode } from 'react';
import Chip, { type ChipProps } from '@mui/material/Chip';
import { useTranslation } from 'react-i18next';
import { isExpanded, type ActionPriority, type ActionStatus, type Expandable, type Lookup } from '../../api/types';

/**
 * Chips for the API's status vocabularies. Status colors are reserved for
 * meaning, so every chip carries its label and a tone, never color alone.
 */

export type Tone = 'neutral' | 'info' | 'success' | 'warning' | 'error';

const toneColor: Record<Tone, ChipProps['color']> = {
  neutral: 'default',
  info: 'info',
  success: 'success',
  warning: 'warning',
  error: 'error',
};

export type StatusChipProps = {
  label: ReactNode;
  tone?: Tone;
  icon?: ChipProps['icon'];
  size?: ChipProps['size'];
  /** Neutral chips are outlined; toned chips are filled unless told otherwise. */
  variant?: ChipProps['variant'];
};

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
  value: Expandable<T> | null | undefined;
  /** The lookup table, needed when `value` is a bare id. */
  lookup?: T[];
  tones: Record<string, Tone>;
  size?: ChipProps['size'];
};

/** A chip for any lookup-backed field. Unresolved ids are shown as such rather than hidden. */
export function LookupChip<T extends Lookup>({ value, lookup, tones, size }: LookupChipProps<T>) {
  const { t } = useTranslation();
  if (value === null || value === undefined) return null;
  const resolved = resolveLookup(value, lookup);
  if (!resolved) return <StatusChip label={t('data.unresolved', { id: String(value) })} tone="neutral" size={size} />;
  return <StatusChip label={resolved.name} tone={tones[resolved.name] ?? 'neutral'} size={size} />;
}

export function ActionStatusChip({
  status,
  lookup,
  size,
}: {
  status: Expandable<ActionStatus> | null;
  lookup?: ActionStatus[];
  size?: ChipProps['size'];
}) {
  return <LookupChip value={status} lookup={lookup} tones={actionStatusTone} size={size} />;
}

export function ActionPriorityChip({
  priority,
  lookup,
  size,
}: {
  priority: Expandable<ActionPriority> | null;
  lookup?: ActionPriority[];
  size?: ChipProps['size'];
}) {
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

export function AlertStateChip({
  alert,
  size,
}: {
  alert: { fixed: boolean; acknowledged: boolean };
  size?: ChipProps['size'];
}) {
  const { t } = useTranslation();
  const { key, tone } = alertTone(alert);
  return <StatusChip label={t(`data.alert.${key}`)} tone={tone} size={size} />;
}
