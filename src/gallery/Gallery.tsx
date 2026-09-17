import { useState } from 'react';
import { Input } from '@base-ui/react/input';
import { useTranslation } from 'react-i18next';
import { demos } from './demos';
import { SearchIcon } from '../icons';
import { DemoErrorBoundary } from './stackDemos';

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
        <label className="search">
          <SearchIcon />
          <Input className="ui-input" placeholder={t('gallery.search')} value={query} onValueChange={setQuery} />
        </label>
      </header>

      {groups.map((group) => (
        <section key={group} className="gallery-group" data-group={group}>
          <h2>{group}</h2>
          <div className="gallery-grid">
            {filtered
              .filter((demo) => demo.group === group)
              .map((demo) => (
                <article key={demo.id} className="card">
                  <header className="card-head">
                    <h3>{demo.title}</h3>
                    <span className="card-tag">{demo.group}</span>
                  </header>
                  <div className="card-body">
                    <DemoErrorBoundary>{demo.render()}</DemoErrorBoundary>
                  </div>
                </article>
              ))}
          </div>
        </section>
      ))}

      {filtered.length === 0 && <p className="ui-description">{t('gallery.empty')}</p>}
    </main>
  );
}
