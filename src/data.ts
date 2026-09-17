export type Building = {
  label: string;
  value: string;
  lat: number;
  lng: number;
};

export type Ticket = {
  id: string;
  title: string;
  status: string;
  site: string;
  openedAt: string;
};

export const buildings: Building[] = [
  { label: '120 Broadway', value: '120-broadway', lat: 40.7081, lng: -74.0109 },
  { label: '1 World Trade Center', value: '1-wtc', lat: 40.7127, lng: -74.0134 },
  { label: '350 Park Avenue', value: '350-park', lat: 40.758, lng: -73.9725 },
  { label: '200 Vesey Street', value: '200-vesey', lat: 40.7136, lng: -74.0155 },
  { label: '4 Times Square', value: '4-times', lat: 40.756, lng: -73.986 },
  { label: '599 Lexington', value: '599-lex', lat: 40.758, lng: -73.9706 },
];

export const meters = [
  { label: 'Main electric', value: 'electric-main' },
  { label: 'Chiller plant', value: 'chiller' },
  { label: 'Steam service', value: 'steam' },
  { label: 'Domestic water', value: 'water' },
  { label: 'Gas boiler', value: 'gas' },
];

export const tickets: Ticket[] = [
  { id: 'T-1842', title: 'AHU-3 vibration alarm', status: 'Open', site: '120 Broadway', openedAt: '2026-09-14T13:04:00-04:00' },
  { id: 'T-1841', title: 'Chiller setpoint drift', status: 'In review', site: '1 World Trade Center', openedAt: '2026-09-14T09:22:00-04:00' },
  { id: 'T-1839', title: 'Meter gap overnight', status: 'Resolved', site: '350 Park Avenue', openedAt: '2026-09-13T01:15:00-04:00' },
  { id: 'T-1837', title: 'Steam trap blow-through', status: 'Open', site: '200 Vesey Street', openedAt: '2026-09-12T16:48:00-04:00' },
];

export const demandSeries = [42, 48, 51, 47, 63, 58, 44, 39, 55, 61, 49, 46];
