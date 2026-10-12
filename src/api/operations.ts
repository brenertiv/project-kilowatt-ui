import type { Ticket } from '../data';
import { http, type MetersPage, type MetersPageParams } from './client';

export async function fetchTickets() {
  const { data } = await http.get<Ticket[]>('/tickets');
  return data;
}

export type { MetersPage, MetersPageParams };

/** One page of meters, filtered and sorted server-side. Resolves after a simulated round trip. */
export async function fetchMetersPage(params: MetersPageParams) {
  const { data } = await http.get<MetersPage>('/meters', { params });
  return data;
}
