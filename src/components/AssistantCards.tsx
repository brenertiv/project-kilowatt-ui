/**
 * The cards an assistant thread shows beyond plain text: the confirm card before anything is written, the
 * not-bought card for a question about a product outside the account, and the chart card an answer embeds.
 * Each is an outlined MUI `Card` set in the thread's `body2`, narrow enough for a drawer, so the thread's
 * message kinds stay few and alike.
 */
import { useMemo } from 'react';
import Button from '@mui/material/Button';
import Card from '@mui/material/Card';
import CardActions from '@mui/material/CardActions';
import CardContent from '@mui/material/CardContent';
import CardHeader from '@mui/material/CardHeader';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';
import { ColumnChart } from '../charts/ColumnChart';
import { Icon } from '../icons';
import { ProvenanceFigure, type CitedFigure } from './ProvenancePopover';

/** What a confirm card asks, and how it came out. */
export type ConfirmRequest = {
  /** The action, as the card's title: "Create a work order at Harbor Point". */
  action: string;
  /** What will change if it's confirmed, in a sentence or two. */
  detail: string;
  /** The Confirm button's label, naming what it does: "Create Work Order". */
  confirmLabel: string;
  /** The Cancel button's label, naming what it does: "Don’t Create". */
  cancelLabel: string;
  /** What the card says once confirmed: "Work order 4821 created." */
  doneText: string;
  /** How it came out, once settled. Unset, the card still asks. */
  outcome?: 'confirmed' | 'cancelled';
};

export type ConfirmCardProps = {
  /** The action to confirm, what it changes, the two labels, the done text, and the outcome once there is one. */
  request: ConfirmRequest;
  /** Called with the outcome when either button is pressed; the owner records it on `request.outcome`. Default none: the buttons are disabled, for a thread that's read-only. */
  onSettle?: (outcome: 'confirmed' | 'cancelled') => void;
};

/**
 * The card an assistant shows before anything is written: the action as its title, what will change under it,
 * then a contained Confirm and a text Cancel, each labelled with what it does. Once settled the buttons go
 * and the card says what happened, with a check for confirmed and a cross for cancelled, so the thread keeps
 * the record. The card holds no state: the owner sets `request.outcome` from `onSettle`.
 *
 * @summary An assistant's confirm card: the action, what changes, Confirm and Cancel, then the outcome.
 * @import import { ConfirmCard } from 'src/components/AssistantCards';
 */
export function ConfirmCard({ request, onSettle }: ConfirmCardProps) {
  const confirmed = request.outcome === 'confirmed';
  return (
    <Card variant="outlined" component="section" aria-label={`Confirm: ${request.action}`}>
      <CardContent>
        <Stack sx={{ gap: 0.5 }}>
          <Typography variant="subtitle2" component="h3">
            {request.action}
          </Typography>
          <Typography variant="body2" sx={{ color: 'text.secondary' }}>
            {request.detail}
          </Typography>
          {request.outcome && (
            <Stack direction="row" sx={{ gap: 1, alignItems: 'flex-start', pt: 1 }}>
              <Icon name={confirmed ? 'check_circle' : 'close'} fontSize="small" color={confirmed ? 'success' : 'inherit'} />
              <Typography variant="body2">{confirmed ? request.doneText : 'Cancelled. Nothing changed.'}</Typography>
            </Stack>
          )}
        </Stack>
      </CardContent>
      {!request.outcome && (
        <CardActions>
          <Button variant="contained" disabled={!onSettle} onClick={() => onSettle?.('confirmed')}>
            {request.confirmLabel}
          </Button>
          <Button disabled={!onSettle} onClick={() => onSettle?.('cancelled')}>
            {request.cancelLabel}
          </Button>
        </CardActions>
      )}
    </Card>
  );
}

export type NotBoughtCardProps = {
  /** The product the question needs, as it's sold: "Carbon Planning". */
  product: string;
  /** The company whose account it isn't part of: "Northwind Holdings". */
  company: string;
  /** Called when the person presses See What It Does; the owner opens the product's own page, where asking the account team lives. Default none: the card has no action, for a product with no page of its own. */
  onSeeWhatItDoes?: () => void;
};

