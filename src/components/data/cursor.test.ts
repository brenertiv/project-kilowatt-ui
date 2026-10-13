import { describe, expect, it } from 'vitest';
import { cursorFromUrl } from './cursor';

describe('cursorFromUrl', () => {
  it('reads the cursor from absolute and relative links', () => {
    expect(cursorFromUrl('http://app.enertiv.com/api/client/?cursor=cD0wMDA%3D&page_size=1')).toBe('cD0wMDA=');
    expect(cursorFromUrl('/api/action/?cursor=bz0x')).toBe('bz0x');
    expect(cursorFromUrl(null)).toBeUndefined();
    expect(cursorFromUrl('/api/action/')).toBeUndefined();
  });
});
