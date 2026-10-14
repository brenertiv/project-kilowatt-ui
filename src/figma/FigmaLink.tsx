import { useState, type FormEvent } from 'react';
import { Button } from '@base-ui/react/button';
import { Input } from '@base-ui/react/input';
import { useTranslation } from 'react-i18next';
import { ArrowOutwardIcon } from '../icons';
import { fixtureGroups } from '../workbench/registry';
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
 * whole file, or a component's node. Shows where it points, opens it, and in
 * the dev server lets you paste a new link, which is written to
 * `src/figma/links.json` so the mapping is committed with the code.
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
          <p className="ui-description figma-link-meta">
            {link.fileName ?? link.fileKey}
            {link.nodeId ? ` · ${t('figma.node', { id: link.nodeId })}` : ` · ${t('figma.wholeFile')}`}
          </p>
        </>
      ) : (
        <>
          <p className="ui-description">{scope.kind === 'file' ? t('figma.file.empty') : t('figma.component.empty')}</p>
          {file ? (
            <OpenLink href={file.url} label={t('figma.openFile', { name: file.fileName ?? file.fileKey })} />
          ) : null}
        </>
      )}

      {figmaLinksEditable ? (
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
              {link ? t('figma.replace') : t('figma.link')}
            </Button>
            {link ? (
              <Button type="button" className="ui-btn ui-btn-ghost" disabled={busy} onClick={() => void save(null)}>
                {t('figma.unlink')}
              </Button>
            ) : null}
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

/** How much of the workbench is mapped: a sync gauge for the design system page. */
export function FigmaCoverage() {
  const { t } = useTranslation();
  const links = useFigmaLinks();
  const linked = fixtureGroups.filter((group) => group.slug in links.components).length;
  return (
    <p className="ui-description figma-coverage">{t('figma.coverage', { linked, total: fixtureGroups.length })}</p>
  );
}