/**
 * The card an assistant shows when a question needs a product the account doesn't include: a lock, one line
 * saying the product isn't part of the company's account, and one action, See What It Does, that opens the
 * product's own page. Quiet by design: it's an answer, not a sales pitch.
 *
 * @summary An assistant's not-bought card: the product isn't in the account, with See What It Does.
 * @import import { NotBoughtCard } from 'src/components/AssistantCards';
 */
export function NotBoughtCard({ product, company, onSeeWhatItDoes }: NotBoughtCardProps) {
  return (
    <Card variant="outlined" component="section" aria-label={`${product} isn’t in your account`}>
      <CardContent>
        <Stack direction="row" sx={{ gap: 1, alignItems: 'flex-start' }}>
          <Icon name="lock" fontSize="small" sx={{ color: 'text.secondary' }} />
          <Stack sx={{ gap: 0.5, minWidth: 0 }}>
            <Typography variant="subtitle2" component="h3">
              Data-ready, not in your account yet
            </Typography>
            <Typography variant="body2" sx={{ color: 'text.secondary' }}>
              {product} isn’t part of {company}’s account.
            </Typography>
          </Stack>
        </Stack>
      </CardContent>
      {onSeeWhatItDoes && (
        <CardActions>
          <Button onClick={onSeeWhatItDoes}>See What It Does</Button>
        </CardActions>
      )}
    </Card>
  );
}

/** A chart an answer embeds, kept as data so the thread and anything made from it draw the same card. */
export type AnswerChart = {
  /** The card's title, in title case, saying what's measured: "Electricity Use". */
  title: string;
  /** The card's figure, shown first, with where it comes from. */
  figure: CitedFigure;
  /** One row per month, oldest first: the month's label on the axis, and its value in `unit`. */
  data: { month: string; value: number }[];
  /** The series' name in the tooltip, in sentence case: "Electricity use". */
  series: string;
  /** The unit of the values, above the value axis and in the tooltip: `kWh`. */
  unit: string;
  /** One sentence on what the chart shows, with the numbers that matter: the chart's accessible name. */
  summary: string;
};

export type AnswerChartCardProps = {
  /** The chart: its title, figure, months, series name, unit and summary. Keep it stable (the message's own object): the chart is rebuilt when its data changes. */
  chart: AnswerChart;
  /** Called with a link's `to` when a link in the figure's popover is followed; the popover closes first. */
  onNavigate: (to: string) => void;
  /** The plot's height in pixels. Default `160`, short enough for a thread. */
  height?: number;
};

/**
 * The chart card an assistant's answer embeds: a card from the system, never a new kind of chart. An outlined
 * card under a title-only header, the figure first, opening where it comes from (`ProvenanceFigure`), then a
 * `ColumnChart` of the months behind it. The card holds no state, so the same `chart` draws the same card in
 * the thread and anywhere the answer is carried to.
 *
 * @summary An assistant's chart card: a title, the figure with its provenance, and a column chart by month.
 * @import import { AnswerChartCard } from 'src/components/AssistantCards';
 */
export function AnswerChartCard({ chart, onNavigate, height = 160 }: AnswerChartCardProps) {
  // ColumnChart is rebuilt when its data or series change, so both stay stable for one chart.
  const series = useMemo(() => [{ field: 'value', name: chart.series }], [chart.series]);
  const data = useMemo(() => chart.data.map(({ month, value }) => ({ month, value })), [chart.data]);
  return (
    <Card variant="outlined" component="section" aria-label={chart.title}>
      <CardHeader title={chart.title} />
      <CardContent sx={{ pt: 0, pb: 0 }}>
        <Typography variant="h4" component="p">
          <ProvenanceFigure figure={chart.figure} onNavigate={onNavigate} />
        </Typography>
      </CardContent>
      <ColumnChart data={data} categoryField="month" series={series} unit={chart.unit} summary={chart.summary} height={height} />
    </Card>
  );
}
