import type { ReactNode } from 'react';
import type { Meta, StoryObj } from '@storybook/react-vite';
import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import { ChartDemo, DndDemo, GridDemo, MapDemo, MetricCardDemo, OverviewPanelDemo, TableDemo } from 'src/fixtures/stackDemos';
import { tokenContrast } from 'src/stories/a11y';

/**
 * Smoke tests for the third-party widget stack (amCharts, TanStack Table, Leaflet,
 * react-grid-layout, hello-pangea dnd) under the app theme. Internal: these demos
 * are not components to copy, so they stay out of the manifest agents read.
 */
const meta = {
  title: 'Internal/Widgets',
  tags: ['!manifest'],
} satisfies Meta;

export default meta;

/** Gives a demo that fills its parent a card with a fixed height. */
function Sized({ children, height = 320 }: { children: ReactNode; height?: number }) {
  return (
    <Card sx={{ height, display: 'flex', flexDirection: 'column' }}>
      <CardContent sx={{ flex: 1, minHeight: 0, display: 'flex', flexDirection: 'column', '&:last-child': { pb: 2 } }}>
        {children}
      </CardContent>
    </Card>
  );
}

type MetricCardArgs = { label: string; value: number; delta: number; focusIndex: number };

/** A KPI card with an amCharts sparkline bar chart; `focusIndex` picks the highlighted bar. */
export const MetricCard: StoryObj<MetricCardArgs> = {
  // Contrast off: successMain text on backgroundDefault. See src/stories/a11y.ts.
  parameters: { a11y: tokenContrast },
  args: { label: 'Total tickets', value: 12853, delta: 0.056, focusIndex: 4 },
  render: (args) => (
    <div style={{ width: 320 }}>
      <MetricCardDemo {...args} />
    </div>
  ),
};

/** A TanStack Table over tickets fetched with React Query. */
export const TicketsTable: StoryObj = {
  render: () => <TableDemo />,
};

/** An amCharts demand series inside the app's chart frame, which is its own card. */
export const DemandChart: StoryObj = {
  render: () => (
    <Box sx={{ maxWidth: 720 }}>
      <ChartDemo />
    </Box>
  ),
};

type OverviewArgs = { closedSharePercent: number };

/** A ticket overview panel with an amCharts donut of closed versus open tickets. */
export const OverviewPanel: StoryObj<OverviewArgs> = {
  args: { closedSharePercent: 64 },
  argTypes: { closedSharePercent: { control: { type: 'range', min: 0, max: 100 } } },
  render: ({ closedSharePercent }) => (
    <Card sx={{ width: 420, height: 480, display: 'flex', flexDirection: 'column' }}>
      <CardContent sx={{ flex: 1, minHeight: 0, display: 'flex', flexDirection: 'column', '&:last-child': { pb: 2 } }}>
        <OverviewPanelDemo closedShare={closedSharePercent / 100} />
      </CardContent>
    </Card>
  ),
};

/** A Leaflet map with a marker per sample building. Loads map tiles from the network. */
export const PortfolioMap: StoryObj = {
  render: () => (
    <Sized height={360}>
      <MapDemo />
    </Sized>
  ),
};

/** A react-grid-layout dashboard whose panels are rearranged by dragging their header. */
export const DashboardGrid: StoryObj = {
  // Contrast off: warningMain text on white. See src/stories/a11y.ts.
  parameters: { a11y: tokenContrast },
  render: () => (
    <Sized height={360}>
      <GridDemo />
    </Sized>
  ),
};

/** A ticket queue reordered by drag and drop (hello-pangea dnd). */
export const QueueReorder: StoryObj = {
  // Contrast off: secondaryMain ticket ids on backgroundDefault. See src/stories/a11y.ts.
  parameters: { a11y: tokenContrast },
  render: () => <DndDemo />,
};
