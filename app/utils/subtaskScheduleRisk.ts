export type SubtaskScheduleRisk = "delayed" | "near-delay" | null;

interface ScheduleRiskInput {
  status?: number | string | null;
  progress?: number | null;
  endDate?: string | Date | null;
  warningDays?: number;
  now?: Date;
}

const isPendingOrInProgress = (status?: number | string | null) => {
  if (typeof status === "number") return status === 0 || status === 1;

  const normalized = String(status ?? "")
    .trim()
    .toLowerCase()
    .replace(/[\s_-]+/g, " ");

  return ["0", "1", "pending", "not started", "in progress"].includes(normalized);
};

const toLocalEndOfDay = (value: string | Date) => {
  if (value instanceof Date) {
    if (Number.isNaN(value.getTime())) return null;
    return new Date(value.getFullYear(), value.getMonth(), value.getDate(), 23, 59, 59, 999);
  }

  const dateKey = value.slice(0, 10);
  const match = dateKey.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (match) {
    return new Date(Number(match[1]), Number(match[2]) - 1, Number(match[3]), 23, 59, 59, 999);
  }

  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return null;
  return new Date(parsed.getFullYear(), parsed.getMonth(), parsed.getDate(), 23, 59, 59, 999);
};

export const getSubtaskScheduleRisk = ({
  status,
  progress = 0,
  endDate,
  warningDays = 3,
  now = new Date(),
}: ScheduleRiskInput): SubtaskScheduleRisk => {
  if (!isPendingOrInProgress(status) || Number(progress) >= 100 || !endDate) return null;

  const dueAt = toLocalEndOfDay(endDate);
  if (!dueAt) return null;

  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const dueDay = new Date(dueAt.getFullYear(), dueAt.getMonth(), dueAt.getDate());
  const daysRemaining = Math.round((dueDay.getTime() - today.getTime()) / 86_400_000);

  if (daysRemaining < 0) return "delayed";
  if (daysRemaining <= warningDays) return "near-delay";
  return null;
};
