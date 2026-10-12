import { useState } from 'react';
import { Button } from '@base-ui/react/button';
import { Input } from '@base-ui/react/input';
import { NumberField } from '@base-ui/react/number-field';
import { Select } from '@base-ui/react/select';
import { Switch } from '@base-ui/react/switch';
import { CheckIcon, ChevronUpDownIcon, MinusIcon, PlusIcon } from '../icons';
import { useInputStore, type InputDefinition, type InputValue } from './inputs';
import { useSyncExternalStore } from 'react';

function JsonControl({ id, value, onChange }: { id: string; value: InputValue; onChange: (next: InputValue) => void }) {
  const [draft, setDraft] = useState(() => JSON.stringify(value, null, 2));
  const [invalid, setInvalid] = useState(false);
  return (
    <textarea
      id={id}
      className="ui-input workbench-json"
      value={draft}
      spellCheck={false}
      data-invalid={invalid || undefined}
      onChange={(event) => {
        setDraft(event.target.value);
        try {
          onChange(JSON.parse(event.target.value) as InputValue);
          setInvalid(false);
        } catch {
          setInvalid(true);
        }
      }}
    />
  );
}

function Control({ definition, value, onChange }: { definition: InputDefinition; value: InputValue; onChange: (next: InputValue) => void }) {
  const id = `input-${definition.name}`;
  switch (definition.kind) {
    case 'boolean':
      return (
        <Switch.Root id={id} className="ui-switch" checked={Boolean(value)} onCheckedChange={(checked) => onChange(checked)}>
          <Switch.Thumb className="ui-switch-thumb" />
        </Switch.Root>
      );
    case 'number':
      return (
        <NumberField.Root id={id} value={Number(value)} onValueChange={(next) => onChange(next ?? 0)} className="ui-number">
          <NumberField.Group className="ui-number-group">
            <NumberField.Decrement className="ui-stepper">
              <MinusIcon />
            </NumberField.Decrement>
            <NumberField.Input className="ui-input ui-number-input" />
            <NumberField.Increment className="ui-stepper">
              <PlusIcon />
            </NumberField.Increment>
          </NumberField.Group>
        </NumberField.Root>
      );
    case 'select':
      return (
        <Select.Root
          items={(definition.options ?? []).map((option) => ({ label: option, value: option }))}
          value={String(value)}
          onValueChange={(next) => next && onChange(next)}
        >
          <Select.Trigger id={id} className="ui-select">
            <Select.Value />
            <Select.Icon className="ui-select-icon">
              <ChevronUpDownIcon />
            </Select.Icon>
          </Select.Trigger>
          <Select.Portal>
            <Select.Positioner className="ui-positioner" sideOffset={4}>
              <Select.Popup className="ui-popup">
                <Select.List>
                  {(definition.options ?? []).map((option) => (
                    <Select.Item key={option} value={option} className="ui-item">
                      <Select.ItemIndicator className="ui-item-indicator">
                        <CheckIcon />
                      </Select.ItemIndicator>
                      <Select.ItemText>{option}</Select.ItemText>
                    </Select.Item>
                  ))}
                </Select.List>
              </Select.Popup>
            </Select.Positioner>
          </Select.Portal>
        </Select.Root>
      );
    case 'json':
      return <JsonControl id={id} value={value} onChange={onChange} />;
    default:
      return <Input id={id} className="ui-input" value={String(value ?? '')} onValueChange={(next) => onChange(next)} />;
  }
}

/** The right-hand panel listing every input the current fixture declared. */
export function ControlPanel() {
  const store = useInputStore();
  const snapshot = useSyncExternalStore(
    store ? store.subscribe : () => () => {},
    () => (store ? store.getSnapshot() : { definitions: [], values: {} }),
    () => ({ definitions: [], values: {} }),
  );
  if (!store) return null;
  const dirty = Object.keys(store.overrides()).length > 0;

  return (
    <section className="workbench-drawer-section" aria-label="Fixture inputs">
      <div className="workbench-panel-head">
        <h3>Inputs</h3>
        <Button className="ui-btn ui-btn-ghost" disabled={!dirty} onClick={() => store.reset()}>
          Reset
        </Button>
      </div>
      {snapshot.definitions.length === 0 ? (
        <p className="ui-description">This fixture declares no inputs. Add `useFixtureInput` or `useFixtureSelect` to expose state.</p>
      ) : (
        <div className="workbench-inputs">
          {snapshot.definitions.map((definition) => (
            <div key={definition.name} className="workbench-input" data-kind={definition.kind}>
              <label className="ui-label" htmlFor={`input-${definition.name}`}>
                {definition.name}
              </label>
              <Control
                definition={definition}
                value={snapshot.values[definition.name]}
                onChange={(next) => store.set(definition.name, next)}
              />
            </div>
          ))}
        </div>
      )}
    </section>
  );
}
