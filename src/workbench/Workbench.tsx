import { Component, isValidElement, useCallback, useEffect, useMemo, useState, type ReactNode } from 'react';
import { Button } from '@base-ui/react/button';
import { Toggle } from '@base-ui/react/toggle';
import { ToggleGroup } from '@base-ui/react/toggle-group';
import { Select } from '@base-ui/react/select';
import { Link, NavLink, useNavigate, useParams, useSearchParams } from 'react-router';
import { CheckIcon, ChevronLeftIcon, ChevronUpDownIcon } from '../icons';
import { ControlPanel } from './ControlPanel';
import { decodeInputs, encodeInputs, FixtureInputsProvider, InputStore } from './inputs';
import { decoratorsForFixture, findFixture, fixtureGroups, slugify, type FixtureEntry } from './registry';
import { sameSize, ViewportContext, viewportPresets, type ViewportSize } from './Viewport';

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

function ComponentSwitcher({ slug }: { slug: string }) {
  const navigate = useNavigate();
  return (
    <Select.Root
      items={fixtureGroups.map((group) => ({ label: group.component, value: group.slug }))}
      value={slug}
      onValueChange={(next) => {
        const group = fixtureGroups.find((candidate) => candidate.slug === next);
        if (group) navigate(`/workbench/${group.slug}/${slugify(group.fixtures[0].name)}`);
      }}
    >
      <Select.Trigger className="ui-select" aria-label="Component">
        <Select.Value />
        <Select.Icon className="ui-select-icon">
          <ChevronUpDownIcon />
        </Select.Icon>
      </Select.Trigger>
      <Select.Portal>
        <Select.Positioner className="ui-positioner" sideOffset={4}>
          <Select.Popup className="ui-popup">
            <Select.List>
              {fixtureGroups.map((group) => (
                <Select.Item key={group.slug} value={group.slug} className="ui-item">
                  <Select.ItemIndicator className="ui-item-indicator">
                    <CheckIcon />
                  </Select.ItemIndicator>
                  <Select.ItemText>{group.component}</Select.ItemText>
                </Select.Item>
              ))}
            </Select.List>
          </Select.Popup>
        </Select.Positioner>
      </Select.Portal>
    </Select.Root>
  );
}

/** The named fixtures of the current component: its states. */
function StatesList({ fixture }: { fixture: FixtureEntry }) {
  const group = fixtureGroups.find((candidate) => candidate.slug === fixture.slug);
  if (!group || group.fixtures.length < 2) return null;
  return (
    <nav className="workbench-states" aria-label="States">
      {group.fixtures.map((entry) => (
        <NavLink key={entry.id} to={`/workbench/${group.slug}/${slugify(entry.name)}`} className="workbench-state-link">
          {entry.name === 'default' ? group.component : entry.name}
        </NavLink>
      ))}
    </nav>
  );
}

/**
 * Component workbench after React Cosmos: a fixture tree, a stage that renders
 * one fixture in isolation at a chosen viewport, and a control panel for the
 * inputs the fixture declares. The URL carries the fixture and its input values.
 */
export function Workbench() {
  const { slug, name } = useParams();
  const [params, setParams] = useSearchParams();
  const navigate = useNavigate();
  const fixture = findFixture(slug, name);
  const [panelOpen, setPanelOpen] = useState(true);
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
        case 'p':
          setPanelOpen((open) => !open);
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
    if (!slug && fixtureGroups[0]) {
      navigate(`/workbench/${fixtureGroups[0].slug}/${slugify(fixtureGroups[0].fixtures[0].name)}`, { replace: true });
    }
  }, [slug, navigate]);

  const requestViewport = useCallback((size: ViewportSize) => {
    setViewport((current) => (sameSize(current, size) ? current : size));
  }, []);
  const viewportContext = useMemo(() => ({ size: viewport, request: requestViewport }), [viewport, requestViewport]);
  const presetLabel = viewportPresets.find((preset) => JSON.stringify(preset.size) === JSON.stringify(viewport))?.label ?? 'Custom';

  return (
    <div className="workbench" data-fullscreen={fullscreen || undefined} data-panel={panelOpen || undefined}>

      <section className="workbench-main">
        {!fullscreen ? (
          <div className="workbench-toolbar">
            <div className="workbench-crumbs">
              <Link to="/components" className="ui-btn ui-btn-ghost workbench-back">
                <ChevronLeftIcon />
                Back to components
              </Link>
              <span className="workbench-crumb is-current">
                {fixture ? `${fixture.component}${fixture.name === 'default' ? '' : ` · ${fixture.name}`}` : 'No fixture'}
              </span>
            </div>
            <div className="workbench-tools">
              <ToggleGroup
                value={[presetLabel]}
                onValueChange={(next) => {
                  const preset = viewportPresets.find((candidate) => candidate.label === next[0]);
                  if (preset) setViewport(preset.size);
                }}
                className="ui-toggle-group"
                aria-label="Viewport"
              >
                {viewportPresets.map((preset) => (
                  <Toggle key={preset.label} value={preset.label} className="ui-toggle">
                    {preset.label}
                  </Toggle>
                ))}
              </ToggleGroup>
              <Button className="ui-btn ui-btn-ghost" onClick={() => setPanelOpen((open) => !open)} aria-pressed={panelOpen}>
                Controls
              </Button>
              <Button className="ui-btn ui-btn-ghost" onClick={() => setGeneration((n) => n + 1)}>
                Reload
              </Button>
              <Button className="ui-btn ui-btn-ghost" onClick={() => setFullscreen(true)}>
                Full screen
              </Button>
            </div>
          </div>
        ) : (
          <Button className="ui-btn workbench-exit" onClick={() => setFullscreen(false)}>
            Exit full screen
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
                No fixture at this address. Go back to the component library, or add a <code>Name.fixture.tsx</code> file
                next to a component.
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

      {panelOpen && !fullscreen && fixture ? (
        <aside className="workbench-drawer" aria-label="Controls">
          <section className="workbench-drawer-section">
            <h3>Component</h3>
            <ComponentSwitcher slug={fixture.slug} />
            <StatesList fixture={fixture} />
          </section>
          <FixtureInputsProvider store={store}>
            <ControlPanel />
          </FixtureInputsProvider>
        </aside>
      ) : null}
    </div>
  );
}
