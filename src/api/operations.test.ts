import { describe, expect, it } from 'vitest';
import { fetchTickets } from './operations';

describe('fetchTickets', () => {
  it('returns the lab ticket catalog through axios', async () => {
    const tickets = await fetchTickets();
    expect(tickets.length).toBeGreaterThan(0);
    expect(tickets[0]?.id).toMatch(/^T-/);
  });
});
