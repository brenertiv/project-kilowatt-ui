import { breakpointRoles, breakpoints, breakpointVarName, type BreakpointName } from '../breakpoints';
import {
  colorRoles,
  colorTokens,
  contrastPairs,
  derivedTokens,
  derivedValue,
  fontLabels,
  layoutGrid,
  resolveTheme,
  tokenById,
  tokens,
  typeRoles,
  type ThemeValues,
} from '../tokens';
import { measureContrast } from './contrast';

function colorOf(id: string, palette: Record<string, string>) {
  return palette[id] ?? tokenById[id]?.defaultValue ?? '';
}

export function buildSystemSnapshot(values: ThemeValues, darkColors: Record<string, string>) {
  const darkResolved = resolveTheme(values, darkColors, 'dark');

  const colors = Object.fromEntries(
    colorTokens.map((token) => [
      token.id,
      {
        label: token.label,
        cssVar: token.cssVar,
        light: colorOf(token.id, values),
        dark: colorOf(token.id, darkColors),
        role: colorRoles.find((role) => role.tokenIds.includes(token.id))?.id ?? null,
      },
    ]),
  );

  const contrast = contrastPairs.map((pair) => ({
    id: pair.id,
    label: pair.label,
    fg: pair.fg,
    bg: pair.bg,
    kind: pair.kind,
    light: measureContrast(colorOf(pair.fg, values), colorOf(pair.bg, values), pair.kind),
    dark: measureContrast(colorOf(pair.fg, darkColors), colorOf(pair.bg, darkColors), pair.kind),
  }));

  const typography = {
    fontFamily: values.fontFamily,
    fontLabel: fontLabels[values.fontFamily] ?? values.fontFamily,
    roles: typeRoles.map((role) => ({
      ...role,
      size: values[role.sizeToken] ?? tokenById[role.sizeToken]?.defaultValue,
      sizeVar: tokenById[role.sizeToken]?.cssVar,
    })),
  };

  const space = [
    ...tokens
      .filter((token) => token.group === 'Space')
      .map((token) => ({
        cssVar: token.cssVar,
        label: token.label,
        value: values[token.id] ?? token.defaultValue,
      })),
    ...derivedTokens
      .filter((token) => token.group === 'Space')
      .map((token) => ({
        cssVar: token.cssVar,
        label: token.label,
        value: derivedValue(token, values, 'light'),
        aliasOf: token.aliasOf,
        note: token.note,
      })),
  ];

  const shape = [
    ...tokens
      .filter((token) => token.group === 'Shape')
      .map((token) => ({
        cssVar: token.cssVar,
        label: token.label,
        value: values[token.id] ?? token.defaultValue,
      })),
    ...derivedTokens
      .filter((token) => token.group === 'Shape')
      .map((token) => ({
        cssVar: token.cssVar,
        label: token.label,
        value: derivedValue(token, values, 'light'),
        darkValue: derivedValue(token, darkResolved, 'dark'),
        note: token.note,
      })),
  ];

  const layout = {
    contentMax: derivedValue(
      derivedTokens.find((token) => token.cssVar === '--content-max')!,
      values,
      'light',
    ),
    grid: layoutGrid,
    breakpoints: (Object.keys(breakpoints) as BreakpointName[]).map((name) => ({
      name,
      cssVar: breakpointVarName(name),
      value: `${breakpoints[name]}px`,
      role: breakpointRoles[name],
    })),
  };

  return {
    name: 'Kilowatt',
    colors,
    colorRoles: colorRoles.map(({ id, label, description, tokenIds }) => ({ id, label, description, tokenIds })),
    contrast,
    typography,
    space,
    shape,
    layout,
  };
}

export function systemToJson(values: ThemeValues, darkColors: Record<string, string>) {
  return `${JSON.stringify(buildSystemSnapshot(values, darkColors), null, 2)}\n`;
}

function mdTable(headers: string[], rows: string[][]) {
  const head = `| ${headers.join(' | ')} |`;
  const rule = `| ${headers.map(() => '---').join(' | ')} |`;
  const body = rows.map((row) => `| ${row.join(' | ')} |`).join('\n');
  return `${head}\n${rule}\n${body}`;
}

export function systemToMarkdown(values: ThemeValues, darkColors: Record<string, string>) {
  const snapshot = buildSystemSnapshot(values, darkColors);
  const sections: string[] = [
    '# Kilowatt design system',
    '',
    'Source of truth for color, type, space, shape, and layout tokens.',
    '',
  ];

  sections.push('## Color', '');
  for (const role of snapshot.colorRoles) {
    sections.push(`### ${role.label}`, '', role.description, '');
    const rows = role.tokenIds.map((id) => {
      const color = snapshot.colors[id];
      return [`${color.label} (\`${id}\`)`, `\`${color.cssVar}\``, color.light, color.dark];
    });
    sections.push(mdTable(['Token', 'CSS variable', 'Light', 'Dark'], rows), '');
  }

  sections.push('## Contrast', '');
  sections.push(
    mdTable(
      ['Pair', 'Light', 'Dark'],
      snapshot.contrast.map((pair) => [
        pair.label,
        pair.light ? `${pair.light.formatted} ${pair.light.level}` : '—',
        pair.dark ? `${pair.dark.formatted} ${pair.dark.level}` : '—',
      ]),
    ),
    '',
  );

  sections.push(
    '## Typography',
    '',
    `Font family: ${snapshot.typography.fontLabel} (\`${snapshot.typography.fontFamily}\`)`,
    '',
  );
  sections.push(
    mdTable(
      ['Role', 'Size', 'Weight', 'Line height', 'Usage'],
      snapshot.typography.roles.map((role) => [
        role.label,
        `${role.size} (\`${role.sizeVar}\`)`,
        String(role.weight),
        String(role.lineHeight),
        role.usage,
      ]),
    ),
    '',
  );

  sections.push('## Space', '');
  sections.push(
    mdTable(
      ['Token', 'Value', 'Notes'],
      snapshot.space.map((item) => [
        `\`${item.cssVar}\``,
        item.value,
        'note' in item && item.note
          ? String(item.note)
          : 'aliasOf' in item && item.aliasOf
            ? `Alias of ${item.aliasOf}`
            : '—',
      ]),
    ),
    '',
  );

  sections.push('## Shape', '');
  sections.push(
    mdTable(
      ['Token', 'Value', 'Notes'],
      snapshot.shape.map((item) => [
        `\`${item.cssVar}\``,
        'darkValue' in item && item.darkValue && item.darkValue !== item.value
          ? `${item.value} / ${item.darkValue}`
          : item.value,
        'note' in item && item.note ? String(item.note) : '—',
      ]),
    ),
    '',
  );

  sections.push(
    '## Layout',
    '',
    `Content max width: \`${snapshot.layout.contentMax}\`. Grid: ${layoutGrid.columns} columns, default span ${layoutGrid.defaultSpan}, wide span ${layoutGrid.wideSpan}.`,
    '',
  );
  sections.push(
    mdTable(
      ['Breakpoint', 'CSS variable', 'Value', 'Role'],
      snapshot.layout.breakpoints.map((item) => [item.name, `\`${item.cssVar}\``, item.value, item.role]),
    ),
    '',
  );

  return `${sections.join('\n').trim()}\n`;
}
