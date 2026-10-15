// @vitest-environment node
import { readdirSync, readFileSync } from 'node:fs';
import { join, relative } from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';
import { storyDeps } from './storyDeps';

const root = fileURLToPath(new URL('../..', import.meta.url));

/** Source files the story tests can load: everything in `src` but unit tests and their setup, plus the preview. */
function storySources(): string[] {
  const files = readdirSync(join(root, 'src'), { recursive: true, encoding: 'utf8' })
    .filter((file) => /\.tsx?$/.test(file) && !/\.test\.tsx?$/.test(file) && !file.startsWith('test/'))
    .map((file) => join(root, 'src', file));
  return [...files, join(root, '.storybook/preview.tsx')];
}

const importPattern =
  /^\s*(?:import|export)\s+(?!type\b)(?:[^'"]*?\sfrom\s+)?['"]([^'"]+)['"]|\bimport\(\s*['"]([^'"]+)['"]\s*\)/gm;

/** Bare package specifiers imported at runtime: no relative or `src/` paths, no type-only imports, no CSS. */
function packageImports(source: string): string[] {
  return [...source.matchAll(importPattern)]
    .map((match) => match[1] ?? match[2])
    .filter((specifier) => !/^(\.|src\/)/.test(specifier) && !specifier.endsWith('.css'));
}

describe('storyDeps', () => {
  it('pins every package the story tests import', () => {
    const missing = new Map<string, string>();
    for (const file of storySources()) {
      for (const specifier of packageImports(readFileSync(file, 'utf8'))) {
        if (!storyDeps.includes(specifier) && !missing.has(specifier)) {
          missing.set(specifier, relative(root, file));
        }
      }
    }
    // Add each one to src/test/storyDeps.ts, or a cold story run reloads under the tests.
    expect(Object.fromEntries(missing)).toEqual({});
  });
});
