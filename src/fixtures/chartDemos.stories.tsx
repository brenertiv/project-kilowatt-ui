import type { Meta, StoryObj } from '@storybook/react-vite';
import { ChartFrame } from 'src/charts/ChartFrame';
import { radarData, RadarPlot, TreemapDemo } from 'src/fixtures/chartDemos';

const meta = {
  title: 'Internal/ChartDemos',
  // Raw amCharts demos, not system components: kept out of the manifest agents read.
  tags: ['!manifest'],
} satisfies Meta;

export default meta;
type Story = StoryObj<typeof meta>;

/** Radar plot of system scores against the portfolio average, inside a frame. */
export const Radar: Story = {
  render: () => (
    <ChartFrame title="System performance" subtitle="Score out of 100" data={radarData} legendShape="line" height={300}>
      <RadarPlot />
    </ChartFrame>
  ),
};

/** Drill-down treemap of energy by building, then by system. */
export const Treemap: Story = {
  render: () => (
    <div className="card" style={{ height: 420, display: 'flex', flexDirection: 'column' }}>
      <div className="card-body" style={{ flex: 1, minHeight: 0, display: 'flex', flexDirection: 'column' }}>
        <TreemapDemo />
      </div>
    </div>
  ),
};
