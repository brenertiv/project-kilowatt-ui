/**
 * Sample readings for the chart stories, deterministic so screenshots and tests stay stable.
 * Dates are UTC timestamps; values are kWh unless a name says otherwise.
 */

const day = (i: number) => Date.UTC(2026, 8, 1 + i);
const isWeekend = (date: number) => [0, 6].includes(new Date(date).getUTCDay());

/** September 2026, day by day: this period and the same days of the period before. */
export const dailyUse = Array.from({ length: 30 }, (_, i) => {
  const date = day(i);
  const base = isWeekend(date) ? 820 : 1240;
  return { date, current: Math.round(base + 60 * Math.sin(i / 2)), previous: Math.round(base * 1.06 + 50 * Math.cos(i / 3)) };
});

/** September 2026, day by day: this period's energy use (kWh) with the day's mean outdoor temperature (`temperature`, °F), cooling into fall. */
export const dailyUseAndTemperature = dailyUse.map(({ date, current }, i) => ({
  date,
  current,
  temperature: Math.round(80 - 0.5 * i + 3 * Math.sin(i / 1.7)),
}));

/** The sample portfolio's buildings. */
export const buildings = ['350 Park Avenue', '200 Vesey Street', '599 Lexington Avenue', '55 Water Street', '1 Liberty Plaza', '425 Park Avenue'];

/** September 2026, day by day, one field per building (`b0` to `b5`, in the order of `buildings`). */
export const buildingDailyUse = Array.from({ length: 30 }, (_, i) => {
  const date = day(i);
  const weekend = isWeekend(date);
  return Object.fromEntries([
    ['date', date],
    ...buildings.map((_, b) => [`b${b}`, Math.round((weekend ? 0.65 : 1) * (1800 - b * 220) + 70 * Math.sin(i / 2 + b))]),
  ]) as { date: number } & Record<string, number>;
});

/** 2026 by month: the electricity bill's supply and delivery charges, in US dollars. */
export const monthlySupplyDelivery = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'].map((month, i) => {
  const season = 1 + 0.35 * Math.cos(((i - 6.5) / 12) * 2 * Math.PI);
  return { month, supply: Math.round(24000 * season), delivery: Math.round(11000 * season) };
});

/** Energy use per building for September 2026, in kWh. */
export const buildingTotals = buildings.map((building, b) => ({
  building,
  use: buildingDailyUse.reduce((total, row) => total + row[`b${b}`], 0),
}));

/** Utility cost for one building, September 2026, in US dollars: more categories than a donut shows. */
export const utilityCost = [
  { category: 'Electricity', value: 48200 },
  { category: 'Natural gas', value: 12900 },
  { category: 'Steam', value: 9400 },
  { category: 'Water', value: 3100 },
  { category: 'Sewer', value: 1800 },
  { category: 'Sanitation', value: 950 },
  { category: 'Fuel oil', value: 600 },
];

/** August to October 2026, day by day: a building's maintenance score (0–100), dipping from excellent through fair into poor and recovering. */
export const dailyScore = Array.from({ length: 60 }, (_, i) => {
  const dip = 38 * Math.exp(-(((i - 30) / 9) ** 2));
  return { date: Date.UTC(2026, 7, 15 + i), score: Math.round(86 - dip + 3 * Math.sin(i / 2.3)) };
});

/** Where the maintenance benchmark sits: the score most of the portfolio's buildings reach. */
export const scoreBenchmark = 65;

/** The month the emissions forecast starts: November 2026. Rows from then on are projected. */
export const emissionsProjectedFrom = Date.UTC(2026, 10, 1);

/** November 2024 to October 2027, month by month: a portfolio's emissions (tCO₂e), measured to October 2026 and projected after, falling as retrofits land. */
export const monthlyEmissions = Array.from({ length: 36 }, (_, i) => {
  const season = 1 + 0.22 * Math.cos(((i + 10 - 0.5) / 12) * 2 * Math.PI);
  return { date: Date.UTC(2024, 10 + i, 1), emissions: Math.round(1450 * season * (1 - i * 0.006)) };
});

/** The portfolio's emissions target for 2027, per month (tCO₂e). */
export const emissionsTarget = 1200;

