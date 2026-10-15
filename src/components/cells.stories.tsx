import type { Meta, StoryObj } from '@storybook/react-vite';
import { fn } from 'storybook/test';
import { sparklines } from 'src/fixtures/sampleData';
import { ActionsCell, ChipCell, DateCell, DeltaCell, EmptyCell, LinkCell, NumericCell, SparklineCell, StatusCell } from 'src/components/cells';
import { tokenContrast } from 'src/stories/a11y';

const units = ['count', 'kW', 'kWh', 'MWh', 'therms', 'gal', 'USD', 'percent', '°F', 'score'];

const meta = {
  title: 'Table/Cells',
  component: StatusCell,
  subcomponents: { ChipCell, NumericCell, DeltaCell, DateCell, LinkCell, ActionsCell, SparklineCell, EmptyCell },
  decorators: [
    (Story) => (
      // Cells are styled for a table body, so render them inside one.
      <div className="table-wrap">
        <table className="ui-table">
          <tbody>
            <tr>
              <td>
                <Story />
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    ),
  ],
  argTypes: {
    tone: { control: 'inline-radio', options: ['positive', 'warning', 'negative', 'neutral'] },
    children: { control: 'text' },
  },
} satisfies Meta<typeof StatusCell>;

export default meta;
type Story = StoryObj<typeof meta>;

/** A state pill (linked, offline, overdue). Pick the `tone` from what the state means, not its color. */
export const Status: Story = {
  args: { tone: 'positive', children: 'Linked' },
};

/** A neutral tag for a category value such as a meter source. */
export const Chip: StoryObj<typeof ChipCell> = {
  args: { children: 'Energy Star' },
  argTypes: { children: { control: 'text' } },
  render: (args) => <ChipCell {...args} />,
};

/** A number with its unit and tabular digits, for end-aligned numeric columns. */
export const Numeric: StoryObj<typeof NumericCell> = {
  args: { value: 12853, unit: 'kWh', compact: false },
  argTypes: { unit: { control: 'select', options: units } },
  render: (args) => <NumericCell {...args} />,
};

/** A signed change colored by whether it is good. Set `upIsGood` to false for costs and consumption. */
export const Delta: StoryObj<typeof DeltaCell> = {
  // Contrast off: successMain text on backgroundDefault. See src/stories/a11y.ts.
  parameters: { a11y: tokenContrast },
  args: { value: 0.056, unit: 'percent', upIsGood: true },
  argTypes: { unit: { control: 'select', options: units } },
  render: (args) => <DeltaCell {...args} />,
};

/** A calendar date (`yyyy-MM-dd`) shown without a time-zone shift. */
export const CalendarDate: StoryObj<typeof DateCell> = {
  args: { iso: '2026-09-14' },
  render: (args) => <DateCell {...args} />,
};

/** A router link to the row's detail page, usually in the first column. */
export const RowLink: StoryObj<typeof LinkCell> = {
  // Contrast off: secondaryMain link text on backgroundDefault. See src/stories/a11y.ts.
  parameters: { a11y: tokenContrast },
  args: { href: '/buildings/1', children: '1 World Trade Center' },
  argTypes: { children: { control: 'text' } },
  render: (args) => <LinkCell {...args} />,
};

/** The per-row overflow menu, in the last column. Mark irreversible actions `destructive`. */
export const Actions: StoryObj<typeof ActionsCell> = {
  args: {
    label: 'Meter actions',
    items: [
      { label: 'Edit', onSelect: fn() },
      { label: 'Duplicate', onSelect: fn() },
      { label: 'Delete', onSelect: fn(), destructive: true },
    ],
  },
  render: (args) => <ActionsCell {...args} />,
};

/** A small trend line for a recent series. Give it a `label` so screen readers announce the trend. */
export const Sparkline: StoryObj<typeof SparklineCell> = {
  args: { points: sparklines.rising, label: 'Rising trend' },
  argTypes: {
    points: { control: 'select', options: Object.keys(sparklines), mapping: sparklines },
  },
  render: (args) => <SparklineCell {...args} />,
};

/** The no-value dash. Cells fall back to it on their own; use it directly for custom cells. */
export const Empty: StoryObj<typeof EmptyCell> = {
  render: () => <EmptyCell />,
};

/** Missing inputs: numeric, delta and date cells show the dash, and a zero delta stays neutral. */
export const MissingValues: StoryObj<typeof EmptyCell> = {
  render: () => (
    <div className="demo-row">
      <NumericCell value={null} />
      <DeltaCell value={undefined} />
      <DateCell iso={null} />
      <SparklineCell points={[5]} />
      <DeltaCell value={0} />
    </div>
  ),
};
