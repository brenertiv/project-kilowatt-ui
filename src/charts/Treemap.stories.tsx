import type { Meta, StoryObj } from '@storybook/react-vite';
import { expect, waitFor } from 'storybook/test';
import { meaningColor, workOrderTypeSlots } from 'src/charts/meanings';
import { Treemap } from 'src/charts/Treemap';
import { utilityCost, workOrdersByType } from 'src/fixtures/charts';
import { inCard } from 'src/stories/decorators';

const percent = new Intl.NumberFormat('en-US', { style: 'percent', maximumFractionDigits: 0 });
const share = (rows: { value: number }[], value: number) =>
  percent.format(value / rows.reduce((sum, row) => sum + row.value, 0));

/** A portfolio's floor area by property type, in square feet. */
const floorArea = [
  { category: 'Office', value: 2_480_000 },
  { category: 'Multifamily', value: 1_120_000 },
  { category: 'Retail', value: 640_000 },
  { category: 'Industrial', value: 415_000 },
  { category: 'Hotel', value: 180_000 },
];
const electricity = utilityCost[0];
const byType = workOrdersByType.map(({ type, count }) => ({
  category: type,
  value: count,
  ...meaningColor(workOrderTypeSlots, type),
}));
const openTotal = workOrdersByType.reduce((sum, row) => sum + row.count, 0);

/**
 * Kilowatt's reference treemap: amCharts 5 through `useChart`, colored from the palette.
 * Each story shows it in a `Card` under a `CardHeader`, as it ships.
 */
const meta = {
  title: 'Charts/Treemap',
  component: Treemap,
  tags: ['!autodocs'],
  decorators: [inCard],
} satisfies Meta<typeof Treemap>;

export default meta;
type Story = StoryObj<typeof meta>;

/** Up to six parts of one whole, squarified and 2px apart, each sized by its value and labeled with its share. */
export const Parts: Story = {
  parameters: { card: { title: 'Floor Area by Property Type' } },
  args: {
    data: floorArea,
    unit: 'sq ft',
    summary: `Office is ${share(floorArea, floorArea[0].value)} of the portfolio's floor area.`,
  },
  play: async ({ canvas }) => {
    const figure = canvas.getByRole('figure', { name: /of the portfolio's floor area/ });
    await waitFor(() => expect(figure.querySelector('canvas')).not.toBeNull());
  },
};

/** More than six parts: the five largest keep their rectangles, and the rest are grouped into a neutral "Other". */
export const GroupedIntoOther: Story = {
  name: 'Grouped into Other',
  parameters: { card: { title: 'Utility Cost' } },
  args: {
    data: utilityCost,
    unit: 'USD',
    summary: `Electricity was ${share(utilityCost, electricity.value)} of the building's utility cost; sanitation and fuel oil are grouped as Other.`,
  },
};

/** Every property's floor area, in square feet. More than six parts, with no product meaning: each in one colour, told apart by size and label. */
const floorAreaByProperty = [
  { category: 'Harbor Point', value: 184_500 },
  { category: 'Lakeside Commons', value: 142_000 },
  { category: 'Ridgeline Plaza', value: 121_300 },
  { category: 'Northwind Tower', value: 96_800 },
  { category: 'Cedar Annex', value: 72_400 },
  { category: 'Maple Court', value: 58_900 },
  { category: 'Riverside Lofts', value: 41_200 },
  { category: 'Pine Court', value: 28_600 },
  { category: 'Elm Plaza', value: 19_100 },
].map((part) => ({ ...part, neutral: true as const }));

/** `group={false}`: every part keeps its rectangle past six, all in one colour (`neutral`), read by size and label, each named in its tooltip. For parts that aren't product meanings. */
export const Ungrouped: Story = {
  parameters: { card: { title: 'Floor Area by Property' } },
  args: {
    data: floorAreaByProperty,
    unit: 'sq ft',
    group: false,
    summary: `Nine properties; Harbor Point, at ${share(floorAreaByProperty, floorAreaByProperty[0].value)} of the floor area, is the largest.`,
  },
};

/** Parts that stand for product meanings keep their colors: each work-order type takes its `slot` from `workOrderTypeSlots`. */
export const Meanings: Story = {
  parameters: { card: { title: 'Open Work Orders by Type' } },
  args: {
    data: byType,
    unit: 'work orders',
    summary: `${openTotal} work orders are open; ${workOrdersByType[0].count} of them (${share(byType, workOrdersByType[0].count)}) are reactive.`,
  },
};
