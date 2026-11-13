import Button from '@mui/material/Button';
import Stack from '@mui/material/Stack';
import Tooltip from '@mui/material/Tooltip';
import Typography from '@mui/material/Typography';
import { Icon } from '../icons';

/** The step a page offers: a text button that does it, or opens where it is done. */
export type NextStepAction = {
  /** The step, as the button's label, in Title Case: “Name the Contacts”. */
  label: string;
  /** What the button does: the step itself, or opening where it is done. */
  onClick: () => void;
  /** The step can't be taken right now; the button is disabled and `reason` says why. Default `false`. */
  disabled?: boolean;
  /** Why the step can't be taken, shown in a tooltip on the disabled button. Default none. */
  reason?: string;
};

export type NextStepProps = {
  /** Where things stand, in one sentence: “3 of 12 properties have no named contact.”, or “Nothing to do here: …” when there is no step. */
  state: string;
  /** The step: the button after the state. Default none, and the line is the state alone. */
  action?: NextStepAction;
};

/**
 * A page's call to action: one line under the page header that tells the person where things stand
 * and what to do next. An arrow in the primary color leads, the state follows in words, and the step
 * is a text button that does it or opens where it is done. A page with nothing to do says so in the
 * same line (“Nothing to do here: …”), so the line is always there and the person learns to read it.
 * The line is a `status` region named “Next step”, and it leaves 24px under itself for the page's
 * content, as `PageHeader` does. A step that can't be taken yet is a disabled button with its reason
 * in a tooltip, on a wrapper so the tooltip still opens.
 *
 * @summary One line under a page header: the state in words and the next step as a text button.
 * @import import { NextStep } from 'src/components/NextStep';
 */
export function NextStep({ state, action }: NextStepProps) {
  const button = action && (
    <Button variant="text" onClick={action.onClick} disabled={action.disabled} endIcon={<Icon name="keyboard_arrow_right" />}>
      {action.label}
    </Button>
  );
  return (
    <Stack direction="row" role="status" aria-label="Next step" sx={{ alignItems: 'center', gap: 1, flexWrap: 'wrap', mb: 3 }}>
      <Icon name="arrow_right_alt" color="primary" />
      <Typography variant="body2" sx={{ color: 'text.secondary' }}>
        {state}
      </Typography>
      {action &&
        (action.disabled && action.reason ? (
          // A disabled button fires no events, so the tooltip wraps it (MUI → Tooltip → Disabled elements).
          <Tooltip title={action.reason}>
            <span>{button}</span>
          </Tooltip>
        ) : (
          button
        ))}
    </Stack>
  );
}

export type CardNextStepProps = {
  /** The step, in one short line: “Name the 3 missing contacts”. */
  children: string;
};

/**
 * The next step on a clickable Overview card: one caption line in the primary color, led by the same
 * arrow as `NextStep`, 8px under the card's figure. It is plain text, not a button, because the whole
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
