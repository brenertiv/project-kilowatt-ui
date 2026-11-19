import Tooltip from '@mui/material/Tooltip';
import Typography from '@mui/material/Typography';
import { Icon } from '../icons';

/** Why a value isn't there, in the words a reader sees. */
export type DataMarkState = 'Missing' | 'Never measured' | 'Not observable' | 'Not bought' | 'Outside your access';

export type DataMarkProps = {
  /** The state word, which leads the tooltip and the accessible name. Default `'Missing'`. */
  state?: DataMarkState;
  /** One sentence saying why there is no value: which bill, reading or source is absent. It follows the state word. */
  reason: string;
};

/**
 * The missing mark: a dash with a marker icon where a value would be, with the state word and the reason in a
 * `Tooltip` on hover and keyboard focus, and as its accessible name. It stands for a value that doesn't exist, so a
 * cell never shows a bare dash and never 0. It is a tab stop, so a keyboard reaches the reason. Use one mark
 * everywhere a value can be absent: a table cell, a tile, a report's figure.
 *
 * @summary The missing mark: a dash and a marker where a value would be, its state and reason in a tooltip.
 * @import import { DataMark } from 'src/components/DataMark';
 */
export function DataMark({ state = 'Missing', reason }: DataMarkProps) {
  const label = `${state}. ${reason}`;
  return (
    <Tooltip title={label}>
      <Typography
        component="span"
        variant="body2"
        color="textSecondary"
        role="img"
        tabIndex={0}
        aria-label={label}
        sx={{ display: 'inline-flex', alignItems: 'center', gap: 0.5, cursor: 'help' }}
      >
        –<Icon name="help" fontSize="inherit" />
      </Typography>
    </Tooltip>
  );
}
