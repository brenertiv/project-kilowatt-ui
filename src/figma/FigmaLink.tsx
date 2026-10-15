import { useState, type FormEvent } from 'react';
import { Button } from '@base-ui/react/button';
import { Input } from '@base-ui/react/input';
import { useTranslation } from 'react-i18next';
import { ArrowOutwardIcon } from '../icons';
import { figmaLinksEditable, linkFor, setFigmaLink, useFigmaLinks, type FigmaScope } from './links';
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
 * The link between one thing in the repository and its place in Figma: the
 * whole file, or a component's node. Linked, it shows the file name in the
 * field's place with Unlink beside it; unlinked, the dev server offers a field
 * to paste a link. Links are written to `src/figma/links.json` so the mapping
 * is committed with the code.
 */
export function FigmaLinkField({ scope }: { scope: FigmaScope }) {
  const { t } = useTranslation();
  const links = useFigmaLinks();
  const current = linkFor(links, scope);
  const link = current ? parseFigmaUrl(current) : null;
  const file = scope.kind === 'component' && links.file ? parseFigmaUrl(links.file) : null;
  const [draft, setDraft] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const inputId = scope.kind === 'file' ? 'figma-link-file' : `figma-link-${scope.slug}`;

  async function save(url: string | null) {
    setBusy(true);
    setError(null);
    try {
      await setFigmaLink(scope, url);
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
    <div className="figma-link" data-scope={scope.kind}>
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
      ) : (
        <>
          {scope.kind === 'component' ? <p className="ui-description">{t('figma.component.empty')}</p> : null}
          {file ? (
            <OpenLink href={file.url} label={t('figma.openFile', { name: file.fileName ?? file.fileKey })} />
          ) : null}
        </>
      )}

      {link ? null : figmaLinksEditable ? (
        <form className="figma-link-form" onSubmit={submit}>
          <Input
            id={inputId}
            className="ui-input"
            placeholder={t('figma.placeholder')}
            aria-label={scope.kind === 'file' ? t('figma.file.label') : t('figma.component.label')}
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

