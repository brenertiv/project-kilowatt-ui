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
