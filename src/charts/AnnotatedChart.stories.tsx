import type { Meta, StoryObj } from '@storybook/react-vite';
import { expect, fn, waitFor } from 'storybook/test';
import { AnnotatedChart } from 'src/charts/AnnotatedChart';
import { utilityCost } from 'src/fixtures/charts';
import { createSchemeTheme } from 'src/mui/theme';
import { inCard } from 'src/stories/decorators';

const whole = new Intl.NumberFormat('en-US');
const costs = utilityCost.slice(0, 5);
const [electricity, gas] = costs;
// Annotations as MarkerJS saved them: an arrow and a note in the `error` ink, which reads in both schemes.
const { palette, typography } = createSchemeTheme('light');
const identity = { a: 1, b: 0, c: 0, d: 1, e: 0, f: 0 };
const saved = {
  width: 688,
  height: 240,
  markers: [
    { typeName: 'ArrowMarker', state: 'select', x1: 492, y1: 150, x2: 420, y2: 132, strokeColor: palette.error.main, strokeWidth: 3, strokeDasharray: '', arrowType: 'end' },
    {
      typeName: 'TextMarker',
      state: 'select',
      left: 496,
      top: 136,
      width: 190,
      height: 32,
      rotationAngle: 0,
      visualTransformMatrix: identity,
      containerTransformMatrix: identity,
      color: palette.error.main,
      fontFamily: typography.fontFamily,
      padding: 5,
      text: 'Demand charge doubled',
    },
  ],
};

/**
 * Kilowatt's reference annotated chart: amCharts 5 and its annotator through `useChart`, opened by an MUI button.
 * Each story shows it in a `Card` under a `CardHeader`, as it ships.
 */
const meta = {
  title: 'Charts/Annotated',
  component: AnnotatedChart,
  tags: ['!autodocs'],
  decorators: [inCard],
  args: { data: costs, unit: 'USD' },
} satisfies Meta<typeof AnnotatedChart>;

export default meta;
type Story = StoryObj<typeof meta>;

/** A chart with saved `annotations` drawn back over it: an arrow and a note on the electricity slice. Annotate opens the tools to add more; Clear annotations removes them. */
export const Annotated: Story = {
  parameters: { card: { title: 'Utility Cost' } },
  args: {
    annotations: saved,
    onAnnotationsChange: fn(),
    summary: `Electricity was ${whole.format(electricity.value)} USD of the building's utility cost and natural gas ${whole.format(gas.value)} USD. A note on electricity says the demand charge doubled.`,
  },
  play: async ({ canvas }) => {
    const figure = canvas.getByRole('figure', { name: /demand charge doubled/ });
    await waitFor(() => expect(figure.querySelector('canvas')).not.toBeNull());
    await expect(canvas.getByRole('button', { name: 'Clear annotations' })).toBeVisible();
  },
};

/** No annotations yet: the Annotate button under the chart opens the tools, and Done hands what was drawn to `onAnnotationsChange` to save. */
export const NotAnnotated: Story = {
  name: 'Not annotated',
  parameters: { card: { title: 'Utility Cost' } },
  args: {
    summary: `Electricity was ${whole.format(electricity.value)} USD of the building's utility cost and natural gas ${whole.format(gas.value)} USD.`,
  },
  play: async ({ canvas }) => {
    await expect(canvas.getByRole('button', { name: 'Annotate' })).toBeVisible();
  },
};
