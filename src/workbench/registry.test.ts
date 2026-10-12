import { createElement } from 'react';
import { describe, expect, it } from 'vitest';
import { componentNameFromPath, decoratorsFor, entriesFromModule, groupFixtures, slugify } from './registry';

const Noop = () => null;

describe('fixture registry', () => {
  it('derives component and slug names from the file path', () => {
    expect(componentNameFromPath('/src/components/DataTable.fixture.tsx')).toBe('DataTable');
    expect(slugify('DataTable')).toBe('data-table');
    expect(slugify('All states')).toBe('all-states');
  });

  it('accepts an element, a component, or a map of named fixtures', () => {
    expect(entriesFromModule('/src/a/Button.fixture.tsx', createElement('button')).map((e) => e.name)).toEqual(['default']);
    expect(entriesFromModule('/src/a/Button.fixture.tsx', Noop).map((e) => e.name)).toEqual(['default']);
    const multi = entriesFromModule('/src/a/Button.fixture.tsx', { Playground: Noop, 'All states': createElement('div'), bad: 42 });
    expect(multi.map((e) => e.id)).toEqual(['button/playground', 'button/all-states']);
  });

  it('groups fixtures by component in alphabetical order', () => {
    const entries = [
      ...entriesFromModule('/src/z/Table.fixture.tsx', Noop),
      ...entriesFromModule('/src/a/Button.fixture.tsx', { One: Noop, Two: Noop }),
    ];
    expect(groupFixtures(entries).map((g) => [g.component, g.fixtures.length])).toEqual([
      ['Button', 2],
      ['Table', 1],
    ]);
  });

  it('applies decorators from outer to inner directories only', () => {
    const decorators = {
      '/src/cosmos.decorator.tsx': Noop,
      '/src/components/cosmos.decorator.tsx': Noop,
      '/src/charts/cosmos.decorator.tsx': Noop,
    };
    const applied = decoratorsFor('/src/components/table', decorators);
    expect(applied).toHaveLength(2);
    expect(decoratorsFor('/src/other', decorators)).toHaveLength(1);
  });
});
