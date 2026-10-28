import type { StyleSpecification } from 'maplibre-gl';

/**
 * The layers of CARTO's Positron and Dark Matter styles (the two share them), from its `carto.streets` v2
 * tiles, for testing the map theme without fetching. Every layer is CARTO's own id, type, source layer and
 * minimum zoom, with its label fonts and line widths, and the state boundaries' filter; each color CARTO sets
 * is replaced with magenta, or kept transparent where CARTO draws it so, so a color the theme doesn't replace
 * stands out. Regenerate it when CARTO's styles change. CARTO writes its zoom functions as legacy `stops`
 * objects, which MapLibre still reads but its types no longer list, hence the cast.
 */
export const cartoStyle = {
  version: 8,
  sources: {
    carto: {
      type: 'vector',
      tiles: ['https://tiles.basemaps.cartocdn.com/vectortiles/carto.streets/v2/{z}/{x}/{y}.mvt'],
    },
  },
  glyphs: 'https://tiles.basemaps.cartocdn.com/fonts/{fontstack}/{range}.pbf',
  layers: [
    {
      id: 'background',
      type: 'background',
      paint: {
        'background-color': '#ff00ff',
      },
    },
    {
      id: 'landcover',
      type: 'fill',
      source: 'carto',
      'source-layer': 'landuse',
      minzoom: 7,
      paint: {
        'fill-color': '#ff00ff',
      },
    },
    {
      id: 'park_national_park',
      type: 'fill',
      source: 'carto',
      'source-layer': 'landuse',
      minzoom: 9,
      paint: {
        'fill-color': '#ff00ff',
      },
    },
    {
      id: 'park_nature_reserve',
      type: 'fill',
      source: 'carto',
      'source-layer': 'landuse',
      minzoom: 0,
      paint: {
        'fill-color': '#ff00ff',
      },
    },
    {
      id: 'landuse_residential',
      type: 'fill',
      source: 'carto',
      'source-layer': 'landuse',
      minzoom: 6,
      paint: {
        'fill-color': '#ff00ff',
      },
    },
    {
      id: 'landuse',
      type: 'fill',
      source: 'carto',
      'source-layer': 'landuse',
      paint: {
        'fill-color': '#ff00ff',
      },
    },
    {
      id: 'waterway',
      type: 'line',
      source: 'carto',
      'source-layer': 'water',
      paint: {
        'line-color': '#ff00ff',
        'line-width': {
          stops: [
            [8, 0.5],
            [9, 1],
            [15, 2],
            [16, 3],
          ],
        },
      },
    },
    {
      id: 'boundary_county',
      type: 'line',
      source: 'carto',
      'source-layer': 'boundaries',
      minzoom: 9,
      paint: {
        'line-color': '#ff00ff',
        'line-width': {
          stops: [
            [4, 0.5],
            [7, 1],
          ],
        },
      },
    },
    {
      id: 'boundary_state',
      type: 'line',
      source: 'carto',
      'source-layer': 'boundaries',
      minzoom: 4,
      filter: [
        'any',
        ['all', ['==', ['get', 'kind_detail'], 4], ['>=', ['zoom'], 6]],
        ['all', ['==', ['get', 'kind'], 'macroregion'], ['<', ['zoom'], 6]],
      ],
      paint: {
        'line-color': '#ff00ff',
        'line-width': {
          stops: [
            [4, 0.5],
            [7, 1],
            [8, 1],
            [9, 1.2],
          ],
        },
      },
    },
    {
      id: 'water',
      type: 'fill',
      source: 'carto',
      'source-layer': 'water',
      minzoom: 0,
      paint: {
        'fill-color': '#ff00ff',
      },
    },
    {
      id: 'water_shadow',
      type: 'fill',
      source: 'carto',
      'source-layer': 'water',
      minzoom: 0,
      paint: {
        'fill-color': 'transparent',
      },
    },
    {
      id: 'aeroway-runway',
      type: 'line',
      source: 'carto',
      'source-layer': 'roads',
      minzoom: 12,
      paint: {
        'line-width': {
          stops: [
            [11, 1],
            [13, 4],
            [14, 6],
            [15, 8],
            [16, 10],
          ],
        },
        'line-color': '#ff00ff',
      },
    },
    {
      id: 'aeroway-taxiway',
      type: 'line',
      source: 'carto',
      'source-layer': 'roads',
      minzoom: 13,
      paint: {
        'line-color': '#ff00ff',
        'line-width': {
          stops: [
            [13, 0.5],
            [14, 1],
            [15, 2],
            [16, 4],
          ],
        },
      },
    },
    {
      id: 'waterway_label',
      type: 'symbol',
      source: 'carto',
      'source-layer': 'water',
      paint: {
        'text-color': '#ff00ff',
        'text-halo-color': '#ff00ff',
      },
      layout: {
        'text-font': ['Montserrat Regular Italic', 'Open Sans Italic', 'Noto Sans Regular', 'Noto Sans CJK JP Regular'],
      },
    },
    {
      id: 'tunnel_service_case',
      type: 'line',
      source: 'carto',
      'source-layer': 'roads',
      minzoom: 15,
      paint: {
        'line-width': {
          stops: [
            [15, 1],
            [16, 3],
            [17, 6],
            [18, 8],
          ],
        },
        'line-color': '#ff00ff',
      },
    },
    {
      id: 'tunnel_minor_case',
      type: 'line',
      source: 'carto',
      'source-layer': 'roads',
      minzoom: 13,
      paint: {
        'line-width': {
          stops: [
            [11, 0.5],
            [12, 0.5],
            [14, 2],
            [15, 4],
            [16, 6],
            [17, 10],
            [18, 14],
          ],
        },
        'line-color': '#ff00ff',
      },
    },
    {
      id: 'tunnel_sec_case',
      type: 'line',
      source: 'carto',
      'source-layer': 'roads',
      minzoom: 11,
      paint: {
        'line-width': {
          stops: [
            [11, 0.5],
            [12, 1],
            [13, 2],
            [14, 5],
            [15, 6],
            [16, 8],
            [17, 12],
            [18, 16],
          ],
        },
        'line-color': '#ff00ff',
      },
    },
    {
      id: 'tunnel_pri_case',
      type: 'line',
      source: 'carto',
      'source-layer': 'roads',
      minzoom: 8,
      paint: {
        'line-width': {
          stops: [
            [6, 0.5],
            [7, 0.8],
            [8, 1],
            [11, 3],
            [13, 4],
            [14, 6],
            [15, 8],
            [16, 10],
            [17, 14],
            [18, 18],
          ],
        },
        'line-color': '#ff00ff',
      },
    },
    {
      id: 'tunnel_trunk_case',
      type: 'line',
      source: 'carto',
      'source-layer': 'roads',
      minzoom: 5,
      paint: {
        'line-width': {
          stops: [
            [6, 0.5],
            [7, 0.8],
            [8, 1],
            [11, 3],
            [13, 4],
            [14, 6],
            [15, 8],
            [16, 10],
            [17, 14],
            [18, 18],
          ],
        },
        'line-color': '#ff00ff',
      },
    },
    {
      id: 'tunnel_mot_case',
      type: 'line',
      source: 'carto',
      'source-layer': 'roads',
      minzoom: 5,
      paint: {
        'line-width': {
          stops: [
            [6, 0.5],
            [7, 0.8],
            [8, 1],
            [11, 3],
            [12, 4],
            [13, 5],
            [14, 7],
            [15, 9],
            [16, 11],
            [17, 13],
            [18, 22],
          ],
        },
        'line-color': '#ff00ff',
      },
    },
    {
      id: 'tunnel_path',
      type: 'line',
      source: 'carto',
      'source-layer': 'roads',
      minzoom: 15,
      paint: {
        'line-width': {
          stops: [
            [15, 0.5],
            [16, 1],
            [18, 3],
          ],
        },
        'line-color': '#ff00ff',
      },
    },
    {
      id: 'tunnel_service_fill',
      type: 'line',
      source: 'carto',
      'source-layer': 'roads',
      minzoom: 15,
      paint: {
        'line-width': {
          stops: [
            [15, 2],
            [16, 2],
            [17, 4],
            [18, 6],
          ],
        },
        'line-color': '#ff00ff',
      },
    },
    {
      id: 'tunnel_minor_fill',
      type: 'line',
      source: 'carto',
      'source-layer': 'roads',
      minzoom: 15,
      paint: {
        'line-width': {
          stops: [
            [15, 3],
            [16, 4],
            [17, 8],
            [18, 12],
          ],
        },
        'line-color': '#ff00ff',
      },
    },
    {
      id: 'tunnel_sec_fill',
      type: 'line',
      source: 'carto',
      'source-layer': 'roads',
      minzoom: 13,
      paint: {
        'line-width': {
          stops: [
            [11, 2],
            [13, 2],
            [14, 3],
            [15, 4],
            [16, 6],
            [17, 10],
            [18, 14],
          ],
        },
        'line-color': '#ff00ff',
      },
    },
    {
      id: 'tunnel_pri_fill',
      type: 'line',
      source: 'carto',
      'source-layer': 'roads',
      minzoom: 11,
      paint: {
        'line-width': {
          stops: [
            [11, 1],
            [13, 2],
            [14, 4],
            [15, 6],
            [16, 8],
            [17, 12],
            [18, 16],
          ],
        },
        'line-color': '#ff00ff',
      },
    },
    {
      id: 'tunnel_trunk_fill',
      type: 'line',
      source: 'carto',
      'source-layer': 'roads',
      minzoom: 11,
      paint: {
        'line-width': {
          stops: [
            [11, 1],
            [13, 2],
            [14, 4],
            [15, 6],
            [16, 8],
            [17, 12],
            [18, 16],
          ],
        },
        'line-color': '#ff00ff',
      },
    },
    {
      id: 'tunnel_mot_fill',
      type: 'line',
      source: 'carto',
      'source-layer': 'roads',
      minzoom: 10,
      paint: {
        'line-width': {
          stops: [
            [10, 1],
            [12, 2],
            [13, 3],
            [14, 5],
            [15, 7],
            [16, 9],
            [17, 11],
            [18, 20],
          ],
        },
        'line-color': '#ff00ff',
      },
    },
    {
      id: 'tunnel_rail',
      type: 'line',
      source: 'carto',
      'source-layer': 'roads',
      minzoom: 13,
      paint: {
        'line-color': '#ff00ff',
        'line-width': {
          base: 1.3,
          stops: [
            [13, 0.5],
            [14, 1],
            [15, 1],
            [16, 3],
            [21, 7],
          ],
        },
      },
    },
    {
      id: 'tunnel_rail_dash',
      type: 'line',
      source: 'carto',
      'source-layer': 'roads',
      minzoom: 15,
      paint: {
        'line-color': '#ff00ff',
        'line-width': {
          base: 1.3,
          stops: [
            [15, 0.5],
            [16, 1],
            [20, 5],
          ],
        },
      },
    },
    {
      id: 'road_service_case',
      type: 'line',
      source: 'carto',
      'source-layer': 'roads',
      minzoom: 15,
      paint: {
        'line-width': {
          stops: [
            [15, 1],
            [16, 3],
            [17, 6],
            [18, 8],
          ],
        },
        'line-color': '#ff00ff',
      },
    },
    {
      id: 'road_minor_case',
      type: 'line',
      source: 'carto',
      'source-layer': 'roads',
      minzoom: 13,
      paint: {
        'line-width': {
          stops: [
            [11, 0.5],
            [12, 0.5],
            [14, 2],
            [15, 3],
            [16, 4.3],
            [17, 10],
            [18, 14],
          ],
        },
        'line-color': '#ff00ff',
      },
    },
    {
      id: 'road_pri_case_ramp',
      type: 'line',
      source: 'carto',
      'source-layer': 'roads',
      minzoom: 12,
      paint: {
        'line-width': {
          stops: [
            [12, 2],
            [13, 3],
            [14, 4],
            [15, 5],
            [16, 8],
            [17, 10],
          ],
        },
        'line-color': '#ff00ff',
      },
    },
    {
      id: 'road_trunk_case_ramp',
      type: 'line',
      source: 'carto',
      'source-layer': 'roads',
      minzoom: 12,
      paint: {
        'line-width': {
          stops: [
            [12, 2],
            [13, 3],
            [14, 4],
            [15, 5],
            [16, 8],
            [17, 10],
          ],
        },
        'line-color': '#ff00ff',
      },
    },
    {
      id: 'road_mot_case_ramp',
      type: 'line',
      source: 'carto',
      'source-layer': 'roads',
      minzoom: 12,
      paint: {
        'line-width': {
          stops: [
            [12, 2],
            [13, 3],
            [14, 4],
            [15, 5],
            [16, 8],
            [17, 10],
          ],
        },
        'line-color': '#ff00ff',
      },
    },
    {
      id: 'road_sec_case_noramp',
      type: 'line',
      source: 'carto',
      'source-layer': 'roads',
      minzoom: 11,
      paint: {
        'line-width': {
          stops: [
            [11, 0.5],
            [12, 1.5],
            [13, 3],
            [14, 5],
            [15, 6],
            [16, 8],
            [17, 12],
            [18, 16],
          ],
        },
        'line-color': '#ff00ff',
      },
    },
    {
      id: 'road_pri_case_noramp',
      type: 'line',
      source: 'carto',
      'source-layer': 'roads',
      minzoom: 7,
      paint: {
        'line-width': {
          stops: [
            [6, 0.5],
            [7, 0.8],
            [8, 1],
            [11, 3],
            [13, 4],
            [14, 6],
            [15, 8],
            [16, 10],
            [17, 14],
            [18, 18],
          ],
        },
        'line-color': '#ff00ff',
      },
    },
    {
      id: 'road_trunk_case_noramp',
      type: 'line',
      source: 'carto',
      'source-layer': 'roads',
      minzoom: 5,
      paint: {
        'line-width': {
          stops: [
            [6, 0.5],
            [7, 0.8],
            [8, 1],
            [11, 3],
            [13, 4],
            [14, 6],
            [15, 8],
            [16, 10],
            [17, 14],
            [18, 18],
          ],
        },
        'line-color': '#ff00ff',
      },
    },
    {
      id: 'road_mot_case_noramp',
      type: 'line',
      source: 'carto',
      'source-layer': 'roads',
      minzoom: 5,
      paint: {
        'line-width': {
          stops: [
            [6, 0.5],
            [7, 0.7],
            [8, 0.8],
            [11, 3],
            [12, 4],
            [13, 5],
            [14, 7],
            [15, 9],
            [16, 11],
            [17, 13],
            [18, 22],
          ],
        },
        'line-color': '#ff00ff',
      },
    },
    {
      id: 'road_path',
      type: 'line',
      source: 'carto',
      'source-layer': 'roads',
      minzoom: 15,
      paint: {
        'line-width': {
          stops: [
            [15, 0.5],
            [16, 1],
            [18, 3],
          ],
        },
        'line-color': '#ff00ff',
      },
    },
    {
      id: 'road_path_areas',
      type: 'line',
      source: 'carto',
      'source-layer': 'landuse',
      minzoom: 15,
      paint: {
        'line-width': {
          stops: [
            [15, 0.5],
            [16, 1],
            [18, 3],
          ],
        },
        'line-color': '#ff00ff',
      },
    },
    {
      id: 'road_service_fill',
      type: 'line',
      source: 'carto',
      'source-layer': 'roads',
      minzoom: 15,
      paint: {
        'line-width': {
          stops: [
            [15, 2],
            [16, 2],
            [17, 4],
            [18, 6],
          ],
        },
        'line-color': '#ff00ff',
      },
    },
    {
      id: 'road_minor_fill',
      type: 'line',
      source: 'carto',
      'source-layer': 'roads',
      minzoom: 15,
      paint: {
        'line-width': {
          stops: [
            [15, 3],
            [16, 4],
            [17, 8],
            [18, 12],
          ],
        },
        'line-color': '#ff00ff',
      },
    },
    {
      id: 'road_pri_fill_ramp',
      type: 'line',
      source: 'carto',
      'source-layer': 'roads',
      minzoom: 12,
      paint: {
        'line-width': {
          stops: [
            [12, 1],
            [13, 1.5],
            [14, 2],
            [15, 3],
            [16, 6],
            [17, 8],
          ],
        },
        'line-color': '#ff00ff',
      },
    },
    {
      id: 'road_trunk_fill_ramp',
      type: 'line',
      source: 'carto',
      'source-layer': 'roads',
      minzoom: 12,
      paint: {
        'line-width': {
          stops: [
            [12, 1],
            [13, 1.5],
            [14, 2],
            [15, 3],
            [16, 6],
            [17, 8],
          ],
        },
        'line-color': '#ff00ff',
      },
    },
    {
      id: 'road_mot_fill_ramp',
      type: 'line',
      source: 'carto',
      'source-layer': 'roads',
      minzoom: 12,
      paint: {
        'line-width': {
          stops: [
            [12, 1],
            [13, 1.5],
            [14, 2],
            [15, 3],
            [16, 6],
            [17, 8],
          ],
        },
        'line-color': '#ff00ff',
      },
    },
    {
      id: 'road_sec_fill_noramp',
      type: 'line',
      source: 'carto',
      'source-layer': 'roads',
      minzoom: 13,
      paint: {
        'line-width': {
          stops: [
            [11, 2],
            [13, 2],
            [14, 3],
            [15, 4],
            [16, 6],
            [17, 10],
            [18, 14],
          ],
        },
        'line-color': '#ff00ff',
      },
    },
    {
      id: 'road_pri_fill_noramp',
      type: 'line',
      source: 'carto',
      'source-layer': 'roads',
      minzoom: 10,
      paint: {
        'line-width': {
          stops: [
            [10, 0.3],
            [13, 2],
            [14, 4],
            [15, 6],
            [16, 8],
            [17, 12],
            [18, 16],
          ],
        },
        'line-color': '#ff00ff',
      },
    },
    {
      id: 'road_trunk_fill_noramp',
      type: 'line',
      source: 'carto',
      'source-layer': 'roads',
      minzoom: 10,
      paint: {
        'line-width': {
          stops: [
            [11, 1],
            [13, 2],
            [14, 4],
            [15, 6],
            [16, 8],
            [17, 12],
            [18, 16],
          ],
        },
        'line-color': '#ff00ff',
      },
    },
    {
      id: 'road_mot_fill_noramp',
      type: 'line',
      source: 'carto',
      'source-layer': 'roads',
      minzoom: 10,
      paint: {
        'line-width': {
          stops: [
            [10, 1],
            [12, 2],
            [13, 3],
            [14, 5],
            [15, 7],
            [16, 9],
            [17, 11],
            [18, 20],
          ],
        },
        'line-color': '#ff00ff',
      },
    },
    {
      id: 'rail',
      type: 'line',
      source: 'carto',
      'source-layer': 'roads',
      minzoom: 13,
      paint: {
        'line-color': '#ff00ff',
        'line-width': {
          base: 1.3,
          stops: [
            [13, 0.5],
            [14, 1],
            [15, 1],
            [16, 3],
            [21, 7],
          ],
        },
      },
    },
    {
      id: 'rail_dash',
      type: 'line',
      source: 'carto',
      'source-layer': 'roads',
      minzoom: 15,
      paint: {
        'line-color': '#ff00ff',
        'line-width': {
          base: 1.3,
          stops: [
            [15, 0.5],
            [16, 1],
            [20, 5],
          ],
        },
      },
    },
    {
      id: 'bridge_service_case',
      type: 'line',
      source: 'carto',
      'source-layer': 'roads',
      minzoom: 15,
      paint: {
        'line-width': {
          stops: [
            [15, 1],
            [16, 3],
            [17, 6],
            [18, 8],
          ],
        },
        'line-color': '#ff00ff',
      },
    },
    {
      id: 'bridge_minor_case',
      type: 'line',
      source: 'carto',
      'source-layer': 'roads',
      minzoom: 13,
      paint: {
        'line-width': {
          stops: [
            [11, 0.5],
            [12, 0.5],
            [14, 2],
            [15, 3],
            [16, 4.3],
            [17, 10],
            [18, 14],
          ],
        },
        'line-color': '#ff00ff',
      },
    },
    {
      id: 'bridge_sec_case',
      type: 'line',
      source: 'carto',
      'source-layer': 'roads',
      minzoom: 11,
      paint: {
        'line-width': {
          stops: [
            [11, 0.5],
            [12, 1.5],
            [13, 3],
            [14, 5],
            [15, 6],
            [16, 8],
            [17, 12],
            [18, 16],
          ],
        },
        'line-color': '#ff00ff',
      },
    },
    {
      id: 'bridge_pri_case',
      type: 'line',
      source: 'carto',
      'source-layer': 'roads',
      minzoom: 8,
      paint: {
        'line-width': {
          stops: [
            [6, 0.5],
            [7, 0.8],
            [8, 1],
            [11, 3],
            [13, 4],
            [14, 6],
            [15, 8],
            [16, 10],
            [17, 14],
            [18, 18],
          ],
        },
        'line-color': '#ff00ff',
      },
    },
    {
      id: 'bridge_trunk_case',
      type: 'line',
      source: 'carto',
      'source-layer': 'roads',
      minzoom: 5,
      paint: {
        'line-width': {
          stops: [
            [6, 0.5],
            [7, 0.8],
            [8, 1],
            [11, 3],
            [13, 4],
            [14, 6],
            [15, 8],
            [16, 10],
            [17, 14],
            [18, 18],
          ],
        },
        'line-color': '#ff00ff',
      },
    },
    {
      id: 'bridge_mot_case',
      type: 'line',
      source: 'carto',
      'source-layer': 'roads',
      minzoom: 5,
      paint: {
        'line-width': {
          stops: [
            [6, 0.5],
            [7, 0.8],
            [8, 1],
            [11, 3],
            [12, 4],
            [13, 5],
            [14, 7],
            [15, 9],
            [16, 11],
            [17, 13],
            [18, 22],
          ],
        },
        'line-color': '#ff00ff',
      },
    },
    {
      id: 'bridge_path',
      type: 'line',
      source: 'carto',
      'source-layer': 'roads',
      minzoom: 15,
      paint: {
        'line-width': {
          stops: [
            [15, 0.5],
            [16, 1],
            [18, 3],
          ],
        },
        'line-color': '#ff00ff',
      },
    },
    {
      id: 'bridge_service_fill',
      type: 'line',
      source: 'carto',
      'source-layer': 'roads',
      minzoom: 15,
      paint: {
        'line-width': {
          stops: [
            [15, 2],
            [16, 2],
            [17, 4],
            [18, 6],
          ],
        },
        'line-color': '#ff00ff',
      },
    },
    {
      id: 'bridge_minor_fill',
      type: 'line',
      source: 'carto',
      'source-layer': 'roads',
      minzoom: 15,
      paint: {
        'line-width': {
          stops: [
            [15, 3],
            [16, 4],
            [17, 8],
            [18, 12],
          ],
        },
        'line-color': '#ff00ff',
      },
    },
    {
      id: 'bridge_sec_fill',
      type: 'line',
      source: 'carto',
      'source-layer': 'roads',
      minzoom: 13,
      paint: {
        'line-width': {
          stops: [
            [11, 2],
            [13, 2],
            [14, 3],
            [15, 4],
            [16, 6],
            [17, 10],
            [18, 14],
          ],
        },
        'line-color': '#ff00ff',
      },
    },
    {
      id: 'bridge_pri_fill',
      type: 'line',
      source: 'carto',
      'source-layer': 'roads',
      minzoom: 11,
      paint: {
        'line-width': {
          stops: [
            [11, 1],
            [13, 2],
            [14, 4],
            [15, 6],
            [16, 8],
            [17, 12],
            [18, 16],
          ],
        },
        'line-color': '#ff00ff',
      },
    },
    {
      id: 'bridge_trunk_fill',
      type: 'line',
      source: 'carto',
      'source-layer': 'roads',
      minzoom: 11,
      paint: {
        'line-width': {
          stops: [
            [11, 1],
            [13, 2],
            [14, 4],
            [15, 6],
            [16, 8],
            [17, 12],
            [18, 16],
          ],
        },
        'line-color': '#ff00ff',
      },
    },
    {
      id: 'bridge_mot_fill',
      type: 'line',
      source: 'carto',
      'source-layer': 'roads',
      minzoom: 10,
      paint: {
        'line-width': {
          stops: [
            [10, 1],
            [12, 2],
            [13, 3],
            [14, 5],
            [15, 7],
            [16, 9],
            [17, 11],
            [18, 20],
          ],
        },
        'line-color': '#ff00ff',
      },
    },
    {
      id: 'building',
      type: 'fill',
      source: 'carto',
      'source-layer': 'buildings',
      minzoom: 13,
      paint: {
        'fill-color': '#ff00ff',
      },
    },
    {
      id: 'building-top',
      type: 'fill',
      source: 'carto',
      'source-layer': 'buildings',
      minzoom: 13,
      paint: {
        'fill-outline-color': '#ff00ff',
        'fill-color': '#ff00ff',
      },
    },
    {
      id: 'boundary_country_outline',
      type: 'line',
      source: 'carto',
      'source-layer': 'boundaries',
      minzoom: 6,
      paint: {
        'line-color': '#ff00ff',
        'line-width': 8,
      },
    },
    {
      id: 'boundary_country_inner',
      type: 'line',
      source: 'carto',
      'source-layer': 'boundaries',
      minzoom: 0,
      paint: {
        'line-color': '#ff00ff',
        'line-width': {
          stops: [
            [3, 1],
            [6, 1.5],
          ],
        },
      },
    },
    {
      id: 'watername_ocean',
      type: 'symbol',
      source: 'carto',
      'source-layer': 'water',
      minzoom: 0,
      paint: {
        'text-color': '#ff00ff',
        'text-halo-color': '#ff00ff',
      },
      layout: {
        'text-font': [
          'Montserrat SemiBold Italic',
          'Open Sans Italic',
          'Noto Sans Regular',
          'Noto Sans CJK JP Regular',
        ],
      },
    },
    {
      id: 'watername_sea',
      type: 'symbol',
      source: 'carto',
      'source-layer': 'water',
      minzoom: 5,
      paint: {
        'text-color': '#ff00ff',
        'text-halo-color': '#ff00ff',
      },
      layout: {
        'text-font': [
          'Montserrat SemiBold Italic',
          'Open Sans Italic',
          'Noto Sans Regular',
          'Noto Sans CJK JP Regular',
        ],
      },
    },
    {
      id: 'watername_lake',
      type: 'symbol',
      source: 'carto',
      'source-layer': 'water',
      minzoom: 4,
      paint: {
        'text-color': '#ff00ff',
        'text-halo-color': '#ff00ff',
      },
      layout: {
        'text-font': ['Montserrat Regular Italic', 'Open Sans Italic', 'Noto Sans Regular', 'Noto Sans CJK JP Regular'],
      },
    },
    {
      id: 'watername_lake_pois',
      type: 'symbol',
      source: 'carto',
      'source-layer': 'pois',
      minzoom: 4,
      paint: {
        'text-color': '#ff00ff',
        'text-halo-color': '#ff00ff',
      },
      layout: {
        'text-font': ['Montserrat Regular Italic', 'Open Sans Italic', 'Noto Sans Regular', 'Noto Sans CJK JP Regular'],
      },
    },
    {
      id: 'watername_lake_line',
      type: 'symbol',
      source: 'carto',
      'source-layer': 'water',
      paint: {
        'text-color': '#ff00ff',
        'text-halo-color': '#ff00ff',
      },
      layout: {
        'text-font': ['Montserrat Regular Italic', 'Open Sans Italic', 'Noto Sans Regular', 'Noto Sans CJK JP Regular'],
      },
    },
    {
      id: 'place_hamlet',
      type: 'symbol',
      source: 'carto',
      'source-layer': 'places',
      minzoom: 12,
      paint: {
        'text-color': '#ff00ff',
        'icon-color': '#ff00ff',
        'text-halo-color': '#ff00ff',
      },
      layout: {
        'text-font': ['Montserrat Medium', 'Open Sans Regular', 'Noto Sans Regular', 'Noto Sans CJK JP Regular'],
      },
    },
    {
      id: 'place_suburbs',
      type: 'symbol',
      source: 'carto',
      'source-layer': 'places',
      minzoom: 12,
      paint: {
        'text-color': '#ff00ff',
        'icon-color': '#ff00ff',
        'text-halo-color': '#ff00ff',
      },
      layout: {
        'text-font': ['Montserrat Medium', 'Open Sans Regular', 'Noto Sans Regular', 'Noto Sans CJK JP Regular'],
      },
    },
    {
      id: 'place_villages',
      type: 'symbol',
      source: 'carto',
      'source-layer': 'places',
      minzoom: 10,
      paint: {
        'text-color': '#ff00ff',
        'icon-color': '#ff00ff',
        'text-halo-color': '#ff00ff',
      },
      layout: {
        'text-font': ['Montserrat SemiBold', 'Open Sans Bold', 'Noto Sans Regular', 'Noto Sans CJK JP Regular'],
      },
    },
    {
      id: 'place_town',
      type: 'symbol',
      source: 'carto',
      'source-layer': 'places',
      minzoom: 8,
      paint: {
        'text-color': '#ff00ff',
        'icon-color': '#ff00ff',
        'text-halo-color': '#ff00ff',
      },
      layout: {
        'text-font': ['Montserrat SemiBold', 'Open Sans Bold', 'Noto Sans Regular', 'Noto Sans CJK JP Regular'],
      },
    },
    {
      id: 'place_country_2',
      type: 'symbol',
      source: 'carto',
      'source-layer': 'places',
      minzoom: 3,
      paint: {
        'text-color': '#ff00ff',
        'text-halo-color': '#ff00ff',
      },
      layout: {
        'text-font': ['Montserrat SemiBold', 'Open Sans Bold', 'Noto Sans Regular', 'Noto Sans CJK JP Regular'],
      },
    },
    {
      id: 'place_country_1',
      type: 'symbol',
      source: 'carto',
      'source-layer': 'places',
      minzoom: 2,
      paint: {
        'text-color': '#ff00ff',
        'text-halo-color': '#ff00ff',
      },
      layout: {
        'text-font': ['Montserrat SemiBold', 'Open Sans Bold', 'Noto Sans Regular', 'Noto Sans CJK JP Regular'],
      },
    },
    {
      id: 'place_state',
      type: 'symbol',
      source: 'carto',
      'source-layer': 'places',
      minzoom: 5,
      paint: {
        'text-color': '#ff00ff',
        'text-halo-color': '#ff00ff',
      },
      layout: {
        'text-font': ['Montserrat SemiBold', 'Open Sans Bold', 'Noto Sans Regular', 'Noto Sans CJK JP Regular'],
      },
    },
    {
      id: 'place_continent',
      type: 'symbol',
      source: 'carto',
      'source-layer': 'places',
      minzoom: 0,
      paint: {
        'text-color': '#ff00ff',
        'text-halo-color': '#ff00ff',
      },
      layout: {
        'text-font': ['Montserrat SemiBold', 'Open Sans Bold', 'Noto Sans Regular', 'Noto Sans CJK JP Regular'],
      },
    },
    {
      id: 'place_city_r6',
      type: 'symbol',
      source: 'carto',
      'source-layer': 'places',
      minzoom: 8,
      paint: {
        'text-color': '#ff00ff',
        'icon-color': '#ff00ff',
        'text-halo-color': '#ff00ff',
      },
      layout: {
        'text-font': ['Montserrat SemiBold', 'Open Sans Bold', 'Noto Sans Regular', 'Noto Sans CJK JP Regular'],
      },
    },
    {
      id: 'place_city_r5',
      type: 'symbol',
      source: 'carto',
      'source-layer': 'places',
      minzoom: 8,
      paint: {
        'text-color': '#ff00ff',
        'icon-color': '#ff00ff',
        'text-halo-color': '#ff00ff',
      },
      layout: {
        'text-font': ['Montserrat SemiBold', 'Open Sans Bold', 'Noto Sans Regular', 'Noto Sans CJK JP Regular'],
      },
    },
    {
      id: 'place_city_dot_r7',
      type: 'symbol',
      source: 'carto',
      'source-layer': 'places',
      minzoom: 6,
      paint: {
        'text-color': '#ff00ff',
        'icon-color': '#ff00ff',
        'text-halo-color': '#ff00ff',
      },
      layout: {
        'text-font': ['Montserrat SemiBold', 'Open Sans Bold', 'Noto Sans Regular', 'Noto Sans CJK JP Regular'],
      },
    },
    {
      id: 'place_city_dot_r4',
      type: 'symbol',
      source: 'carto',
      'source-layer': 'places',
      minzoom: 5,
      paint: {
        'text-color': '#ff00ff',
        'icon-color': '#ff00ff',
        'text-halo-color': '#ff00ff',
      },
      layout: {
        'text-font': ['Montserrat SemiBold', 'Open Sans Bold', 'Noto Sans Regular', 'Noto Sans CJK JP Regular'],
      },
    },
    {
      id: 'place_city_dot_r2',
      type: 'symbol',
      source: 'carto',
      'source-layer': 'places',
      minzoom: 4,
      paint: {
        'text-color': '#ff00ff',
        'icon-color': '#ff00ff',
        'text-halo-color': '#ff00ff',
      },
      layout: {
        'text-font': ['Montserrat SemiBold', 'Open Sans Bold', 'Noto Sans Regular', 'Noto Sans CJK JP Regular'],
      },
    },
    {
      id: 'place_city_dot_z7',
      type: 'symbol',
      source: 'carto',
      'source-layer': 'places',
      minzoom: 7,
      paint: {
        'text-color': '#ff00ff',
        'icon-color': '#ff00ff',
        'text-halo-color': '#ff00ff',
      },
      layout: {
        'text-font': ['Montserrat SemiBold', 'Open Sans Bold', 'Noto Sans Regular', 'Noto Sans CJK JP Regular'],
      },
    },
    {
      id: 'place_capital_dot_z7',
      type: 'symbol',
      source: 'carto',
      'source-layer': 'places',
      minzoom: 7,
      paint: {
        'text-color': '#ff00ff',
        'icon-color': '#ff00ff',
        'text-halo-color': '#ff00ff',
      },
      layout: {
        'text-font': ['Montserrat SemiBold', 'Open Sans Bold', 'Noto Sans Regular', 'Noto Sans CJK JP Regular'],
      },
    },
    {
      id: 'poi_stadium',
      type: 'symbol',
      source: 'carto',
      'source-layer': 'pois',
      minzoom: 15,
      paint: {
        'text-color': '#ff00ff',
        'text-halo-color': '#ff00ff',
      },
      layout: {
        'text-font': ['Montserrat SemiBold', 'Open Sans Bold', 'Noto Sans Regular', 'Noto Sans CJK JP Regular'],
      },
    },
    {
      id: 'poi_park',
      type: 'symbol',
      source: 'carto',
      'source-layer': 'pois',
      minzoom: 15,
      paint: {
        'text-color': '#ff00ff',
        'text-halo-color': '#ff00ff',
      },
      layout: {
        'text-font': ['Montserrat SemiBold', 'Open Sans Bold', 'Noto Sans Regular', 'Noto Sans CJK JP Regular'],
      },
    },
    {
      id: 'roadname_minor',
      type: 'symbol',
      source: 'carto',
      'source-layer': 'roads',
      minzoom: 16,
      paint: {
        'text-color': '#ff00ff',
        'text-halo-color': '#ff00ff',
      },
      layout: {
        'text-font': ['Montserrat Medium', 'Open Sans Regular', 'Noto Sans Regular', 'Noto Sans CJK JP Regular'],
      },
    },
    {
      id: 'roadname_sec',
      type: 'symbol',
      source: 'carto',
      'source-layer': 'roads',
      minzoom: 15,
      paint: {
        'text-color': '#ff00ff',
        'text-halo-color': '#ff00ff',
      },
      layout: {
        'text-font': ['Montserrat Medium', 'Open Sans Regular', 'Noto Sans Regular', 'Noto Sans CJK JP Regular'],
      },
    },
    {
      id: 'roadname_pri',
      type: 'symbol',
      source: 'carto',
      'source-layer': 'roads',
      minzoom: 14,
      paint: {
        'text-color': '#ff00ff',
        'text-halo-color': '#ff00ff',
      },
      layout: {
        'text-font': ['Montserrat Medium', 'Open Sans Regular', 'Noto Sans Regular', 'Noto Sans CJK JP Regular'],
      },
    },
    {
      id: 'roadname_major',
      type: 'symbol',
      source: 'carto',
      'source-layer': 'roads',
      minzoom: 13,
      paint: {
        'text-color': '#ff00ff',
        'text-halo-color': '#ff00ff',
      },
      layout: {
        'text-font': ['Montserrat Medium', 'Open Sans Regular', 'Noto Sans Regular', 'Noto Sans CJK JP Regular'],
      },
    },
    {
      id: 'housenumber',
      type: 'symbol',
      source: 'carto',
      'source-layer': 'buildings',
      minzoom: 17,
      paint: {
        'text-halo-color': 'transparent',
        'text-color': 'transparent',
      },
      layout: {
        'text-font': ['Montserrat Medium', 'Open Sans Regular', 'Noto Sans Regular', 'Noto Sans CJK JP Regular'],
      },
    },
  ],
} as unknown as StyleSpecification;
