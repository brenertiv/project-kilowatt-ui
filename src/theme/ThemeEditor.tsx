import { useState, type FormEvent } from 'react';
import { AlertDialog } from '@base-ui/react/alert-dialog';
import { Button } from '@base-ui/react/button';
import { Dialog } from '@base-ui/react/dialog';
import { Field } from '@base-ui/react/field';
import { Input } from '@base-ui/react/input';
import { Select } from '@base-ui/react/select';
import { fontLabels, primitiveTokens, type Token } from '../tokens';
import { useTheme } from './ThemeProvider';
import {
  CheckIcon,
  ChevronUpDownIcon,
  CopyIcon,
  DeleteIcon,
  PlusIcon,
  ResetIcon,
  SaveIcon,
  TuneIcon,
  XIcon,
} from '../icons';

const panelGroups: { id: string; label: string; tokens: Token[] }[] = [
  { id: 'Color', label: 'Color', tokens: primitiveTokens.filter((token) => token.group === 'Color') },
  { id: 'Typography', label: 'Typography', tokens: primitiveTokens.filter((token) => token.group === 'Typography') },
  {
    id: 'Shape',
    label: 'Shape & space',
    tokens: primitiveTokens.filter((token) => token.group === 'Shape' || token.group === 'Space'),
  },
];

function toPxValue(raw: string, fallback: string) {
  const numeric = Number.parseFloat(raw);
  if (!Number.isFinite(numeric)) return fallback;
  return `${numeric}px`;
}

