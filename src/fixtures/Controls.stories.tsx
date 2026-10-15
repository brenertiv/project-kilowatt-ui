import Box from '@mui/material/Box';
import Checkbox from '@mui/material/Checkbox';
import FormControlLabel from '@mui/material/FormControlLabel';
import Switch from '@mui/material/Switch';
import Tab from '@mui/material/Tab';
import Tabs from '@mui/material/Tabs';
import type { Meta, StoryObj } from '@storybook/react-vite';
import { type ChangeEvent, useId, useState } from 'react';
import { fn } from 'storybook/test';

/** On/off and pick-a-view controls: MUI's Switch, Checkbox and Tabs as themed. There are no wrapper components. */
const meta = {
  title: 'Primitives/Controls',
  tags: ['!autodocs'],
} satisfies Meta;

export default meta;

type ToggleArgs = { label: string; disabled: boolean; onChange: (event: ChangeEvent<HTMLInputElement>, checked: boolean) => void };
type TabsArgs = { tabCount: number; scrollable: boolean };

/** A setting that takes effect at once (no Save button): `Switch` as the `control` of a `FormControlLabel`. */
export const SwitchControl: StoryObj<ToggleArgs> = {
  name: 'Switch',
  args: { label: 'Real-time alerts', disabled: false, onChange: fn() },
  argTypes: { onChange: { control: false } },
  render: ({ label, disabled, onChange }) => (
    <FormControlLabel control={<Switch defaultChecked onChange={onChange} />} label={label} disabled={disabled} />
  ),
};

/** An option that is applied with the rest of a form: `Checkbox` as the `control` of a `FormControlLabel`. */
export const CheckboxControl: StoryObj<ToggleArgs> = {
  name: 'Checkbox',
  args: { label: 'Include submetered loads', disabled: false, onChange: fn() },
  argTypes: { onChange: { control: false } },
  render: ({ label, disabled, onChange }) => (
    <FormControlLabel control={<Checkbox defaultChecked onChange={onChange} />} label={label} disabled={disabled} />
  ),
};

const childMeters = ['Main electric', 'Chiller plant', 'Steam service'];

function ParentCheckbox({ label, disabled, onChange }: ToggleArgs) {
  const [checked, setChecked] = useState([true, false, false]);
  const all = checked.every(Boolean);
  const some = checked.some(Boolean);
  return (
    <Box>
      <FormControlLabel
        label={label}
        disabled={disabled}
        control={
          <Checkbox
            checked={all}
            indeterminate={some && !all}
            onChange={(event, value) => {
              setChecked(checked.map(() => value));
              onChange(event, value);
            }}
          />
        }
      />
      <Box sx={{ display: 'flex', flexDirection: 'column', ml: 3 }}>
        {childMeters.map((meter, index) => (
          <FormControlLabel
            key={meter}
            label={meter}
            disabled={disabled}
            control={
              <Checkbox
                checked={checked[index]}
                onChange={(_event, value) => setChecked(checked.map((current, at) => (at === index ? value : current)))}
              />
            }
          />
        ))}
      </Box>
    </Box>
  );
}

/** A parent checkbox when only some of its children are checked: set `indeterminate` on the parent `Checkbox`. */
export const CheckboxIndeterminate: StoryObj<ToggleArgs> = {
  name: 'Checkbox, indeterminate',
  args: { label: 'All meters', disabled: false, onChange: fn() },
  argTypes: { onChange: { control: false } },
  render: (args) => <ParentCheckbox {...args} />,
};

const tabNames = ['Usage', 'Demand', 'Cost', 'Carbon', 'Weather', 'Alerts'];

function TabsDemo({ tabCount, scrollable }: TabsArgs) {
  const id = useId();
  const tabs = tabNames.slice(0, Math.min(tabNames.length, Math.max(1, tabCount)));
  const [value, setValue] = useState(0);
  const selected = Math.min(value, tabs.length - 1);
  return (
    <Box>
      <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
        <Tabs
          value={selected}
          onChange={(_event, next: number) => setValue(next)}
          aria-label="Building views"
          variant={scrollable ? 'scrollable' : 'standard'}
          scrollButtons={scrollable ? 'auto' : false}
          allowScrollButtonsMobile={scrollable}
        >
          {tabs.map((tab, index) => (
            <Tab key={tab} label={tab} id={`${id}-tab-${index}`} aria-controls={`${id}-panel-${index}`} />
          ))}
        </Tabs>
      </Box>
      {tabs.map((tab, index) => (
        <Box
          key={tab}
          role="tabpanel"
          hidden={index !== selected}
          id={`${id}-panel-${index}`}
          aria-labelledby={`${id}-tab-${index}`}
          sx={{ py: 2 }}
        >
          {index === selected ? `${tab} content.` : null}
        </Box>
      ))}
    </Box>
  );
}

/** Switching between views of the same subject: `Tabs` of `Tab`, each linked to its `tabpanel` by `id` and `aria-controls`. */
export const TabsControl: StoryObj<TabsArgs> = {
  name: 'Tabs',
  args: { tabCount: 3, scrollable: false },
  argTypes: { tabCount: { control: { type: 'range', min: 1, max: tabNames.length } } },
  render: (args) => <TabsDemo {...args} />,
};

/** A full tab list at phone width (375px): `variant="scrollable"` with scroll buttons so no tab is cut off. */
export const TabsOnPhone: StoryObj<TabsArgs> = {
  ...TabsControl,
  name: 'Tabs on a phone',
  args: { tabCount: 6, scrollable: true },
  globals: { viewport: { value: 'phone', isRotated: false } },
};
