import { Component, isValidElement, useCallback, useEffect, useMemo, useState, type ReactNode } from 'react';
import { Button } from '@base-ui/react/button';
import { Input } from '@base-ui/react/input';
import { Drawer } from '@base-ui/react/drawer';
import { Select } from '@base-ui/react/select';
import { NavLink, useNavigate, useParams, useSearchParams } from 'react-router';
import {
  CheckIcon,
  ChevronDownIcon,
  FullscreenExitIcon,
  FullscreenIcon,
  DevicesIcon,
  FitScreenIcon,
  LaptopIcon,
  PhoneIcon,
  SearchIcon,
  TabletIcon,
  XIcon,
  type IconProps,
} from '../icons';
import type { ComponentType } from 'react';
import { FigmaLinkField } from '../figma/FigmaLink';
import { ControlPanel } from './ControlPanel';
import { decodeInputs, encodeInputs, FixtureInputsProvider, InputStore } from './inputs';
import { decoratorsForFixture, findFixture, fixtureSections, slugify, type FixtureEntry, type FixtureGroup } from './registry';
import { sameSize, ViewportContext, viewportPresets, type ViewportSize } from './Viewport';
import { compactQuery, useMediaQuery } from './useMediaQuery';

/** Route prefix the workbench is mounted under. */
const base = '/components';

function fixturePath(group: FixtureGroup, entry: FixtureEntry) {
  return `${base}/${group.slug}/${slugify(entry.name)}`;
}

const firstGroup = fixtureSections.flatMap((section) => section.groups)[0];

const presetIcons: Record<string, ComponentType<IconProps>> = {
  Fit: FitScreenIcon,
  Phone: PhoneIcon,
  Tablet: TabletIcon,
  Laptop: LaptopIcon,
};

/** One dropdown for the stage size, with a device icon for each preset. */
function ViewportSelect({ value, onChange }: { value: string; onChange: (label: string) => void }) {
  const Current = presetIcons[value] ?? DevicesIcon;
  return (
    <Select.Root items={viewportPresets.map((preset) => ({ label: preset.label, value: preset.label }))} value={value} onValueChange={(next) => next && onChange(next)}>
      <Select.Trigger className="ui-icon-btn workbench-viewport-select" aria-label={`Viewport: ${value}`} title="Viewport">
        <Current />
      </Select.Trigger>
      <Select.Portal>
        <Select.Positioner className="ui-positioner" sideOffset={4}>
          <Select.Popup className="ui-popup">
            <Select.List>
              {viewportPresets.map((preset) => {
                const Icon = presetIcons[preset.label] ?? DevicesIcon;
                return (
                  <Select.Item key={preset.label} value={preset.label} className="ui-item">
                    <Select.ItemIndicator className="ui-item-indicator">
                      <CheckIcon />
                    </Select.ItemIndicator>
                    <Icon />
                    <Select.ItemText>{preset.label}</Select.ItemText>
                    {preset.size ? (
                      <span className="workbench-viewport-size">
                        {preset.size.width} × {preset.size.height}
                      </span>
                    ) : null}
                  </Select.Item>
                );
              })}
            </Select.List>
          </Select.Popup>
        </Select.Positioner>
      </Select.Portal>
    </Select.Root>
  );
}

class FixtureErrorBoundary extends Component<{ children: ReactNode; resetKey: string }, { error: Error | null }> {
  state = { error: null as Error | null };

  static getDerivedStateFromError(error: Error) {
    return { error };
  }

  componentDidUpdate(previous: { resetKey: string }) {
    if (previous.resetKey !== this.props.resetKey && this.state.error) this.setState({ error: null });
  }

  render() {
    if (this.state.error) {
      return (
        <div className="workbench-error" role="alert">
          <p className="ui-description">This fixture threw while rendering.</p>
          <pre className="workbench-trace">{this.state.error.message}</pre>
        </div>
      );
    }
    return this.props.children;
  }
}