function ColorControl({ token, value, onChange }: { token: Token; value: string; onChange: (next: string) => void }) {
  return (
    <label className="token-row">
      <span className="token-label">{token.label}</span>
      <span className="color-control">
        <input
          className="color-swatch"
          type="color"
          value={value}
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
      <span className="token-label">{token.label}</span>
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
      <span className="token-label">{token.label}</span>
      <Select.Root
        items={options.map((option) => ({ label: fontLabels[option] ?? option, value: option }))}
        value={value}
        onValueChange={(next) => next && onChange(next)}
      >
        <Select.Trigger className="ui-select">
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

function PresetSelect() {
  const { presets, activePresetId, applyPreset } = useTheme();
  const items = presets.map((preset) => ({ label: preset.name, value: preset.id }));

  return (
    <Select.Root items={items} value={activePresetId} onValueChange={(next) => next && applyPreset(next)}>
      <Select.Trigger className="ui-select" aria-label="Theme preset">
        <Select.Value />
        <Select.Icon className="ui-select-icon">
          <ChevronUpDownIcon />
        </Select.Icon>
      </Select.Trigger>
      <Select.Portal>
        <Select.Positioner className="ui-positioner" sideOffset={4}>
          <Select.Popup className="ui-popup">
            <Select.List>
              {presets.map((preset) => (
                <Select.Item key={preset.id} value={preset.id} className="ui-item">
                  <Select.ItemIndicator className="ui-item-indicator">
                    <CheckIcon />
                  </Select.ItemIndicator>
                  <Select.ItemText>{preset.name}</Select.ItemText>
                </Select.Item>
              ))}
            </Select.List>
          </Select.Popup>
        </Select.Positioner>
      </Select.Portal>
    </Select.Root>
  );
}

function SavePresetDialog({ open, onOpenChange }: { open: boolean; onOpenChange: (open: boolean) => void }) {
  const { savePresetAs } = useTheme();
  const [name, setName] = useState('');
  const trimmed = name.trim();

  function handleOpenChange(next: boolean) {
    if (next) setName('');
    onOpenChange(next);
  }

  function handleSubmit(event: FormEvent) {
    event.preventDefault();
    if (!trimmed) return;
    savePresetAs(trimmed);
    onOpenChange(false);
  }

  return (
    <Dialog.Root open={open} onOpenChange={handleOpenChange}>
      <Dialog.Portal>
        <Dialog.Backdrop className="ui-backdrop" />
        <Dialog.Viewport className="ui-dialog-viewport">
          <Dialog.Popup className="ui-dialog">
            <form className="ui-dialog-form" onSubmit={handleSubmit}>
              <Dialog.Title className="ui-dialog-title">Save theme</Dialog.Title>
              <Dialog.Description className="ui-description">
                Name this preset to switch back to it later.
              </Dialog.Description>
              <Field.Root className="ui-field" name="preset-name">
                <Field.Label className="ui-label">Name</Field.Label>
                <Input className="ui-input" value={name} onValueChange={setName} placeholder="Night ops" autoFocus />
              </Field.Root>
              <div className="demo-row demo-end">
                <Dialog.Close className="ui-btn">Cancel</Dialog.Close>
                <Button className="ui-btn ui-btn-solid" type="submit" disabled={!trimmed}>
                  Save
                </Button>
              </div>
            </form>
          </Dialog.Popup>
        </Dialog.Viewport>
      </Dialog.Portal>
    </Dialog.Root>
  );
}

function DeletePresetDialog({
  open,
  name,
  onOpenChange,
  onConfirm,
}: {
  open: boolean;
  name: string;
  onOpenChange: (open: boolean) => void;
  onConfirm: () => void;
}) {
  return (
    <AlertDialog.Root open={open} onOpenChange={onOpenChange}>
      <AlertDialog.Portal>
        <AlertDialog.Backdrop className="ui-backdrop" />
        <AlertDialog.Viewport className="ui-dialog-viewport">
          <AlertDialog.Popup className="ui-dialog">
            <AlertDialog.Title className="ui-dialog-title">Delete {name}?</AlertDialog.Title>
            <AlertDialog.Description className="ui-description">
              This removes the saved preset. The Kilowatt theme stays available.
            </AlertDialog.Description>
            <div className="demo-row demo-end">
              <AlertDialog.Close className="ui-btn">Keep</AlertDialog.Close>
              <AlertDialog.Close className="ui-btn ui-btn-solid" onClick={onConfirm}>
                Delete
              </AlertDialog.Close>
            </div>
          </AlertDialog.Popup>
        </AlertDialog.Viewport>
      </AlertDialog.Portal>
    </AlertDialog.Root>
  );
}

export function ThemeEditor() {
  const { values, setToken, reset, exportCss, colorScheme, presets, activePresetId, dirty, savePreset, deletePreset } =
    useTheme();
  const [copied, setCopied] = useState(false);
  const [saveOpen, setSaveOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const editingDark = colorScheme === 'dark';
  const activePreset = presets.find((preset) => preset.id === activePresetId);
  const canSave = Boolean(dirty && activePreset && !activePreset.builtIn);
  const canDelete = Boolean(activePreset && !activePreset.builtIn);

  async function copyCss() {
    await navigator.clipboard.writeText(exportCss());
    setCopied(true);
    window.setTimeout(() => setCopied(false), 1600);
  }

  return (
    <Dialog.Root>
      <Dialog.Trigger
        className="ui-btn ui-btn-ghost"
        data-tour="theme-editor"
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
                    ? 'Primary colors edit the dark palette. Type, shape, and space stay shared.'
                    : 'Edit primary variables. Semantic tokens stay on the Design System page.'}
                </Dialog.Description>
              </div>
              <Dialog.Close className="ui-icon-btn" aria-label="Close theme">
                <XIcon />
              </Dialog.Close>
            </div>

            <div className="editor-panel-toolbar">
              <div className="preset-block">
                <span className="token-label">Preset</span>
                <PresetSelect />
                {dirty ? <p className="preset-status">Unsaved changes</p> : null}
              </div>
              <div className="editor-actions">
                <Button className="ui-btn ui-btn-ghost" onClick={() => setSaveOpen(true)}>
                  <PlusIcon />
                  Save as
                </Button>
                <Button
                  className="ui-btn ui-btn-ghost"
                  onClick={savePreset}
                  disabled={!canSave}
                  aria-label="Save preset"
                >
                  <SaveIcon />
                  Save
                </Button>
                <Button
                  className="ui-btn ui-btn-ghost"
                  onClick={() => setDeleteOpen(true)}
                  disabled={!canDelete}
                  aria-label="Delete preset"
                >
                  <DeleteIcon />
                </Button>
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
              {panelGroups.map((group) => (
                <section key={group.id} className="editor-group">
                  <h3>{group.id === 'Color' && editingDark ? 'Color · Dark' : group.label}</h3>
                  <div className="editor-panel-grid">
                    {group.tokens.map((token) => {
                      const value = values[token.id] ?? token.defaultValue;
                      if (token.type === 'color') {
                        return (
                          <ColorControl
                            key={token.id}
                            token={token}
                            value={value}
                            onChange={(next) => setToken(token.id, next)}
                          />
                        );
                      }
                      if (token.type === 'font') {
                        return (
                          <FontControl
                            key={token.id}
                            token={token}
                            value={value}
                            onChange={(next) => setToken(token.id, next)}
                          />
                        );
                      }
                      return (
                        <LengthControl
                          key={token.id}
                          token={token}
                          value={value}
                          onChange={(next) => setToken(token.id, next)}
                        />
                      );
                    })}
                  </div>
                </section>
              ))}
            </div>
          </Dialog.Popup>
        </Dialog.Viewport>
      </Dialog.Portal>

      <SavePresetDialog open={saveOpen} onOpenChange={setSaveOpen} />
      <DeletePresetDialog
        open={deleteOpen}
        name={activePreset?.name ?? 'preset'}
        onOpenChange={setDeleteOpen}
        onConfirm={() => activePreset && deletePreset(activePreset.id)}
      />
    </Dialog.Root>
  );
}