/** The first year of the decarbonization plan's projection. Years from 2027 on are projected. */
export const pathwayProjectedFrom = Date.UTC(2027, 0, 1);

/**
 * 2020 to 2050, year by year: a portfolio's emissions (tCO₂e) with its planned retrofits (`planned`)
 * and without them (`unplanned`, from 2026, where the two part ways), against the CRREM 1.5 °C pathway
 * it has to stay under (`crrem`). Measured to 2026, projected after.
 */
export const yearlyPathways = Array.from({ length: 31 }, (_, i) => {
  const year = 2020 + i;
  const measured = 17800 - 260 * Math.min(i, 6) + 180 * Math.sin(i);
  const ahead = Math.max(0, year - 2026);
  return {
    date: Date.UTC(year, 0, 1),
    planned: Math.round(year <= 2026 ? measured : measured * Math.max(0.12, 1 - 0.075 * ahead)),
    ...(year >= 2026 ? { unplanned: Math.round(measured * (1 - 0.012 * ahead)) } : {}),
    crrem: Math.round(19500 * Math.exp(-0.072 * i)),
  };
});

/** The last 30 days of `dailyScore`: what a summary card's sparkline shows. */
export const recentScore = dailyScore.slice(-30);

/** November 2025 to October 2026, month by month: a building's ENERGY STAR score (1–100), climbing past certification. */
export const monthlyEnergyStar = Array.from({ length: 12 }, (_, i) => ({
  date: Date.UTC(2025, 10 + i, 1),
  score: Math.round(64 + i * 1.4 + 2 * Math.sin(i)),
}));

/** `buildingTotals`, largest first: a ranking. */
export const buildingRanking = [...buildingTotals].sort((a, b) => b.use - a.use);

/** Nine properties with capital projects planned: more than a chart can color apart. */
export const plannedProperties = [...buildings, '120 Wall Street', '75 Rockefeller Plaza', '9 West 57th Street'];

/** 2027 to 2031, year by year: planned capital spend on each property (`p0` to `p8`, in the order of `plannedProperties`), in US dollars. */
export const yearlyCapitalSpend = Array.from({ length: 5 }, (_, i) => ({
  year: String(2027 + i),
  ...Object.fromEntries(plannedProperties.map((_, p) => [`p${p}`, Math.round((420000 - p * 38000) * (1 + 0.35 * Math.sin(i + p)) / 1000) * 1000])),
})) as ({ year: string } & Record<string, number>)[];

/** 2027 to 2031, year by year: planned project spend and the energy-cost savings it brings, in US dollars. */
export const yearlySpendSavings = Array.from({ length: 5 }, (_, i) => ({
  year: String(2027 + i),
  spend: [1840000, 1320000, 960000, 610000, 380000][i],
  savings: Math.round(140000 + i * 165000),
}));

/** Open work orders by type across the portfolio, October 2026, by the API's type names. */
export const workOrdersByType = [
  { type: 'Reactive', count: 142 },
  { type: 'Preventative', count: 96 },
  { type: 'Inspection', count: 41 },
  { type: 'Rounds', count: 23 },
];

/** Work orders across the portfolio by status, October 2026, by the API's status names, in lifecycle order. */
export const workOrdersByStatus = [
  { status: 'Open', count: 118 },
  { status: 'In Progress', count: 74 },
  { status: 'On Hold', count: 19 },
  { status: 'Requires Attention', count: 27 },
  { status: 'Completed', count: 412 },
  { status: 'Expired', count: 12 },
  { status: 'Cancelled', count: 0 },
];

/** The year's months, January to December, as column labels. */
export const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

/** Eight buildings with monthly variance: `buildings` and two more. */
export const varianceBuildings = [...buildings, '120 Wall Street', '75 Rockefeller Plaza'];

/**
 * 2026 by month: each building's energy use against 2025 (% change), to October. 120 Wall Street was
 * metered from April, so its first three months have no data; 75 Rockefeller Plaza's last month is still
 * loading; November and December haven't happened.
 */
