import type { Meta, StoryObj } from '@storybook/react-vite';
import { portfolio } from 'src/fixtures/data';
import { RelationLink } from 'src/components/data/RelationLink';

const building = portfolio.buildings[0]!;

/** Reads the name off an expanded record. Typed loosely so one function serves every story. */
const nameOf = (row: { id: string | number; name?: string }) => row.name;
const buildingPath = (id: string | number) => `/buildings/${id}`;

const meta = {
  title: 'Data/RelationLink',
  component: RelationLink,
  args: {
    value: building,
    label: nameOf,
    to: buildingPath,
  },
  argTypes: {
    value: { control: 'object' },
    label: { control: false },
    to: { control: false },
  },
} satisfies Meta<typeof RelationLink>;

export default meta;
type Story = StoryObj<typeof meta>;

/** An expanded relation with a `to`: the record's name as a link. The usual case when the request used `expand`. */
export const ExpandedLinked: Story = {};

/** An expanded relation with no `to`: the name as plain text, for records with no page of their own. */
export const ExpandedPlain: Story = {
  args: { to: undefined },
};

/** A bare id, because the request skipped `expand`: a short mono id with the full id on hover, still linked. */
export const BareIdLinked: Story = {
  args: { value: building.id },
};

/** A bare id with no `to`: the short id as plain text. */
export const BareIdPlain: Story = {
  args: { value: building.id, to: undefined },
};

/** An integer id, as some entities (utility bills) use. Short ids show in full. */
export const IntegerId: Story = {
  args: { value: 2723, to: (id) => `/bills/${id}` },
};

/** No relation: the no-value dash. */
export const Missing: Story = {
  args: { value: null },
};
