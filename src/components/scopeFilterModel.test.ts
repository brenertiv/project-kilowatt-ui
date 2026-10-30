import { describe, expect, it } from 'vitest';
import type { ScopeProperty } from './ScopePicker';
import { emptyFilter, filterSet, isFilterActive, matchesCriteria, suggestName } from './scopeFilterModel';

const all: ScopeProperty[] = [
  { id: 'a', name: 'Harbor Tower', city: 'Austin, TX', state: 'TX', type: 'Office', area: 120_000 },
  { id: 'b', name: 'Elm Plaza', city: 'Austin, TX', state: 'TX', type: 'Office', area: 40_000 },
  { id: 'c', name: 'Dallas Yard', city: 'Dallas, TX', state: 'TX', type: 'Industrial', area: 300_000 },
  { id: 'd', name: 'Lake Works', city: 'Columbus, OH', state: 'OH', type: 'Retail', area: 60_000 },
  { id: 'e', name: 'Pine Court', city: 'Denver, CO', state: 'CO', type: 'Industrial' },
  { id: 'f', name: 'Bay Point', city: 'Miami, FL', state: 'FL', type: 'Retail', area: 50_000 },
];
const pick = (...ids: string[]) => all.filter((p) => ids.includes(p.id));

describe('the scope filter', () => {
  it('matches a location by state or city, and never matches a missing area against a bound', () => {
    expect(matchesCriteria(all[0], { ...emptyFilter, states: ['TX'] })).toBe(true);
    expect(matchesCriteria(all[3], { ...emptyFilter, cities: ['Austin, TX'] })).toBe(false);
    expect(matchesCriteria(all[4], { ...emptyFilter, minArea: 1 })).toBe(false);
  });
  it('keeps the picked properties when there are any, otherwise what the criteria keep', () => {
    expect(filterSet(all, { ...emptyFilter, types: ['Office'] }).map((p) => p.id)).toEqual(['a', 'b']);
    expect(filterSet(all, { ...emptyFilter, types: ['Office'], selected: ['d', 'a'] }).map((p) => p.id)).toEqual(['a', 'd']);
    expect(isFilterActive(emptyFilter)).toBe(false);
  });
});

describe('the suggested portfolio name', () => {
  it('names what the saved properties share: type, then place, then a set area bound', () => {
    expect(suggestName(pick('a', 'b'), emptyFilter, all, [])).toBe('Office properties in Austin, TX');
    expect(suggestName(pick('a', 'c'), { ...emptyFilter, minArea: 100_000 }, all, [])).toBe('Office and industrial properties in TX at least 100,000 ft²');
    expect(suggestName(pick('c', 'd'), emptyFilter, all, [])).toBe('Industrial and retail properties in TX and OH');
    expect(suggestName(pick('a', 'd', 'f'), { ...emptyFilter, maxArea: 150_000 }, all, [])).toBe('Office and retail properties up to 150,000 ft²');
  });
  it('leaves out a part that doesn’t narrow, or an area bound a saved property misses', () => {
    const offices = all.map((p) => ({ ...p, type: 'Office' }));
    expect(suggestName(offices.slice(0, 2), emptyFilter, offices, [])).toBe('Properties in Austin, TX');
    expect(suggestName(pick('a', 'b'), { ...emptyFilter, minArea: 100_000 }, all, [])).toBe('Office properties in Austin, TX');
  });
  it('falls back to the first property and a count', () => {
    expect(suggestName(pick('a', 'c', 'd', 'e'), emptyFilter, all, [])).toBe('Harbor Tower and 3 others');
    const two = [all[0], { ...all[3], type: 'Office' }];
    expect(suggestName(two, emptyFilter, two, [])).toBe('Harbor Tower and 1 other');
  });
  it('numbers a name that’s taken', () => {
    expect(suggestName(pick('a', 'b'), emptyFilter, all, ['Office properties in Austin, TX', 'office properties in austin, tx 2'])).toBe('Office properties in Austin, TX 3');
  });
});
