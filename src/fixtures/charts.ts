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
