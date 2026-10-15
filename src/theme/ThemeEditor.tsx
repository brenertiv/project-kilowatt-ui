import { useState } from 'react';
import { Button } from '@base-ui/react/button';
import { Dialog } from '@base-ui/react/dialog';
import { Input } from '@base-ui/react/input';
import { Select } from '@base-ui/react/select';
import { Toggle } from '@base-ui/react/toggle';
import { ToggleGroup } from '@base-ui/react/toggle-group';
import {
  derivedTokens,
  derivedValue,
  fontLabels,
  tokenLayer,
  tokens,
  type DerivedToken,
  type SystemGroup,
  type ThemeValues,
  type Token,
  type TokenLayer,
} from '../tokens';
import { useTheme } from './ThemeProvider';
import { CheckIcon, ChevronUpDownIcon, CopyIcon, ResetIcon, TuneIcon, XIcon } from '../icons';

type LayerFilter = TokenLayer | 'derived' | 'all';

type PanelGroup = {
  id: string;
  label: string;
  groups: SystemGroup[];
};

const panelGroups: PanelGroup[] = [
  { id: 'Color', label: 'Color', groups: ['Color'] },
  { id: 'Typography', label: 'Typography', groups: ['Typography'] },
  { id: 'Shape', label: 'Shape & space', groups: ['Shape', 'Space'] },
  { id: 'Layout', label: 'Layout', groups: ['Layout'] },
];

const layerFilters: { value: LayerFilter; label: string }[] = [
  { value: 'all', label: 'All' },
  { value: 'core', label: 'Core' },
  { value: 'semantic', label: 'Semantic' },
  { value: 'derived', label: 'Derived' },
];

const layerCopy: Record<TokenLayer, string> = {
  core: 'Identity knobs. Everything else builds on these.',
  semantic: 'Role tokens. Figma-owned roles read from the snapshot; code-owned roles are ramp steps. Edit to override a role locally without touching the core token.',
};

function toPxValue(raw: string, fallback: string) {
  const numeric = Number.parseFloat(raw);
  if (!Number.isFinite(numeric)) return fallback;
  return `${numeric}px`;
}

function matches(needle: string, ...haystack: string[]) {
  if (!needle) return true;
  return haystack.some((text) => text.toLowerCase().includes(needle));
}

function TokenLabel({ label, cssVar }: { label: string; cssVar: string }) {
  return (
    <span className="token-label">
      <span className="token-name">{label}</span>
      <code className="token-var">{cssVar}</code>
    </span>
  );
}

function ColorControl({ token, value, onChange }: { token: Token; value: string; onChange: (next: string) => void }) {
  return (
    <label className="token-row">
      <TokenLabel label={token.label} cssVar={token.cssVar} />
      <span className="color-control">
        <input
          className="color-swatch"
          type="color"
          value={value.slice(0, 7)}
          onChange={(event) => onChange(event.target.value)}
          aria-label={token.label}
        />
        <Input className="ui-input ui-input-compact" value={value} onValueChange={onChange} />
      </span>
    </label>
  );
}

function LengthControl({ token, value, onChange }: { token: Token; value: string; onChange: (next: string) => void }) {
  const [draft, setDraft] = useState(value);
  const [focused, setFocused] = useState(false);

  function commit(raw: string) {
    const next = toPxValue(raw, value);
    setDraft(next);
    if (next !== value) onChange(next);
  }

  return (
    <label className="token-row">
      <TokenLabel label={token.label} cssVar={token.cssVar} />
      <Input
        className="ui-input ui-input-compact"
        value={focused ? draft : value}
        inputMode="decimal"
        spellCheck={false}
        onFocus={() => {
          setFocused(true);
          setDraft(value);
        }}
        onBlur={() => {
          commit(draft);
          setFocused(false);
        }}
        onValueChange={(next) => {
          setDraft(next);
          const parsed = toPxValue(next, '');
          if (parsed) onChange(parsed);
        }}
      />
    </label>
  );
}

