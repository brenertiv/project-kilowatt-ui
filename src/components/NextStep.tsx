import { createContext, useContext, useState, type ReactNode } from 'react';
import Box from '@mui/material/Box';
import ButtonBase from '@mui/material/ButtonBase';
import IconButton from '@mui/material/IconButton';
import Stack from '@mui/material/Stack';
import type { Theme } from '@mui/material/styles';
import Tooltip from '@mui/material/Tooltip';
import Typography from '@mui/material/Typography';
import { Icon } from '../icons';

/**
 * A note in a few words: the first sentence of the state, without what follows a colon (a label of one or two
 * words before a colon is kept), a bracket, a semicolon or a comma. The bar shows it, and Explain still hands on
 * the whole state.
 *
 * @summary Shortens a page's state to the few words the note bar shows.
 * @import import { shortNote } from 'src/components/NextStep';
 */
export function shortNote(state: string): string {
  let text = state.split(/\.(\s|$)/)[0];
  let label = '';
  const colon = text.indexOf(': ');
  if (colon > 0) {
    const head = text.slice(0, colon);
    if (head.split(' ').length <= 2) {
      label = `${head}: `;
      text = text.slice(colon + 2);
    } else text = head;
  }
  text = text.split(/ \(|; |, /)[0];
  return `${label}${text}`;
}

/**
 * What Explain does with a note: the app provides it once, and gets the whole `state` when the bar is pressed,
 * to open its assistant on it. Without a provider a note has no Explain and is not a button. Default none.
 *
 * @summary The app's handler for a note bar's Explain.
 * @import import { NextStepExplain } from 'src/components/NextStep';
 */
export const NextStepExplain = createContext<((state: string) => void) | undefined>(undefined);

/**
 * The step a page has for the person. The bar doesn't draw it: it tells a note with something to do, which has
 * Explain, from a note with nothing to do, which doesn't.
 */
export type NextStepAction = {
  /** The step, in Title Case: “Name the Contacts”. */
  label: string;
  /** The step itself, or opening where it is done. The bar never calls it; the page offers the step in its own content. */
  onClick: () => void;
  /** The step can't be taken right now. Default `false`. */
  disabled?: boolean;
  /** Why the step can't be taken. Default none. */
  reason?: string;
};

export type NextStepProps = {
  /** Where things stand, in one sentence naming the problem: “3 of 12 properties have no named contact.”, or “Nothing to do here: …” when there is no step. Explain hands on the whole sentence. */
  state: string;
  /** The note in a few words, which is what the bar shows. Default `shortNote(state)`. */
  summary?: string;
  /** The step the page has. With it, and a `NextStepExplain` provider, the bar is a button labelled Explain. Default none, and the bar is the note alone. */
  action?: NextStepAction;
  /** The bar's own label and what pressing it does, in place of Explain: `{ label: 'Help Me Prioritize', onClick }`. Default none. */
  ask?: { label: string; onClick: () => void };
  /** A mark before the note saying whose note it is, such as the app's assistant mark at 24px. Decorative: hide it from assistive technology. Default none. */
  icon?: ReactNode;
};

/**
 * A page's note bar: one bar under the page header, the page's width and at least 48px tall, on the paper surface
 * with a `border.level0` edge. A mark leads (`icon`), the note follows in a few words (`summary`, or
 * `shortNote(state)`) in `subtitle2` and `secondary.main`, and a label ends it: Explain with the `chat` icon, which
 * hands the whole `state` to the app's `NextStepExplain` handler, or the bar's own `ask`. The mark, the note and
 * the label are one button with MUI's hover tint; Dismiss is an icon button beside it, and removes the bar until
 * the page is opened again (nothing is stored). A note with nothing to do (“Nothing to do here: …”) has no label
 * and is not a button. The bar is a `status` region named “Next step”, and it leaves 24px under itself for the
 * page's content, as `PageHeader` does.
 *
 * @summary A note bar under a page header: the state in a few words, Explain to open the assistant on it, and Dismiss.
 * @import import { NextStep } from 'src/components/NextStep';
 */
export function NextStep({ state, summary, action, ask, icon }: NextStepProps) {
  // Dismissed, the bar is gone until the page is opened again; nothing remembers it, so a note that still holds comes back.
  const [dismissed, setDismissed] = useState(false);
  const explain = useContext(NextStepExplain);
  if (dismissed) return null;
  // What the bar does when pressed: its own `ask`, else Explain on a note that has a step.
  const open = ask ? { label: ask.label, onClick: ask.onClick } : action && explain ? { label: 'Explain', onClick: () => explain(state) } : undefined;
  const note = (
    <>
      {icon}
      {/* The note takes the row's free width, so the label sits at the bar's end. */}
      <Typography variant="subtitle2" component="span" sx={{ color: 'secondary.main', flex: 1, minWidth: 0, textAlign: 'start' }}>
        {summary ?? shortNote(state)}
      </Typography>
    </>
  );
  const row = { display: 'flex', alignItems: 'center', gap: 1, flex: 1, minWidth: 0, pl: 2, py: 0.5, minHeight: (theme: Theme) => theme.spacing(6) };
  return (
    <Stack
      direction="row"
      role="status"
      aria-label="Next step"
      sx={{
        alignItems: 'stretch',
        mb: 3,
        borderRadius: 1,
        overflow: 'hidden',
        bgcolor: 'background.paper',
        border: 1,
        borderColor: 'border.level0',
        transition: (theme) => theme.transitions.create('background-color', { duration: theme.transitions.duration.shortest }),
        ...(open ? { '&:hover': { bgcolor: 'action.hover' } } : {}),
      }}
    >
      {open ? (
        // The mark, the note and the label are one button, the bar's width less Dismiss, which stays a button of
        // its own beside it (a button can't hold another).
        <ButtonBase onClick={open.onClick} sx={{ ...row, pr: 1, justifyContent: 'flex-start', font: 'inherit', '&.Mui-focusVisible': { bgcolor: 'action.focus' } }}>
          {note}
          <Typography variant="button" component="span" sx={{ color: 'secondary.main', display: 'inline-flex', alignItems: 'center', gap: 1, flex: 'none', px: 1 }}>
            {open.label}
            <Icon name="chat" />
          </Typography>
        </ButtonBase>
      ) : (
        <Box sx={row}>{note}</Box>
      )}
      <Box sx={{ display: 'flex', alignItems: 'center', pr: 1 }}>
        <Tooltip title="Dismiss">
          <IconButton aria-label="Dismiss" onClick={() => setDismissed(true)} sx={{ color: 'text.secondary' }}>
            <Icon name="close" />
          </IconButton>
        </Tooltip>
      </Box>
    </Stack>
  );
}

export type CardNextStepProps = {
  /** The step, in one short line: “Name the 3 missing contacts”. */
  children: string;
};

/**
 * The next step on a clickable Overview card: one caption line in the primary color, led by an
 * arrow (`arrow_right_alt`), 8px under the card's figure. It is plain text, not a button, because the whole
 * card is the control (`CardActionArea`) and a button can hold no other control; opening the card
 * leads to where the step is taken.
 *
 * @summary The next step as a plain caption line under a clickable card's figure.
 * @import import { CardNextStep } from 'src/components/NextStep';
 */
export function CardNextStep({ children }: CardNextStepProps) {
  return (
    <Typography variant="caption" component="p" sx={{ color: 'primary.main', mt: 1, display: 'flex', alignItems: 'center', gap: 0.5 }}>
      <Icon name="arrow_right_alt" fontSize="inherit" />
      {children}
    </Typography>
  );
}
