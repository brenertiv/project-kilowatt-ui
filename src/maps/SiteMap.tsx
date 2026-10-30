import { useEffect, useMemo, useRef, useState } from 'react';
import maplibregl, { type LngLatBoundsLike } from 'maplibre-gl';
import 'maplibre-gl/dist/maplibre-gl.css';
import { MapboxOverlay } from '@deck.gl/mapbox';
import { ScatterplotLayer } from '@deck.gl/layers';
import Box from '@mui/material/Box';
import IconButton from '@mui/material/IconButton';
import Paper from '@mui/material/Paper';
import Popper from '@mui/material/Popper';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';
import { visuallyHidden } from '@mui/utils';
import { Icon } from '../icons';
import { useResolvedScheme } from '../mui/useResolvedScheme';
import { basemapStyle, mapColors } from './theme';

/** One site on the map: where it is, its name, and optionally a value and how it takes its color. */
export type MapSite = {
  /** A stable id, unique among the sites. */
  id: string;
  /** The site's name, shown in its tooltip and the list. */
  name: string;
  latitude: number;
  longitude: number;
  /** A reading for the site, in the map's `unit`, shown in full in its tooltip. Default none. */
  value?: number;
  /** The `chart.series` slot the site takes, for a product meaning (a building type). Default `0`, the first series color. */
  slot?: number;
  /** Draws the site in `chart.neutral`: context, when other sites are the point. Default `false`. */
  neutral?: boolean;
  /** A status the site takes its color from, in place of `slot`: an intent. Don't mix with `slot` on one map. Default none. */
  status?: 'success' | 'warning' | 'error' | 'info';
  /** The site has no data for the map's lens: drawn as a ring in its color, at the smallest size when the map is `sized`. Default `false`. */
  hollow?: boolean;
  /** A line under the site's name in its tooltip and the list: what its color stands for, or why it is hollow. Default: the reading, when there is one. */
  detail?: string;
};

export type SiteMapProps = {
  /** The sites to show. The map opens fitted to them. Keep it stable (a constant or `useMemo`): the layer is rebuilt when it changes. */
  sites: MapSite[];
  /** The unit of the sites' values, shown after each value: `kWh`, `kW`. Default none. */
  unit?: string;
  /** One sentence on what the map shows. It isn't shown: it's the figure's accessible name, the map's text alternative for screen readers, with the list of sites. */
  summary: string;
  /** The map's height in pixels. Default `320`. */
  height?: number;
  /** Called with the site whose dot is clicked. Keep it stable (`useCallback`): the layer is rebuilt when it changes. */
  onSelect?: (site: MapSite) => void;
  /** Sizes each dot by its `value` on a square-root scale, from the smallest dot at none to the largest at the highest value, so a dot's area follows its value. Default `false`: every dot is one size. */
  sized?: boolean;
};

/** How far the map keeps the sites from its edges when it fits them, in pixels. */
const fitPadding = 48;
/** The closest the map zooms when it fits the sites, so one site doesn't open at street level. */
const fitMaxZoom = 15;
/**
 * A site's radius in pixels, and the extra distance the pointer picks it from, so every hit area is
 * 24px or more. Neutral sites are smaller, so a highlighted site stands out by size as well as color.
 */
const radius = 8;
const neutralRadius = 6;
const pickingRadius = 6;
// The range a sized dot takes: the smallest keeps a 24px hit area with the picking radius, the largest stays a dot rather than a region.
const sizedRadius = { min: 6, max: 16 };
/** No fill: a hollow dot is its outline alone. */
const clear: [number, number, number, number] = [0, 0, 0, 0];

/** The box around every site, west-south to east-north. */
function siteBounds(sites: MapSite[]): LngLatBoundsLike | undefined {
  if (!sites.length) return undefined;
  const lngs = sites.map(({ longitude }) => longitude);
  const lats = sites.map(({ latitude }) => latitude);
  return [Math.min(...lngs), Math.min(...lats), Math.max(...lngs), Math.max(...lats)];
}

