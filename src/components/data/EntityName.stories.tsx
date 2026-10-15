import type { Meta, StoryObj } from '@storybook/react-vite';
import { EntityName } from './EntityName';

const meta = {
  title: 'Data/EntityName',
  component: EntityName,
  args: {
    name: 'Chiller 2',
    noun: 'equipment',
  },
  argTypes: {
    name: { control: 'text' },
    noun: { control: 'text' },
  },
} satisfies Meta<typeof EntityName>;

export default meta;
type Story = StoryObj<typeof meta>;

/** A real name renders as plain text. Use EntityName wherever a record's name appears inline. */
export const Default: Story = {};

/** A placeholder name the live API holds, such as `???`: shown as "Unnamed {noun}" in italics, with the raw value on hover. */
export const PlaceholderName: Story = {
  args: { name: '???' },
};

/** No name at all: the same fallback, so a missing name never renders as blank space. */
export const MissingName: Story = {
  args: { name: null, noun: 'meter' },
};
