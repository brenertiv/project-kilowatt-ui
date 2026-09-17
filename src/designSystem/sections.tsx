import type { CSSProperties } from 'react';
import { useTranslation } from 'react-i18next';
import { breakpointRoles, breakpoints, breakpointVarName, type BreakpointName } from '../breakpoints';
import { iconCatalog } from '../icons';
import { useTheme } from '../theme/ThemeProvider';
import {
  colorRoles,
  contrastPairs,
  derivedTokens,
  derivedValue,
  fontLabels,
  layoutGrid,
  tokenById,
  tokens,
  typeRoles,
  type ThemeValues,
} from '../tokens';
import { measureContrast, type WcagLevel } from './contrast';

export const systemSections = [
  { id: 'color', labelKey: 'system.sections.color' },
  { id: 'typography', labelKey: 'system.sections.typography' },
  { id: 'space', labelKey: 'system.sections.space' },
  { id: 'shape', labelKey: 'system.sections.shape' },
  { id: 'layout', labelKey: 'system.sections.layout' },
  { id: 'icons', labelKey: 'system.sections.icons' },
] as const;

function colorOf(id: string, palette: Record<string, string>) {
  return palette[id] ?? tokenById[id]?.defaultValue ?? '';
}

function parsePx(value: string) {
  const numeric = Number.parseFloat(value);
  return Number.isFinite(numeric) ? numeric : 0;
}

function ContrastBadge({
  foreground,
  background,
  kind,
}: {
  foreground: string;
  background: string;
  kind: 'normal' | 'ui';
}) {
  const measured = measureContrast(foreground, background, kind);
  if (!measured) return null;
  return (
    <span className="system-badge" data-level={measured.level}>
      {measured.formatted} {measured.level === 'fail' ? 'fails' : measured.level}
    </span>
  );
}

function pairForToken(tokenId: string) {
  return contrastPairs.find((pair) => pair.fg === tokenId);
}

export function ColorSection({
  lightValues,
  darkColors,
}: {
  lightValues: ThemeValues;
  darkColors: Record<string, string>;
}) {
  const { t } = useTranslation();

  return (
    <section id="color" className="system-section">
      <h2>{t('system.sections.color')}</h2>
      <p className="ui-description">{t('system.color.lead')}</p>

      {colorRoles.map((role) => (
        <div key={role.id} className="system-role">
          <div className="system-role-head">
            <h3>{role.label}</h3>
            <p className="ui-description">{role.description}</p>
          </div>
          <div className="system-swatches">
            {role.tokenIds.map((id) => {
              const token = tokenById[id];
              if (!token) return null;
              const light = colorOf(id, lightValues);
              const dark = colorOf(id, darkColors);
              const pair = pairForToken(id);
              return (
                <article key={id} className="card system-swatch">
                  <div className="system-swatch-split" aria-hidden="true">
                    <span className="system-swatch-half" style={{ background: light }} />
                    <span className="system-swatch-half" style={{ background: dark }} />
                  </div>
                  <h4>{token.label}</h4>
                  <code className="system-code">{token.id}</code>
                  <code className="system-code">{token.cssVar}</code>
                  <p className="system-meta">
                    <span>{light}</span>
                    <span>{dark}</span>
                  </p>
                  {pair ? (
                    <div className="system-swatch-contrast">
                      <ContrastBadge foreground={light} background={colorOf(pair.bg, lightValues)} kind={pair.kind} />
                      <ContrastBadge foreground={dark} background={colorOf(pair.bg, darkColors)} kind={pair.kind} />
                    </div>
                  ) : null}
                </article>
              );
            })}
          </div>
        </div>
      ))}

      <div className="system-role">
        <div className="system-role-head">
          <h3>{t('system.contrast.title')}</h3>
          <p className="ui-description">{t('system.contrast.lead')}</p>
        </div>
        <div className="system-contrast-list">
          {contrastPairs.map((pair) => {
            const light = measureContrast(colorOf(pair.fg, lightValues), colorOf(pair.bg, lightValues), pair.kind);
            const dark = measureContrast(colorOf(pair.fg, darkColors), colorOf(pair.bg, darkColors), pair.kind);
            return (
              <article key={pair.id} className="card system-contrast-row">
                <div className="system-contrast-pair" aria-hidden="true">
                  <span
                    className="system-contrast-chip"
                    style={{ background: colorOf(pair.bg, lightValues), color: colorOf(pair.fg, lightValues) }}
                  >
                    Ag
                  </span>
                  <span
                    className="system-contrast-chip"
                    style={{ background: colorOf(pair.bg, darkColors), color: colorOf(pair.fg, darkColors) }}
                  >
                    Ag
                  </span>
                </div>
                <div>
                  <h4>{pair.label}</h4>
                  <p className="system-meta">
                    <span>
                      {t('system.contrast.light')}: {formatLevel(light?.formatted, light?.level)}
                    </span>
                    <span>
                      {t('system.contrast.dark')}: {formatLevel(dark?.formatted, dark?.level)}
                    </span>
                  </p>
                </div>
              </article>
            );
          })}
        </div>
      </div>
    </section>
  );
}

