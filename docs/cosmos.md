# React Cosmos

React Cosmos is an optional second host for the same fixtures the in-app workbench renders (see `docs/workbench.md`). It offers a fixture tree, a control panel, responsive viewports and a static export. The workbench under the app's **Components** tab is the default; run Cosmos beside the dev server when you want its tooling:

```bash
npm run cosmos
```

The Cosmos UI opens at `http://localhost:5100` and renders fixtures through the project's own Vite config, so Material UI, the tokens, the icons and the translations all behave as they do in the app. The scripts set `COSMOS=1`, which turns off the alias that otherwise points `react-cosmos/client` at the workbench shim in `src/fixtures/client.tsx`.

## Fixtures

- A fixture is a file named `Name.fixture.tsx` beside the component it exercises. Cosmos discovers every fixture under the project.
- The default export is a React element, a component, or an object whose keys are fixture names and whose values are elements or components. The object form gives a component several named fixtures.
- Imports come from `react-cosmos/client`: `useFixtureInput`, `useFixtureSelect` and `Viewport`.

```tsx
// src/components/Button.fixture.tsx
import { useFixtureInput, useFixtureSelect } from 'react-cosmos/client';

export default {
  Playground,
  'All states': <AllStates />,
};
```

## Inputs

Inputs are hooks a fixture calls to expose state. The control panel renders a control per input.

- `useFixtureInput(name, defaultValue)` returns `[value, setValue]`. The control is chosen from the default: a switch for booleans, a stepper for numbers, a text field for strings, a tree editor for objects and arrays.
- `useFixtureSelect(name, { options, defaultValue })` returns `[value, setValue]` and renders a dropdown. The first option is the default unless one is given.
- Under Cosmos input values are not in the URL; the workbench records them in `?inputs=`. A state worth linking to from either host is a named fixture.

## Decorators

`src/cosmos.decorator.tsx` is host-aware. Under Cosmos it wraps every fixture in the same provider stack the app shell uses, from `src/AppProviders.tsx`: query client, theme, the Material bridge, toasts and tooltips, plus a memory router. It also declares one `scheme` select, so **light** and **dark** are a control in every fixture, and places the **Back to library** link in the top-left corner of the renderer. Inside the workbench it renders the fixture as is, since the app shell already provides all of that. Add a `cosmos.decorator.tsx` beside a component family when its fixtures need another provider.

## Data

Fixtures that show API data pick a named set from `src/fixtures/data` (`none`, `one`, `few`, `page`, `all`, `sparse`, `long`, `placeholder`) through a select input, and put the component in a state with an `AsyncState` value. Page fixtures run queries against the mock adapter instead, and reach the error state with `setMockFailure`. See `docs/data-layer.md`.

Chart and table fixtures use `src/fixtures/sampleData.ts`, which predates the API-shaped sets.

## Viewport

Wrap a fixture in `<Viewport width={375} height={667}>` to open it at that size. The toolbar's responsive mode offers device presets.

## Adding a fixture

1. Create `Name.fixture.tsx` beside the component.
2. Export a Playground that declares inputs for every prop that changes state, plus named fixtures for states that need fixed data: loading, fetching, empty, error, sparse, placeholder.
3. Put reusable data in `src/fixtures/data`.
4. Open the fixture in the workbench or in Cosmos and walk every input. If a state is not reachable from the panel or the fixture list, it is not covered.

## Export

`npm run cosmos:export` writes a static Cosmos site to `dist/cosmos`. Every fixture there shows a **Back to library** control that opens the dev server in development, or `VITE_LIBRARY_URL` when set for an exported site.

## Pages

Page views under `src/pages` are fixtures too. They run real queries against the mock adapter, so their loading, fetching, empty and error states are the genuine article. The decorator in `src/pages/cosmos.decorator.tsx` adds two controls to every page fixture: **fail requests**, which makes every request reject, and **latency ms**, which sets the simulated round trip. Use them to watch a page degrade and recover.
