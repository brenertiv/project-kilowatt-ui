/**
 * The Change scope dialog's filter, as pure functions: which properties a filter keeps, and the name it suggests
 * when the result is saved as a portfolio. `ScopePicker` draws it.
 */
import type { ScopeProperty } from './ScopePicker';

/**
 * What the filter holds: criteria that narrow the table, and properties picked by hand. When any are picked they are
 * the filter's set, whatever the criteria now show; otherwise the set is every property the criteria keep.
 */
export type ScopeFilter = {
  /** States, as properties carry them (`TX`). */
  states: string[];
  /** Cities, as properties carry them (`Austin, TX`). */
  cities: string[];
  /** Property types (`Office`). */
  types: string[];
  /** Floor area bounds in ft², either left open. */
  minArea?: number;
  maxArea?: number;
  /** Properties picked by hand, in the order they were picked. */
  selected: string[];
};

export const emptyFilter: ScopeFilter = { states: [], cities: [], types: [], selected: [] };

export const hasCriteria = (filter: ScopeFilter) =>
  filter.states.length > 0 || filter.cities.length > 0 || filter.types.length > 0 || filter.minArea !== undefined || filter.maxArea !== undefined;

/** Whether the filter narrows anything: criteria set or properties picked. */
export const isFilterActive = (filter: ScopeFilter) => hasCriteria(filter) || filter.selected.length > 0;

const inArea = (property: ScopeProperty, filter: Pick<ScopeFilter, 'minArea' | 'maxArea'>) =>
  (filter.minArea === undefined || (property.area !== undefined && property.area >= filter.minArea)) &&
  (filter.maxArea === undefined || (property.area !== undefined && property.area <= filter.maxArea));

/** Whether a property passes the criteria. A location matches its state or its city; a missing value never matches a bound. */
export function matchesCriteria(property: ScopeProperty, filter: ScopeFilter) {
  const located = filter.states.length + filter.cities.length === 0 || (property.state !== undefined && filter.states.includes(property.state)) || (property.city !== undefined && filter.cities.includes(property.city));
  const typed = filter.types.length === 0 || (property.type !== undefined && filter.types.includes(property.type));
  return located && typed && inArea(property, filter);
}

/** The filter's set: the picked properties when there are any, else every property the criteria keep, in portfolio order. */
export function filterSet(properties: ScopeProperty[], filter: ScopeFilter) {
  if (filter.selected.length > 0) {
    const picked = new Set(filter.selected);
    return properties.filter((property) => picked.has(property.id));
  }
  return properties.filter((property) => matchesCriteria(property, filter));
}

const number = (value: number) => new Intl.NumberFormat().format(value);
/** An area with its unit, a non-breaking space between them (Rules › Content and layout). */
export const formatArea = (value: number) => `${number(value)} ft²`;

const distinct = (values: (string | undefined)[]) => [...new Set(values.filter((value): value is string => value !== undefined))];
const joinTwo = (values: string[]) => values.join(' and ');

/**
 * The name Save as portfolio suggests, built from what the saved properties share, not from the criteria, since
 * properties picked by hand can sit outside them. Up to three parts, each only where it narrows the portfolio:
 * their type ("Office properties", "Office and retail properties"), their place ("in Austin, TX", "in TX and OH") and,
 * when an area bound is set and every one meets it, their area ("at least 50,000 ft²"; the bounds include their value). With nothing distinctive it names
 * the first property and a count ("Harbor Tower and 4 others"). A name already taken gets a number ("… 2").
 */
export function suggestName(set: ScopeProperty[], filter: ScopeFilter, all: ScopeProperty[], taken: string[]) {
  if (set.length === 0) return '';
  const parts: string[] = [];

  const types = distinct(set.map((property) => property.type));
  const typeNarrows = types.length <= 2 && set.every((property) => property.type !== undefined) && distinct(all.map((property) => property.type)).length > types.length;
  const typePart = typeNarrows ? `${joinTwo(types.map((type, i) => (i === 0 ? type : type.toLowerCase())))} properties` : undefined;

  const cities = distinct(set.map((property) => property.city));
  const states = distinct(set.map((property) => property.state));
  const allCities = distinct(all.map((property) => property.city));
  const allStates = distinct(all.map((property) => property.state));
  if (cities.length === 1 && allCities.length > 1 && set.every((property) => property.city !== undefined)) parts.push(`in ${cities[0]}`);
  else if (states.length <= 2 && allStates.length > states.length && set.every((property) => property.state !== undefined)) parts.push(`in ${joinTwo(states)}`);

  const { minArea, maxArea } = filter;
  if ((minArea !== undefined || maxArea !== undefined) && set.every((property) => inArea(property, filter))) {
    parts.push(minArea !== undefined && maxArea !== undefined ? `${number(minArea)}–${formatArea(maxArea)}` : minArea !== undefined ? `at least ${formatArea(minArea)}` : `up to ${formatArea(maxArea!)}`);
  }

  let name: string;
  if (typePart || parts.length > 0) name = [typePart ?? 'Properties', ...parts].join(' ');
  else if (set.length === 1) name = set[0].name;
  else name = `${set[0].name} and ${number(set.length - 1)} ${set.length === 2 ? 'other' : 'others'}`;

  const used = new Set(taken.map((t) => t.trim().toLowerCase()));
  if (!used.has(name.toLowerCase())) return name;
  for (let n = 2; ; n++) if (!used.has(`${name} ${n}`.toLowerCase())) return `${name} ${n}`;
}
