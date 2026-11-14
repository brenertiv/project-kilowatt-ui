/**
 * The cards an assistant thread shows beyond plain text: the confirm card before anything is written, and
 * the not-bought card for a question about a product outside the account. Each is an outlined MUI `Card` set
 * in the thread's `body2`, narrow enough for a drawer, so the thread's message kinds stay few and alike.
 */
import Button from '@mui/material/Button';
import Card from '@mui/material/Card';
import CardActions from '@mui/material/CardActions';
import CardContent from '@mui/material/CardContent';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';
import { Icon } from '../icons';

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

const askedDate = new Intl.DateTimeFormat(undefined, { dateStyle: 'long' });

export type NotBoughtCardProps = {
  /** The product the question needs, as it's sold: "Carbon Planning". */
  product: string;
  /** The company whose account it isn't part of: "Northwind Holdings". */
  company: string;
  /** When the account team was asked, in epoch milliseconds. Set, the card says so and drops its action. Default none: the card offers to ask. */
  requested?: number;
  /** Called when the person asks their account team; the owner records when on `requested`. Default none: the action is disabled, for a thread that's read-only. */
  onRequest?: () => void;
};

/**
 * The card an assistant shows when a question needs a product the account doesn't include: a lock, one line
 * saying the product isn't part of the company's account, and one action that asks the account team. Once
 * asked, the card says when, and the action goes. Quiet by design: it's an answer, not a sales pitch.
 *
 * @summary An assistant's not-bought card: the product isn't in the account, with one ask to the account team.
 * @import import { NotBoughtCard } from 'src/components/AssistantCards';
 */
export function NotBoughtCard({ product, company, requested, onRequest }: NotBoughtCardProps) {
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
            {requested !== undefined && <Typography variant="body2">You asked your account team on {askedDate.format(requested)}. They’ll be in touch.</Typography>}
          </Stack>
        </Stack>
      </CardContent>
      {requested === undefined && (
        <CardActions>
          <Button disabled={!onRequest} onClick={onRequest}>
            Ask Your Account Team About It
          </Button>
        </CardActions>
      )}
    </Card>
  );
}
