import * as am5 from '@amcharts/amcharts5';
import type { ThemeValues } from '../tokens';
import { categoricalPalette } from './color';

/**
 * Maps design tokens onto amCharts once, so chart code never paints a label or
 * grid line by hand. Create it per root: `root.setThemes([createChartTheme(values).new(root)])`.
 *
 * Mark specs follow the dataviz method: 2px lines, 4px rounded column caps,
 * 2px surface gaps between fills, hairline solid grid, text in text tokens.
 */
export function createChartTheme(values: ThemeValues) {
  const color = (hex: string) => am5.color(hex);
  const innerRadius = Number.parseInt(values.radiusControl, 10) || 4;

  return class KilowattChartTheme extends am5.Theme {
    protected override setupDefaultRules() {
      super.setupDefaultRules();
      const r = this.rule.bind(this);

      r('InterfaceColors').setAll({
        text: color(values.text),
        alternativeText: color(values.onSolid),
        grid: color(values.border),
        background: color(values.surface),
        alternativeBackground: color(values.solid),
        stroke: color(values.border),
        fill: color(values.hover),
        positive: color(values.positive),
        negative: color(values.negative),
        disabled: color(values.track),
        primaryButton: color(values.accent),
        primaryButtonHover: color(values.accent),
        primaryButtonDown: color(values.accent),
        primaryButtonActive: color(values.accent),
        primaryButtonText: color(values.onAccent),
      });

      r('ColorSet').setAll({
        colors: categoricalPalette(values).map(color),
        reuse: false,
        passOptions: {},
      });

      r('Label').setAll({
        fontFamily: values.fontSans,
        fontSize: 11,
        fill: color(values.textSecondary),
        oversizedBehavior: 'truncate',
      });

      r('AxisLabel').setAll({
        fill: color(values.textMuted),
        fontSize: 11,
        paddingTop: 6,
        paddingRight: 6,
      });

      r('Grid').setAll({
        stroke: color(values.border),
        strokeOpacity: 1,
        strokeWidth: 1,
        strokeDasharray: [],
      });
      r('Grid', ['base']).setAll({ stroke: color(values.border), strokeOpacity: 1 });
      r('Grid', ['minor']).setAll({ forceHidden: true });
      r('AxisTick').setAll({ forceHidden: true });
      r('AxisRenderer').setAll({ strokeOpacity: 0 });

      r('Tooltip').setAll({
        getFillFromSprite: false,
        getStrokeFromSprite: false,
        getLabelFillFromSprite: false,
        autoTextColor: false,
        paddingTop: 6,
        paddingBottom: 6,
        paddingLeft: 8,
        paddingRight: 8,
      });
      r('PointedRectangle', ['tooltip', 'background']).setAll({
        fill: color(values.surface),
        fillOpacity: 1,
        stroke: color(values.border),
        strokeOpacity: 1,
        strokeWidth: 1,
        cornerRadius: innerRadius,
        shadowOpacity: 0,
      });
      r('Label', ['tooltip']).setAll({
        fill: color(values.text),
        fontSize: 12,
      });

      r('XYCursor').setAll({ behavior: 'none' });
      r('Grid', ['cursor', 'x']).setAll({
        stroke: color(values.textMuted),
        strokeOpacity: 0.6,
        strokeDasharray: [],
      });
      r('Grid', ['cursor', 'y']).setAll({ forceHidden: true });

      r('Graphics', ['series', 'stroke']).setAll({ strokeWidth: 2 });
      r('Graphics', ['series', 'fill']).setAll({ fillOpacity: 0.1, visible: false });

      r('RoundedRectangle', ['series', 'column']).setAll({
        cornerRadiusTL: 4,
        cornerRadiusTR: 4,
        cornerRadiusBL: 0,
        cornerRadiusBR: 0,
        stroke: color(values.surface),
        strokeOpacity: 1,
        strokeWidth: 2,
      });

      r('Slice').setAll({
        stroke: color(values.surface),
        strokeOpacity: 1,
        strokeWidth: 2,
      });

      r('Bullet').setAll({ locationY: 1 });
      r('Circle').setAll({
        radius: 4,
        stroke: color(values.surface),
        strokeWidth: 2,
      });
    }
  };
}
