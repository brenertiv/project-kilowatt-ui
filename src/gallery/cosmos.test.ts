import { describe, expect, it } from 'vitest';
import { cosmosFixtureUrl } from './cosmos';

describe('cosmosFixtureUrl', () => {
  it('encodes the fixture id the way the Cosmos UI reads it', () => {
    const url = cosmosFixtureUrl(
      { path: 'src/components/Button.fixture.tsx', name: 'All states' },
      'http://localhost:5100/',
    );
    expect(url).toBe(
      `http://localhost:5100/?fixture=${encodeURIComponent('{"path":"src/components/Button.fixture.tsx","name":"All states"}')}`,
    );
  });

  it('omits the name for single-fixture modules and returns null without a base', () => {
    expect(cosmosFixtureUrl({ path: 'src/gallery/Treemap.fixture.tsx', name: null }, 'http://x')).toContain(
      encodeURIComponent('{"path":"src/gallery/Treemap.fixture.tsx"}'),
    );
    expect(cosmosFixtureUrl({ path: 'a', name: null }, null)).toBeNull();
  });
});
