import { Viewport, useFixtureInput, useFixtureSelect } from 'react-cosmos/client';
import { Checkbox } from '@base-ui/react/checkbox';
import { Switch } from '@base-ui/react/switch';
import { Tabs } from '@base-ui/react/tabs';
import { CheckIcon } from '../icons';

function SwitchFixture() {
  const [checked, setChecked] = useFixtureInput('checked', true);
  const [disabled] = useFixtureInput('disabled', false);
  const [label] = useFixtureInput('label', 'Real-time alerts');
  return (
    <label className="ui-inline-label">
      <Switch.Root className="ui-switch" checked={checked} disabled={disabled} onCheckedChange={setChecked}>
        <Switch.Thumb className="ui-switch-thumb" />
      </Switch.Root>
      {label}
    </label>
  );
}

function CheckboxFixture() {
  const [state, setState] = useFixtureSelect('state', { options: [...(['unchecked', 'checked', 'indeterminate'] as const)], defaultValue: 'checked' });
  const [disabled] = useFixtureInput('disabled', false);
  return (
    <label className="ui-inline-label">
      <Checkbox.Root
        className="ui-checkbox"
        checked={state === 'checked'}
        indeterminate={state === 'indeterminate'}
        disabled={disabled}
        onCheckedChange={(next) => setState(next ? 'checked' : 'unchecked')}
      >
        <Checkbox.Indicator className="ui-checkbox-indicator">
          <CheckIcon />
        </Checkbox.Indicator>
      </Checkbox.Root>
      Include submetered loads
    </label>
  );
}

function TabsFixture() {
  const [count] = useFixtureInput('tab count', 3);
  const [selected, setSelected] = useFixtureInput('selected', 'Tab 1');
  const tabs = Array.from({ length: Math.min(6, Math.max(1, count)) }, (_, index) => `Tab ${index + 1}`);
  return (
    <Tabs.Root value={tabs.includes(selected) ? selected : tabs[0]} onValueChange={(value) => setSelected(String(value))} className="ui-tabs">
      <Tabs.List className="ui-tabs-list">
        {tabs.map((tab) => (
          <Tabs.Tab key={tab} className="ui-tab" value={tab}>
            {tab}
          </Tabs.Tab>
        ))}
        <Tabs.Indicator className="ui-tab-indicator" />
      </Tabs.List>
      {tabs.map((tab) => (
        <Tabs.Panel key={tab} className="ui-tab-panel" value={tab}>
          {tab} content.
        </Tabs.Panel>
      ))}
    </Tabs.Root>
  );
}

export default {
  Switch: SwitchFixture,
  Checkbox: CheckboxFixture,
  Tabs: TabsFixture,
  'Tabs on a phone': (
    <Viewport width={375} height={667}>
      <TabsFixture />
    </Viewport>
  ),
};
