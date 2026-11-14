import { useId } from 'react';
import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import CardHeader from '@mui/material/CardHeader';
import Chip, { type ChipProps } from '@mui/material/Chip';
import CardActionArea from '@mui/material/CardActionArea';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';
import { MonthBars, type MonthBarsProps } from './MonthBars';
import { TruncatedText } from './TruncatedText';

/** One feed's strip in a `CompletenessCard`: its name at the left, then its month bars. */
export type CompletenessRow = Pick<MonthBarsProps, 'months' | 'summary' | 'placeholder' | 'overlay'> & {
  /** The feed's name: `Electricity`. */
  label: string;
};

export type CompletenessCardProps = {
  /** What the card is about: a property's name. */
  title: string;
  /** A line under the title: `Office · Springfield, OR`. Default none. */
  subheader?: string;
  /** Makes the whole card a button that opens the thing it is about, named for screen readers (`Open Harbor Point: sets it as your scope`), its content as the description. Default none: a plain card. */
  open?: { onClick: () => void; label: string };
  /** A status chip at the top right, so a column of cards scans by its right edge: `{ label: 'Healthy', color: 'success' }`. Default none. */
  status?: { label: string; color: ChipProps['color'] };
  /** One line of counts above the strips, at the right so figures line up down a column of cards: `3/4 feeds complete · 2 open items`. Default none. */
  caption?: string;
  /** One strip per feed, each stretched to one month axis. */
  rows: CompletenessRow[];
  /** Under the strips, the period's first month at the left: `Jan 2025`. */
  start: string;
  /** Under the strips at the right: the latest month with data, `Last data · Oct 2025`. */
  end: string;
};

/**
 * One card in a grid that scans the health of many things' data at once: every card the same shape, so the eye learns
 * the layout once and then reads color. With `open`, the whole card opens the thing (its month bars take no focus then).
 * The title over a subheader, a status
 * chip at the top right, a line of counts, then one `MonthBars` strip per feed, stretched to one month axis, with the
 * period's first month and the latest month with data under them. Lay the cards out in MUI's `Grid`, sorted least
 * complete first, with `MonthBarsLegend` above them and the rule the bars follow written under them.
 *
 * @summary A card of month-bar strips, one per feed, for a grid that scans data completeness.
 * @import import { CompletenessCard } from 'src/components/CompletenessCard';
 */
export function CompletenessCard({ title, subheader, open, status, caption, rows, start, end }: CompletenessCardProps) {
  const detailsId = useId();
  const content = (
    <>
      <CardHeader
        title={<TruncatedText>{title}</TruncatedText>}
        slotProps={{ title: { component: 'h2' } }}
        subheader={subheader && <TruncatedText>{subheader}</TruncatedText>}
        // The chip takes the action slot, in a box the height of the icon button the slot is laid out for, so it sits level with the title.
        action={
          status && (
            <Box sx={{ display: 'flex', alignItems: 'center', height: (t) => t.spacing(5) }}>
              <Chip size="small" color={status.color} variant="outlined" label={status.label} />
            </Box>
          )
        }
      />
      <CardContent id={detailsId} sx={{ pt: 0, mt: 'auto', display: 'flex', flexDirection: 'column', gap: 1 }}>
        {caption && (
          <Typography variant="caption" sx={{ color: 'text.secondary', alignSelf: 'flex-end', fontVariantNumeric: 'tabular-nums' }}>
            {caption}
          </Typography>
        )}
        <Stack component="dl" sx={{ gap: 0.75, m: 0 }}>
          {rows.map(({ label, ...bars }) => (
            <Stack key={label} direction="row" sx={{ alignItems: 'center', gap: 1.5 }}>
              <Typography component="dt" variant="caption" sx={{ color: 'text.secondary', width: (t) => t.spacing(9), flex: 'none' }}>
                {label}
              </Typography>
              <Box component="dd" sx={{ m: 0, flex: 1, minWidth: 0, display: 'flex' }}>
                <MonthBars {...bars} stretch focusable={!open} />
              </Box>
            </Stack>
          ))}
        </Stack>
        {/* Time reads left to right, oldest to newest. */}
        <Stack direction="row" sx={{ justifyContent: 'space-between', gap: 1 }}>
          <Typography variant="caption" sx={{ color: 'text.secondary' }}>
            {start}
          </Typography>
          <Typography variant="caption" sx={{ color: 'text.secondary' }}>
            {end}
          </Typography>
        </Stack>
      </CardContent>
    </>
  );
  return (
    <Card variant="outlined" sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      {open ? (
        // One button for the whole card, named by `open.label` and described by its content (Card → Clickable).
        <CardActionArea onClick={open.onClick} aria-label={open.label} aria-describedby={detailsId} sx={{ height: '100%', display: 'flex', flexDirection: 'column', alignItems: 'stretch' }}>
          {content}
        </CardActionArea>
      ) : (
        content
      )}
    </Card>
  );
}
