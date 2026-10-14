import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  useSyncExternalStore,
  type ReactNode,
} from 'react';

const noopSubscribe = () => () => {};

/**
 * Fixture inputs, after React Cosmos's `useFixtureInput` and `useFixtureSelect`.
 * A fixture declares inputs with hooks; the control panel renders them and
 * the values round-trip through the URL so a state can be linked.
 */

export type InputValue = string | number | boolean | Record<string, unknown> | unknown[] | null;

export type InputDefinition = {
  name: string;
  kind: 'text' | 'number' | 'boolean' | 'select' | 'json';
  defaultValue: InputValue;
  options?: string[];
};

type Listener = () => void;

export class InputStore {
  private definitions = new Map<string, InputDefinition>();
  private values = new Map<string, InputValue>();
  private listeners = new Set<Listener>();
  private order: string[] = [];
  private snapshot: { definitions: InputDefinition[]; values: Record<string, InputValue> } = {
    definitions: [],
    values: {},
  };

  constructor(initial: Record<string, InputValue> = {}) {
    for (const [name, value] of Object.entries(initial)) this.values.set(name, value);
  }

  subscribe = (listener: Listener) => {
    this.listeners.add(listener);
    return () => {
      this.listeners.delete(listener);
    };
  };

  getSnapshot = () => this.snapshot;

  private emit() {
    this.snapshot = {
      definitions: this.order.map((name) => this.definitions.get(name)!).filter(Boolean),
      values: Object.fromEntries(this.order.map((name) => [name, this.get(name)])),
    };
    for (const listener of this.listeners) listener();
  }

  register(definition: InputDefinition) {
    const existing = this.definitions.get(definition.name);
    if (!existing) this.order.push(definition.name);
    if (!existing || existing.kind !== definition.kind || existing.options?.join() !== definition.options?.join()) {
      this.definitions.set(definition.name, definition);
      this.emit();
    }
  }

  has(name: string) {
    return this.values.has(name);
  }

  get(name: string): InputValue {
    return this.values.has(name) ? this.values.get(name)! : (this.definitions.get(name)?.defaultValue ?? null);
  }

  set(name: string, value: InputValue) {
    this.values.set(name, value);
    this.emit();
  }

  reset() {
    this.values.clear();
    this.emit();
  }

  /** Values that differ from their defaults, for the URL. */
  overrides(): Record<string, InputValue> {
    const out: Record<string, InputValue> = {};
    for (const [name, value] of this.values) {
      const definition = this.definitions.get(name);
      if (!definition || JSON.stringify(definition.defaultValue) !== JSON.stringify(value)) out[name] = value;
    }
    return out;
  }
}

const StoreContext = createContext<InputStore | null>(null);

export function FixtureInputsProvider({ store, children }: { store: InputStore; children: ReactNode }) {
  return <StoreContext.Provider value={store}>{children}</StoreContext.Provider>;
}

export function useInputStore() {
  return useContext(StoreContext);
}

/** True while the workbench renders the fixture; false under Cosmos or in a plain page. */
export function useInWorkbench() {
  return useContext(StoreContext) !== null;
}

function kindOf(value: InputValue): InputDefinition['kind'] {
  if (typeof value === 'boolean') return 'boolean';
  if (typeof value === 'number') return 'number';
  if (typeof value === 'string') return 'text';
  return 'json';
}

/**
 * Declares a control for the fixture. Outside the workbench it behaves like
 * `useState`, so fixtures also render anywhere else.
 */
export function useFixtureInput(name: string, defaultValue: boolean): [boolean, (next: boolean) => void];
export function useFixtureInput(name: string, defaultValue: number): [number, (next: number) => void];
export function useFixtureInput(name: string, defaultValue: string): [string, (next: string) => void];
export function useFixtureInput<T extends InputValue>(name: string, defaultValue: T): [T, (next: T) => void];
export function useFixtureInput<T extends InputValue>(name: string, defaultValue: T): [T, (next: T) => void] {
  const store = useContext(StoreContext);
  const [local, setLocal] = useState<T>(defaultValue);
  const kind = kindOf(defaultValue);

  useEffect(() => {
    store?.register({ name, kind, defaultValue });
  }, [store, name, kind, defaultValue]);

  const stored = useSyncExternalStore(
    store ? store.subscribe : noopSubscribe,
    () => (store && store.has(name) ? store.get(name) : null),
    () => null,
  );

  const setValue = useCallback(
    (next: T) => {
      if (store) store.set(name, next);
      else setLocal(next);
    },
    [store, name],
  );

  if (!store) return [local, setValue];
  return [store.has(name) ? (stored as T) : defaultValue, setValue];
}

/** A dropdown control. The first option is the default unless `defaultValue` is given. */
export function useFixtureSelect<T extends string>(
  name: string,
  config: { options: readonly T[]; defaultValue?: T },
): [T, (next: T) => void] {
  const store = useContext(StoreContext);
  const defaultValue = config.defaultValue ?? config.options[0];
  const optionsKey = config.options.join('|');
  const options = useMemo(() => [...config.options], [optionsKey]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    store?.register({ name, kind: 'select', defaultValue, options });
  }, [store, name, defaultValue, options]);

  const value = useSyncExternalStore(
    store ? store.subscribe : noopSubscribe,
    () => (store && store.has(name) ? (store.get(name) as T) : null),
    () => null,
  );

  const setValue = useCallback(
    (next: T) => {
      store?.set(name, next);
    },
    [store, name],
  );

  return [value && options.includes(value) ? value : defaultValue, setValue];
}

export function encodeInputs(values: Record<string, InputValue>): string | undefined {
  const keys = Object.keys(values);
  if (keys.length === 0) return undefined;
  return JSON.stringify(values);
}

export function decodeInputs(raw: string | null): Record<string, InputValue> {
  if (!raw) return {};
  try {
    const parsed: unknown = JSON.parse(raw);
    return parsed && typeof parsed === 'object' && !Array.isArray(parsed) ? (parsed as Record<string, InputValue>) : {};
  } catch {
    return {};
  }
}
