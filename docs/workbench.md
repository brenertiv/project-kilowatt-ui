# Component Workbench

The workbench renders one component at a time in isolation, with a panel of inputs to set its state and a URL that captures the fixture and its inputs. It follows the conventions of React Cosmos so fixtures written here would port to Cosmos unchanged.

Open it from **Components** by clicking a card title or choosing *Open in workbench* from the card menu. **Back to components** in the toolbar returns to the library. Everything you can change sits in the right-hand drawer: the component switcher, the component's states, and the inputs.

## Fixtures

- A fixture is a file named `Name.fixture.tsx` beside the component it exercises. The workbench discovers every fixture under `src/`.
- The default export is one of: a React element, a component, or an object whose keys are fixture names and whose values are elements or components. The object form gives a component several named fixtures.
- The component name comes from the file name. `DataTable.fixture.tsx` appears as **DataTable** in the component switcher; its named fixtures are listed as states in the drawer.
- A fixture renders inside the app shell, so theme, dark mode, toasts, tooltips and the router are already available.

```tsx
// src/components/Button.fixture.tsx
export default {
  Playground,
  'All states': <AllStates />,
};
```

## Inputs

Inputs are hooks a fixture calls to expose state. The control panel renders a control per input and the URL records any value that differs from its default.

- `useFixtureInput(name, defaultValue)` returns `[value, setValue]`. The control is chosen from the default: a switch for booleans, a stepper for numbers, a text field for strings, a JSON editor for objects and arrays.
- `useFixtureSelect(name, { options, defaultValue })` returns `[value, setValue]` and renders a dropdown. The first option is the default unless one is given.
- Outside the workbench both hooks behave like `useState`, so fixtures also render in the gallery or in tests.

```tsx
function Playground() {
  const [variant] = useFixtureSelect('variant', { options: ['solid', 'outline', 'ghost'] });
  const [disabled] = useFixtureInput('disabled', false);
  return <Button className={variantClass[variant]} disabled={disabled}>Dispatch</Button>;
}
```

## Decorators

A file named `cosmos.decorator.tsx` exports a component that receives `children`. It wraps every fixture in its directory and below, outermost directory first. The root decorator in `src/` supplies the stage padding. Add one next to a component family when its fixtures need a provider.

## Viewport

Wrap a fixture in `<Viewport width={375} height={667}>` to open it at that size. The toolbar offers Fit, Phone, Tablet and Laptop presets, and the frame reports its dimensions.

## Sample data

`src/workbench/sampleData.ts` holds data sets built to reach every state a component defines: empty, single, typical, dense, missing values and long text. Fixtures pick a set by name, usually through a select input, so each state is one dropdown away.

## Shortcuts

| Key | Action |
| --- | --- |
| P | Toggle the controls drawer |
| F | Full screen |
| R | Remount the fixture |
| Esc | Leave full screen |

## Adding a fixture

1. Create `Name.fixture.tsx` beside the component.
2. Export a Playground that declares inputs for every prop that changes state, plus named fixtures for states that need fixed data such as loading, error and empty.
3. Put any data the fixture needs in `sampleData.ts` if other fixtures could reuse it.
4. Open the workbench and walk every input. If a state is not reachable from the panel, it is not covered.
