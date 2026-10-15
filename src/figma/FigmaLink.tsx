import { useState, type FormEvent } from 'react';
import { Button } from '@base-ui/react/button';
import { Input } from '@base-ui/react/input';
import { useTranslation } from 'react-i18next';
import { ArrowOutwardIcon } from '../icons';
import { figmaLinksEditable, setFigmaFileLink, useFigmaLinks } from './links';
import { parseFigmaUrl } from './url';

function OpenLink({ href, label }: { href: string; label: string }) {
  return (
    <a className="figma-link-open" href={href} target="_blank" rel="noreferrer">
      {label}
      <ArrowOutwardIcon />
    </a>
  );
}

/**
 * The link between the repository and the Figma file it mirrors. Linked, it
 * shows the file name in the field's place with Unlink beside it; unlinked, the
 * dev server offers a field to paste a link. The link is written to
 * `src/figma/links.json` so it is committed with the code.
 */
export function FigmaLinkField() {
  const { t } = useTranslation();
  const links = useFigmaLinks();
  const link = links.file ? parseFigmaUrl(links.file) : null;
  const [draft, setDraft] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const inputId = 'figma-link-file';

  async function save(url: string | null) {
    setBusy(true);
    setError(null);
    try {
      await setFigmaFileLink(url);
      setDraft('');
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : String(cause));
    } finally {
      setBusy(false);
    }
  }

  function submit(event: FormEvent) {
    event.preventDefault();
    const value = draft.trim();
    if (!value) return;
    if (!parseFigmaUrl(value)) {
      setError(t('figma.invalid'));
      return;
    }
    void save(value);
  }

  return (
    <div className="figma-link">
      {link ? (
        <>
          <OpenLink href={link.url} label={t('figma.open')} />
          <div className="figma-link-form">
            <p className="ui-input figma-link-current" aria-label={t('figma.linkedTo')}>
              <span className="figma-link-name">{link.fileName ?? link.fileKey}</span>
              <span className="figma-link-meta">
                {link.nodeId ? t('figma.node', { id: link.nodeId }) : t('figma.wholeFile')}
              </span>
            </p>
            {figmaLinksEditable ? (
              <div className="figma-link-actions">
                <Button type="button" className="ui-btn ui-btn-ghost" disabled={busy} onClick={() => void save(null)}>
                  {t('figma.unlink')}
                </Button>
              </div>
            ) : null}
          </div>
          {error ? (
            <p className="ui-description ui-field-error" role="alert">
              {error}
            </p>
          ) : null}
        </>
      ) : null}

      {link ? null : figmaLinksEditable ? (
        <form className="figma-link-form" onSubmit={submit}>
          <Input
            id={inputId}
            className="ui-input"
            placeholder={t('figma.placeholder')}
            aria-label={t('figma.file.label')}
            aria-invalid={error ? true : undefined}
            value={draft}
            onValueChange={(next) => {
              setDraft(next);
              if (error) setError(null);
            }}
            disabled={busy}
          />
          <div className="figma-link-actions">
            <Button type="submit" className="ui-btn" disabled={busy || !draft.trim()}>
              {t('figma.link')}
            </Button>
          </div>
          {error ? (
            <p className="ui-description ui-field-error" role="alert">
              {error}
            </p>
          ) : null}
        </form>
      ) : (
        <p className="ui-description">{t('figma.readOnly')}</p>
      )}
    </div>
  );
}

