import Card from '@mui/material/Card';
import CardActionArea from '@mui/material/CardActionArea';
import CardContent from '@mui/material/CardContent';
import CardHeader from '@mui/material/CardHeader';
import Grid from '@mui/material/Grid';
import type { Meta, StoryObj } from '@storybook/react-vite';
import { expect, fn } from 'storybook/test';
import { AppShell } from 'src/components/AppShell';
import { CardNextStep, NextStep, NextStepExplain } from 'src/components/NextStep';
import { PageHeader } from 'src/components/PageHeader';
import { PlainFigure } from 'src/components/SourceFigure';
import { TruncatedText } from 'src/components/TruncatedText';
import { Icon } from 'src/icons';

/** Stands in for the app opening its assistant on a note; the stories' play functions check it. */
const explain = fn();
/** Stands in for the app's assistant mark, which the app passes as `icon`. */
const mark = <Icon name="smart_toy" color="secondary" />;

/**
 * Kilowatt's `NextStep`: a note bar under a page header that says where things stand in a few words,
 * with Explain to open the app's assistant on the whole note, and Dismiss. `CardNextStep` is a step as a
 * plain caption line on a clickable Overview card.
 */
const meta = {
  title: 'Data display/NextStep',
  component: NextStep,
  tags: ['!autodocs'],
  // The MUI components this page documents; docs.test.ts checks its MUI departures section against them.
  parameters: { muiComponents: ['ButtonBase', 'IconButton', 'Tooltip', 'Typography'] },
  args: { state: '3 of 12 properties have no named contact. Reports for them go to the account owner.', icon: mark },
  decorators: [
    (Story) => (
      <NextStepExplain value={explain}>
        <Story />
      </NextStepExplain>
    ),
  ],
} satisfies Meta<typeof NextStep>;

export default meta;
type Story = StoryObj<typeof meta>;

/** A note with something to do: the whole bar is a button labelled Explain, which hands the whole `state` to the app's `NextStepExplain` handler. */
export const WithAction: Story = {
  name: 'With action',
  args: { action: { label: 'Name the Contacts', onClick: fn() } },
  play: async ({ args, canvas, userEvent }) => {
    explain.mockClear();
    // The bar shows the note in a few words: the first sentence.
    await expect(canvas.getByRole('status', { name: 'Next step' })).toHaveTextContent('3 of 12 properties have no named contact');
    await expect(canvas.queryByText(/Reports for them/)).toBeNull();
    await userEvent.click(canvas.getByRole('button', { name: /Explain/ }));
    await expect(explain).toHaveBeenCalledOnce();
    await expect(explain).toHaveBeenCalledWith(args.state);
    // The bar doesn't offer the step itself.
    await expect(args.action?.onClick).not.toHaveBeenCalled();
  },
};

/** `summary` sets the few words the bar shows, where `shortNote` would cut the state badly; Explain still hands on the whole `state`. */
export const WithSummary: Story = {
  name: 'With a summary',
  args: { summary: '3 properties have no contact', action: { label: 'Name the Contacts', onClick: fn() } },
  play: async ({ args, canvas, userEvent }) => {
    explain.mockClear();
    await userEvent.click(canvas.getByRole('button', { name: /3 properties have no contact/ }));
    await expect(explain).toHaveBeenCalledOnce();
    await expect(explain).toHaveBeenCalledWith(args.state);
  },
};

/** `ask` gives the bar its own label and action in place of Explain: an invitation, not a note about a problem. */
export const Ask: Story = {
  args: { state: 'Six things need a decision this week.', ask: { label: 'Help Me Prioritize', onClick: fn() } },
  play: async ({ args, canvas, userEvent }) => {
    await userEvent.click(canvas.getByRole('button', { name: /Help Me Prioritize/ }));
    await expect(args.ask?.onClick).toHaveBeenCalledOnce();
  },
};

/** Dismiss removes the bar until the page is opened again; nothing is stored, so a note that still holds comes back. */
export const Dismissed: Story = {
  name: 'Dismiss',
  args: { action: { label: 'Name the Contacts', onClick: fn() } },
  play: async ({ canvas, userEvent }) => {
    await userEvent.click(canvas.getByRole('button', { name: 'Dismiss' }));
    await expect(canvas.queryByRole('status', { name: 'Next step' })).toBeNull();
  },
};

/** A page with nothing to do says so in the same bar: the note alone, with no label, and not a button. Dismiss stays. */
export const NothingToDo: Story = {
  name: 'Nothing to do',
  args: { state: 'Nothing to do here: every property has a named contact.' },
  play: async ({ canvas }) => {
    await expect(canvas.getByRole('status', { name: 'Next step' })).toHaveTextContent('Nothing to do here');
    await expect(canvas.queryByRole('button', { name: /Explain/ })).toBeNull();
    await expect(canvas.getByRole('button', { name: 'Dismiss' })).toBeVisible();
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
            <Card variant="outlined">
              <CardHeader title={title} />
            </Card>
          </Grid>
        ))}
      </Grid>
    </AppShell>
  ),
  play: async ({ args, canvas, userEvent }) => {
    explain.mockClear();
    await userEvent.click(canvas.getByRole('button', { name: /Explain/ }));
    await expect(explain).toHaveBeenCalledOnce();
    await expect(explain).toHaveBeenCalledWith(args.state);
  },
};

/** Stands in for opening the Properties page; the card story's play function checks it. */
const openProperties = fn();

/** On a clickable Overview card the step is `CardNextStep`, a plain caption under the figure: the whole card is the control, so it holds no button. */
export const OnCard: Story = {
  name: 'On an Overview card',
  render: () => (
    <Card variant="outlined" sx={{ maxWidth: 360, display: 'flex', flexDirection: 'column' }}>
      <CardActionArea onClick={openProperties} sx={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'stretch' }}>
        <CardHeader title={<TruncatedText>Properties</TruncatedText>} slotProps={{ title: { component: 'h2' } }} />
        <CardContent sx={{ mt: 'auto' }}>
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
