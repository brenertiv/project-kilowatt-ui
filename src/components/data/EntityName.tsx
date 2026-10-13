import Box from '@mui/material/Box';
import Tooltip from '@mui/material/Tooltip';
import { useTranslation } from 'react-i18next';
import { InfoIcon } from '../../icons';
import { displayName } from './placeholder';

/** A record's name inline, with placeholder names replaced and explained. */
export function EntityName({ name, noun }: { name: string | null | undefined; noun: string }) {
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
