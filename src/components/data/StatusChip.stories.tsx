import type { Meta, StoryObj } from '@storybook/react-vite';
import { actionPriorities, actionStatuses } from 'src/fixtures/data';
import { CheckCircleIcon } from 'src/icons';
import {
  ActionPriorityChip,
  ActionStatusChip,
  AlertStateChip,
  LookupChip,
  StatusChip,
  actionStatusTone,
  type Tone,
} from 'src/components/data/StatusChip';

const tones: Tone[] = ['neutral', 'info', 'success', 'warning', 'error'];

const meta = {
  title: 'Data/StatusChip',
  component: StatusChip,
  tags: ['!autodocs'],
  subcomponents: { LookupChip, ActionStatusChip, ActionPriorityChip, AlertStateChip },
  decorators: [
    (Story) => (
      // A plain div, not Stack: story imports end up in the snippet agents copy.
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, alignItems: 'center' }}>
        <Story />
      </div>
    ),
  ],
  args: {
    label: 'Office',
    tone: 'neutral',
    size: 'small',
  },
  argTypes: {
    tone: { control: 'select', options: tones },
    size: { control: 'inline-radio', options: ['small', 'medium'] },
    variant: { control: 'inline-radio', options: ['filled', 'outlined'] },
    icon: { control: false },
    label: { control: 'text' },
  },
} satisfies Meta<typeof StatusChip>;

export default meta;
type Story = StoryObj<typeof meta>;

/** A neutral, outlined chip for a plain fact with no status meaning, such as a building type. */
export const Default: Story = {};

/** Every tone side by side. Use a tone only for meaning: success, warning and error are reserved for status. */
export const Tones: Story = {
  render: (args) => (
    <>
      {tones.map((tone) => (
        <StatusChip key={tone} {...args} label={tone} tone={tone} />
      ))}
    </>
  ),
};

/** A leading icon to reinforce the label. The label still carries the meaning; never rely on the icon alone. */
export const WithIcon: Story = {
  args: { label: 'Energy Star linked', tone: 'success', icon: <CheckCircleIcon /> },
};

/** The medium size, for a chip that sits beside a page title rather than in a row or a card. */
export const Medium: Story = {
  args: { label: '3 open alerts', tone: 'info', size: 'medium' },
};

/** Any lookup-backed field: pass the value, the lookup table and a name-to-tone map. Use it when no dedicated chip exists. */
export const Lookup: Story = {
  render: () => <LookupChip value={actionStatuses[1]!.id} lookup={actionStatuses} tones={actionStatusTone} />,
};

/** Every work order status from the API lookup, with the tone each one maps to. */
export const ActionStatuses: Story = {
  render: () => (
    <>
      {actionStatuses.map((status) => (
        <ActionStatusChip key={status.id} status={status.id} lookup={actionStatuses} />
      ))}
    </>
  ),
};

/** Every work order priority. Medium and high stand out; lowest and low stay neutral. */
export const ActionPriorities: Story = {
  render: () => (
    <>
      {actionPriorities.map((priority) => (
        <ActionPriorityChip key={priority.id} priority={priority.id} lookup={actionPriorities} />
      ))}
    </>
  ),
};

/** The three property alert states, derived from the `fixed` and `acknowledged` flags: open, acknowledged, fixed. */
export const AlertStates: Story = {
  render: () => (
    <>
      <AlertStateChip alert={{ fixed: false, acknowledged: false }} />
      <AlertStateChip alert={{ fixed: false, acknowledged: true }} />
      <AlertStateChip alert={{ fixed: true, acknowledged: true }} />
    </>
  ),
};

/** A bare id with no lookup table to resolve it. The chip names the id instead of hiding the field. */
export const UnresolvedId: Story = {
  render: () => <ActionStatusChip status={7} />,
};
