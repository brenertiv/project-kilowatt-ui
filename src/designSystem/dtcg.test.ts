import { describe, expect, it } from 'vitest';
import { defaultDarkColors, defaultTheme } from '../tokens';
import { dtcgColor, dtcgPrimitive, systemToDtcg } from './dtcg';
import { buildSystemSnapshot } from './export';

describe('dtcgColor', () => {
  it('reads hex with and without alpha as sRGB components', () => {
    expect(dtcgColor('#ff0000')).toEqual({ colorSpace: 'srgb', components: [1, 0, 0], alpha: 1, hex: '#ff0000' });
    expect(dtcgColor('#00000080').alpha).toBe(0.502);
    expect(() => dtcgColor('rgb(0 0 0)')).toThrow(/hex/);
  });
});

describe('dtcgPrimitive', () => {
  it('types each primitive from its path and value', () => {
    expect(dtcgPrimitive('spacing/2', '16px')).toEqual({ $type: 'dimension', $value: { value: 16, unit: 'px' } });
    expect(dtcgPrimitive('opacity/40', '40%')).toEqual({ $type: 'number', $value: 0.4 });
    expect(dtcgPrimitive('typography/fontFamily/mono', '"Roboto Mono"')).toEqual({ $type: 'fontFamily', $value: 'Roboto Mono' });
    expect(dtcgPrimitive('typography/fontWeight/medium', '500')).toEqual({ $type: 'fontWeight', $value: 500 });
    expect(dtcgPrimitive('typography/letterSpacing/tight', '-0.01em')).toMatchObject({ $type: 'number', $value: -0.01 });
  });
});

describe('systemToDtcg', () => {
  const snapshot = buildSystemSnapshot(defaultTheme, defaultDarkColors);

  it('converts every primitive in the system', () => {
    expect(() => systemToDtcg(snapshot, 'light')).not.toThrow();
  });

  it('aliases semantic colors to the primitive step for each scheme', () => {
    const [id, color] = Object.entries(snapshot.colors).find(([, entry]) => entry.role && entry.lightPrimitive && entry.darkPrimitive)!;
    const role = color.role!;
    type Tree = { semantic: Record<string, Record<string, { $value: unknown }>> };
    const light = systemToDtcg(snapshot, 'light') as unknown as Tree;
    const dark = systemToDtcg(snapshot, 'dark') as unknown as Tree;
    expect(light.semantic[role][id].$value).toBe(`{${color.lightPrimitive!.replaceAll('/', '.')}}`);
    expect(dark.semantic[role][id].$value).toBe(`{${color.darkPrimitive!.replaceAll('/', '.')}}`);
  });
});
