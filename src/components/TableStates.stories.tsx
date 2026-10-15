import type { Meta, StoryObj } from '@storybook/react-vite';
import { fn } from 'storybook/test';
import { TableEmptyRow, TableError, TableSkeleton } from 'src/components/TableStates';

const meta = {
  title: 'Table/States',
  component: TableSkeleton,
  subcomponents: { TableError, TableEmptyRow },
  args: { columns: 6, rows: 8, label: 'Loading meters' },
} satisfies Meta<typeof TableSkeleton>;

export default meta;
type Story = StoryObj<typeof meta>;

/** First load of a custom table: block out its columns while rows load. DataTable shows this for `isLoading`. */
export const Skeleton: Story = {};

/** A narrow table, such as a card's summary list, keeps fewer columns and rows. */
export const SkeletonFewRows: Story = {
  args: { columns: 3, rows: 3 },
};

/** The table's request failed: show the message and a Retry button wired to `onRetry`. */
export const Failed: StoryObj<typeof TableError> = {
  args: { message: 'Meters could not be loaded.', onRetry: fn() },
  render: (args) => <TableError {...args} />,
};

/** An error that retrying will not fix: omit `onRetry` and the button is hidden. */
export const FailedWithoutRetry: StoryObj<typeof TableError> = {
  args: { message: 'You do not have access to these meters.' },
  render: (args) => <TableError {...args} />,
};

/** No rows after loading or filtering: one full-width body row. Set `colSpan` to the column count. */
export const EmptyRow: StoryObj<typeof TableEmptyRow> = {
  args: { colSpan: 3, children: 'No meters match these filters.' },
  argTypes: { children: { control: 'text' } },
  render: (args) => (
    <div className="table-wrap">
      <table className="ui-table">
        <thead>
          <tr>
            <th scope="col">Meter</th>
            <th scope="col">Source</th>
            <th scope="col">Channels</th>
          </tr>
        </thead>
        <tbody>
          <TableEmptyRow {...args} />
        </tbody>
      </table>
    </div>
  ),
};