function formatLevel(formatted?: string, level?: WcagLevel) {
  if (!formatted || !level) return '—';
  return `${formatted} ${level === 'fail' ? 'fails AA' : level}`;
}

export function TypographySection({ values }: { values: ThemeValues }) {
  const { t } = useTranslation();
  const family = values.fontFamily;
  const familyLabel = fontLabels[family] ?? family;

  return (
    <section id="typography" className="system-section">
      <h2>{t('system.sections.typography')}</h2>
      <p className="ui-description">{t('system.type.lead', { family: familyLabel })}</p>
      <p className="system-code-line">
        <code className="system-code">{family}</code>
      </p>
      <div className="system-type-list">
        {typeRoles.map((role) => {
          const sizeToken = tokenById[role.sizeToken];
          const style: CSSProperties = {
            fontSize: `var(${sizeToken.cssVar})`,
            fontWeight: role.weight,
            lineHeight: role.lineHeight,
            letterSpacing: role.letterSpacing,
            textTransform: role.transform,
            fontVariantNumeric: role.tabularNums ? 'tabular-nums' : undefined,
          };
          return (
            <article key={role.id} className="card system-type-card">
              <p className="system-type-sample" style={style}>
                {role.sample}
              </p>
              <h3>{role.label}</h3>
              <p className="ui-description">{role.usage}</p>
              <p className="system-meta">
                <span>{values[role.sizeToken] ?? sizeToken.defaultValue}</span>
                <span>{role.weight}</span>
                <span>{role.lineHeight}</span>
                {role.tabularNums ? <span>tabular</span> : null}
              </p>
              <code className="system-code">{sizeToken.cssVar}</code>
            </article>
          );
        })}
      </div>
    </section>
  );
}

export function SpaceSection({ values }: { values: ThemeValues }) {
  const { t } = useTranslation();
  const scale = derivedTokens.filter((token) => token.group === 'Space');
  const editable = tokens.filter((token) => token.group === 'Space');
  const max = Math.max(...scale.map((token) => parsePx(derivedValue(token, values, 'light'))), 1);

  return (
    <section id="space" className="system-section">
      <h2>{t('system.sections.space')}</h2>
      <p className="ui-description">{t('system.space.lead')}</p>
      <div className="system-space-list">
        {scale.map((token) => {
          const value = derivedValue(token, values, 'light');
          const width = `${(parsePx(value) / max) * 100}%`;
          return (
            <div key={token.cssVar} className="system-space-row">
              <div className="system-space-copy">
                <span>{token.label}</span>
                <code className="system-code">{token.cssVar}</code>
                {token.note ? <span className="system-note">{token.note}</span> : null}
              </div>
              <div className="system-space-track">
                <span className="system-space-fill" style={{ width }} />
              </div>
              <span className="system-space-value">{value}</span>
            </div>
          );
        })}
      </div>
      <div className="system-meta-row">
        {editable.map((token) => (
          <p key={token.id} className="system-note">
            {token.label}: <code className="system-code">{values[token.id] ?? token.defaultValue}</code> ({token.cssVar}
            )
          </p>
        ))}
      </div>
    </section>
  );
}

