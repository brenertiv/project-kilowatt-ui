import type { ReactNode } from 'react';
import Card from '@mui/material/Card';
import CardActionArea from '@mui/material/CardActionArea';
import CardHeader from '@mui/material/CardHeader';
import Grid from '@mui/material/Grid';
import type { Meta, StoryObj } from '@storybook/react-vite';
import { expect } from 'storybook/test';
import { SchematicPreview, type Schematic, type SchematicBlock } from 'src/components/SchematicPreview';
import { TruncatedText } from 'src/components/TruncatedText';

const figure = (span: SchematicBlock['span'] = 4): SchematicBlock => ({ glyph: 'figure', span });
const wide = (glyph: SchematicBlock['glyph']): SchematicBlock => ({ glyph, span: 12 });
const half = (glyph: SchematicBlock['glyph']): SchematicBlock => ({ glyph, span: 6 });

/** Synthetic templates: what each opens on, as blocks. */
const energyDashboard: Schematic = {
  frame: 'dashboard',
  blocks: [figure(), figure(), figure(), wide('column'), wide('table')],
};
const monthlyReport: Schematic = {
  frame: 'report',
  blocks: [figure(), figure(), figure(), wide('text'), wide('table')],
};
const carbonPlan: Schematic = {
  frame: 'plan',
  blocks: [figure(3), figure(3), figure(3), figure(3), wide('text'), wide('line')],
};
const welcomeReport: Schematic = { frame: 'report', hero: true, blocks: [wide('text'), wide('progress'), wide('map')] };
const portfolioDashboard: Schematic = {
  frame: 'dashboard',
  blocks: [figure(6), figure(6), half('bars'), half('list')],
};

/** A template card as a gallery shows it: the preview edge to edge at the top, the name under it. */
function TemplateCard({ name, preview }: { name: string; preview: Schematic }) {
  return (
    <Card variant="outlined">
      <CardActionArea>
        <SchematicPreview preview={preview} />
        <CardHeader title={<TruncatedText>{name}</TruncatedText>} />
      </CardActionArea>
    </Card>
  );
}

/** A single preview at the top of a card, as it ships. */
const inCard = (Story: () => ReactNode) => (
  <Card variant="outlined" sx={{ maxWidth: 360 }}>
    <Story />
    <CardHeader title={<TruncatedText>Energy Overview</TruncatedText>} />
  </Card>
);

/**
 * Kilowatt's `SchematicPreview`: a page's layout in miniature, a shape per component, for a template or workspace card.
 * Each story shows it at the top of a card, as it ships.
 */
const meta = {
  title: 'Data display/Schematic preview',
  component: SchematicPreview,
  tags: ['!autodocs'],
  // The MUI components this page documents; docs.test.ts checks its MUI departures section against them.
  parameters: { muiComponents: ['Box'] },
  args: { preview: energyDashboard },
} satisfies Meta<typeof SchematicPreview>;

export default meta;
type Story = StoryObj<typeof meta>;

/** A dashboard: its cards on the canvas, three figures over a column chart and a table. */
export const Dashboard: Story = {
  decorators: [inCard],
  play: async ({ canvasElement }) => {
    const svg = canvasElement.querySelector('svg');
    await expect(svg).toHaveAttribute('aria-hidden', 'true');
  },
};

/** A report: a document narrower than the canvas, its blocks outlined on the page under a title. */
export const Report: Story = { decorators: [inCard], args: { preview: monthlyReport } };

/** A report that opens on a hero image. */
export const ReportWithHero: Story = { decorators: [inCard], args: { preview: welcomeReport } };

/** A plan: its canvas under a timeline. */
export const Plan: Story = { decorators: [inCard], args: { preview: carbonPlan } };

/** A blank page: an Add plus in a dashed frame, so an empty template reads as a place to start. */
export const Blank: Story = { decorators: [inCard], args: { preview: { frame: 'dashboard', blocks: [] } } };

/** A gallery of template cards, each preview the top of the page it opens on. */
export const Gallery: Story = {
  render: () => (
    <Grid container spacing={2} sx={{ maxWidth: 960 }}>
      {[
        ['Energy Overview', energyDashboard],
        ['Monthly Update', monthlyReport],
        ['Carbon Plan', carbonPlan],
        ['Welcome', welcomeReport],
        ['Portfolio Ranking', portfolioDashboard],
        ['Blank Report', { frame: 'report', blocks: [] } as Schematic],
      ].map(([name, preview]) => (
        <Grid key={name as string} size={{ xs: 12, sm: 6, md: 4 }}>
          <TemplateCard name={name as string} preview={preview as Schematic} />
        </Grid>
      ))}
    </Grid>
  ),
};
