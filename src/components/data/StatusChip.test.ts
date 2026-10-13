import { describe, expect, it } from 'vitest';
import { actionStatuses } from '../../fixtures/data';
import { actionStatusTone, alertTone, resolveLookup } from './StatusChip';

describe('resolveLookup', () => {
  it('accepts a bare id with a table, an expanded object without one, and nothing otherwise', () => {
    expect(resolveLookup(7, actionStatuses)?.name).toBe('Requires Attention');
    expect(resolveLookup(actionStatuses[0]!)?.name).toBe('Open');
    expect(resolveLookup(99, actionStatuses)).toBeUndefined();
    expect(resolveLookup(null, actionStatuses)).toBeUndefined();
  });

  it('has a tone for every action status the API serves', () => {
    for (const status of actionStatuses) expect(actionStatusTone[status.name]).toBeDefined();
  });
});

describe('alertTone', () => {
  it('ranks fixed over acknowledged over open', () => {
    expect(alertTone({ fixed: true, acknowledged: true })).toEqual({ key: 'fixed', tone: 'success' });
    expect(alertTone({ fixed: false, acknowledged: true })).toEqual({ key: 'acknowledged', tone: 'info' });
    expect(alertTone({ fixed: false, acknowledged: false })).toEqual({ key: 'open', tone: 'warning' });
  });
});