function FontControl({ token, value, onChange }: { token: Token; value: string; onChange: (next: string) => void }) {
  const options = token.options ?? [];
  return (
    <div className="token-row">
      <TokenLabel label={token.label} cssVar={token.cssVar} />
      <Select.Root
        items={options.map((option) => ({ label: fontLabels[option] ?? option, value: option }))}
        value={value}
        onValueChange={(next) => next && onChange(next)}
      >
        <Select.Trigger className="ui-select" aria-label={token.label}>
          <Select.Value />
          <Select.Icon className="ui-select-icon">
            <ChevronUpDownIcon />
          </Select.Icon>
        </Select.Trigger>
        <Select.Portal>
          <Select.Positioner className="ui-positioner" sideOffset={4}>
            <Select.Popup className="ui-popup">
              <Select.List>
                {options.map((option) => (
                  <Select.Item key={option} value={option} className="ui-item">
                    <Select.ItemIndicator className="ui-item-indicator">
                      <CheckIcon />
                    </Select.ItemIndicator>
                    <Select.ItemText>{fontLabels[option] ?? option}</Select.ItemText>
                  </Select.Item>
                ))}
              </Select.List>
            </Select.Popup>
          </Select.Positioner>
        </Select.Portal>
      </Select.Root>
    </div>
  );
}

function TokenControl({
  token,
  value,
  onChange,
}: {
  token: Token;
  value: string;
  onChange: (next: string) => void;
}) {
  if (token.type === 'color') return <ColorControl token={token} value={value} onChange={onChange} />;
  if (token.type === 'font') return <FontControl token={token} value={value} onChange={onChange} />;
  return <LengthControl token={token} value={value} onChange={onChange} />;
}

function DerivedRow({ token, value }: { token: DerivedToken; value: string }) {
  return (
    <div className="token-row derived-row">
      <TokenLabel label={token.label} cssVar={token.cssVar} />
      <span className="derived-value">
        <code className="system-code">{value}</code>
        {token.note ? <span className="derived-note">{token.note}</span> : null}
      </span>
    </div>
  );
}

function LayerBlock({
  layer,
  items,
  values,
  onChange,
}: {
  layer: TokenLayer;
  items: Token[];
  values: ThemeValues;
  onChange: (id: string, next: string) => void;
}) {
  if (items.length === 0) return null;
  return (
    <div className="editor-subgroup">
      <div className="editor-subgroup-head">
        <h4>{layer === 'core' ? 'Core' : 'Semantic'}</h4>
        <p className="ui-description">{layerCopy[layer]}</p>
      </div>
      <div className="editor-panel-grid">
        {items.map((token) => (
          <TokenControl
            key={token.id}
            token={token}
            value={values[token.id] ?? token.defaultValue}
            onChange={(next) => onChange(token.id, next)}
          />
        ))}
      </div>
    </div>
  );
}

