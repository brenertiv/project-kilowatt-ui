import { isValidElement, type ComponentType, type ReactElement, type ReactNode } from 'react';

/**
 * Fixture discovery, following React Cosmos file conventions:
 * - `Name.fixture.tsx` beside the component it exercises
 * - default export is an element, a component, or an object of named fixtures
 * - `cosmos.decorator.tsx` wraps every fixture in its directory and below
 */

export type FixtureRender = ReactElement | ComponentType;

export type FixtureEntry = {
  /** Stable id: `<slug>/<name>`. */
  id: string;
  /** Component slug derived from the file name, e.g. `data-table`. */
  slug: string;
  /** Display name derived from the file name, e.g. `DataTable`. */
  component: string;
  /** Fixture name. `default` for single-fixture modules. */
  name: string;
  /** Directory of the fixture file, used to scope decorators. */
  dir: string;
  render: FixtureRender;
};

export type FixtureGroup = {
  slug: string;
  component: string;
  dir: string;
  fixtures: FixtureEntry[];
};

export type Decorator = ComponentType<{ children: ReactNode }>;

type FixtureModuleDefault = FixtureRender | Record<string, FixtureRender>;

function isRender(value: unknown): value is FixtureRender {
  return isValidElement(value) || typeof value === 'function';
}

export function slugify(name: string) {
  return name
    .replace(/([a-z0-9])([A-Z])/g, '$1-$2')
    .replace(/[^a-zA-Z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .toLowerCase();
}

export function componentNameFromPath(path: string) {
  const file = path.split('/').pop() ?? path;
  return file.replace(/\.fixture\.(t|j)sx?$/, '');
}

export function dirOf(path: string) {
  return path.slice(0, path.lastIndexOf('/'));
}

/** Normalizes one fixture module into entries. Invalid exports are skipped. */
export function entriesFromModule(path: string, moduleDefault: unknown): FixtureEntry[] {
  const component = componentNameFromPath(path);
  const slug = slugify(component);
  const dir = dirOf(path);
  if (isRender(moduleDefault)) {
    return [{ id: `${slug}/default`, slug, component, name: 'default', dir, render: moduleDefault }];
  }
  if (moduleDefault && typeof moduleDefault === 'object') {
    return Object.entries(moduleDefault as Record<string, unknown>)
      .filter((pair): pair is [string, FixtureRender] => isRender(pair[1]))
      .map(([name, render]) => ({ id: `${slug}/${slugify(name)}`, slug, component, name, dir, render }));
  }
  return [];
}

export function groupFixtures(entries: FixtureEntry[]): FixtureGroup[] {
  const groups = new Map<string, FixtureGroup>();
  for (const entry of entries) {
    const group = groups.get(entry.slug) ?? { slug: entry.slug, component: entry.component, dir: entry.dir, fixtures: [] };
    group.fixtures.push(entry);
    groups.set(entry.slug, group);
  }
  return [...groups.values()].sort((a, b) => a.component.localeCompare(b.component));
}

/** Decorators whose directory contains the fixture, outermost first. */
export function decoratorsFor(dir: string, decorators: Record<string, Decorator>): Decorator[] {
  return Object.entries(decorators)
    .filter(([path]) => dir === dirOf(path) || dir.startsWith(`${dirOf(path)}/`))
    .sort((a, b) => a[0].length - b[0].length)
    .map(([, decorator]) => decorator);
}

const fixtureModules = import.meta.glob('/src/**/*.fixture.tsx', { import: 'default', eager: true }) as Record<
  string,
  FixtureModuleDefault
>;

const decoratorModules = import.meta.glob('/src/**/cosmos.decorator.tsx', { import: 'default', eager: true }) as Record<
  string,
  Decorator
>;

export const fixtures: FixtureEntry[] = Object.entries(fixtureModules).flatMap(([path, moduleDefault]) =>
  entriesFromModule(path, moduleDefault),
);

export const fixtureGroups = groupFixtures(fixtures);

export function findFixture(slug: string | undefined, name: string | undefined): FixtureEntry | undefined {
  const group = fixtureGroups.find((candidate) => candidate.slug === slug);
  if (!group) return undefined;
  if (!name) return group.fixtures[0];
  return group.fixtures.find((fixture) => slugify(fixture.name) === name || fixture.name === name);
}

export function decoratorsForFixture(fixture: FixtureEntry): Decorator[] {
  return decoratorsFor(fixture.dir, decoratorModules);
}
