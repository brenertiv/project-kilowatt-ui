import { useEffect, type ReactNode } from 'react';
import Markdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { Link, Navigate, NavLink, useLocation, useParams } from 'react-router';
import { useTranslation } from 'react-i18next';
import { docs, findDoc, slugify } from './docs';

function textOf(node: ReactNode): string {
  if (typeof node === 'string' || typeof node === 'number') return String(node);
  if (Array.isArray(node)) return node.map(textOf).join('');
  if (node && typeof node === 'object' && 'props' in node) {
    return textOf((node as { props: { children?: ReactNode } }).props.children);
  }
  return '';
}

/** Renders the markdown files in `/docs` with the system's typography and a section index. */
export function DocsPage() {
  const { t } = useTranslation();
  const { slug } = useParams();
  const { hash } = useLocation();
  const doc = findDoc(slug);

  useEffect(() => {
    if (!hash) return;
    document.getElementById(hash.slice(1))?.scrollIntoView({ block: 'start' });
  }, [hash, slug]);

  if (!doc) {
    return docs[0] ? <Navigate to={`/docs/${docs[0].slug}`} replace /> : <p className="ui-description">{t('docs.empty')}</p>;
  }

  return (
    <div className="docs">
      <aside className="docs-side" aria-label={t('docs.index')}>
        {docs.length > 1 ? (
          <nav className="docs-files" aria-label={t('docs.files')}>
            {docs.map((entry) => (
              <NavLink key={entry.slug} to={`/docs/${entry.slug}`} className="docs-file">
                {entry.title}
              </NavLink>
            ))}
          </nav>
        ) : null}
        <nav className="docs-toc" aria-label={t('docs.sections')}>
          {doc.sections.map((section) => (
            <Link key={section.id} to={`#${section.id}`} className="docs-toc-link">
              {section.label}
            </Link>
          ))}
        </nav>
      </aside>
      <article className="docs-body markdown">
        <Markdown
          remarkPlugins={[remarkGfm]}
          components={{
            h1: ({ children }) => <h1>{children}</h1>,
            h2: ({ children }) => <h2 id={slugify(textOf(children))}>{children}</h2>,
            h3: ({ children }) => <h3 id={slugify(textOf(children))}>{children}</h3>,
            a: ({ href, children }) =>
              href?.startsWith('/') || href?.startsWith('#') ? (
                <Link to={href}>{children}</Link>
              ) : (
                <a href={href} target="_blank" rel="noreferrer">
                  {children}
                </a>
              ),
            table: ({ children }) => (
              <div className="table-wrap">
                <table className="ui-table">{children}</table>
              </div>
            ),
          }}
        >
          {doc.markdown}
        </Markdown>
      </article>
    </div>
  );
}
