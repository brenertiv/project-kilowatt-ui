import { Checkbox } from '@base-ui/react/checkbox';
import { Switch } from '@base-ui/react/switch';
import { Tabs } from '@base-ui/react/tabs';
import type { Meta, StoryObj } from '@storybook/react-vite';
import { fn } from 'storybook/test';
import { CheckIcon } from 'src/icons';

/** Recipes for on/off and pick-one controls over Base UI. There are no wrapper components: copy the markup and classes. */
const meta = {
  title: 'Primitives/Controls',
  tags: ['!autodocs'],
} satisfies Meta;

export default meta;

type SwitchArgs = { label: string; disabled: boolean; onCheckedChange: (checked: boolean) => void };
type CheckboxArgs = { label: string; disabled: boolean; onCheckedChange: (checked: boolean) => void };
type TabsArgs = { tabCount: number };

/** A setting that takes effect at once (no Save button): `ui-switch` with its thumb, inside a `ui-inline-label`. */
export const SwitchControl: StoryObj<SwitchArgs> = {
  name: 'Switch',
  args: { label: 'Real-time alerts', disabled: false, onCheckedChange: fn() },
  argTypes: { onCheckedChange: { control: false } },
  render: ({ label, disabled, onCheckedChange }) => (
    <label className="ui-inline-label">
      <Switch.Root className="ui-switch" defaultChecked disabled={disabled} onCheckedChange={onCheckedChange}>
        <Switch.Thumb className="ui-switch-thumb" />
      </Switch.Root>
      {label}
    </label>
  ),
};

/** An option that is applied with the rest of a form: `ui-checkbox` with a check icon in its indicator. */
export const CheckboxControl: StoryObj<CheckboxArgs> = {
  name: 'Checkbox',
  args: { label: 'Include submetered loads', disabled: false, onCheckedChange: fn() },
  argTypes: { onCheckedChange: { control: false } },
  render: ({ label, disabled, onCheckedChange }) => (
    <label className="ui-inline-label">
      <Checkbox.Root className="ui-checkbox" defaultChecked disabled={disabled} onCheckedChange={onCheckedChange}>
        <Checkbox.Indicator className="ui-checkbox-indicator">
          <CheckIcon />
        </Checkbox.Indicator>
      </Checkbox.Root>
      {label}
    </label>
  ),
};

/** A parent checkbox when only some of its children are checked: set `indeterminate` on `Checkbox.Root`. */
export const CheckboxIndeterminate: StoryObj<CheckboxArgs> = {
  name: 'Checkbox, indeterminate',
  args: { label: 'All meters', disabled: false, onCheckedChange: fn() },
  argTypes: { onCheckedChange: { control: false } },
  render: ({ label, disabled, onCheckedChange }) => (
    <label className="ui-inline-label">
      <Checkbox.Root className="ui-checkbox" indeterminate disabled={disabled} onCheckedChange={onCheckedChange}>
        <Checkbox.Indicator className="ui-checkbox-indicator">
          <CheckIcon />
        </Checkbox.Indicator>
      </Checkbox.Root>
      {label}
    </label>
  ),
};

function tabLabels(count: number) {
  return Array.from({ length: Math.min(6, Math.max(1, count)) }, (_, index) => `Tab ${index + 1}`);
}

/** Switching between views of the same subject: `ui-tabs`, `ui-tabs-list`, `ui-tab` and the sliding `ui-tab-indicator`. */
export const TabsControl: StoryObj<TabsArgs> = {
  name: 'Tabs',
  args: { tabCount: 3 },
  argTypes: { tabCount: { control: { type: 'range', min: 1, max: 6 } } },
  render: ({ tabCount }) => {
    const tabs = tabLabels(tabCount);
    return (
      <Tabs.Root className="ui-tabs" defaultValue={tabs[0]}>
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
  },
};

/** The same tabs at phone width (375px), to review how a full tab list fits a narrow screen. */
export const TabsOnPhone: StoryObj<TabsArgs> = {
  ...TabsControl,
  name: 'Tabs on a phone',
  args: { tabCount: 6 },
  globals: { viewport: { value: 'phone', isRotated: false } },
};
