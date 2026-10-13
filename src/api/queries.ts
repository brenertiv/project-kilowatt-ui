import { keepPreviousData, useQuery } from '@tanstack/react-query';
import { http } from './client';
import {
  entityPaths,
  lookupPaths,
  type CursorPage,
  type EnergyData,
  type EnergyDataParams,
  type EntityName,
  type EntityRecord,
  type ListParams,
  type LookupName,
  type LookupRecord,
} from './types';

/**
 * Query hooks over the entity endpoints. Keys are `[entity, kind, args]` so
 * invalidating `['action']` refreshes every work-order view.
 */

export async function fetchList<E extends EntityName>(
  entity: E,
  params: ListParams = {},
): Promise<CursorPage<EntityRecord[E]>> {
  const { data } = await http.get<CursorPage<EntityRecord[E]>>(entityPaths[entity], { params });
  return data;
}

export async function fetchOne<E extends EntityName>(
  entity: E,
  id: string | number,
  params: ListParams = {},
): Promise<EntityRecord[E]> {
  const { data } = await http.get<EntityRecord[E]>(`${entityPaths[entity]}${id}/`, { params });
  return data;
}

export async function fetchLookup<L extends LookupName>(name: L): Promise<LookupRecord[L][]> {
  const { data } = await http.get<LookupRecord[L][]>(lookupPaths[name]);
  return data;
}

export async function fetchEnergyData(
  entity: 'meter' | 'equipment',
  id: string,
  params: EnergyDataParams,
): Promise<EnergyData> {
  const { data } = await http.get<EnergyData>(`${entityPaths[entity]}${id}/data/`, { params });
  return data;
}

export const queryKeys = {
  list: (entity: EntityName, params: ListParams = {}) => [entity, 'list', params] as const,
  one: (entity: EntityName, id: string | number, params: ListParams = {}) => [entity, 'one', id, params] as const,
  lookup: (name: LookupName) => ['lookup', name] as const,
  energy: (entity: 'meter' | 'equipment', id: string, params: EnergyDataParams) =>
    [entity, 'energy', id, params] as const,
};

export function useEntityList<E extends EntityName>(
  entity: E,
  params: ListParams = {},
  options: { enabled?: boolean } = {},
) {
  return useQuery({
    queryKey: queryKeys.list(entity, params),
    queryFn: () => fetchList(entity, params),
    placeholderData: keepPreviousData,
    enabled: options.enabled ?? true,
  });
}

export function useEntity<E extends EntityName>(entity: E, id: string | number | undefined, params: ListParams = {}) {
  return useQuery({
    queryKey: queryKeys.one(entity, id ?? '', params),
    queryFn: () => fetchOne(entity, id!, params),
    enabled: id !== undefined && id !== '',
  });
}

export function useLookup<L extends LookupName>(name: L) {
  return useQuery({ queryKey: queryKeys.lookup(name), queryFn: () => fetchLookup(name), staleTime: Infinity });
}

export function useEnergyData(entity: 'meter' | 'equipment', id: string | undefined, params: EnergyDataParams) {
  return useQuery({
    queryKey: queryKeys.energy(entity, id ?? '', params),
    queryFn: () => fetchEnergyData(entity, id!, params),
    enabled: Boolean(id),
    placeholderData: keepPreviousData,
  });
}
