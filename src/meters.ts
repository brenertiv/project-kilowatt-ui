export type MeterSource =
  'Energy Star' | 'Unmonitored' | 'Monitored' | 'Shadow Meter' | 'BMS Monitored' | 'Utility Bill' | 'Weather';

export type EnergyStarLink = 'Linked' | 'Not linked' | 'Link ended';

export type Meter = {
  id: string;
  name: string;
  description?: string;
  sublocation: string;
  source: MeterSource;
  energyStarLink: EnergyStarLink;
  linkStartDate?: string;
  utilityAccount?: string;
  channels: number;
};

// Weighted so the sample mirrors a real portfolio: mostly Energy Star, unmonitored, and monitored meters.
const sourceCycle: MeterSource[] = [
  'Energy Star',
  'Monitored',
  'Unmonitored',
  'Shadow Meter',
  'Energy Star',
  'Unmonitored',
  'Monitored',
  'Weather',
  'Energy Star',
  'Shadow Meter',
  'Utility Bill',
  'BMS Monitored',
];

const energyStarNames = ['Electricity Use (Grid)', 'Natural Gas Use', 'Energy Star Score', 'Water Use (All Sources)'];
const rooms = ['Main Electrical Rm', 'Mechanical Rm 2910', 'Outside', 'Penthouse', 'Loading Dock', 'Level 3 Riser'];
const placements = [
  'Left middle meter on the right-hand wall',
  'Bottom row, second from the left',
  'Behind the switchgear, panel side',
  'Top right of the meter bank',
];
const channelsBySource: Record<MeterSource, number[]> = {
  'Energy Star': [1],
  Unmonitored: [0],
  Monitored: [1, 3, 6],
  'Shadow Meter': [3],
  'BMS Monitored': [12],
  'Utility Bill': [1],
  Weather: [1],
};

function pad(value: number, length: number) {
  return String(value).padStart(length, '0');
}

function meterName(source: MeterSource, index: number) {
  if (source === 'Energy Star') return energyStarNames[index % energyStarNames.length];
  if (source === 'Weather') return 'Weather Sensor';
  if (source === 'Unmonitored' || source === 'Utility Bill') return pad(1000000 + index * 7919, 9);
  if (source === 'BMS Monitored') return `BMS-AHU-${pad(index, 2)}`;
  return `EM-${1000 + index * 37}`;
}

function meterDescription(source: MeterSource, index: number) {
  if (source === 'Energy Star') return `${energyStarNames[index % energyStarNames.length]} - Monthly`;
  if (source === 'Weather') return 'Virtual weather data feed';
  if (index % 5 === 0) return undefined;
  return `${placements[index % placements.length]} #${100 + index * 10}`;
}

function meterSublocation(source: MeterSource, index: number) {
  if (source === 'Energy Star') return 'Energy Star';
  if (source === 'Weather') return 'Weather Station';
  return rooms[(index + Math.floor(index / sourceCycle.length)) % rooms.length];
}

function buildMeter(index: number): Meter {
  const source = sourceCycle[index % sourceCycle.length];
  const metered = source === 'Monitored' || source === 'Shadow Meter';
  const linked = metered && index % 4 < 2;
  const ended = index === 33;
  const channels = channelsBySource[source];

  return {
    id: `meter-${pad(index + 1, 3)}`,
    name: meterName(source, index),
    description: meterDescription(source, index),
    sublocation: meterSublocation(source, index),
    source,
    energyStarLink: ended ? 'Link ended' : linked ? 'Linked' : 'Not linked',
    linkStartDate: linked || ended ? `2026-${pad((index % 9) + 1, 2)}-${pad((index % 27) + 1, 2)}` : undefined,
    utilityAccount: source === 'Utility Bill' || index % 11 === 2 ? pad(5100000000 + index * 104729, 10) : undefined,
    channels: channels[index % channels.length],
  };
}

/** Made-up sample shaped like a meters-by-source export. Not customer data. */
export const meterInventory: Meter[] = Array.from({ length: 96 }, (_, index) => buildMeter(index));

export const meterSources: MeterSource[] = [...new Set(sourceCycle)].sort();

/** 2,000 generated rows for virtualization demos. Same shape and generator as `meterInventory`. */
export const largeMeterInventory: Meter[] = Array.from({ length: 2000 }, (_, index) => buildMeter(index));
