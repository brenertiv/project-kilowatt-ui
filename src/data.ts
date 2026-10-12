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

export type DemandPoint = {
  hour: string;
  today: number;
  lastWeek: number;
};

export const demandTrend: DemandPoint[] = [
  { hour: '6a', today: 182, lastWeek: 176 },
  { hour: '8a', today: 264, lastWeek: 248 },
  { hour: '10a', today: 338, lastWeek: 312 },
  { hour: '12p', today: 371, lastWeek: 349 },
  { hour: '2p', today: 412, lastWeek: 366 },
  { hour: '4p', today: 384, lastWeek: 358 },
  { hour: '6p', today: 296, lastWeek: 301 },
  { hour: '8p', today: 221, lastWeek: 234 },
];

export type SystemScore = {
  system: string;
  building: number;
  portfolio: number;
};

export const systemScores: SystemScore[] = [
  { system: 'HVAC', building: 82, portfolio: 71 },
  { system: 'Lighting', building: 91, portfolio: 78 },
  { system: 'Plug load', building: 64, portfolio: 69 },
  { system: 'Steam', building: 58, portfolio: 66 },
  { system: 'Water', building: 77, portfolio: 73 },
  { system: 'Envelope', building: 70, portfolio: 62 },
];

export type EnergyNode = {
  name: string;
  value?: number;
  children?: EnergyNode[];
};

export const energyBreakdown: EnergyNode = {
  name: 'Portfolio',
  children: [
    {
      name: '1 World Trade Center',
      children: [
        { name: 'HVAC', value: 1840 },
        { name: 'Lighting', value: 760 },
        { name: 'Plug load', value: 640 },
        { name: 'Elevators', value: 310 },
      ],
    },
    {
      name: '120 Broadway',
      children: [
        { name: 'HVAC', value: 1120 },
        { name: 'Lighting', value: 480 },
        { name: 'Plug load', value: 390 },
        { name: 'Elevators', value: 170 },
      ],
    },
    {
      name: '200 Vesey Street',
      children: [
        { name: 'HVAC', value: 940 },
        { name: 'Lighting', value: 410 },
        { name: 'Plug load', value: 350 },
      ],
    },
    {
      name: '350 Park Avenue',
      children: [
        { name: 'HVAC', value: 610 },
        { name: 'Lighting', value: 290 },
        { name: 'Plug load', value: 240 },
      ],
    },
    {
      name: '4 Times Square',
      children: [
        { name: 'HVAC', value: 520 },
        { name: 'Lighting', value: 260 },
        { name: 'Plug load', value: 180 },
      ],
    },
  ],
};

export type DemandSample = {
  /** ISO timestamp in the operations time zone. */
  time: string;
  today: number;
  baseline: number;
};

function hourlyDemand(hour: number, scale: number, phase: number) {
  const daytime = Math.max(0, Math.sin(((hour - 5 + phase) / 15) * Math.PI));
  return Math.round(150 + 270 * daytime * scale + 12 * Math.sin(hour * 1.7));
}

/** One day of hourly demand against the same weekday last week. */
export const demandDay: DemandSample[] = Array.from({ length: 24 }, (_, hour) => ({
  time: `2026-09-14T${String(hour).padStart(2, '0')}:00:00-04:00`,
  today: hourlyDemand(hour, 1, 0),
  baseline: hourlyDemand(hour, 0.92, 0.4),
}));

export const weekdays = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

/** Average kW by weekday and hour: the classic load profile heatmap. */
export const loadProfile: { day: string; hours: number[] }[] = weekdays.map((day, dayIndex) => ({
  day,
  hours: Array.from({ length: 24 }, (_, hour) => {
    const weekend = dayIndex >= 5;
    const base = hourlyDemand(hour, weekend ? 0.45 : 1, dayIndex * 0.1);
    return Math.round(base - (weekend ? 40 : 0));
  }),
}));

export type EnergyMixSlice = { system: string; mwh: number };

/** Portfolio annual energy by end use. */
export const energyMix: EnergyMixSlice[] = [
  { system: 'HVAC', mwh: 5030 },
  { system: 'Lighting', mwh: 2200 },
  { system: 'Plug load', mwh: 1800 },
  { system: 'Elevators', mwh: 480 },
  { system: 'Other', mwh: 390 },
];
