import type { Meta, StoryObj } from '@storybook/react-vite';
import { fn } from 'storybook/test';
import { actionSets } from 'src/fixtures/data';
import { CursorPagination } from 'src/components/data/CursorPagination';

const results = actionSets.few;
const nextUrl = '/action/?cursor=cD0yMDI2LTEwLTAx&page_size=5';
const previousUrl = '/action/?cursor=cj0xJnA9MjAyNi0xMC0wOA&page_size=5';

const meta = {
  title: 'Data/CursorPagination',
  component: CursorPagination,
  decorators: [
    (Story) => (
      // A plain div, not Box: story imports end up in the snippet agents copy.
      <div style={{ maxWidth: 720 }}>
        <Story />
      </div>
    ),
  ],
  args: {
    page: { next: nextUrl, previous: null, results },
    noun: 'work orders',
    onCursor: fn(),
    state: { status: 'ready' },
  },
  argTypes: {
    page: { control: 'object' },
    noun: { control: 'text' },
    state: { control: 'object' },
  },
} satisfies Meta<typeof CursorPagination>;

export default meta;
type Story = StoryObj<typeof meta>;

/** The first page of several: only Next is enabled. `onCursor` receives the cursor read from the API's `next` link. */
export const FirstPage: Story = {};

/** A page in the middle: both Previous and Next are enabled. */
export const MiddlePage: Story = {
  args: { page: { next: nextUrl, previous: previousUrl, results } },
};

/** The last page: only Previous is enabled. */
export const LastPage: Story = {
  args: { page: { next: null, previous: previousUrl, results } },
};

/** Everything fits on one page: both buttons are disabled and the count still shows. */
export const SinglePage: Story = {
  args: { page: { next: null, previous: null, results } },
};

/** The page has no records, such as a search that matched nothing. */
export const NoResults: Story = {
  args: { page: { next: null, previous: null, results: [] } },
};

/** While the next page loads, both buttons are disabled so a second click cannot skip a page. */
export const Busy: Story = {
  args: { page: { next: nextUrl, previous: previousUrl, results }, state: { status: 'fetching' } },
};
