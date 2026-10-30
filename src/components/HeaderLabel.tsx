import { useEffect, useRef, useState } from 'react';
import Box from '@mui/material/Box';
import Tooltip from '@mui/material/Tooltip';
import Typography from '@mui/material/Typography';

export type HeaderLabelProps = {
  /** The header's text. */
  children: string;
  /** Set inside a `TableSortLabel`: a button can't hold a focusable element, and the button's name is already the full text. Default `false`. */
  inButton?: boolean;
};

/**
 * A table column header's text: one line that truncates with an ellipsis rather than wrapping, and shows
 * the full text in a `Tooltip` when it's cut off. The header sizes its column as wrapped text would: at
 * least its longest word, its whole text when there's room. It turns focusable while cut off, so
 * keyboard users can open the tooltip, except `inButton`.
 *
 * @summary A table header's one-line text, truncated with a tooltip, each column at least its longest word.
 * @import import { HeaderLabel } from 'src/components/HeaderLabel';
 */
export function HeaderLabel({ children, inButton = false }: HeaderLabelProps) {
  const ref = useRef<HTMLSpanElement>(null);
  const [truncated, setTruncated] = useState(false);

  useEffect(() => {
    const element = ref.current;
    if (!element) return;
    const measure = () => setTruncated(element.scrollWidth > element.clientWidth);
    measure();
    const observer = new ResizeObserver(measure);
    observer.observe(element);
    return () => observer.disconnect();
  }, [children]);

  return (
    <Box component="span" sx={{ display: 'grid' }}>
      <Tooltip title={truncated ? children : ''}>
        <Typography ref={ref} component="span" variant="inherit" noWrap tabIndex={truncated && !inButton ? 0 : undefined} sx={{ display: 'block', gridArea: '1 / 1' }}>
          {children}
        </Typography>
      </Tooltip>
      {/* The column's minimum: the text as it would wrap, invisible and taking no height. */}
      <Box component="span" aria-hidden sx={{ gridArea: '1 / 1', height: 0, visibility: 'hidden' }}>
        {children}
      </Box>
    </Box>
  );
}
