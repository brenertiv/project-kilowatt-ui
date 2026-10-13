import { describe, expect, it } from 'vitest';
import {
  actionSets,
  buildPortfolio,
  clientSets,
  equipmentSets,
  locationSets,
  meterSets,
  portfolio,
  propertyAlertSets,
  sampleSetNames,
  utilityBillSets,
} from './index';

describe('sample portfolio', () => {
  it('is deterministic', () => {
    expect(buildPortfolio()).toEqual(portfolio);
  });

  it('keeps every relation pointing at a record that exists', () => {
    const locationIds = new Set(portfolio.locations.map((row) => row.id));
    const sublocationIds = new Set(portfolio.sublocations.map((row) => row.id));
    const assetIds = new Set([...portfolio.equipment, ...portfolio.meters].map((row) => row.id));
    expect(portfolio.units.every((unit) => unit.parent_location && locationIds.has(unit.parent_location))).toBe(true);
    expect(portfolio.sublocations.every((room) => locationIds.has(room.location as string))).toBe(true);
    expect(
      [...portfolio.equipment, ...portfolio.meters].every((asset) => sublocationIds.has(asset.sublocation as string)),
    ).toBe(true);
    expect(portfolio.utilityBills.every((bill) => locationIds.has(bill.location as string))).toBe(true);
    expect(portfolio.actions.every((action) => locationIds.has(action.location_id))).toBe(true);
    expect(portfolio.actions.every((action) => action.equipment === null || assetIds.has(action.equipment))).toBe(true);
  });

  it('reaches every work-order status and both alert flags', () => {
    const statuses = new Set(portfolio.actions.map((action) => action.action_status));
    expect([...statuses].sort()).toEqual([1, 2, 3, 4, 5, 6, 7]);
    expect(portfolio.propertyAlerts.some((alert) => alert.fixed)).toBe(true);
    expect(portfolio.propertyAlerts.some((alert) => !alert.fixed && !alert.acknowledged)).toBe(true);
    expect(portfolio.propertyAlerts.some((alert) => alert.relevant_period === null)).toBe(true);
  });

  it('uses unique ids and the API timestamp format', () => {
    const ids = portfolio.utilityBills.map((bill) => bill.id);
    expect(new Set(ids).size).toBe(ids.length);
    expect(portfolio.buildings[0]!.created).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{6}-04:00$/);
    expect(portfolio.utilityBills[0]!.start_date).toMatch(/^\d{4}-\d{2}-01$/);
  });
});

describe('sample sets', () => {
  const all = { clientSets, locationSets, equipmentSets, meterSets, utilityBillSets, propertyAlertSets, actionSets };

  it('exposes the same set names for every entity', () => {
    for (const sets of Object.values(all)) {
      expect(Object.keys(sets).sort()).toEqual([...sampleSetNames].sort());
      expect(sets.none).toHaveLength(0);
      expect(sets.one).toHaveLength(1);
      expect(sets.few.length).toBeGreaterThan(1);
      expect(sets.all.length).toBeGreaterThanOrEqual(sets.page.length);
    }
  });

  it('models placeholder names the way bad data arrives', () => {
    expect(equipmentSets.placeholder.map((row) => row.name)).toContain('???');
    expect(meterSets.placeholder.map((row) => row.name)).toContain('0');
    expect(actionSets.sparse.every((action) => action.due_date === null)).toBe(true);
    expect(locationSets.long[0]!.name.length).toBeGreaterThan(40);
  });
});
