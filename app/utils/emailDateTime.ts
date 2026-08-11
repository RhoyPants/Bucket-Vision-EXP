const EMAIL_TIME_ZONE = "Asia/Manila";

export const formatEmailDateTime = (value?: string | Date) => {
  if (!value) return "—";
  const normalized = typeof value === "string" && /^\d{4}-\d{2}-\d{2}$/.test(value)
    ? `${value}T00:00:00+08:00`
    : value;
  const date = normalized instanceof Date ? normalized : new Date(normalized);
  if (Number.isNaN(date.getTime())) return String(value);

  return new Intl.DateTimeFormat("en-US", {
    timeZone: EMAIL_TIME_ZONE,
    month: "long",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
    second: "2-digit",
    hour12: true,
    timeZoneName: "short",
  }).format(date);
};
