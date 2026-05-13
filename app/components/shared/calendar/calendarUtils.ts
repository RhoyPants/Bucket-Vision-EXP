/**
 * calendarUtils.ts
 * Pure utility functions for the week-based Gantt calendar.
 * No React / MUI dependencies — safe to import anywhere.
 */

// ─────────────────────────────────────────────
// TYPES
// ─────────────────────────────────────────────

export interface CalendarSubtask {
  id: string;
  title: string;
  startDate: string; // ISO string
  endDate: string;   // ISO string
  progress: number;
  scopeId?: string;
  scopeName?: string;
}

export interface LanedSubtask extends CalendarSubtask {
  lane: number;
}

export interface WeekRange {
  weekStart: Date;
  weekEnd: Date;
}

// ─────────────────────────────────────────────
// WEEK HELPERS
// ─────────────────────────────────────────────

/** Returns the Sunday-aligned start of the week containing `date`. */
export function getWeekStart(date: Date): Date {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  d.setDate(d.getDate() - d.getDay()); // back to Sunday
  return d;
}

/**
 * Returns all week ranges that overlap the given month.
 * Each range spans Sun–Sat. The first/last ranges may include days
 * from the adjacent months (they are shown dimmed in the grid).
 */
export function getWeeksInMonth(year: number, month: number): WeekRange[] {
  const monthStart = new Date(year, month - 1, 1);
  const monthEnd = new Date(year, month, 0); // last day of month
  monthEnd.setHours(23, 59, 59, 999);

  const weeks: WeekRange[] = [];
  let current = getWeekStart(monthStart);

  while (current <= monthEnd) {
    const weekEnd = new Date(current);
    weekEnd.setDate(weekEnd.getDate() + 6);
    weekEnd.setHours(23, 59, 59, 999);
    weeks.push({ weekStart: new Date(current), weekEnd: new Date(weekEnd) });
    current = new Date(weekEnd);
    current.setDate(current.getDate() + 1);
    current.setHours(0, 0, 0, 0);
  }

  return weeks;
}

// ─────────────────────────────────────────────
// FILTERING
// ─────────────────────────────────────────────

/** Returns subtasks whose date range overlaps the given week. */
export function getSubtasksInWeek(
  subtasks: CalendarSubtask[],
  weekStart: Date,
  weekEnd: Date
): CalendarSubtask[] {
  return subtasks.filter((s) => {
    if (!s.startDate || !s.endDate) return false;
    const start = new Date(s.startDate);
    const end = new Date(s.endDate);
    if (isNaN(start.getTime()) || isNaN(end.getTime())) return false;
    return start <= weekEnd && end >= weekStart;
  });
}

// ─────────────────────────────────────────────
// LANE ALLOCATION
// ─────────────────────────────────────────────

/**
 * Assigns a non-overlapping lane index to each subtask.
 * Tasks are sorted by startDate, then greedily packed into the
 * earliest available lane.
 */
export function assignLanes(subtasks: CalendarSubtask[]): LanedSubtask[] {
  const sorted = [...subtasks].sort(
    (a, b) => new Date(a.startDate).getTime() - new Date(b.startDate).getTime()
  );

  // Each outer array is one lane; each inner entry is the last task placed there.
  const laneEnds: Date[] = [];
  const result: LanedSubtask[] = [];

  for (const task of sorted) {
    const taskStart = new Date(task.startDate);
    let placedLane = -1;

    for (let i = 0; i < laneEnds.length; i++) {
      if (taskStart > laneEnds[i]) {
        placedLane = i;
        laneEnds[i] = new Date(task.endDate);
        break;
      }
    }

    if (placedLane === -1) {
      placedLane = laneEnds.length;
      laneEnds.push(new Date(task.endDate));
    }

    result.push({ ...task, lane: placedLane });
  }

  return result;
}

// ─────────────────────────────────────────────
// POSITIONING
// ─────────────────────────────────────────────

function clampDate(d: Date, min: Date, max: Date): Date {
  if (d < min) return min;
  if (d > max) return max;
  return d;
}

/**
 * Returns left% and width% for a task bar relative to the 7-day week row.
 * Values are clamped so the bar never overflows the week container.
 */
export function getBarStyle(
  task: CalendarSubtask,
  weekStart: Date,
  weekEnd: Date
): { leftPct: number; widthPct: number } {
  const msPerDay = 1000 * 60 * 60 * 24;
  const totalWeekMs = 7 * msPerDay;

  const clampedStart = clampDate(new Date(task.startDate), weekStart, weekEnd);
  const clampedEnd = clampDate(new Date(task.endDate), weekStart, weekEnd);

  // Normalize to day boundaries
  clampedStart.setHours(0, 0, 0, 0);
  clampedEnd.setHours(23, 59, 59, 999);

  const startOffsetMs = clampedStart.getTime() - weekStart.getTime();
  // duration in full days (inclusive)
  const durationDays =
    Math.round((clampedEnd.getTime() - clampedStart.getTime()) / msPerDay) + 1;

  const leftPct = Math.max(0, (startOffsetMs / totalWeekMs) * 100);
  const rawWidthPct = (durationDays / 7) * 100;

  // Ensure bar doesn't overflow container
  const widthPct = Math.min(rawWidthPct, 100 - leftPct);

  return { leftPct, widthPct };
}

// ─────────────────────────────────────────────
// COLORS
// ─────────────────────────────────────────────

/**
 * Returns vibrant traffic light color based on progress.
 * Colors are controlled with opacity in the component for visual focus.
 */
export function getProgressColor(progress: number): string {
  if (progress <= 30) return "#ef4444"; // vibrant red
  if (progress <= 70) return "#f59e0b"; // vibrant amber
  return "#22c55e";                     // vibrant green
}

/**
 * Returns white text that pops against the vibrant bar colors.
 */
export function getProgressTextColor(progress: number): string {
  return "white"; // white works perfectly with vibrant colors
}

/**
 * Returns bar styling with vibrant background, white text, and controlled borders.
 */
export function getBarBackgroundColor(
  progress: number,
  _durationDays?: number
): { bg: string; text: string; border: string } {
  const bg = getProgressColor(progress);
  const text = getProgressTextColor(progress);
  return { bg, text, border: "1px solid rgba(0,0,0,0.12)" };
}

/** Duration in calendar days (inclusive) between two ISO strings. */
export function getDurationDays(startDate: string, endDate: string): number {
  const ms = new Date(endDate).getTime() - new Date(startDate).getTime();
  return Math.max(1, Math.round(ms / (1000 * 60 * 60 * 24)) + 1);
}
