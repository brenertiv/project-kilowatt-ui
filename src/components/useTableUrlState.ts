import { useCallback, useMemo } from 'react';
import { useSearchParams } from 'react-router';
import { decodeTableUrlState, defaultTableUrlState, encodeTableUrlState, type TableUrlState } from './tableUrlState';

/**
 * Table state (sorting, search, column filters, page) stored in the URL under `${prefix}.*`.
 * Requires a react-router context. Pass a referentially stable `defaults` object.
 */
export function useTableUrlState(
  prefix: string,
  defaults: TableUrlState = defaultTableUrlState,
): [TableUrlState, (next: TableUrlState) => void] {
  const [searchParams, setSearchParams] = useSearchParams();
  const state = useMemo(() => decodeTableUrlState(searchParams, prefix, defaults), [searchParams, prefix, defaults]);
  const setState = useCallback(
    (next: TableUrlState) => {
      setSearchParams((previous) => encodeTableUrlState(previous, prefix, next, defaults), { replace: true });
    },
    [setSearchParams, prefix, defaults],
  );
  return [state, setState];
}
