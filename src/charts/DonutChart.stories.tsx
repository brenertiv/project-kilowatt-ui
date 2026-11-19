import { useState } from 'react';
import type { Meta, StoryObj } from '@storybook/react-vite';
import { expect, fn, userEvent, waitFor } from 'storybook/test';
import { DonutChart } from 'src/charts/DonutChart';
import { meaningColor, workOrderTypeSlots } from 'src/charts/meanings';
import { utilityCost, workOrdersByType } from 'src/fixtures/charts';
import { inCard } from 'src/stories/decorators';

const percent = new Intl.NumberFormat('en-US', { style: 'percent', maximumFractionDigits: 0 });
const share = (rows: { value: number }[], value: number) => percent.format(value / rows.reduce((sum, row) => sum + row.value, 0));

/** A portfolio's properties by type: synthetic counts. */
const propertyTypes = [
  { category: 'Office', value: 48 },
  { category: 'Multifamily', value: 31 },
  { category: 'Retail', value: 19 },
  { category: 'Industrial', value: 11 },
  { category: 'Hotel', value: 6 },
];
/** A portfolio's properties by where they are in setup: synthetic counts. Live is the positive part, Onboarding its negative. */
const propertyStatus = [
  { category: 'Live', value: 86, slot: 0 },
  { category: 'Onboarding', value: 29, negative: true },
];
const propertyTotal = propertyTypes.reduce((sum, row) => sum + row.value, 0);
const electricity = utilityCost[0];
const byType = workOrdersByType.map(({ type, count }) => ({ category: type, value: count, ...meaningColor(workOrderTypeSlots, type) }));
const openTotal = workOrdersByType.reduce((sum, row) => sum + row.count, 0);

/**
 * Kilowatt's reference donut chart: amCharts 5 through `useChart`, colored from the palette, with the
 * total in the middle and a legend under the ring. Each story shows it in a `Card` under a `CardHeader`, as it ships.
 */
const meta = {
  title: 'Charts/Donut',
  component: DonutChart,
  tags: ['!autodocs'],
  decorators: [inCard],
} satisfies Meta<typeof DonutChart>;

export default meta;
type Story = StoryObj<typeof meta>;

/** Up to six parts of one whole, largest first: the total in the middle, each part and its share in the legend. */
export const Parts: Story = {
  parameters: { card: { title: 'Properties by Type' } },
  args: {
    data: propertyTypes,
    unit: 'properties',
    summary: `${propertyTotal} properties; office is the largest type, ${share(propertyTypes, propertyTypes[0].value)} of them.`,
  },
  play: async ({ canvas }) => {
    const figure = canvas.getByRole('figure', { name: /properties; office is the largest type/ });
    await waitFor(() => expect(figure.querySelector('canvas')).not.toBeNull());
    await expect(canvas.getByText(String(propertyTotal))).toBeVisible();
    // The entry's name and its share, which sits in its own span in the secondary text color.
    const entry = new RegExp(`^Office ${share(propertyTypes, propertyTypes[0].value)}$`);
    await expect(canvas.getByText((_, element) => element?.tagName === 'P' && entry.test(element.textContent ?? ''))).toBeVisible();
  },
};

/** More than six parts: the five largest keep their slices, and the rest are grouped into a neutral "Other". */
export const GroupedIntoOther: Story = {
  name: 'Grouped into Other',
  parameters: { card: { title: 'Utility Cost' } },
  args: {
    data: utilityCost,
    unit: 'USD',
    summary: `Electricity was ${share(utilityCost, electricity.value)} of the building's utility cost; sanitation and fuel oil are grouped as Other.`,
  },
  play: async ({ canvas }) => {
    await expect(canvas.getByText(/^Other/)).toBeVisible();
  },
};

