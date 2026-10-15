import './dataTable.css';
import type { ReactNode } from 'react';
import { Menu } from '@base-ui/react/menu';
import { Link } from 'react-router';
import { MoreIcon } from '../icons';
import { formatCalendarDate } from '../lib/dates';
import { formatDelta, formatUnit, type Unit } from '../lib/format';

export type StatusCellProps = {
  /** Semantic tone: `positive`, `warning`, `negative` or `neutral`. Pick it from what the state means, not the color you want. */
  tone: string;
  /** The state's label, e.g. "Linked". Always pass one; the tone alone carries no meaning. */
  children: ReactNode;
};

/**
 * A state pill for a table cell: a colored dot plus its label, e.g. linked, offline, overdue. Use it in
 * `DataTable` columns built with `createColumnHelper`. Outside tables, and for API status vocabularies,
 * use `StatusChip` and its wrappers from `src/components/data` instead.
 *
 * @summary A table-cell status pill with a semantic tone and a label.
 * @import import { StatusCell } from 'src/components/cells';
 */
export function StatusCell({ tone, children }: StatusCellProps) {
  return (
    <span className="ui-status" data-tone={tone}>
      {children}
    </span>
  );
}

export type ChipCellProps = {
  /** The category text, e.g. a meter source. */
  children: ReactNode;
};

/**
 * A neutral chip for a categorical value in a table cell, such as a source or a type. It carries no tone;
 * when the value is a state that can be good or bad, use `StatusCell` instead.
 *
 * @summary A table-cell chip for a category label.
 * @import import { ChipCell } from 'src/components/cells';
 */
export function ChipCell({ children }: ChipCellProps) {
  return <span className="ui-chip">{children}</span>;
}

export type NumericCellProps = {
  /** The number. `null`, `undefined` or `NaN` renders `EmptyCell`. */
  value: number | null | undefined;
  /** How `value` is formatted: energy, demand, money, a percentage (a fraction), a count or a score. Defaults to `count`. */
  unit?: Unit;
  /** Abbreviates large values (88.2K instead of 88,200.87). Use for money and big totals in narrow columns. Defaults to false. */
  compact?: boolean;
};

/**
 * A number formatted with its unit, in tabular digits. Use it for any measured value in a table column,
 * and give the column `meta.align: 'end'`. For a change against a previous period, use `DeltaCell`; for a
 * headline number outside a table, use `StatCard`.
 *
 * @summary A table-cell number formatted with its unit; a dash when missing.
 * @import import { NumericCell } from 'src/components/cells';
 */
export function NumericCell({ value, unit = 'count', compact }: NumericCellProps) {
  if (value === null || value === undefined || Number.isNaN(value)) return <EmptyCell />;
  return <span className="ui-table-number">{formatUnit(value, unit, { compact })}</span>;
}

export type DeltaCellProps = {
  /** The change, in `unit` (a fraction for percent, so `0.12` is +12%). `null`, `undefined` or `NaN` renders `EmptyCell`. Zero is neutral. */
  value: number | null | undefined;
  /** How `value` is formatted. Defaults to `percent`. */
  unit?: Unit;
  /** Whether an increase is good. Set false for consumption and cost, where going down is good. Defaults to true. */
  upIsGood?: boolean;
};

/**
 * A signed change, colored positive or negative by whether the movement is good. Use it for period-over-period
 * columns in a table. For the absolute value, use `NumericCell`.
 *
 * @summary A table-cell signed change, toned by whether up is good.
 * @import import { DeltaCell } from 'src/components/cells';
 */
export function DeltaCell({ value, unit = 'percent', upIsGood = true }: DeltaCellProps) {
  if (value === null || value === undefined || Number.isNaN(value)) return <EmptyCell />;
  const tone = value === 0 ? 'neutral' : (value > 0) === upIsGood ? 'positive' : 'negative';
  return (
    <span className="ui-table-delta ui-table-number" data-tone={tone}>
      {formatDelta(value, unit)}
    </span>
  );
}

export type DateCellProps = {
  /** A calendar date as `yyyy-MM-dd`. Empty, `null` or `undefined` renders `EmptyCell`. */
  iso: string | null | undefined;
};

/**
 * A calendar date in a table cell, formatted without a time-zone shift and wrapped in `<time>`. Use it for
 * date-only fields such as a link start date. Outside tables, use `DateText` from `src/components/data`.
 *
 * @summary A table-cell calendar date that never shifts time zone.
 * @import import { DateCell } from 'src/components/cells';
 */
export function DateCell({ iso }: DateCellProps) {
  if (!iso) return <EmptyCell />;
  return <time dateTime={iso}>{formatCalendarDate(iso)}</time>;
}

export type LinkCellProps = {
  /** In-app route to navigate to, e.g. `/meters/42`. Rendered with react-router's `Link`, so it needs a router context. */
  href: string;
  /** The link text, usually the record's name. */
  children: ReactNode;
};

/**
 * An in-app link in a table cell, usually on the name column to open the record. For a relation to another
 * record from API data, use `RelationLink` from `src/components/data`.
 *
 * @summary A table-cell react-router link to a record.
 * @import import { LinkCell } from 'src/components/cells';
 */
export function LinkCell({ href, children }: LinkCellProps) {
  return (
    <Link className="ui-table-link" to={href}>
      {children}
    </Link>
  );
}

/** One entry in an `ActionsCell` menu. */
export type ActionItem = {
  /** Menu item text. Also the React key, so keep labels unique within a row. */
  label: string;
  /** Called when the item is chosen. */
  onSelect: () => void;
  /** Draws the item in the negative color. Use for irreversible actions such as delete. Defaults to false. */
  destructive?: boolean;
};

export type ActionsCellProps = {
  /** The row's actions, in menu order. */
  items: ActionItem[];
  /** Accessible name for the icon-only trigger. Name the row when you can, e.g. "Actions for Main meter". Defaults to "Row actions". */
  label?: string;
};

/**
 * A "more" icon button that opens a menu of per-row actions. Use it in a trailing column, usually pinned
 * right. For a card's top-right menu, use `CardMenu`; for actions on several selected rows, use DataTable's
 * `bulkActions`.
 *
 * @summary A table-cell overflow menu of per-row actions.
 * @import import { ActionsCell } from 'src/components/cells';
 */
export function ActionsCell({ items, label = 'Row actions' }: ActionsCellProps) {
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

export type SparklineCellProps = {
  /** The series, oldest first. Only the last 12 are drawn and non-finite values are dropped; fewer than 2 left renders `EmptyCell`. */
  points: number[];
  /** Accessible description of the trend, e.g. "Rising over 12 months". Without it the line is hidden from assistive technology. */
  label?: string;
};

/**
 * A tiny trend line (80 by 20 pixels) in the current text color. Use it to show the shape of a recent series
 * next to its number in a table. It has no axes or values; for a readable chart, use a chart component.
 *
 * @summary A table-cell sparkline of the last 12 points.
 * @import import { SparklineCell } from 'src/components/cells';
 */
export function SparklineCell({ points, label }: SparklineCellProps) {
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

/**
 * The em dash for a missing value, with the accessible name "None". DataTable already renders the same dash for
 * empty accessor values, and the other cells render it for missing input, so use it directly only in a
 * custom `cell` renderer.
 *
 * @summary The table's missing-value dash with an accessible name.
 * @import import { EmptyCell } from 'src/components/cells';
 */
export function EmptyCell() {
  return (
    <span className="ui-table-empty" aria-label="None">
      —
    </span>
  );
}
