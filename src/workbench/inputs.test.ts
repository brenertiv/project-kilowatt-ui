import { describe, expect, it } from 'vitest';
import { decodeInputs, encodeInputs, InputStore } from './inputs';

describe('fixture input store', () => {
  it('returns defaults until a value is set, then reports overrides', () => {
    const store = new InputStore();
    store.register({ name: 'disabled', kind: 'boolean', defaultValue: false });
    expect(store.get('disabled')).toBe(false);
    expect(store.overrides()).toEqual({});
    store.set('disabled', true);
    expect(store.get('disabled')).toBe(true);
    expect(store.overrides()).toEqual({ disabled: true });
    store.set('disabled', false);
    expect(store.overrides()).toEqual({});
  });

  it('hydrates from URL values and resets to defaults', () => {
    const store = new InputStore({ variant: 'ghost' });
    store.register({ name: 'variant', kind: 'select', defaultValue: 'solid', options: ['solid', 'ghost'] });
    expect(store.get('variant')).toBe('ghost');
    store.reset();
    expect(store.get('variant')).toBe('solid');
  });

  it('keeps definitions in registration order and notifies subscribers', () => {
    const store = new InputStore();
    let notified = 0;
    store.subscribe(() => {
      notified += 1;
    });
    store.register({ name: 'b', kind: 'text', defaultValue: 'x' });
    store.register({ name: 'a', kind: 'number', defaultValue: 1 });
    store.register({ name: 'b', kind: 'text', defaultValue: 'x' });
    expect(store.getSnapshot().definitions.map((d) => d.name)).toEqual(['b', 'a']);
    expect(notified).toBe(2);
  });

  it('round-trips input values through the URL encoding', () => {
    expect(encodeInputs({})).toBeUndefined();
    const encoded = encodeInputs({ count: 3, label: 'Go', on: true });
    expect(decodeInputs(encoded ?? null)).toEqual({ count: 3, label: 'Go', on: true });
    expect(decodeInputs('not json')).toEqual({});
    expect(decodeInputs('[1,2]')).toEqual({});
  });
});
