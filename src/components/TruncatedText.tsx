import { useEffect, useRef, useState } from 'react';
import Tooltip from '@mui/material/Tooltip';
import Typography from '@mui/material/Typography';

export type TruncatedTextProps = {
  /** The full text. It shows on one line, cut off with an ellipsis when it doesn't fit, and in full in the tooltip. */
  children: string;
};

/**
 * One line of text that truncates with an ellipsis and, only when it's cut off, shows the full text in
 * a `Tooltip` on hover and keyboard focus. It inherits its parent's type, so it reads the same as
 * plain text: use it for a `CardHeader` title or subheader, or any label that has to stay on one line.
 *
 * @summary One line of text that truncates, with the full text in a tooltip when it's cut off.
 * @import import { TruncatedText } from 'src/components/TruncatedText';
 */
export function TruncatedText({ children }: TruncatedTextProps) {
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
    <Tooltip title={truncated ? children : ''}>
      {/* Focusable only while cut off, so keyboard users can open the tooltip too. */}
      <Typography ref={ref} component="span" variant="inherit" noWrap tabIndex={truncated ? 0 : undefined} sx={{ display: 'block' }}>
        {children}
      </Typography>
    </Tooltip>
  );
}
