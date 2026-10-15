import { Menu } from '@base-ui/react/menu';
import { useTranslation } from 'react-i18next';
import { DownloadIcon } from '../icons';
import { downloadText } from '../lib/download';
import { FigmaLinkField } from '../figma/FigmaLink';
import { SyncPanel } from '../figma/SyncPanel';
import { useTheme } from '../theme/ThemeProvider';
import { systemToJson, systemToMarkdown } from './export';
import {
  ColorSection,
  IconsSection,
  LayoutSection,
  PrimitivesSection,
  ShapeSection,
  SpaceSection,
  systemSections,
  TypographySection,
} from './sections';

export function DesignSystem() {
  const { t } = useTranslation();
  const { values, lightValues, darkColors, exportCss } = useTheme();

  const downloads = [
    { id: 'css', label: t('system.exportCss'), file: 'kilowatt-tokens.css', type: 'text/css;charset=utf-8', text: () => exportCss() },
    { id: 'json', label: t('system.exportJson'), file: 'kilowatt-design-system.json', type: 'application/json;charset=utf-8', text: () => systemToJson(lightValues, darkColors) },
    { id: 'md', label: t('system.exportMarkdown'), file: 'kilowatt-design-system.md', type: 'text/markdown;charset=utf-8', text: () => systemToMarkdown(lightValues, darkColors) },
  ];

  return (
    <main className="system">
      <header className="system-head">
        <div>
          <h1>{t('system.title')}</h1>
          <p>{t('system.subtitle')}</p>
        </div>
        <div className="system-exports">
          <Menu.Root>
            <Menu.Trigger className="ui-btn ui-btn-ghost">
              <DownloadIcon />
              {t('system.download')}
            </Menu.Trigger>
            <Menu.Portal>
              <Menu.Positioner className="ui-positioner" align="end" sideOffset={4}>
                <Menu.Popup className="ui-popup">
                  {downloads.map((item) => (
                    <Menu.Item key={item.id} className="ui-item" onClick={() => downloadText(item.file, item.text(), item.type)}>
                      {item.label}
                      <span className="ui-item-hint">{item.file}</span>
                    </Menu.Item>
                  ))}
                </Menu.Popup>
              </Menu.Positioner>
            </Menu.Portal>
          </Menu.Root>
        </div>
      </header>

      <section className="system-figma" aria-label={t('figma.title')}>
        <h2>{t('figma.title')}</h2>
        <div className="figma-link-column">
          <FigmaLinkField />
          <SyncPanel />
        </div>
      </section>

      <nav className="system-toc" aria-label={t('system.toc')}>
        {systemSections.map((section) => (
          <a key={section.id} href={`#${section.id}`} className="system-toc-link">
            {t(section.labelKey)}
          </a>
        ))}
      </nav>

      <PrimitivesSection />
      <ColorSection lightValues={lightValues} darkColors={darkColors} />
      <TypographySection values={values} />
      <SpaceSection values={values} />
      <ShapeSection values={values} />
      <LayoutSection />
      <IconsSection />
    </main>
  );
}
