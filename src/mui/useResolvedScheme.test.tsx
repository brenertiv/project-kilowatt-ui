import { render } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { MuiProvider } from './MuiProvider';
import { useResolvedScheme } from './useResolvedScheme';

/** The scheme the hook returns on each render, in order. */
function renders(): (string | undefined)[] {
  const seen: (string | undefined)[] = [];
  function Probe() {
    seen.push(useResolvedScheme());
    return null;
  }
  render(
    <MuiProvider>
      <Probe />
    </MuiProvider>,
  );
  return seen;
}

describe('useResolvedScheme', () => {
  afterEach(() => {
    localStorage.clear();
    vi.unstubAllGlobals();
  });

  it('is undefined on the first render, then the stored scheme', () => {
    localStorage.setItem('mui-mode', 'dark');
    const seen = renders();
    expect(seen[0]).toBeUndefined();
    expect(seen.at(-1)).toBe('dark');
  });

  it('resolves system to the viewer’s setting', () => {
    localStorage.setItem('mui-mode', 'system');
    vi.stubGlobal('matchMedia', () => ({ matches: true, addEventListener: vi.fn(), removeEventListener: vi.fn(), addListener: vi.fn(), removeListener: vi.fn() }));
    expect(renders().at(-1)).toBe('dark');
  });
});
