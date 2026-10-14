# Component Workbench

The workbench renders one component at a time in isolation, with a panel of inputs to set its state and a URL that captures the fixture and its inputs. It follows the conventions of React Cosmos, and the fixtures import their hooks from `react-cosmos/client`, so the same files also run under Cosmos (see `docs/cosmos.md`). In the app that specifier resolves to `src/fixtures/client.tsx`, the workbench's implementation of the same API.

It is the **Components** tab, at `/components/<component>/<state>`, laid out like Cosmos: the fixture browser on the left, the stage in the middle, and the inputs the fixture declares on the right. The browser has two sections, **Components** and **Pages**; a fixture under `src/pages` is a page, everything else is a component. A component with several named fixtures expands to list them. The filter box narrows both sections. Below 900px the browser collapses into one grouped dropdown in the toolbar and the inputs move into a sheet that slides up from the bottom of the screen.

## Fixtures

- A fixture is a file named `Name.fixture.tsx` beside the component it exercises. The workbench discovers every fixture under `src/`.
- The default export is one of: a React element, a component, or an object whose keys are fixture names and whose values are elements or components. The object form gives a component several named fixtures.
- The component name comes from the file name. `DataTable.fixture.tsx` appears as **DataTable** in the browser; its named fixtures are nested under it.
- A fixture renders inside the app shell, so theme, dark mode, toasts, tooltips and the router are already available.

```tsx
// src/components/Button.fixture.tsx
import { useFixtureInput, useFixtureSelect } from 'react-cosmos/client';

export default {
  Playground,
  'All states': <AllStates />,
};
```

## Inputs

Inputs are hooks a fixture calls to expose state. The control panel renders a control per input and the URL records any value that differs from its default.

- `useFixtureInput(name, defaultValue)` returns `[value, setValue]`. The control is chosen from the default: a switch for booleans, a stepper for numbers, a text field for strings, a JSON editor for objects and arrays.
- `useFixtureSelect(name, { options, defaultValue })` returns `[value, setValue]` and renders a dropdown. The first option is the default unless one is given.
- Outside the workbench both hooks behave like `useState`, so fixtures also render in tests.

```tsx
function Playground() {
  const [variant] = useFixtureSelect('variant', { options: ['solid', 'outline', 'ghost'] });
  const [disabled] = useFixtureInput('disabled', false);
  return <Button className={variantClass[variant]} disabled={disabled}>Dispatch</Button>;
}
```

## Decorators

A file named `cosmos.decorator.tsx` exports a component that receives `children`. It wraps every fixture in its directory and below, outermost directory first. The root decorator in `src/cosmos.decorator.tsx` is host-aware: inside the workbench it renders the fixture as is, because the app shell already provides theme, router, query client and toasts; under Cosmos it supplies that provider stack itself. `src/pages/cosmos.decorator.tsx` adds the **fail requests** and **latency ms** switches to every page fixture. Add one next to a component family when its fixtures need a provider.

## Viewport

Wrap a fixture in `<Viewport width={375} height={667}>` to open it at that size. The device dropdown in the toolbar offers Fit, Phone, Tablet and Laptop presets, and the frame reports its dimensions.

## Sample data

`src/fixtures/data` holds API-shaped sets (`none`, `one`, `few`, `page`, `all`, `sparse`, `long`, `placeholder`) for the data components, and `src/fixtures/sampleData.ts` holds the chart and table sets. Fixtures pick a set by name, usually through a select input, so each state is one dropdown away. Page fixtures run real queries against the mock adapter instead.

## Figma

The inputs panel ends with a **Figma** section for the component on stage. Paste a link copied from Figma (**Copy link to selection**) and press **Link**; the dev server writes it to `src/figma/links.json`, keyed by the component's slug, so the mapping is committed with the code. Once linked, **Open in Figma** opens that node. The whole-file link lives on the **System** tab. See `docs/figma.md`.

## Shortcuts

| Key | Action |
| --- | --- |
| N | Toggle the fixture browser |
| P | Toggle the inputs panel |
| F | Full screen |
| R | Remount the fixture |
| Esc | Leave full screen |

## Adding a fixture

1. Create `Name.fixture.tsx` beside the component.
2. Export a Playground that declares inputs for every prop that changes state, plus named fixtures for states that need fixed data such as loading, error and empty.
3. Put any data the fixture needs in `src/fixtures` if other fixtures could reuse it.
4. Open the workbench and walk every input. If a state is not reachable from the inputs panel or the browser, it is not covered.