function FixtureView({ fixture }: { fixture: FixtureEntry }) {
  const decorators = decoratorsForFixture(fixture);
  const Render = fixture.render;
  let node: ReactNode = isValidElement(Render) ? Render : <Render />;
  for (const Decorator of [...decorators].reverse()) {
    node = <Decorator>{node}</Decorator>;
  }
  return node;
}

/** The compact stand-in for the browser: one dropdown, grouped into components and pages. */
function FixtureSelect({ current }: { current: FixtureEntry | undefined }) {
  const navigate = useNavigate();
  const entryLabel = (group: FixtureGroup, entry: FixtureEntry) =>
    group.fixtures.length > 1 ? `${group.component} · ${entry.name}` : group.component;
  const items = fixtureSections.flatMap((section) =>
    section.groups.flatMap((group) => group.fixtures.map((entry) => ({ value: entry.id, label: entryLabel(group, entry) }))),
  );
  return (
    <Select.Root
      items={items}
      value={current?.id ?? null}
      onValueChange={(next) => {
        for (const section of fixtureSections) {
          for (const group of section.groups) {
            const entry = group.fixtures.find((candidate) => candidate.id === next);
            if (entry) navigate(fixturePath(group, entry));
          }
        }
      }}
    >
      <Select.Trigger className="ui-select workbench-fixture-select" aria-label="Fixture">
        <Select.Value placeholder="Choose a fixture" />
        <Select.Icon className="ui-select-icon">
          <ChevronDownIcon />
        </Select.Icon>
      </Select.Trigger>
      <Select.Portal>
        <Select.Positioner className="ui-positioner" sideOffset={4}>
          <Select.Popup className="ui-popup workbench-fixture-popup">
            <Select.List>
              {fixtureSections.map((section) =>
                section.groups.length === 0 ? null : (
                  <Select.Group key={section.kind}>
                    <Select.GroupLabel className="workbench-section-title workbench-group-label">{section.label}</Select.GroupLabel>
                    {section.groups.flatMap((group) =>
                      group.fixtures.map((entry) => (
                        <Select.Item key={entry.id} value={entry.id} className="ui-item">
                          <Select.ItemIndicator className="ui-item-indicator">
                            <CheckIcon />
                          </Select.ItemIndicator>
                          <Select.ItemText>{entryLabel(group, entry)}</Select.ItemText>
                        </Select.Item>
                      )),
                    )}
                  </Select.Group>
                ),
              )}
            </Select.List>
          </Select.Popup>
        </Select.Positioner>
      </Select.Portal>
    </Select.Root>
  );
}

/**
 * The fixture browser, after the Cosmos tree: components and pages in their
 * own sections, a file per component, and its named fixtures nested below.
 */
function FixtureBrowser({ current }: { current: FixtureEntry | undefined }) {
  const navigate = useNavigate();
  const [query, setQuery] = useState('');
  const [toggled, setToggled] = useState<Record<string, boolean>>({});
  const needle = query.trim().toLowerCase();
  const matches = (group: FixtureGroup) =>
    !needle ||
    group.component.toLowerCase().includes(needle) ||
    group.fixtures.some((entry) => entry.name.toLowerCase().includes(needle));

  return (
    <nav className="workbench-nav" aria-label="Fixtures">
      <label className="search workbench-nav-search">
        <SearchIcon />
        <Input className="ui-input" placeholder="Filter fixtures" value={query} onValueChange={setQuery} aria-label="Filter fixtures" />
      </label>
      {fixtureSections.map((section) => {
        const groups = section.groups.filter(matches);
        if (groups.length === 0) return null;
        return (
          <section key={section.kind} className="workbench-nav-section">
            <h3 className="workbench-section-title">{section.label}</h3>
            <ul className="workbench-tree">
              {groups.map((group) => {
                const isCurrent = current?.slug === group.slug;
                const multi = group.fixtures.length > 1;
                const open = multi && (toggled[group.slug] ?? (isCurrent || needle.length > 0));
                return (
                  <li key={group.slug} className="workbench-tree-item" data-current={isCurrent || undefined}>
                    {multi ? (
                      <button
                        type="button"
                        className="workbench-tree-link"
                        aria-expanded={open}
                        onClick={() => {
                          setToggled((state) => ({ ...state, [group.slug]: !open }));
                          if (!isCurrent) navigate(fixturePath(group, group.fixtures[0]));
                        }}
                      >
                        <ChevronDownIcon className="workbench-tree-chevron" />
                        {group.component}
                      </button>
                    ) : (
                      <NavLink to={fixturePath(group, group.fixtures[0])} className="workbench-tree-link">
                        {group.component}
                      </NavLink>
                    )}
                    {open ? (
                      <ul className="workbench-tree-states">
                        {group.fixtures.map((entry) => (
                          <li key={entry.id}>
                            <NavLink to={fixturePath(group, entry)} className="workbench-tree-link">
                              {entry.name}
                            </NavLink>
                          </li>
                        ))}
                      </ul>
                    ) : null}
                  </li>
                );
              })}
            </ul>
          </section>
        );
      })}
      {fixtureSections.every((section) => section.groups.filter(matches).length === 0) ? (
        <p className="ui-description">No fixtures match that filter.</p>
      ) : null}
    </nav>
  );
}

