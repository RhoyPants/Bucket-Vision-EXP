// datetime-local controls have no timezone; incident input always means Manila.
export function manilaInput(value?: string | null): string {
  if (!value) return "";
  const date = new Date(value);
  if (!Number.isFinite(date.getTime())) return "";
  return new Date(date.getTime() + 8 * 60 * 60 * 1000).toISOString().slice(0, 16);
}
export function manilaTimestamp(value: string): string {
  if (!/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/.test(value)) throw new Error("Enter a valid incident date and time.");
  const date = new Date(`${value}:00+08:00`);
  if (!Number.isFinite(date.getTime()) || manilaInput(date.toISOString()) !== value) throw new Error("Enter a valid incident date and time.");
  return date.toISOString();
}
export const dueDateInput = (value?: string | null) => {
  if (!value || typeof value !== "string") return "";
  return value.slice(0, 10);
};