export function ThemeEditor() {
  const { values, setToken, reset, exportCss, colorScheme, dirty } = useTheme();
  const [copied, setCopied] = useState(false);
  const [layer, setLayer] = useState<LayerFilter>('all');
  const [query, setQuery] = useState('');
  const editingDark = colorScheme === 'dark';
  const needle = query.trim().toLowerCase();

  async function copyCss() {
    await navigator.clipboard.writeText(exportCss());
    setCopied(true);
    window.setTimeout(() => setCopied(false), 1600);
  }

  const sections = panelGroups
    .map((panel) => {
      const inGroup = tokens.filter(
        (token) => panel.groups.includes(token.group) && matches(needle, token.label, token.cssVar, token.id),
      );
      const showLayer = (candidate: TokenLayer) => layer === 'all' || layer === candidate;
      const core = showLayer('core') ? inGroup.filter((token) => tokenLayer(token) === 'core') : [];
      const semantic = showLayer('semantic') ? inGroup.filter((token) => tokenLayer(token) === 'semantic') : [];
      const derived =
        layer === 'all' || layer === 'derived'
          ? derivedTokens.filter(
              (token) => panel.groups.includes(token.group) && matches(needle, token.label, token.cssVar),
            )
          : [];
      return { panel, core, semantic, derived };
    })
    .filter((section) => section.core.length + section.semantic.length + section.derived.length > 0);

  return (
    <Dialog.Root>
      <Dialog.Trigger
        className="ui-btn ui-btn-ghost"
        aria-label={dirty ? 'Theme, unsaved changes' : 'Theme'}
      >
        <TuneIcon />
        Theme
        {dirty ? <span className="topbar-dirty" aria-hidden="true" /> : null}
      </Dialog.Trigger>
      <Dialog.Portal>
        <Dialog.Backdrop className="ui-backdrop" />
        <Dialog.Viewport className="ui-dialog-viewport">
          <Dialog.Popup className="ui-dialog editor-panel">
            <div className="editor-panel-head">
              <div>
                <Dialog.Title className="ui-dialog-title">Theme</Dialog.Title>
                <Dialog.Description className="ui-description">
                  {editingDark
                    ? 'Color edits apply to the dark palette. Type, shape, and space are shared across both schemes.'
                    : 'Every core and semantic token, grouped by role. Derived variables show their resolved value. Primitives (the Figma ramps) live on the System page.'}
                </Dialog.Description>
              </div>
              <Dialog.Close className="ui-icon-btn" aria-label="Close theme">
                <XIcon />
              </Dialog.Close>
            </div>

            <div className="editor-panel-toolbar">
              <div className="editor-filters">
                <ToggleGroup
                  value={[layer]}
                  onValueChange={(next) => {
                    const chosen = next[0] as LayerFilter | undefined;
                    if (chosen) setLayer(chosen);
                  }}
                  className="ui-toggle-group"
                  aria-label="Token layer"
                >
                  {layerFilters.map((option) => (
                    <Toggle key={option.value} value={option.value} className="ui-toggle">
                      {option.label}
                    </Toggle>
                  ))}
                </ToggleGroup>
                <Input
                  className="ui-input editor-search"
                  type="search"
                  placeholder="Filter tokens"
                  aria-label="Filter tokens"
                  value={query}
                  onValueChange={setQuery}
                />
              </div>
              <div className="editor-actions">
                <Button className="ui-btn ui-btn-ghost" onClick={copyCss}>
                  <CopyIcon />
                  {copied ? 'Copied' : 'CSS'}
                </Button>
                <Button className="ui-btn ui-btn-ghost" onClick={reset} disabled={!dirty}>
                  <ResetIcon />
                  Reset
                </Button>
              </div>
            </div>

            <div className="editor-panel-body">
              {sections.length === 0 ? <p className="ui-description">No tokens match this filter.</p> : null}
              {sections.map(({ panel, core, semantic, derived }) => (
                <section key={panel.id} className="editor-group">
                  <h3>{panel.id === 'Color' && editingDark ? 'Color · Dark' : panel.label}</h3>
                  <LayerBlock layer="core" items={core} values={values} onChange={setToken} />
                  <LayerBlock layer="semantic" items={semantic} values={values} onChange={setToken} />
                  {derived.length > 0 ? (
                    <div className="editor-subgroup">
                      <div className="editor-subgroup-head">
                        <h4>Derived</h4>
                        <p className="ui-description">
                          Computed from the tokens above. Change the source token to move these.
                        </p>
                      </div>
                      <div className="editor-panel-grid">
                        {derived.map((token) => (
                          <DerivedRow
                            key={token.cssVar}
                            token={token}
                            value={derivedValue(token, values, colorScheme)}
                          />
                        ))}
                      </div>
                    </div>
                  ) : null}
                </section>
              ))}
            </div>
          </Dialog.Popup>
        </Dialog.Viewport>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