/**
 * Component workbench after React Cosmos: a fixture browser on the left, a
 * stage that renders one fixture in isolation at a chosen viewport, and the
 * inputs the fixture declares on the right. The URL carries the fixture and
 * its input values.
 */
export function Workbench() {
  const { slug, name } = useParams();
  const [params, setParams] = useSearchParams();
  const navigate = useNavigate();
  const fixture = findFixture(slug, name);
  const compact = useMediaQuery(compactQuery);
  const [navOpen, setNavOpen] = useState(true);
  const [panelOpen, setPanelOpen] = useState(true);
  const [sheetOpen, setSheetOpen] = useState(false);
  const [fullscreen, setFullscreen] = useState(false);
  const [viewport, setViewport] = useState<ViewportSize>(null);
  const [generation, setGeneration] = useState(0);

  const fixtureKey = fixture?.id ?? 'none';
  const store = useMemo(() => new InputStore(decodeInputs(params.get('inputs'))), [fixtureKey]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    return store.subscribe(() => {
      const encoded = encodeInputs(store.overrides());
      setParams(
        (current) => {
          const next = new URLSearchParams(current);
          if (encoded) next.set('inputs', encoded);
          else next.delete('inputs');
          return next;
        },
        { replace: true },
      );
    });
  }, [store, setParams]);

  useEffect(() => {
    function onKey(event: KeyboardEvent) {
      const target = event.target as HTMLElement | null;
      const typing = target && (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable);
      if (typing || event.metaKey || event.ctrlKey || event.altKey) return;
      switch (event.key.toLowerCase()) {
        case 'n':
          setNavOpen((open) => !open);
          break;
        case 'p':
          setPanelOpen((open) => !open);
          setSheetOpen((open) => !open);
          break;
        case 'f':
          setFullscreen((full) => !full);
          break;
        case 'r':
          setGeneration((n) => n + 1);
          break;
        case 'escape':
          setFullscreen(false);
          break;
        default:
      }
    }
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  useEffect(() => {
    if (!slug && firstGroup) navigate(fixturePath(firstGroup, firstGroup.fixtures[0]), { replace: true });
  }, [slug, navigate]);

  const requestViewport = useCallback((size: ViewportSize) => {
    setViewport((current) => (sameSize(current, size) ? current : size));
  }, []);
  const viewportContext = useMemo(() => ({ size: viewport, request: requestViewport }), [viewport, requestViewport]);
  const presetLabel = viewportPresets.find((preset) => JSON.stringify(preset.size) === JSON.stringify(viewport))?.label ?? 'Custom';

  const showNav = navOpen && !fullscreen && !compact;
  const showPanel = panelOpen && !fullscreen && !compact;

  return (
    <div className="workbench" data-fullscreen={fullscreen || undefined} data-nav={showNav || undefined} data-panel={showPanel || undefined}>
      {showNav ? <FixtureBrowser current={fixture} /> : null}

      <section className="workbench-main">
        {!fullscreen ? (
          <div className="workbench-toolbar">
            <ViewportSelect
              value={presetLabel}
              onChange={(label) => {
                const preset = viewportPresets.find((candidate) => candidate.label === label);
                if (preset) setViewport(preset.size);
              }}
            />
            {compact ? <FixtureSelect current={fixture} /> : null}
            <div className="workbench-tools">
              {compact ? null : (
                <Button className="ui-btn ui-btn-ghost" onClick={() => setNavOpen((open) => !open)} aria-pressed={navOpen}>
                  Fixtures
                </Button>
              )}
              {compact ? (
                <Button className="ui-btn ui-btn-ghost" onClick={() => setSheetOpen(true)} disabled={!fixture}>
                  Inputs
                </Button>
              ) : (
                <Button className="ui-btn ui-btn-ghost" onClick={() => setPanelOpen((open) => !open)} aria-pressed={panelOpen}>
                  Inputs
                </Button>
              )}
              <Button className="ui-btn ui-btn-ghost" onClick={() => setGeneration((n) => n + 1)}>
                Reload
              </Button>
              <Button className="ui-icon-btn" onClick={() => setFullscreen(true)} aria-label="Full screen" title="Full screen">
                <FullscreenIcon />
              </Button>
            </div>
          </div>
        ) : (
          <Button className="ui-icon-btn workbench-exit" onClick={() => setFullscreen(false)} aria-label="Exit full screen" title="Exit full screen">
            <FullscreenExitIcon />
          </Button>
        )}

        <div className="workbench-stage" data-viewport={viewport ? 'fixed' : 'fit'}>
          <div
            className="workbench-frame"
            style={viewport ? { width: viewport.width, height: viewport.height } : undefined}
            data-testid="workbench-frame"
          >
            {fixture ? (
              <ViewportContext.Provider value={viewportContext}>
                <FixtureInputsProvider store={store}>
                  <FixtureErrorBoundary resetKey={`${fixture.id}:${generation}`}>
                    <FixtureView key={`${fixture.id}:${generation}`} fixture={fixture} />
                  </FixtureErrorBoundary>
                </FixtureInputsProvider>
              </ViewportContext.Provider>
            ) : (
              <p className="ui-description">
                No fixture at this address. Pick one from the browser, or add a <code>Name.fixture.tsx</code> file next to a
                component.
              </p>
            )}
          </div>
          {viewport ? (
            <p className="workbench-viewport-label">
              {viewport.width} × {viewport.height}
            </p>
          ) : null}
        </div>
      </section>

      {showPanel && fixture ? (
        <aside className="workbench-drawer" aria-label="Inputs" data-tour="controls">
          <FixtureInputsProvider store={store}>
            <ControlPanel />
          </FixtureInputsProvider>
          <section className="workbench-drawer-section" aria-label="Figma">
            <h3>Figma</h3>
            <FigmaLinkField scope={{ kind: 'component', slug: fixture.slug }} />
          </section>
        </aside>
      ) : null}

      {compact && fixture ? (
        <Drawer.Root open={sheetOpen && !fullscreen} onOpenChange={setSheetOpen} swipeDirection="down">
          <Drawer.Portal>
            <Drawer.Backdrop className="ui-backdrop" />
            <Drawer.Viewport className="ui-sheet-viewport">
              <Drawer.Popup className="ui-sheet" aria-label="Inputs">
                <div className="ui-sheet-handle" aria-hidden="true" />
                <Drawer.Close className="ui-icon-btn ui-icon-btn-sm ui-sheet-close" aria-label="Close inputs">
                  <XIcon />
                </Drawer.Close>
                <Drawer.Content className="ui-sheet-content">
                <FixtureInputsProvider store={store}>
                  <ControlPanel />
                </FixtureInputsProvider>
                <section className="workbench-drawer-section" aria-label="Figma">
                  <h3>Figma</h3>
                  <FigmaLinkField scope={{ kind: 'component', slug: fixture.slug }} />
                </section>
                </Drawer.Content>
              </Drawer.Popup>
            </Drawer.Viewport>
          </Drawer.Portal>
        </Drawer.Root>
      ) : null}
    </div>
  );
}
