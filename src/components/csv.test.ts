import { describe, expect, it } from 'vitest';
import { CSV_BOM, toCsv } from './csv';

describe('toCsv', () => {
  it('joins headers and rows with CRLF', () => {
    expect(toCsv(['a', 'b'], [['1', '2'], ['3', '4']])).toBe('a,b\r\n1,2\r\n3,4');
  });

  it('quotes cells containing commas', () => {
    expect(toCsv(['name'], [['Main Electrical Rm, Level 3']])).toBe('name\r\n"Main Electrical Rm, Level 3"');
  });

  it('doubles embedded quotes and quotes the cell', () => {
    expect(toCsv(['note'], [['12" conduit']])).toBe('note\r\n"12"" conduit"');
  });

  it('quotes cells containing line breaks', () => {
    expect(toCsv(['note'], [['line one\nline two'], ['crlf\r\nhere']])).toBe(
      'note\r\n"line one\nline two"\r\n"crlf\r\nhere"',
    );
  });

  it('leaves plain cells unquoted and keeps empty cells', () => {
    expect(toCsv(['a', 'b', 'c'], [['x', '', 'z']])).toBe('a,b,c\r\nx,,z');
  });

  it('prefixes a BOM only when asked', () => {
    expect(toCsv(['a'], [], { bom: true })).toBe(`${CSV_BOM}a`);
    expect(toCsv(['a'], []).startsWith(CSV_BOM)).toBe(false);
  });
});
