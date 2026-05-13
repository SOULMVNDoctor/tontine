export function startOfDayUTC(date: Date): Date {
  return new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()));
}

export function addDaysUTC(date: Date, days: number): Date {
  const d = new Date(date);
  d.setUTCDate(d.getUTCDate() + days);
  return d;
}

export function isBusinessDayUTC(date: Date): boolean {
  const day = date.getUTCDay();
  return day !== 0 && day !== 6;
}

export function dateKeyUTC(date: Date): string {
  const y = date.getUTCFullYear();
  const m = String(date.getUTCMonth() + 1).padStart(2, "0");
  const d = String(date.getUTCDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

export function parseDateKeyUTC(dateKey: string): Date | null {
  const m = /^([0-9]{4})-([0-9]{2})-([0-9]{2})$/.exec(dateKey);
  if (!m) return null;
  const y = Number(m[1]);
  const mo = Number(m[2]) - 1;
  const d = Number(m[3]);
  if (!Number.isFinite(y) || !Number.isFinite(mo) || !Number.isFinite(d)) return null;
  return new Date(Date.UTC(y, mo, d));
}

export function listBusinessDaysUTC(startDate: Date, endDate: Date): Date[] {
  const start = startOfDayUTC(startDate);
  const end = startOfDayUTC(endDate);

  const out: Date[] = [];
  for (let cursor = start; cursor <= end; cursor = addDaysUTC(cursor, 1)) {
    if (isBusinessDayUTC(cursor)) out.push(cursor);
  }
  return out;
}

export function weekdayShortFR(date: Date): string {
  // using Intl to keep it simple and locale-correct
  return new Intl.DateTimeFormat("fr-FR", { weekday: "short", timeZone: "UTC" }).format(date);
}

export function formatDateFR(date: Date): string {
  return new Intl.DateTimeFormat("fr-FR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    timeZone: "UTC",
  }).format(date);
}

export function formatDateKeyFR(dateKey: string): string {
  const d = parseDateKeyUTC(dateKey);
  return d ? formatDateFR(d) : dateKey;
}
