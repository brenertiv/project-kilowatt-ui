import './dataTable.css';
import type { ReactNode } from 'react';
import { Menu } from '@base-ui/react/menu';
import { Link } from 'react-router';
import { MoreIcon } from '../icons';
import { formatCalendarDate } from '../lib/dates';
import { formatDelta, formatUnit, type Unit } from '../lib/format';

/** Pill with a semantic tone: `positive`, `negative`, `warning`, `neutral`, or any tone `.ui-status` supports. */
export function StatusCell({ tone, children }: { tone: string; children: ReactNode }) {
  return (
    <span className="ui-status" data-tone={tone}>
      {children}
    </span>
  );
}

export function ChipCell({ children }: { children: ReactNode }) {
  return <span className="ui-chip">{children}</span>;
}

/** Number with its unit, tabular digits. Renders a dash for missing values. */
export function NumericCell({ value, unit = 'count', compact }: { value: number | null | undefined; unit?: Unit; compact?: boolean }) {
  if (value === null || value === undefined || Number.isNaN(value)) return <EmptyCell />;
  return <span className="ui-table-number">{formatUnit(value, unit, { compact })}</span>;
}

/** Signed change coloured by whether the movement is good. */
export function DeltaCell({
  value,
  unit = 'percent',
  upIsGood = true,
}: {
  value: number | null | undefined;
  unit?: Unit;
  upIsGood?: boolean;
}) {
  if (value === null || value === undefined || Number.isNaN(value)) return <EmptyCell />;
  const tone = value === 0 ? 'neutral' : (value > 0) === upIsGood ? 'positive' : 'negative';
  return (
    <span className="ui-table-delta ui-table-number" data-tone={tone}>
      {formatDelta(value, unit)}
    </span>
  );
}

/** Calendar date (`yyyy-MM-dd`) without a time-zone shift. */
export function DateCell({ iso }: { iso: string | null | undefined }) {
  if (!iso) return <EmptyCell />;
  return <time dateTime={iso}>{formatCalendarDate(iso)}</time>;
}

export function LinkCell({ href, children }: { href: string; children: ReactNode }) {
  return (
    <Link className="ui-table-link" to={href}>
      {children}
    </Link>
  );
}

export type ActionItem = { label: string; onSelect: () => void; destructive?: boolean };

/** Overflow menu for per-row actions. */
export function ActionsCell({ items, label = 'Row actions' }: { items: ActionItem[]; label?: string }) {
  return (
    <Menu.Root>
      <Menu.Trigger className="ui-icon-btn" aria-label={label}>
        <MoreIcon />
      </Menu.Trigger>
      <Menu.Portal>
        <Menu.Positioner className="ui-positioner" sideOffset={4} align="end">
          <Menu.Popup className="ui-popup">
            {items.map((item) => (
              <Menu.Item
                key={item.label}
                className={item.destructive ? 'ui-item is-destructive' : 'ui-item'}
                onClick={item.onSelect}
              >
                {item.label}
              </Menu.Item>
            ))}
          </Menu.Popup>
        </Menu.Positioner>
      </Menu.Portal>
    </Menu.Root>
  );
}

const sparklineWidth = 80;
const sparklineHeight = 20;
const sparklineMaxPoints = 12;

/** Tiny trend line in the current text colour. Uses at most the last 12 points. */
export function SparklineCell({ points, label }: { points: number[]; label?: string }) {
  const values = points.slice(-sparklineMaxPoints).filter((point) => Number.isFinite(point));
  if (values.length < 2) return <EmptyCell />;
  const min = Math.min(...values);
  const max = Math.max(...values);
  const range = max - min || 1;
  const inset = 1.5; // keep the 2px stroke inside the viewBox
  const stepX = (sparklineWidth - inset * 2) / (values.length - 1);
  const coordinates = values
    .map((value, index) => {
      const x = inset + index * stepX;
      const y = inset + (1 - (value - min) / range) * (sparklineHeight - inset * 2);
      return `${x.toFixed(1)},${y.toFixed(1)}`;
    })
    .join(' ');
  return (
    <svg
      className="ui-sparkline"
      width={sparklineWidth}
      height={sparklineHeight}
      viewBox={`0 0 ${sparklineWidth} ${sparklineHeight}`}
      role={label ? 'img' : undefined}
      aria-label={label}
      aria-hidden={label ? undefined : true}
      focusable="false"
    >
      <polyline fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" points={coordinates} />
    </svg>
  );
}

export function EmptyCell() {
  return (
    <span className="ui-table-empty" aria-label="None">
      —
    </span>
  );
}
