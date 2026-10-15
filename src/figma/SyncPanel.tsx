import { useState } from 'react';
import { Button } from '@base-ui/react/button';
import { useTranslation } from 'react-i18next';
import { CopyIcon } from '../icons';
import { pushPlan, pushScript } from './push';
import { figmaSnapshot } from './snapshot';

/**
 * When the Figma snapshot was last taken, and the script that pushes
 * code-owned tokens back. Tokens that have drifted are listed only when there
 * are any. Reading Figma and writing to it both happen through the connector,
 * so the panel hands over the script rather than pretending to run it.
 */
export function SyncPanel() {
  const { t } = useTranslation();
  const [copyState, setCopyState] = useState<'idle' | 'copied' | 'failed'>('idle');
  const plan = pushPlan();
  const fetched = new Date(figmaSnapshot.fetchedAt);

  async function copy() {
    try {
      await navigator.clipboard.writeText(pushScript());
      setCopyState('copied');
    } catch {
      setCopyState('failed');
    }
    window.setTimeout(() => setCopyState('idle'), 1600);
  }

  return (
    <div className="figma-sync">
      <div className="figma-sync-row">
        <p className="ui-description">
          {t('figma.sync.lastSync', { date: fetched.toLocaleDateString(undefined, { dateStyle: 'medium' }) })}
        </p>
        <Button className="ui-btn ui-btn-ghost" onClick={() => void copy()}>
          <CopyIcon />
          {copyState === 'copied' ? t('figma.sync.copied') : copyState === 'failed' ? t('figma.sync.copyFailed') : t('figma.sync.copyPush')}
        </Button>
      </div>
      {plan.pending > 0 ? (
        <ul className="figma-sync-list">
          {plan.entries
            .filter((entry) => entry.status !== 'synced')
            .map((entry) => (
              <li key={entry.name}>
                <code>{entry.name}</code>
                <span>
                  {entry.light} / {entry.dark}
                </span>
                <span className="figma-sync-status">{t(`figma.sync.status.${entry.status}`)}</span>
              </li>
            ))}
        </ul>
      ) : null}
    </div>
  );
}
