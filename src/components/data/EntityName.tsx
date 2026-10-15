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
      sx={{ color: 'text.secondary', fontStyle: 'italic', display: 'inline-flex', alignItems: 'center', gap: 0.5 }}
    >
      {shown.text}
      <Tooltip title={hint}>
        <Box component="span" sx={{ display: 'inline-flex', color: 'text.disabled' }} tabIndex={0} aria-label={hint}>
          <InfoIcon />
        </Box>
      </Tooltip>
    </Box>
  );
}
