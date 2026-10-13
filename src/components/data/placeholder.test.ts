import { describe, expect, it } from 'vitest';
import { displayName, isPlaceholder, shortId } from './placeholder';

describe('isPlaceholder', () => {
  it('treats the values bad data arrives with as placeholders', () => {
    for (const value of ['???', '0', '', '  ', 'N/A', 'null', '-', null, undefined, 0])
      expect(isPlaceholder(value)).toBe(true);
  });
  it('keeps real names', () => {
    for (const value of ['AHU-1', '120 Broadway', 'Suite 0', 1]) expect(isPlaceholder(value)).toBe(false);
  });
});

describe('displayName', () => {
  it('substitutes a fallback and remembers the raw value', () => {
    expect(displayName('???', 'Unnamed meter')).toEqual({ text: 'Unnamed meter', placeholder: true, raw: '???' });
    expect(displayName(' Main electric ', 'Unnamed meter')).toEqual({
      text: 'Main electric',
      placeholder: false,
      raw: ' Main electric ',
    });
  });
});

describe('shortId', () => {
  it('keeps the first block of a UUID and leaves short ids alone', () => {
    expect(shortId('d79cbeac-9ef1-479f-9415-fa70f2f738b4')).toBe('d79cbeac');
    expect(shortId(2723)).toBe('2723');
  });
});
