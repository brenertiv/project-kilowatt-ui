import { useState, type ReactNode } from 'react';
import Box from '@mui/material/Box';
import Chip from '@mui/material/Chip';
import Collapse from '@mui/material/Collapse';
import { keyframes } from '@mui/material/styles';
import useMediaQuery from '@mui/material/useMediaQuery';
import { Icon, type IconName } from 'src/icons';

// The tint: the brand blue (`secondary.light`) at MUI's selected and focus opacities together, a step stronger (plus the
// hover opacity) on hover and keyboard focus, as MUI tints a selected item.
const tint = (opacity: string) => `rgba(var(--mui-palette-secondary-lightChannel) / ${opacity})`;
const layer = (color: string) => `linear-gradient(${color}, ${color})`;
const rest = tint('calc(var(--mui-palette-action-selectedOpacity) + var(--mui-palette-action-focusOpacity))');
const hover = tint('calc(var(--mui-palette-action-selectedOpacity) + var(--mui-palette-action-focusOpacity) + var(--mui-palette-action-hoverOpacity))');

// The alert: a ring of the marker's own color grows out and fades, then rests, once every three seconds.
const ping = keyframes`
  0% { transform: scale(1); opacity: 0.5; }
  40% { transform: scale(1.7); opacity: 0; }
  100% { transform: scale(1.7); opacity: 0; }
`;

export type MarkerChipProps = {
  /** The icon, from `src/icons`: `lightbulb` for savings. */
  icon: IconName;
  /** What the marker stands for, shown when it widens on hover or keyboard focus: "$12,400 a year". */
  label: string;
  /** The accessible name: what it is, where, and the label's words, ending in what a click does ("2 savings opportunities on Energy Use, $12,400 a year. Open"). */
  'aria-label': string;
  /** Whether what it marks is unread: a ring pulses out every 3 seconds, stopping while it's pointed at and under reduced motion. Set it false once it's been opened. Default `false`. */
  alerting?: boolean;
  /** `'small'` (24px) beside a title or in a row; `'medium'` (32px) on a card's corner. Default `'medium'`. */
  size?: 'small' | 'medium';
  /** Opens what it marks. A marker in a clickable row stops the click there, so the row doesn't open too. */
  onClick: () => void;
};

/**
 * A marker that says something lives on the card, row or title beside it: a round, icon-only `Chip`
 * in the brand-blue tint that widens to its label on hover or keyboard focus, never on touch, and
 * opens what it marks. While what it marks is unread, a ring pulses out from it every 3 seconds.
 * One marker per place, never one per item.
 *
 * @summary A round icon chip in the brand-blue tint that widens to its label on hover or focus and pulses while unread.
 * @import import { MarkerChip } from 'src/components/MarkerChip';
 */
export function MarkerChip({ icon, label, 'aria-label': ariaLabel, alerting = false, size = 'medium', onClick }: MarkerChipProps) {
  // A screen with a pointer that can hover; on touch screens the marker stays an icon and a tap opens it.
  const canHover = useMediaQuery('(hover: hover) and (pointer: fine)');
  const [pointed, setPointed] = useState(false);
  const small = size === 'small';
  // Round while it's only the icon: the icon and its margins make a square the chip's height (MUI's small chip icon is
  // 18px in a 24px chip; the medium chip's icon is 24px in a 32px chip).
  const margin = small ? 0.375 : 0.5;
  return (
    <Chip
      size={small ? 'small' : undefined}
      icon={<Icon name={icon} />}
      label={
        <Collapse orientation="horizontal" in={canHover && pointed}>
          <Box component="span" sx={{ display: 'block', whiteSpace: 'nowrap', pr: small ? 1 : 1.5 }}>
            {label}
          </Box>
        </Collapse>
      }
      onClick={(event) => {
        event.stopPropagation();
        onClick();
      }}
      onMouseEnter={() => setPointed(true)}
      onMouseLeave={() => setPointed(false)}
      onFocus={(event) => setPointed(event.currentTarget.matches(':focus-visible'))}
      onBlur={() => setPointed(false)}
      aria-label={ariaLabel}
      sx={{
        position: 'relative',
        isolation: 'isolate',
        overflow: 'visible',
        // The tint is laid over the paper surface, so a card's border doesn't show through where the marker overhangs it.
        bgcolor: 'background.paper',
        backgroundImage: layer(rest),
        color: 'secondary.main',
        '&.MuiChip-clickable:hover, &.Mui-focusVisible': { bgcolor: 'background.paper', backgroundImage: layer(hover) },
        '& .MuiChip-icon': { color: 'secondary.main', mx: margin },
        '& .MuiChip-label': { px: 0 },
        ...(alerting &&
          !pointed && {
            '&::after': {
              content: '""',
              position: 'absolute',
              inset: 0,
              zIndex: -1,
              borderRadius: 'inherit',
              border: 2,
              borderColor: 'secondary.main',
              pointerEvents: 'none',
              animation: `${ping} 3s ease-out infinite`,
              '@media (prefers-reduced-motion: reduce)': { animation: 'none', opacity: 0 },
            },
          }),
      }}
    />
  );
}

export type MarkedCardProps = {
  /** The card's `MarkerChip`, or nothing, which leaves the corner empty. */
  marker?: ReactNode;
  /** The card. */
  children: ReactNode;
};

/**
 * A card with a `MarkerChip` over its top-left corner, outside the card's bounds, so the marker widens
 * to the right over the title without pushing it.
 *
 * @summary A card with its marker over the top-left corner, widening over the title.
 * @import import { MarkedCard } from 'src/components/MarkerChip';
 */
export function MarkedCard({ marker, children }: MarkedCardProps) {
  return (
    <Box sx={{ position: 'relative', height: '100%' }}>
      {children}
      {/* Offset by a fixed amount rather than a share of its width, so widening grows to the right and the icon stays put. */}
      <Box sx={{ position: 'absolute', top: (theme) => theme.spacing(-1.5), left: (theme) => theme.spacing(-1.5), zIndex: 1, '&:empty': { display: 'none' } }}>{marker}</Box>
    </Box>
  );
}
