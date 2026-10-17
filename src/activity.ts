import type { RepoChange } from "./repos";

const WEEKS_SHOWN = 52;
const MONTHS_SHOWN = 6;
const FEED_COUNT = 10;

export interface HeatCell {
  key: string;
  count: number;

  level: number;

  future: boolean;
}

export interface HeatWeek {
  cells: HeatCell[];

  monthLabel: string;
}

export interface ActivityStats {
  total: number;

  windowTotal: number;
  contributors: number;
  activeDays: number;
  mostActiveDay: { label: string; count: number } | null;
  longestStreak: number;
  lastCommit: string | null;
}

export interface MonthlyCount {
  label: string;
  value: number;
}

export interface ActivityModel {
  weeks: HeatWeek[];
  dayLabels: string[];
  monthly: MonthlyCount[];
  stats: ActivityStats;
  recent: RepoChange[];
}

const MONTH_NAMES = [
  "Jan",
  "Feb",
  "Mar",
  "Apr",
  "May",
  "Jun",
  "Jul",
  "Aug",
  "Sep",
  "Oct",
  "Nov",
  "Dec",
];

function parseTimestamp(ts: string): number | null {
  const m = ts.match(/^(\d{4})-(\d{2})-(\d{2})[ T](\d{2}):(\d{2})/);
  if (!m) return null;
  const ms = new Date(
    Number(m[1]),
    Number(m[2]) - 1,
    Number(m[3]),
    Number(m[4]),
    Number(m[5]),
  ).getTime();
  return Number.isFinite(ms) ? ms : null;
}

function dateKey(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(
    d.getDate(),
  ).padStart(2, "0")}`;
}

function collectDaily(changes: RepoChange[]): {
  daily: Map<string, number>;
  authors: Set<string>;
  lastCommitMs: number;
} {
  const daily = new Map<string, number>();
  const authors = new Set<string>();
  let lastCommitMs = 0;

  for (const c of changes) {
    if (c.author) authors.add(c.author);
    const ms = parseTimestamp(c.timestamp);
    if (ms === null) continue;
    if (ms > lastCommitMs) lastCommitMs = ms;
    const key = dateKey(new Date(ms));
    daily.set(key, (daily.get(key) ?? 0) + 1);
  }

  return { daily, authors, lastCommitMs };
}

function buildWeeks(daily: Map<string, number>, now: Date): HeatWeek[] {
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const thisWeekStart = new Date(today);
  thisWeekStart.setDate(today.getDate() - today.getDay());
  const oldestStart = new Date(thisWeekStart);
  oldestStart.setDate(thisWeekStart.getDate() - (WEEKS_SHOWN - 1) * 7);

  const weeks: HeatWeek[] = [];
  let prevMonth = -1;
  for (let w = 0; w < WEEKS_SHOWN; w++) {
    const weekStart = new Date(oldestStart);
    weekStart.setDate(oldestStart.getDate() + w * 7);
    const cells: HeatCell[] = [];
    let monthLabel = "";
    for (let d = 0; d < 7; d++) {
      const day = new Date(weekStart);
      day.setDate(weekStart.getDate() + d);
      const key = dateKey(day);
      const future = day.getTime() > today.getTime();
      const count = future ? 0 : (daily.get(key) ?? 0);
      cells.push({ key, count, level: 0, future });
    }

    const weekMonth = weekStart.getMonth();
    if (weekMonth !== prevMonth) {
      monthLabel = MONTH_NAMES[weekMonth];
      prevMonth = weekMonth;
    }
    weeks.push({ cells, monthLabel });
  }

  return weeks;
}

function assignCellLevels(
  weeks: HeatWeek[],
  daily: Map<string, number>,
): number {
  let max = 0;
  for (const v of daily.values()) max = Math.max(max, v);
  const maxL = Math.max(max, 1);

  let windowTotal = 0;
  for (const wk of weeks) {
    for (const cell of wk.cells) {
      windowTotal += cell.count;
      cell.level =
        cell.count === 0 ? 0 : 1 + Math.round((cell.count / maxL) * 3);
    }
  }

  return windowTotal;
}

function buildMonthly(daily: Map<string, number>, now: Date): MonthlyCount[] {
  const monthly: MonthlyCount[] = [];
  for (let m = MONTHS_SHOWN - 1; m >= 0; m--) {
    const ref = new Date(now.getFullYear(), now.getMonth() - m, 1);
    const y = ref.getFullYear();
    const mo = ref.getMonth();
    let sum = 0;
    for (const [k, v] of daily) {
      const [ky, km] = k.split("-").map(Number);
      if (ky === y && km === mo + 1) sum += v;
    }
    monthly.push({ label: MONTH_NAMES[mo], value: sum });
  }
  return monthly;
}

function countActiveDays(daily: Map<string, number>): number {
  let activeDays = 0;
  for (const v of daily.values()) {
    if (v > 0) activeDays++;
  }
  return activeDays;
}

function mostActiveDayOf(
  daily: Map<string, number>,
): { label: string; count: number } | null {
  let mostActiveDay: { label: string; count: number } | null = null;
  for (const [k, v] of daily) {
    if (mostActiveDay === null || v > mostActiveDay.count) {
      mostActiveDay = { label: k, count: v };
    }
  }
  return mostActiveDay;
}

function longestStreakOf(daily: Map<string, number>): number {
  const sortedDays = [...daily.keys()].sort();
  let longestStreak = 0;
  let run = 0;
  for (let i = 0; i < sortedDays.length; i++) {
    if (i > 0) {
      const prev = new Date(sortedDays[i - 1]);
      const cur = new Date(sortedDays[i]);
      const diffDays = (cur.getTime() - prev.getTime()) / 86_400_000;
      run = diffDays === 1 ? run + 1 : 1;
    } else {
      run = 1;
    }
    if (run > longestStreak) longestStreak = run;
  }
  return longestStreak;
}

function buildStats(
  changes: RepoChange[],
  daily: Map<string, number>,
  windowTotal: number,
  authors: Set<string>,
  lastCommitMs: number,
): ActivityStats {
  const lastCommit =
    lastCommitMs > 0 ? new Date(lastCommitMs).toISOString().slice(0, 10) : null;
  return {
    total: changes.length,
    windowTotal,
    contributors: authors.size,
    activeDays: countActiveDays(daily),
    mostActiveDay: mostActiveDayOf(daily),
    longestStreak: longestStreakOf(daily),
    lastCommit,
  };
}

export function buildActivityModel(
  changes: RepoChange[],
  now: Date = new Date(),
): ActivityModel {
  const { daily, authors, lastCommitMs } = collectDaily(changes);
  const weeks = buildWeeks(daily, now);
  const windowTotal = assignCellLevels(weeks, daily);
  return {
    weeks,
    dayLabels: ["S", "M", "T", "W", "T", "F", "S"],
    monthly: buildMonthly(daily, now),
    stats: buildStats(changes, daily, windowTotal, authors, lastCommitMs),
    recent: changes.slice(0, FEED_COUNT),
  };
}