export function ShapeSection({ values }: { values: ThemeValues }) {
  const { t } = useTranslation();
  const { colorScheme } = useTheme();
  const radius = values.radius ?? tokenById.radius.defaultValue;
  const radiusControl = values.radiusControl ?? tokenById.radiusControl.defaultValue;
  const radiusInner = derivedValue(
    derivedTokens.find((token) => token.cssVar === '--radius-inner')!,
    values,
    'light',
  );
  const controlHeight = values.controlHeight ?? tokenById.controlHeight.defaultValue;
  const borderWidth = values.borderWidth ?? tokenById.borderWidth.defaultValue;
  const elevation = derivedValue(
    derivedTokens.find((token) => token.cssVar === '--shadow-elevation')!,
    values,
    colorScheme,
  );

  return (
    <section id="shape" className="system-section">
      <h2>{t('system.sections.shape')}</h2>
      <p className="ui-description">{t('system.shape.lead')}</p>
      <div className="system-shape-grid">
        <article className="card">
          <div className="system-radius-row">
            <div className="system-radius-tile" style={{ borderRadius: radius }}>
              <span>Card</span>
              <code className="system-code">{radius}</code>
            </div>
            <div className="system-radius-tile" style={{ borderRadius: radiusControl }}>
              <span>Control</span>
              <code className="system-code">{radiusControl}</code>
            </div>
            <div className="system-radius-tile" style={{ borderRadius: radiusInner }}>
              <span>Inner</span>
              <code className="system-code">{radiusInner}</code>
            </div>
          </div>
          <p className="ui-description">{t('system.shape.radiusRule')}</p>
        </article>
        <article className="card">
          <div className="system-shape-samples">
            <div className="system-control-sample" style={{ height: controlHeight }}>
              Control {controlHeight}
            </div>
            <div className="system-border-sample" style={{ borderWidth }}>
              Border {borderWidth}
            </div>
            <div className="system-elevation-sample" style={{ boxShadow: elevation === 'none' ? 'none' : elevation }}>
              Elevation {elevation}
            </div>
          </div>
        </article>
      </div>
    </section>
  );
}

export function LayoutSection() {
  const { t } = useTranslation();
  const contentMax = derivedTokens.find((token) => token.cssVar === '--content-max');
  const names = Object.keys(breakpoints) as BreakpointName[];

  return (
    <section id="layout" className="system-section">
      <h2>{t('system.sections.layout')}</h2>
      <p className="ui-description">{t('system.layout.lead')}</p>

      <article className="card system-layout-card">
        <h3>{t('system.layout.gridTitle')}</h3>
        <p className="ui-description">
          {t('system.layout.gridMeta', {
            columns: layoutGrid.columns,
            span: layoutGrid.defaultSpan,
            wide: layoutGrid.wideSpan,
            max: contentMax?.value,
          })}
        </p>
        <div
          className="system-grid-diagram"
          style={{ gridTemplateColumns: `repeat(${layoutGrid.columns}, minmax(0, 1fr))` }}
        >
          {Array.from({ length: layoutGrid.columns }, (_, index) => (
            <span key={`col-${index}`} className="system-grid-col">
              {index + 1}
            </span>
          ))}
          <span className="system-grid-span" style={{ gridColumn: `span ${layoutGrid.defaultSpan}` }}>
            Default · {layoutGrid.defaultSpan}
          </span>
          <span className="system-grid-span" style={{ gridColumn: `span ${layoutGrid.defaultSpan}` }}>
            Default · {layoutGrid.defaultSpan}
          </span>
          <span className="system-grid-span" style={{ gridColumn: `span ${layoutGrid.defaultSpan}` }}>
            Default · {layoutGrid.defaultSpan}
          </span>
          <span
            className="system-grid-span system-grid-span-wide"
            style={{ gridColumn: `span ${layoutGrid.wideSpan}` }}
          >
            Wide · {layoutGrid.wideSpan}
          </span>
          <span
            className="system-grid-span system-grid-span-wide"
            style={{ gridColumn: `span ${layoutGrid.wideSpan}` }}
          >
            Wide · {layoutGrid.wideSpan}
          </span>
        </div>
      </article>

      <div className="system-breakpoint-list">
        {names.map((name) => (
          <article key={name} className="card">
            <h3>{name}</h3>
            <code className="system-code">{breakpointVarName(name)}</code>
            <p className="panel-value system-bp-value">{breakpoints[name]}px</p>
            <p className="ui-description">{breakpointRoles[name]}</p>
          </article>
        ))}
      </div>
    </section>
  );
}

export function IconsSection() {
  const { t } = useTranslation();

  return (
    <section id="icons" className="system-section">
      <h2>{t('system.sections.icons')}</h2>
      <p className="ui-description">{t('system.icons.lead')}</p>
      <div className="system-icon-grid">
        {iconCatalog.map(({ name, Icon }) => (
          <article key={name} className="card system-icon-card">
            <span className="system-icon-tile" aria-hidden="true">
              <Icon />
            </span>
            <code className="system-code">{name}</code>
          </article>
        ))}
      </div>
    </section>
  );
}
