import { useState } from 'react';
import { Input } from '@base-ui/react/input';
import { Toast } from '@base-ui/react/toast';
import { useTranslation } from 'react-i18next';
import { demos, type Demo } from './demos';
import { cosmosBaseUrl, cosmosFixtureUrl } from './cosmos';
import { SearchIcon } from '../icons';
import { CardMenu } from '../components/CardMenu';
import { DemoErrorBoundary } from './stackDemos';

function DemoCard({ demo }: { demo: Demo }) {
  const toastManager = Toast.useToastManager();
  const fixtureUrl = demo.fixture ? cosmosFixtureUrl(demo.fixture) : null;
  const [collapsed, setCollapsed] = useState(false);
  const [generation, setGeneration] = useState(0);
  const View = demo.render;

  async function copyName() {
    try {
      await navigator.clipboard.writeText(demo.title);
      toastManager.add({ title: 'Copied', description: `“${demo.title}” is on the clipboard.` });
    } catch {
      toastManager.add({ title: 'Copy failed', description: 'Clipboard access was blocked.' });
    }
  }

  return (
    <article className="card" data-collapsed={collapsed || undefined}>
      <header className="card-head">
        <h3>
          {fixtureUrl ? (
            <a href={fixtureUrl} className="card-title-link" target="_blank" rel="noreferrer">
              {demo.title}
            </a>
          ) : (
            demo.title
          )}
        </h3>
        <div className="card-actions">
          <CardMenu
            label={`${demo.title} actions`}
            items={[
              ...(fixtureUrl
                ? [{ id: 'cosmos', label: 'Open in Cosmos', onSelect: () => window.open(fixtureUrl, '_blank', 'noreferrer') }]
                : []),
              { id: 'copy', label: 'Copy name', onSelect: copyName },
              { id: 'remount', label: 'Remount demo', onSelect: () => setGeneration((n) => n + 1) },
              { id: 'collapse', label: collapsed ? 'Expand' : 'Collapse', onSelect: () => setCollapsed((c) => !c) },
            ]}
          />
        </div>
      </header>
      {collapsed ? null : (
        <div className="card-body">
          <DemoErrorBoundary key={generation}>
            <View />
          </DemoErrorBoundary>
        </div>
      )}
    </article>
  );
}

export function Gallery() {
  const { t } = useTranslation();
  const [query, setQuery] = useState('');
  const needle = query.trim().toLowerCase();
  const filtered = needle
    ? demos.filter((demo) => demo.title.toLowerCase().includes(needle) || demo.group.toLowerCase().includes(needle))
    : demos;

  const groups = [...new Set(filtered.map((demo) => demo.group))];

  return (
    <main className="gallery" data-tour="gallery">
      <header className="gallery-head">
        <div>
          <h1>{t('gallery.title')}</h1>
          <p>{t('gallery.subtitle')}</p>
        </div>
        <div className="gallery-tools">
          {cosmosBaseUrl ? (
            <a href={cosmosBaseUrl} className="ui-btn gallery-cosmos-link" target="_blank" rel="noreferrer">
              {t('gallery.cosmos')}
            </a>
          ) : null}
          <label className="search">
            <SearchIcon />
            <Input className="ui-input" placeholder={t('gallery.search')} value={query} onValueChange={setQuery} />
          </label>
        </div>
      </header>

      {groups.map((group) => (
        <section key={group} className="gallery-group" data-group={group}>
          <h2>{group}</h2>
          <div className="gallery-grid">
            {filtered
              .filter((demo) => demo.group === group)
              .map((demo) => (
                <DemoCard key={demo.id} demo={demo} />
              ))}
          </div>
        </section>
      ))}

      {filtered.length === 0 && <p className="ui-description">{t('gallery.empty')}</p>}
    </main>
  );
}
