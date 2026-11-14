// @vitest-environment node
import { describe, expect, it } from 'vitest';
import { toCsv, widgetScopeText } from './patterns';

describe('toCsv', () => {
  it('quotes a value where it needs it, doubles a quote, and leaves a missing value blank', () => {
    expect(toCsv([['Property', 'Use (kWh)'], ['Meridian Tower, East', 1200], ['Say "hi"', undefined]])).toBe('Property,Use (kWh)\n"Meridian Tower, East",1200\n"Say ""hi""",');
  });
});

describe('the widget-scope state', () => {
  it('says what scopes the chart takes, in one sentence', () => {
    expect(widgetScopeText).toBe('This chart works for a portfolio, group or single property.');
  });
});
