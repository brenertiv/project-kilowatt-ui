import type { Meta, StoryObj } from '@storybook/react-vite';
import { expect, waitFor } from 'storybook/test';
import { BulletChart } from 'src/charts/BulletChart';
import { carbonProgress, certificationCoverage, savingsByProperty, spendAgainstBudget } from 'src/fixtures/charts';
import { inCard } from 'src/stories/decorators';

const savings = savingsByProperty.map(({ building, realised, projected }) => ({ category: building, value: realised, target: projected }));
const short = savingsByProperty.filter(({ realised, projected }) => realised < projected).length;
const coverage = certificationCoverage.map(({ certification, share }) => ({ category: certification, value: share, target: 100 }));
const budget = spendAgainstBudget.map(({ building, actual, budget: target }) => ({ category: building, value: actual, target }));
const overBudget = spendAgainstBudget.filter(({ actual, budget: target }) => actual > target).length;

/**
 * Kilowatt's reference bullet chart: amCharts 5 through `useChart`, each row's value against its target.
 * Each story shows it in a `Card` under a `CardHeader`, as it ships.
 */
const meta = {
  title: 'Charts/Bullet',
  component: BulletChart,
  tags: ['!autodocs'],
  decorators: [inCard],
} satisfies Meta<typeof BulletChart>;

export default meta;
type Story = StoryObj<typeof meta>;

/** Realised savings per property against what its measures projected: bars short of their tick take `error`. */
export const AgainstProjection: Story = {
  name: 'Against a projection',
  parameters: { card: { title: 'Realised Savings by Property' } },
  args: {
    rows: savings,
    name: 'Realised',
    targetName: 'Projected',
    unit: 'USD',
    worse: 'below',
    summary: `${short} of ${savings.length} properties have realised less than their projected savings.`,
  },
  play: async ({ canvas }) => {
    const figure = canvas.getByRole('figure', { name: /projected savings/ });
    await waitFor(() => expect(figure.querySelector('canvas')).not.toBeNull());
    await expect(canvas.getByText('Projected')).toBeVisible();
  },
};

/** The share of floor area each certification covers, on a track to 100%: neither side is worse, so the bars take the first series color. */
export const ShareOfWhole: Story = {
  name: 'Share of a whole',
  parameters: { card: { title: 'Certified Floor Area' } },
  args: {
    rows: coverage,
    name: 'Certified',
    targetName: 'Whole portfolio',
    unit: '%',
    max: 100,
    summary: `ENERGY STAR covers ${certificationCoverage[0].share}% of the portfolio's floor area, the most of any certification; BREEAM covers ${certificationCoverage[certificationCoverage.length - 1].share}%.`,
  },
};

/** Spend so far this year against budget, per property: bars over their tick take `error`. In a table, the same bar sits in a column. */
export const AgainstBudget: Story = {
  name: 'Against a budget',
  parameters: { card: { title: 'Spend Against Budget, Year to Date' } },
  args: {
    rows: budget,
    name: 'Spend',
    targetName: 'Budget',
    unit: 'USD',
    worse: 'above',
    summary: `${overBudget} of ${budget.length} properties are over budget for the year so far.`,
  },
};

/** One row: the portfolio's progress toward carbon zero, its cut in emissions since 2019 on a track to 100%, against where its pathway puts it for 2026. Behind the pathway, so the bar takes `error`. */
export const CarbonZeroProgress: Story = {
  name: 'Carbon-zero progress',
  parameters: { card: { title: 'Progress to Carbon Zero' } },
  args: {
    rows: [{ category: 'Portfolio', value: carbonProgress.reduction, target: carbonProgress.pathway }],
    name: 'Cut since 2019',
    targetName: 'Pathway for 2026',
    unit: '%',
    max: 100,
    worse: 'below',
    summary: `The portfolio has cut its emissions ${carbonProgress.reduction}% since 2019, behind the ${carbonProgress.pathway}% its pathway sets for 2026.`,
  },
};
