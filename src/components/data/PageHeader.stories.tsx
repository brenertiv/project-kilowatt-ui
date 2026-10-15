import Button from '@mui/material/Button';
import type { Meta, StoryObj } from '@storybook/react-vite';
import { PlusIcon } from 'src/icons';
import { PageHeader } from 'src/components/data/PageHeader';
import { StatusChip } from 'src/components/data/StatusChip';
import { tokenContrast } from 'src/stories/a11y';

const meta = {
  title: 'Data/PageHeader',
  component: PageHeader,
  tags: ['!autodocs'],
  args: {
    title: '120 Broadway',
    eyebrow: 'Building',
    description: 'Office tower in Lower Manhattan with 42 metered tenants and a central chiller plant.',
    breadcrumbs: [{ label: 'Portfolio', to: '/' }, { label: 'Buildings', to: '/buildings' }, { label: '120 Broadway' }],
    actions: (
      <>
        <Button variant="outlined" color="inherit">
          Export
        </Button>
        <Button variant="contained" startIcon={<PlusIcon />}>
          New work order
        </Button>
      </>
    ),
    meta: (
      <>
        <StatusChip label="Office" />
        <StatusChip label="3 open alerts" tone="warning" />
        <StatusChip label="Energy Star linked" tone="success" />
      </>
    ),
  },
  argTypes: {
    title: { control: 'text' },
    eyebrow: { control: 'text' },
    description: { control: 'text' },
    breadcrumbs: { control: 'object' },
    state: { control: 'object' },
    actions: { control: false },
    meta: { control: false },
  },
} satisfies Meta<typeof PageHeader>;

export default meta;
type Story = StoryObj<typeof meta>;

/** A detail page header: breadcrumbs, the record type, its name, a description, key facts as chips, and actions. */
export const Default: Story = {
  // Contrast off: white on successMain in the status chip. See src/stories/a11y.ts.
  parameters: { a11y: tokenContrast },
};

/** Just the title, for a top-level page such as a portfolio overview. Add parts only when they carry information. */
export const TitleOnly: Story = {
  args: {
    title: 'Buildings',
    eyebrow: undefined,
    description: undefined,
    breadcrumbs: undefined,
    actions: undefined,
    meta: undefined,
  },
};

/** A list page header: a title, a one-line description, and the primary action. */
export const ListPage: Story = {
  args: {
    title: 'Work orders',
    eyebrow: undefined,
    description: 'Open and scheduled work across the portfolio.',
    breadcrumbs: [{ label: 'Portfolio', to: '/' }, { label: 'Work orders' }],
    meta: undefined,
    actions: (
      <Button variant="contained" startIcon={<PlusIcon />}>
        New work order
      </Button>
    ),
  },
};

/** A long name: the title wraps and the actions move below it on narrow widths. */
export const LongTitle: Story = {
  // Contrast off: white on successMain in the status chip. See src/stories/a11y.ts.
  parameters: { a11y: tokenContrast },
  args: {
    title: 'Riverside Commons Mixed-Use Development, Phase Two North Tower and Parking Structure',
  },
};

/** While the record loads: the title and description are skeletons and the chips are hidden. */
export const Loading: Story = {
  args: { state: { status: 'loading' } },
};
