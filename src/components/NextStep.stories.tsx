import Card from '@mui/material/Card';
import CardActionArea from '@mui/material/CardActionArea';
import CardContent from '@mui/material/CardContent';
import CardHeader from '@mui/material/CardHeader';
import Grid from '@mui/material/Grid';
import type { Meta, StoryObj } from '@storybook/react-vite';
import { expect, fn, screen } from 'storybook/test';
import { AppShell } from 'src/components/AppShell';
import { CardNextStep, NextStep } from 'src/components/NextStep';
import { PageHeader } from 'src/components/PageHeader';
import { PlainFigure } from 'src/components/SourceFigure';
import { TruncatedText } from 'src/components/TruncatedText';

/**
 * Kilowatt's `NextStep`: one line under a page header that says where things stand and what to do
 * next, with the step as a text button. `CardNextStep` is the same step as a plain caption line on a
 * clickable Overview card.
 */
const meta = {
  title: 'Data display/NextStep',
  component: NextStep,
  tags: ['!autodocs'],
  // The MUI components this page documents; docs.test.ts checks its MUI departures section against them.
  parameters: { muiComponents: ['Button', 'Tooltip', 'Typography'] },
  args: { state: '3 of 12 properties have no named contact.' },
} satisfies Meta<typeof NextStep>;

export default meta;
type Story = StoryObj<typeof meta>;

/** The state, then the step as a text button that does it or opens where it is done. */
export const WithAction: Story = {
  name: 'With action',
  args: { action: { label: 'Name the Contacts', onClick: fn() } },
  play: async ({ args, canvas, userEvent }) => {
    await expect(canvas.getByRole('status', { name: 'Next step' })).toHaveTextContent(args.state);
    await userEvent.click(canvas.getByRole('button', { name: 'Name the Contacts' }));
    await expect(args.action?.onClick).toHaveBeenCalledOnce();
  },
};

/** A step that can't be taken yet: the button is disabled, and its `reason` shows in a tooltip on hover. */
export const Disabled: Story = {
  args: { action: { label: 'Name the Contacts', onClick: fn(), disabled: true, reason: 'Only a portfolio owner can name contacts.' } },
  play: async ({ args, canvas, userEvent }) => {
    const button = canvas.getByRole('button', { name: 'Name the Contacts' });
    await expect(button).toBeDisabled();
    // The tooltip listens on the wrapper around the disabled button.
    await userEvent.hover(button.parentElement!);
    await expect(await screen.findByRole('tooltip')).toHaveTextContent(args.action?.reason ?? '');
    await expect(args.action?.onClick).not.toHaveBeenCalled();
  },
};

/** A page with nothing to do says so in the same line, so the line is always there: the state alone, with no button. */
export const NothingToDo: Story = {
  name: 'Nothing to do',
  args: { state: 'Nothing to do here: every property has a named contact.' },
  play: async ({ canvas }) => {
    await expect(canvas.queryByRole('button')).toBeNull();
  },
};

const company = { id: 'ridgeline', name: 'Ridgeline Logistics REIT' };
const sections = [{ id: 'home', label: 'Home', icon: 'home' as const }];
const cards = Array.from({ length: 6 }, (_, index) => `Metric ${index + 1}`);

/** Where it goes: straight under `PageHeader`, before the page's content, inside `AppShell`. */
export const UnderPageHeader: Story = {
  name: 'Under a page header',
  parameters: {
    layout: 'fullscreen',
    // The shell fills the viewport, so the docs page shows the story in its own frame.
    docs: { story: { inline: false, height: '480px' } },
  },
  args: { action: { label: 'Name the Contacts', onClick: fn() } },
  render: (args) => (
    <AppShell company={company} sections={sections} section="home">
      <PageHeader title="Properties" />
      <NextStep {...args} />
      <Grid container spacing={2}>
        {cards.map((title) => (
          <Grid key={title} size={{ xs: 12, sm: 6 }}>
            <Card variant="outlined" sx={{ minHeight: (theme) => theme.spacing(20) }}>
              <CardHeader title={title} />
            </Card>
          </Grid>
        ))}
      </Grid>
    </AppShell>
  ),
  play: async ({ args, canvas, userEvent }) => {
    await userEvent.click(canvas.getByRole('button', { name: 'Name the Contacts' }));
    await expect(args.action?.onClick).toHaveBeenCalledOnce();
  },
};

/** Stands in for opening the Properties page; the card story's play function checks it. */
const openProperties = fn();

/** On a clickable Overview card the step is `CardNextStep`, a plain caption under the figure: the whole card is the control, so it holds no button. */
export const OnCard: Story = {
  name: 'On an Overview card',
  render: () => (
    <Card variant="outlined" sx={{ maxWidth: 360, minHeight: (theme) => theme.spacing(20), display: 'flex', flexDirection: 'column' }}>
      <CardActionArea onClick={openProperties} sx={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'stretch' }}>
        <CardHeader title={<TruncatedText>Properties</TruncatedText>} slotProps={{ title: { component: 'h2' } }} />
        <CardContent sx={{ pt: 0, mt: 'auto' }}>
          <PlainFigure value="12" />
          <CardNextStep>Name the 3 missing contacts</CardNextStep>
        </CardContent>
      </CardActionArea>
    </Card>
  ),
  play: async ({ canvas, userEvent }) => {
    openProperties.mockClear();
    await userEvent.click(canvas.getByRole('button', { name: /Properties/ }));
    await expect(openProperties).toHaveBeenCalledOnce();
  },
};