/** Parts that stand for product meanings keep their colors: each work-order type takes its `slot` from `workOrderTypeSlots`, so Reactive is the same color on every chart. */
export const Meanings: Story = {
  parameters: { card: { title: 'Open Work Orders by Type' } },
  args: {
    data: byType,
    unit: 'work orders',
    summary: `${openTotal} work orders are open; ${workOrdersByType[0].count} of them (${share(byType, workOrdersByType[0].count)}) are reactive.`,
  },
};

/** A positive part and its negative: Live in slot 0, brand blue, and Onboarding with `negative`, drawn in `chart.seriesShade`, a shade off the card, so only the positive reads as data. */
export const PositiveAndNegative: Story = {
  name: 'Positive and negative',
  parameters: { card: { title: 'Properties by Status' } },
  args: {
    data: propertyStatus,
    unit: 'properties',
    summary: `${propertyStatus[0].value} of ${propertyStatus[0].value + propertyStatus[1].value} properties are live (${share(propertyStatus, propertyStatus[0].value)}); the other ${propertyStatus[1].value} are onboarding.`,
  },
  play: async ({ canvas }) => {
    const dot = (label: HTMLElement) => label.closest('li')!.querySelector('[aria-hidden]') as HTMLElement;
    const entry = (name: string) => canvas.getByText((_, element) => element?.tagName === 'P' && (element.textContent ?? '').startsWith(name));
    const paletteColor = (name: string) => {
      const probe = document.body.appendChild(document.createElement('span'));
      probe.style.color = `var(--mui-palette-${name})`;
      const { color } = getComputedStyle(probe);
      probe.remove();
      return color;
    };
    await expect(getComputedStyle(dot(entry('Onboarding'))).backgroundColor).toBe(paletteColor('chart-seriesShade'));
    await expect(getComputedStyle(dot(entry('Live'))).backgroundColor).toBe(paletteColor('chart-series-0'));
  },
};

/** A filter: each legend entry is a toggle button, and a click on it or its slice selects that part while the rest step back. The page keeps the selection. */
export const Filter: Story = {
  parameters: { card: { title: 'Properties by Type' } },
  args: {
    data: propertyTypes,
    unit: 'properties',
    summary: `Properties by type; office is ${share(propertyTypes, propertyTypes[0].value)} of ${propertyTotal}.`,
    onSelect: fn(),
  },
  render: function Render(args) {
    const [selected, setSelected] = useState<string[]>([]);
    const toggle = (category: string) => {
      args.onSelect?.(category);
      setSelected((current) => (current.includes(category) ? current.filter((item) => item !== category) : [...current, category]));
    };
    return <DonutChart {...args} selected={selected} onSelect={toggle} />;
  },
  play: async ({ args, canvas }) => {
    const button = canvas.getByRole('button', { name: /^Office/ });
    await expect(button).toHaveAttribute('aria-pressed', 'false');
    await userEvent.click(button);
    await expect(args.onSelect).toHaveBeenCalledWith('Office');
    await expect(button).toHaveAttribute('aria-pressed', 'true');
    await userEvent.click(button);
    await expect(button).toHaveAttribute('aria-pressed', 'false');
  },
};

/** One color for every slice, stepped down in opacity, for a chart on a colored surface where the series colors would clash. */
export const OneColor: Story = {
  name: 'One color',
  parameters: { card: { title: 'Properties by Type' } },
  args: {
    data: propertyTypes,
    unit: 'properties',
    summary: `${propertyTotal} properties; office is the largest type, ${share(propertyTypes, propertyTypes[0].value)} of them.`,
    fill: 'secondary.main',
  },
};

/** A thicker ring, with `innerRadius` lower than the default 82%, where the slices need more weight than the total. */
export const InnerRadius: Story = {
  name: 'Inner radius',
  parameters: { card: { title: 'Properties by Type' } },
  args: {
    data: propertyTypes,
    unit: 'properties',
    summary: `${propertyTotal} properties; office is the largest type, ${share(propertyTypes, propertyTypes[0].value)} of them.`,
    innerRadius: 64,
  },
};