export const monthlyVariance = varianceBuildings.flatMap((row, b) =>
  monthNames.slice(0, 10).map((column, m) => {
    if (b === 6 && m < 3) return { row, column, state: 'noData' as const };
    if (b === 7 && m === 9) return { row, column, state: 'pending' as const };
    const drift = [-6, 4, -11, 2, -3, 9, -8, 1][b];
    return { row, column, value: Math.round((drift + 7 * Math.sin(m / 1.6 + b) + (b === 5 && m === 6 ? 18 : 0)) * 10) / 10 };
  }),
);

/** 2026 by month: each building's energy use (MWh), to October, for a sequential heatmap. */
export const monthlyUseGrid = varianceBuildings.flatMap((row, b) =>
  monthNames.slice(0, 10).map((column, m) => ({
    row,
    column,
    value: Math.round((900 - b * 70) * (1 + 0.3 * Math.cos(((m - 6.5) / 12) * 2 * Math.PI))),
  })),
);

/** The first reading of `intervalDemand`: midnight UTC on October 1, 2025. */
export const intervalStart = Date.UTC(2025, 9, 1);

/**
 * October 2025 to September 2026, every 15 minutes: one building's electric demand (kW), 35,040 readings.
 * A base load overnight and on weekends, an occupied plateau from 7:00 to 19:00 on weekdays, and cooling
 * that lifts summer afternoons, with a little meter noise.
 */
export const intervalDemand = Array.from({ length: 365 * 96 }, (_, i) => {
  const date = intervalStart + i * 15 * 60 * 1000;
  const hour = (i % 96) / 4;
  const dayOfYear = Math.floor(i / 96) + 273;
  const summer = 0.5 - 0.5 * Math.cos(((dayOfYear - 15) / 365) * 2 * Math.PI);
  const occupied = isWeekend(date) ? 0.15 : 1 / (1 + Math.exp(-2 * (hour - 7))) - 1 / (1 + Math.exp(-2 * (hour - 19)));
  const afternoon = Math.exp(-(((hour - 15) / 4) ** 2));
  const noise = ((Math.sin(i * 12.9898) * 43758.5453) % 1) * 30;
  return { date, demand: Math.round((380 + 520 * occupied + 420 * summer * afternoon * (0.4 + occupied) + noise) * 10) / 10 };
});

/** A building's ENERGY STAR score today (1–100): the latest month of `monthlyEnergyStar`. */
export const energyStarScore = monthlyEnergyStar[monthlyEnergyStar.length - 1].score;

/** The ENERGY STAR score a building needs for certification. */
export const energyStarCertification = 75;

/** A building's vitals right now: four readings, each on its own scale. */
export const buildingVitals = [
  { name: 'ENERGY STAR score', value: energyStarScore, max: 100, unit: 'pts' },
  { name: 'Demand', value: 842, max: 1200, unit: 'kW' },
  { name: 'Occupancy', value: 71, max: 100, unit: '%' },
  { name: 'Data coverage', value: 94, max: 100, unit: '%' },
];

/** The sample portfolio's buildings and two more: eight, for a radar's spokes. */
export const radarBuildings = [...buildings, '120 Wall Street', '75 Rockefeller Plaza'];

/** Each building's site energy use intensity for the last 12 months and the 12 before, in kBtu per square foot, with its ENERGY STAR score. */
export const buildingIntensity = radarBuildings.map((building, b) => {
  const current = Math.round(62 + 34 * Math.abs(Math.sin(b * 1.9 + 0.4)) + b * 2);
  return { building, current, previous: Math.round(current * (1.04 + 0.05 * Math.cos(b * 1.3))), score: Math.round(92 - (current - 62) * 0.75) };
});

/** A building's energy use for September 2026 by system, then by equipment, in kWh: a hierarchy two levels deep. */
export const energyBySystem = {
  name: '350 Park Avenue',
  children: [
    {
      name: 'HVAC',
      children: [
        { name: 'Chillers', value: 9_840 },
        { name: 'Air handlers', value: 6_120 },
        { name: 'Pumps', value: 2_960 },
        { name: 'Cooling towers', value: 1_780 },
      ],
    },
    {
      name: 'Lighting',
      children: [
        { name: 'Tenant floors', value: 5_210 },
        { name: 'Common areas', value: 2_340 },
        { name: 'Exterior', value: 610 },
      ],
    },
    {
      name: 'Plug loads',
      children: [
        { name: 'Tenant floors', value: 4_480 },
        { name: 'Data room', value: 2_050 },
      ],
    },
    {
      name: 'Vertical transport',
      children: [
        { name: 'Elevators', value: 1_930 },
        { name: 'Escalators', value: 420 },
      ],
    },
    { name: 'Domestic hot water', value: 1_260 },
  ],
};

