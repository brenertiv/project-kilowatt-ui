import Box from '@mui/material/Box';
import Tooltip from '@mui/material/Tooltip';
import { useTranslation } from 'react-i18next';
import { InfoIcon } from '../../icons';
import { displayName } from './placeholder';

export type EntityNameProps = {
  /** The record's name as the API sent it. Placeholder values such as `???`, `0` or empty become "Unnamed {noun}", in italics with a hint naming the raw value. */
  name: string | null | undefined;
  /** What the record is, for the fallback name: "meter", "work order". */
  noun: string;
};

/**
 * A record's name inline, with placeholder names replaced and explained. Use it wherever a record's name appears
 * in text, a list row or a table cell, so a raw `???` is never printed as a name. `EntityCard` already does this
 * for its title. For a relation that may be a bare id, use `RelationLink`.
 *
 * @summary A record's name, with placeholder values replaced by "Unnamed {noun}" and a hint.
 * @import import { EntityName } from 'src/components/data';
 */
export function EntityName({ name, noun }: EntityNameProps) {
  const { t } = useTranslation();
  const shown = displayName(name, t('data.unnamed', { noun }));
  if (!shown.placeholder) return <>{shown.text}</>;
  const hint = t('data.placeholderHint', { value: shown.raw ?? '∅' });
  return (
    <Box
      component="span"
      sx={{ color: 'text.secondary', fontStyle: 'italic', display: 'inline-flex', alignItems: 'center', gap: 0.25 }}
    >
      {shown.text}
      <PlaceholderHint hint={hint} />
    </Box>
  );
}

export type PlaceholderHintProps = {
  /** What the placeholder was, e.g. from `data.placeholderHint`. The button's accessible name and its tooltip. */
  hint: string;
};

/**
 * The info icon after a placeholder name: a focusable button named by the hint, which also shows as a tooltip.
 * `EntityName` and `EntityCard` already add it; render it yourself only after a name you draw some other way,
 * such as a custom heading built with `displayName`.
 *
 * @summary Focusable info icon that explains a replaced placeholder name.
 * @import import { PlaceholderHint } from 'src/components/data';
 */
export function PlaceholderHint({ hint }: PlaceholderHintProps) {
  return (
    <Tooltip title={hint}>
      {/* A button, not a span, so the hint has a role that may carry a name and can take focus. */}
      <Box
        component="button"
        type="button"
        aria-label={hint}
        sx={{
          display: 'inline-flex',
          p: 0,
          border: 0,
          background: 'none',
          // Secondary, not disabled: the hint is an active control and its glyph must meet text contrast.
          color: 'text.secondary',
          font: 'inherit',
          cursor: 'help',
        }}
      >
        <InfoIcon />
      </Box>
    </Tooltip>
  );
}
