import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import CardHeader from '@mui/material/CardHeader';
import Chip, { type ChipProps } from '@mui/material/Chip';
import Link from '@mui/material/Link';
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
  /** Makes the title a link button that opens the thing the card is about, and names it for screen readers (`Open Harbor Point: sets it as your scope`). Default none: plain text. */
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
 * the layout once and then reads color. The title (a link that opens the thing, with `open`) over a subheader, a status
 * chip at the top right, a line of counts, then one `MonthBars` strip per feed, stretched to one month axis, with the
 * period's first month and the latest month with data under them. Lay the cards out in MUI's `Grid`, sorted least
 * complete first, with `MonthBarsLegend` above them and the rule the bars follow written under them.
 *
 * @summary A card of month-bar strips, one per feed, for a grid that scans data completeness.
 * @import import { CompletenessCard } from 'src/components/CompletenessCard';
 */
export function CompletenessCard({ title, subheader, open, status, caption, rows, start, end }: CompletenessCardProps) {
  return (
    <Card variant="outlined" sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      <CardHeader
        // The name opens the thing as the tables' name columns do, with the same ellipsis.
        title={
          open ? (
            <Link
              component="button"
              onClick={open.onClick}
              aria-label={open.label}
              sx={{ font: 'inherit', color: 'inherit', textAlign: 'start', maxWidth: '100%', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', display: 'block' }}
            >
              {title}
            </Link>
          ) : (
            <TruncatedText>{title}</TruncatedText>
          )
        }
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
      <CardContent sx={{ pt: 0, mt: 'auto', display: 'flex', flexDirection: 'column', gap: 1 }}>
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
                <MonthBars {...bars} stretch />
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
    </Card>
  );
}