/** 2026 by month: a building's energy use against its budget (kWh), with the month's cooling degree days and their 10-year normal. */
export const monthlyUseAndBudget = Array.from({ length: 12 }, (_, i) => {
  const season = 0.5 - 0.5 * Math.cos(((i - 0.5) / 12) * 2 * Math.PI);
  const normal = Math.round(420 * season ** 2);
  const degreeDays = Math.round(normal * (1 + 0.18 * Math.sin(i * 1.7)));
  const budget = Math.round(31_000 + 17_000 * season);
  return { date: Date.UTC(2026, i, 1), use: Math.round(budget * (0.93 + 0.12 * Math.sin(i * 1.7) + 0.02 * Math.cos(i))), budget, degreeDays, normal };
});

/** One building's site energy use intensity for the last 12 months, in kBtu per square foot, with the benchmark for its property type: the national median for offices. */
export const siteIntensity = { building: buildings[0], value: 61.4, benchmark: 52.9 };

/** The last 30 days for each building: daily energy use (`use`, kWh) and peak demand (`peak`, kW), for a table of sparklines. */
export const buildingTrends = radarBuildings.map((building, b) => {
  const drift = (b % 3) - 1;
  const rows = Array.from({ length: 30 }, (_, i) => {
    const date = day(i);
    const base = (isWeekend(date) ? 0.7 : 1) * (1700 - b * 160);
    const use = Math.round(base * (1 + drift * 0.004 * i) + 60 * Math.sin(i / 2 + b));
    return { date, use, peak: Math.round(use / 11 + 12 * Math.cos(i / 3 + b)) };
  });
  return { building, rows };
});

/** The portfolio's utility cost from August to September 2026, in US dollars: August's total, what changed it, and September's total, for a cost bridge. */
export const costBridge = [
  { label: 'Aug 2026', value: 412_600, total: true },
  { label: 'Rate', value: 18_400 },
  { label: 'Weather', value: -9_200 },
  { label: 'Consumption', value: 6_100 },
  { label: 'Properties added', value: 22_800 },
  { label: 'Properties sold', value: -15_400 },
  { label: 'Sep 2026', total: true },
];

/** The portfolio's annual savings opportunities, in US dollars a year, from identified to realised: each total, and what fell away between them. */
export const savingsBridge = [
  { label: 'Identified', value: 1_240_000, total: true },
  { label: 'Dismissed', value: -310_000 },
  { label: 'Accepted', total: true },
  { label: 'Not yet implemented', value: -280_000 },
  { label: 'Implemented', total: true },
  { label: 'Not yet realised', value: -95_000 },
  { label: 'Realised', total: true },
];

/** The fine per metric ton of CO₂e over a property's limit under Local Law 97, in US dollars. */
export const finePerTon = 268;

/** Each building's 2026 emissions limit and its emissions over the last 12 months, in metric tons of CO₂e, with the fine the overage would bring. */
export const emissionsLimits = radarBuildings.map((building, b) => {
  const limit = Math.round(2_400 + 1_900 * Math.abs(Math.cos(b * 1.4 + 0.3)));
  const actual = Math.round(limit * (0.82 + 0.34 * Math.abs(Math.sin(b * 2.3 + 0.8))));
  return { building, limit, actual, fine: Math.max(0, actual - limit) * finePerTon };
});

/** The year each building's emissions cross its CRREM pathway (it strands), from the current year, 2026. */
export const currentYear = 2026;
export const strandingYears = radarBuildings.map((building, b) => ({ building, year: currentYear + 2 + Math.round(14 * Math.abs(Math.sin(b * 1.7 + 0.6))) }));

/** Each building's realised annual savings against what its measures projected, in US dollars. */
export const savingsByProperty = radarBuildings.slice(0, 6).map((building, b) => {
  const projected = Math.round((180_000 - b * 21_000) / 1_000) * 1_000;
  return { building, projected, realised: Math.round((projected * (0.62 + 0.5 * Math.abs(Math.sin(b * 1.9 + 0.2)))) / 1_000) * 1_000 };
});

