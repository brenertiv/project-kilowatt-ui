import { useState } from 'react';
import { Button } from '@base-ui/react/button';
import { useTranslation } from 'react-i18next';
import { CopyIcon } from '../icons';
import { useTheme } from '../theme/ThemeProvider';
import { systemToJson, systemToMarkdown } from './export';
import {
  ColorSection,
  IconsSection,
  LayoutSection,
  ShapeSection,
  SpaceSection,
  systemSections,
  TypographySection,
} from './sections';

type CopiedFormat = 'css' | 'json' | 'md' | null;

export function DesignSystem() {
  const { t } = useTranslation();
  const { values, lightValues, darkColors, exportCss } = useTheme();
  const [copied, setCopied] = useState<CopiedFormat>(null);

  async function copy(format: Exclude<CopiedFormat, null>, text: string) {
    await navigator.clipboard.writeText(text);
    setCopied(format);
    window.setTimeout(() => setCopied(null), 1600);
  }

  return (
    <main className="system">
      <header className="system-head">
        <div>
          <h1>{t('system.title')}</h1>
          <p>{t('system.subtitle')}</p>
        </div>
        <div className="system-exports">
          <Button className="ui-btn ui-btn-ghost" onClick={() => copy('css', exportCss())}>
            <CopyIcon />
            {copied === 'css' ? t('system.copied') : t('system.exportCss')}
          </Button>
          <Button className="ui-btn ui-btn-ghost" onClick={() => copy('json', systemToJson(lightValues, darkColors))}>
            <CopyIcon />
            {copied === 'json' ? t('system.copied') : t('system.exportJson')}
          </Button>
          <Button className="ui-btn ui-btn-ghost" onClick={() => copy('md', systemToMarkdown(lightValues, darkColors))}>
            <CopyIcon />
            {copied === 'md' ? t('system.copied') : t('system.exportMarkdown')}
          </Button>
        </div>
      </header>

      <nav className="system-toc" aria-label={t('system.toc')}>
        {systemSections.map((section) => (
          <a key={section.id} href={`#${section.id}`} className="system-toc-link">
            {t(section.labelKey)}
          </a>
        ))}
      </nav>

      <ColorSection lightValues={lightValues} darkColors={darkColors} />
      <TypographySection values={values} />
      <SpaceSection values={values} />
      <ShapeSection values={values} />
      <LayoutSection />
      <IconsSection />
    </main>
  );
}
