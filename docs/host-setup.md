# Host setup

What an app must provide to run Kilowatt's theme or to rebuild its reference charts and maps. Storybook sets this up for its own pages, so a missing piece shows up only once the code runs in the app.

Start with Introduction → Set up MUI in an app, which installs MUI and copies the theme. This page lists what the host provides on top of that.

| The host provides                    | Needed by                       | Without it                                               |
| ------------------------------------ | ------------------------------- | -------------------------------------------------------- |
| `MuiProvider` around the tree        | Everything                      | MUI's default theme; charts and maps never draw          |
| A wait for the color scheme          | Rebuilt charts and maps         | Dark charts and maps build once in light, then rebuild   |
| Roboto and Material Symbols Outlined | Everything                      | The fallback font; icons show their names as text        |
| The map fonts, and their URL         | Rebuilt maps                    | Map labels don't draw                                    |
| `InitColorSchemeScript`              | Hosts that render on the server | Dark viewers see the page in light until the client runs |

## Wrap the tree in `MuiProvider`

`MuiProvider` (`src/mui/MuiProvider.tsx`) applies the theme and MUI's `CssBaseline`, and holds the color scheme. Everything that draws Kilowatt sits inside it.

```tsx
<MuiProvider>
  <App />
</MuiProvider>
```

Outside it, MUI components render with MUI's default theme, and nothing tells you so. `useResolvedScheme` stays undefined there, so `useChart` never builds its chart and `SiteMap` never loads its basemap or data: the chart's `div` and the map's surface stay empty, with no error.

## Wait for the color scheme

MUI doesn't know the color scheme on the first render, so `useColorScheme()` returns no mode until the client has mounted. `useResolvedScheme` (`src/mui/useResolvedScheme.ts`) wraps it: undefined until the scheme is known, then `light` or `dark`, with `system` resolved to the viewer's setting. It isn't one of the theme files Introduction lists, so copy it beside them. It imports only `departures.ts` and MUI.

amCharts and MapLibre draw once per scheme, so a rebuilt chart or map skips its work until the scheme is there and runs again when it changes. This is how `src/charts/useChart.ts` does it:

```tsx
const scheme = useResolvedScheme();

useLayoutEffect(() => {
  if (!ref.current || !scheme) return;
  const root = am5.Root.new(ref.current);
  root.setThemes(chartThemes(root, scheme, reducedMotion));
  build({ root, scheme, colors: chartColors(scheme) });
  return () => root.dispose();
}, [build, scheme, reducedMotion]);
```

Don't default to light with `scheme ?? 'light'` or `scheme === 'dark' ? 'dark' : 'light'`. In dark, that builds the chart in light and then builds it again. Run charts through `useChart` and the wait comes with it; a map checks the scheme itself, as `SiteMap` does before it calls `basemapStyle` and `mapColors`.

## Load the fonts

The theme names Roboto and the `Icon` component uses Material Symbols Outlined, but neither is bundled. In this repository they load from `.storybook/preview-head.html`, which an app doesn't get. Put these in the page's `<head>`, Roboto at the four weights the theme uses (300, 400, 500, 700):

```html
<link rel="preconnect" href="https://fonts.googleapis.com" />
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
<link href="https://fonts.googleapis.com/css2?family=Roboto:wght@300;400;500;700&display=swap" rel="stylesheet" />
<link
  href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:opsz,wght,FILL,GRAD@20..48,100..700,0..1,-50..200&display=block"
  rel="stylesheet"
/>
```

`document.fonts.check('16px Roboto')` returns `true` once Roboto has loaded, and `<Icon name="search" />` draws a magnifying glass rather than the word “search” once the icon font has.

## Host the map fonts

MapLibre draws map labels from glyph files, and CARTO's font server has no Roboto (Rules → Maps). `src/maps/fonts` holds Roboto Regular and Roboto Medium as glyph files. Serve that folder from the app with its two subfolder names unchanged, since they're the font names the basemap style asks for. Storybook serves it at `/map-fonts/` (`.storybook/main.ts`).

Pass its URL to `basemapStyle(scheme, glyphs)` (`src/maps/theme.ts`). The second argument is a MapLibre glyphs URL, absolute, with `{fontstack}` and `{range}` in it. Its default, `mapGlyphsUrl()`, resolves `map-fonts/` from the page's own URL, so on a nested route it points at the wrong place. If the app serves the folder at `/map-fonts/`, resolve it from the root instead:

```ts
const glyphs = mapGlyphsUrl(new URL('/', document.baseURI).href);
const style = await basemapStyle(scheme, glyphs);
```

Anywhere else, pass the URL as a string: `https://example.com/kilowatt/map-fonts/{fontstack}/{range}.pbf`.

## Set the scheme before the first paint

Use this only if the host renders on the server. Kilowatt switches schemes with a `dark` class on `<html>` (the `css-variables` departure), and `MuiProvider` sets that class after the client runs. A server-rendered page paints before then, so a viewer in dark sees it in light until the client takes over. A host that renders only on the client has no server HTML to paint, and doesn't need this.

MUI's `InitColorSchemeScript` closes the gap. It's a small inline script that reads the stored mode and sets the class before the page paints. Render it as the first child of `<body>`, ahead of anything that paints:

```tsx
import InitColorSchemeScript from '@mui/material/InitColorSchemeScript';

<html lang="en" suppressHydrationWarning>
  <body>
    <InitColorSchemeScript attribute="class" />
    <MuiProvider>{children}</MuiProvider>
  </body>
</html>
```

- **`attribute="class"` is required.** It has to match the theme's `colorSchemeSelector`. The default attribute is `data-mui-color-scheme`, which the theme's styles don't read.
- **Leave the other props alone.** Their defaults are what `MuiProvider` uses: the `system` mode, and the `mui-mode` and `mui-color-scheme` storage keys.
- **`suppressHydrationWarning` goes on `<html>`.** The script changes the class after the server sent it, and React would otherwise warn about the mismatch.

The script sets only the class. `useResolvedScheme` is still undefined on the first render, so charts and maps wait the same way. MUI's [InitColorSchemeScript page](https://mui.com/material-ui/react-init-color-scheme-script/) and [CSS theme variables configuration](https://mui.com/material-ui/customization/css-theme-variables/configuration/) cover Next.js's Pages Router and Gatsby, where the script goes in `_document` and `gatsby-ssr` instead.