/** The share of the portfolio's floor area each certification covers, in percent. */
export const certificationCoverage = [
  { certification: 'ENERGY STAR', share: 68 },
  { certification: 'LEED', share: 54 },
  { certification: 'Fitwel', share: 31 },
  { certification: 'WELL', share: 22 },
  { certification: 'BREEAM', share: 9 },
];

/** Each building's spend so far this year against its budget for the same months, in US dollars. */
export const spendAgainstBudget = buildings.map((building, b) => {
  const budget = Math.round((1_420_000 - b * 140_000) / 1_000) * 1_000;
  return { building, budget, actual: Math.round((budget * (0.9 + 0.17 * Math.sin(b * 2.1 + 0.5))) / 1_000) * 1_000 };
});

/** The portfolio's progress toward carbon zero: its cut in emissions since its 2019 baseline, in percent, against where its pathway puts it for 2026. */
export const carbonProgress = { reduction: 31, pathway: 38 };

/** The portfolio's funds, each with its floor area in square feet and the share of that floor area by property type, in percent. */
export const fundMix = [
  { fund: 'Core Fund I', area: 4_200_000, office: 64, multifamily: 18, retail: 12, industrial: 6 },
  { fund: 'Value-Add Fund II', area: 2_600_000, office: 28, multifamily: 44, retail: 20, industrial: 8 },
  { fund: 'Industrial Fund III', area: 1_900_000, office: 6, multifamily: 0, retail: 9, industrial: 85 },
  { fund: 'Opportunity Fund IV', area: 900_000, office: 35, multifamily: 25, retail: 30, industrial: 10 },
];

/** The portfolio's open savings opportunities: each one's annual savings and upfront cost in US dollars, the emissions it avoids each year in metric tons of CO₂e, and its kind. */
export const opportunities = [
  { opportunity: 'Chiller plant optimization', savings: 186_000, cost: 420_000, avoided: 610, kind: 'Controls' },
  { opportunity: 'LED retrofit, 6 properties', savings: 142_000, cost: 380_000, avoided: 470, kind: 'Lighting' },
  { opportunity: 'BMS schedule tuning', savings: 98_000, cost: 40_000, avoided: 330, kind: 'Controls' },
  { opportunity: 'Heat pump conversion', savings: 76_000, cost: 1_150_000, avoided: 920, kind: 'Electrification' },
  { opportunity: 'VFDs on AHU fans', savings: 64_000, cost: 160_000, avoided: 210, kind: 'Equipment' },
  { opportunity: 'Demand response enrollment', savings: 41_000, cost: 12_000, avoided: 40, kind: 'Controls' },
  { opportunity: 'Rooftop solar, 3 properties', savings: 38_000, cost: 520_000, avoided: 260, kind: 'Electrification' },
  { opportunity: 'Steam trap repair', savings: 27_000, cost: 35_000, avoided: 150, kind: 'Equipment' },
  { opportunity: 'Garage lighting sensors', savings: 18_000, cost: 26_000, avoided: 60, kind: 'Lighting' },
  { opportunity: 'Low-flow fixtures', savings: 12_000, cost: 48_000, avoided: 15, kind: 'Equipment' },
  { opportunity: 'Window film, 2 properties', savings: 9_000, cost: 70_000, avoided: 30, kind: 'Equipment' },
  { opportunity: 'Tenant submetering', savings: 6_000, cost: 55_000, avoided: 20, kind: 'Controls' },
];

/** The ENERGY STAR score at or above which a property can be certified. */
export const certificationScore = 75;

/** Each property's latest ENERGY STAR score (1–100), with its type: 30 properties for a strip plot. */
export const energyStarByProperty = Array.from({ length: 30 }, (_, i) => {
  const type = (['Office', 'Multifamily', 'Retail', 'Industrial'] as const)[i % 4];
  const center = { Office: 74, Multifamily: 62, Retail: 55, Industrial: 81 }[type];
  return { property: `Property ${String(i + 1).padStart(2, '0')}`, type, score: Math.max(1, Math.min(100, Math.round(center + 22 * Math.sin(i * 2.7 + 0.4)))) };
});
