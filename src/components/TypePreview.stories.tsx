import type { ReactNode } from 'react';
import Card from '@mui/material/Card';
import CardActionArea from '@mui/material/CardActionArea';
import CardHeader from '@mui/material/CardHeader';
import Grid from '@mui/material/Grid';
import type { Meta, StoryObj } from '@storybook/react-vite';
import { expect } from 'storybook/test';
import { TruncatedText } from 'src/components/TruncatedText';
import { TypePreview, type TypePreviewProps } from 'src/components/TypePreview';

/** A single picture at the top of a card, as it ships. */
const inCard = (name: string) => (Story: () => ReactNode) => (
  <Card variant="outlined" sx={{ maxWidth: 360 }}>
    <Story />
    <CardHeader title={<TruncatedText>{name}</TruncatedText>} />
  </Card>
);

/** Synthetic templates, one of each type and a blank one. */
const templates: (TypePreviewProps & { name: string })[] = [
  { name: 'Energy Overview', type: 'dashboard' },
  { name: 'Quarterly Utility Review', type: 'report' },
  { name: 'Boiler Replacement Plan', type: 'plan' },
  { name: 'Blank Dashboard', type: 'dashboard', blank: true },
  { name: 'Blank Report', type: 'report', blank: true },
  { name: 'Blank Plan', type: 'plan', blank: true },
];

/**
 * Kilowatt's `TypePreview`: a motif for a workspace's type on a tint of the type's color, for the picture on a
 * workspace or template card. Each story shows it at the top of a card, as it ships.
 */
const meta = {
  title: 'Data display/Type preview',
  component: TypePreview,
  tags: ['!autodocs'],
  // The MUI components this page documents; docs.test.ts checks its MUI departures section against them.
  parameters: { muiComponents: ['Box'] },
  args: { type: 'dashboard' },
} satisfies Meta<typeof TypePreview>;

export default meta;
type Story = StoryObj<typeof meta>;

/** A dashboard: columns, in the dashboard's color. */
export const Dashboard: Story = {
  decorators: [inCard('Energy Overview')],
  play: async ({ canvasElement }) => {
    await expect(canvasElement.querySelector('svg')).toHaveAttribute('aria-hidden', 'true');
  },
};

/** A report: a heading over lines of text, in the report's color. */
export const Report: Story = { decorators: [inCard('Quarterly Utility Review')], args: { type: 'report' } };

/** A plan: a falling path, in the plan's color. */
export const Plan: Story = { decorators: [inCard('Boiler Replacement Plan')], args: { type: 'plan' } };

/** `blank`: a plus in place of the motif, for a template that starts empty; the color still says its type. */
export const Blank: Story = { decorators: [inCard('Blank Report')], args: { type: 'report', blank: true } };

/** A gallery of template cards: the pictures sort it by type, and the titles say what each is. */
export const Gallery: Story = {
  render: () => (
    <Grid container spacing={2} sx={{ maxWidth: 960 }}>
      {templates.map(({ name, ...preview }) => (
        <Grid key={name} size={{ xs: 12, sm: 6, md: 4 }}>
          <Card variant="outlined">
            <CardActionArea>
              <TypePreview {...preview} />
              <CardHeader title={<TruncatedText>{name}</TruncatedText>} />
            </CardActionArea>
          </Card>
        </Grid>
      ))}
    </Grid>
  ),
  play: async ({ canvas }) => {
    await expect(canvas.getByRole('button', { name: 'Boiler Replacement Plan' })).toBeVisible();
  },
};
