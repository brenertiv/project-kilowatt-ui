import { describe, expect, it } from 'vitest';
import { formatOperationsTime } from './dates';

describe('formatOperationsTime', () => {
  it('formats an ISO timestamp in America/New_York', () => {
    expect(formatOperationsTime('2026-09-14T13:04:00-04:00')).toMatch(/Sep 14/);
  });
});
