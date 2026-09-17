import type { Ticket } from '../data';
import { http } from './client';

export async function fetchTickets() {
  const { data } = await http.get<Ticket[]>('/tickets');
  return data;
}