/**
 * A map of sites on Kilowatt's CARTO basemap (Rules → Maps): a reference implementation that
 * Enertiv's app rebuilds. MapLibre draws the basemap from `basemapStyle`, themed from the palette
 * for the active color scheme, and deck.gl draws each site as a dot in a `chart.series` color from
 * `mapColors`, or `chart.neutral`. Every site has a tooltip with its name and value. The map sits
 * in a `figure` named by `summary`, with the sites as a list for screen readers; put it in an
 * outlined `Card` under a `CardHeader`, where it runs edge to edge.
 *
 * @summary A map of sites on the themed CARTO basemap, with MUI controls, tooltips and a list for screen readers.
 * @import import { SiteMap } from 'src/maps/SiteMap';
 */
export function SiteMap({ sites, unit, summary, height = 320, onSelect, sized = false }: SiteMapProps) {
  const container = useRef<HTMLDivElement>(null);
  const [map, setMap] = useState<maplibregl.Map | null>(null);
  const [overlay, setOverlay] = useState<MapboxOverlay | null>(null);
  const [hover, setHover] = useState<{ site: MapSite; left: number; top: number } | null>(null);
  const scheme = useResolvedScheme();
  const bounds = useMemo(() => siteBounds(sites), [sites]);
  const format = useMemo(() => new Intl.NumberFormat(undefined, { maximumFractionDigits: 2 }), []);
  const reading = (site: MapSite) =>
    site.value === undefined ? undefined : [format.format(site.value), unit].filter(Boolean).join(' ');
  // What the tooltip and the list say under the name: the site's detail, else the reading.
  const detail = (site: MapSite) => site.detail ?? reading(site);

  // The map, made once. It opens on an empty style, which shows the card surface until the basemap loads.
  useEffect(() => {
    if (!container.current) return;
    const instance = new maplibregl.Map({
      container: container.current,
      style: { version: 8, sources: {}, layers: [] },
      cooperativeGestures: true,
      attributionControl: { compact: true },
    });
    const deck = new MapboxOverlay({ layers: [], pickingRadius });
    instance.addControl(deck as unknown as maplibregl.IControl);
    setMap(instance);
    setOverlay(deck);
    return () => instance.remove();
  }, []);

  // The basemap for the active scheme. MapLibre swaps styles in place, keeping the camera.
  useEffect(() => {
    if (!map || !scheme) return;
    let live = true;
    basemapStyle(scheme)
      .then((style) => live && map.setStyle(style))
      .catch((error: unknown) =>
        console.warn('The CARTO basemap did not load; the map shows the sites on the land color.', error),
      );
    return () => {
      live = false;
    };
  }, [map, scheme]);

  useEffect(() => {
    if (map && bounds) map.fitBounds(bounds, { padding: fitPadding, maxZoom: fitMaxZoom, animate: false });
  }, [map, bounds]);

  useEffect(() => {
    if (!overlay || !scheme) return;
    const colors = mapColors(scheme);
    // A site's color: neutral, its status intent, or its series slot.
    const colorOf = ({ slot = 0, neutral, status }: MapSite) =>
      neutral ? colors.neutral : status ? colors[status] : colors.series[slot % colors.series.length];
    // Sized: the square root of the value's share of the highest, so a dot's area follows its value.
    const top = sized
      ? Math.max(
          0,
          ...sites.filter((site) => !site.neutral && site.value !== undefined).map((site) => site.value as number),
        )
      : 0;
    const radiusOf = (site: MapSite) => {
      if (site.neutral) return neutralRadius;
      if (!sized) return radius;
      if (site.value === undefined || top <= 0) return sizedRadius.min;
      return sizedRadius.min + (sizedRadius.max - sizedRadius.min) * Math.sqrt(site.value / top);
    };
    overlay.setProps({
      // A dot that opens something shows the pointer.
      getCursor: ({ isDragging, isHovering }) =>
        isDragging ? 'grabbing' : isHovering && onSelect ? 'pointer' : 'grab',
      layers: [
        new ScatterplotLayer<MapSite>({
          id: 'sites',
          // Neutral sites first, so the sites that are the point draw on top; then the largest first, so a small dot isn't covered.
          data: [...sites].sort(
            (a, b) => Number(Boolean(b.neutral)) - Number(Boolean(a.neutral)) || radiusOf(b) - radiusOf(a),
          ),
          getPosition: ({ longitude, latitude }) => [longitude, latitude],
          // A hollow dot has no fill and takes its color on the outline instead.
          getFillColor: (site) => (site.hollow ? clear : colorOf(site)),
          // An outline in the land color sets each dot apart from the roads and buildings below it.
          getLineColor: (site) => (site.hollow ? colorOf(site) : colors.land),
          stroked: true,
          lineWidthUnits: 'pixels',
          getLineWidth: 2,
          radiusUnits: 'pixels',
          getRadius: radiusOf,
          pickable: true,
          // The pointer's place on the page, for the tooltip's anchor: deck.gl gives it within the map.
          onHover: ({ object, x, y }) => {
            const box = container.current?.getBoundingClientRect();
            setHover(object && box ? { site: object, left: box.left + x, top: box.top + y } : null);
          },
          onClick: ({ object }) => {
            if (object && onSelect) onSelect(object);
          },
          updateTriggers: { getFillColor: scheme, getLineColor: scheme, getRadius: sized },
        }),
      ],
    });
  }, [overlay, sites, scheme, onSelect, sized]);

  // The tooltip follows the hovered site: a point anchor at the pointer.
  const anchor = useMemo(
    () => hover && { getBoundingClientRect: () => new DOMRect(hover.left, hover.top, 0, 0) },
    [hover],
  );

  return (
    <Box
      component="figure"
      aria-label={summary}
      sx={(theme) => ({
        m: 0,
        position: 'relative',
        height,
        // MapLibre's attribution box, on the card surface in the caption style (the `map-attribution` departure).
        '& .maplibregl-ctrl-attrib': {
          ...theme.typography.caption,
          bgcolor: 'background.level3',
          color: 'text.secondary',
        },
        '& .maplibregl-ctrl-attrib a': { color: 'inherit' },
        // Its info button is a dark icon drawn by MapLibre's CSS; dark mode inverts it to read on the dark surface.
        '& .maplibregl-ctrl-attrib-button': theme.applyStyles('dark', { filter: 'invert(1)' }),
      })}
    >
      <Box ref={container} sx={{ position: 'absolute', inset: 0 }} />
      <Paper variant="outlined" sx={{ position: 'absolute', top: 8, right: 8 }}>
        <Stack>
          <IconButton aria-label="Zoom in" disabled={!map} onClick={() => map?.zoomIn()}>
            <Icon name="add" />
          </IconButton>
          <IconButton aria-label="Zoom out" disabled={!map} onClick={() => map?.zoomOut()}>
            <Icon name="remove" />
          </IconButton>
          <IconButton
            aria-label="Show all sites"
            disabled={!map || !bounds}
            onClick={() => bounds && map?.fitBounds(bounds, { padding: fitPadding, maxZoom: fitMaxZoom })}
          >
            <Icon name="fit_screen" />
          </IconButton>
        </Stack>
      </Paper>
      <Popper
        open={Boolean(anchor)}
        anchorEl={anchor}
        placement="top"
        modifiers={[{ name: 'offset', options: { offset: [0, radius + 4] } }]}
        sx={{ pointerEvents: 'none', zIndex: 'tooltip' }}
      >
        {hover && (
          <Paper elevation={8} sx={{ px: 1.5, py: 1 }}>
            <Typography variant="body2">{hover.site.name}</Typography>
            {detail(hover.site) && (
              <Typography variant="caption" color="text.secondary" sx={{ fontVariantNumeric: 'tabular-nums' }}>
                {detail(hover.site)}
              </Typography>
            )}
          </Paper>
        )}
      </Popper>
      <Box component="ul" sx={visuallyHidden}>
        {sites.map((site) => (
          <li key={site.id}>{[site.name, detail(site)].filter(Boolean).join(': ')}</li>
        ))}
      </Box>
    </Box>
  );
}
