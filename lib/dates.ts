import type { AppLanguage } from "@/lib/i18n";

export function isoDate(date = new Date()) {
  return date.toISOString().slice(0, 10);
}

export function formatLongDate(date: string, locale: AppLanguage) {
  return new Date(`${date}T12:00:00`).toLocaleDateString(locale, {
    weekday: "long",
    month: "long",
    day: "numeric",
  });
}

export function formatMonthTitle(year: number, monthIndex: number, locale: AppLanguage) {
  return new Date(year, monthIndex, 1).toLocaleDateString(locale, {
    month: "long",
    year: "numeric",
  });
}

export function formatShortDate(date: string, locale: AppLanguage) {
  return new Date(`${date}T12:00:00`).toLocaleDateString(locale, {
    weekday: "long",
    month: "short",
    day: "numeric",
  });
}
