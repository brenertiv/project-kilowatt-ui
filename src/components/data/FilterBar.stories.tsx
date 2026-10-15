import { useState } from 'react';
import type { Meta, StoryObj } from '@storybook/react-vite';
import { fn } from 'storybook/test';
import type { ListParams } from '../../api/types';
import { FilterBar } from './FilterBar';

const ordering = [
  { value: '-due_date', label: 'Due date, latest first' },
  { value: 'due_date', label: 'Due date, earliest first' },
  { value: 'name', label: 'Name' },
  { value: '-work_order_number', label: 'Newest work order' },
];

const meta = {
  title: 'Data/FilterBar',
  component: FilterBar,
  decorators: [
    (Story) => (
      // A plain div, not Box: story imports end up in the snippet agents copy.
      <div style={{ maxWidth: 720 }}>
        <Story />
      </div>
    ),
  ],
  // FilterBar is controlled: the page owns `params`. This keeps them in story state and logs each change.
  render: function ControlledFilterBar(args) {
    const [params, setParams] = useState<ListParams>(args.params);
    return (
      <FilterBar
        {...args}
        params={params}
        onChange={(next) => {
          setParams(next);
          args.onChange(next);
        }}
      />
    );
  },
  args: {
    params: { page_size: 10, ordering: '-due_date' },
    onChange: fn(),
    searchPlaceholder: 'Search work orders',
    ordering,
    pageSizes: [10, 25, 50],
  },
  argTypes: {
    params: { control: 'object' },
    searchPlaceholder: { control: 'text' },
    ordering: { control: 'object' },
    pageSizes: { control: 'object' },
    children: { control: false },
  },
} satisfies Meta<typeof FilterBar>;

export default meta;
type Story = StoryObj<typeof meta>;

/** Search, sort and page size over a list's params. Any change clears the cursor so the list restarts on page one. */
export const Default: Story = {};

/** Search alone, for a short list with no useful sort and a fixed page size. */
export const SearchOnly: Story = {
  args: { params: {}, ordering: undefined, pageSizes: undefined },
};

/** Opened with a search and sort already applied, as when a page restores params from the URL. */
export const Prefilled: Story = {
  args: { params: { page_size: 25, ordering: 'name', search: 'chiller' } },
};
