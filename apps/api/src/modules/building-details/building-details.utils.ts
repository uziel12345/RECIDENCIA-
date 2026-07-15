import type { BuildingScheduleRow } from "../building-schedules/building-schedules.types.js";

export const CAMPUS_TIMEZONE = "America/Mexico_City";

export type BuildingOpenStatus = "abierto" | "cerrado" | "sin_horario";

export type BuildingStatusResult = {
  status: BuildingOpenStatus;
  until?: string;
};

function getDateParts(now: Date, timeZone: string) {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone,
    weekday: "short",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hourCycle: "h23",
  }).formatToParts(now);

  const byType = Object.fromEntries(parts.map((p) => [p.type, p.value]));
  return byType as Record<string, string>;
}

const WEEKDAY_TO_ISO: Record<string, number> = {
  Mon: 1,
  Tue: 2,
  Wed: 3,
  Thu: 4,
  Fri: 5,
  Sat: 6,
  Sun: 7,
};

/** Día ISO (1=Lunes…7=Domingo) de `now` en la zona horaria del campus. */
export function getCampusDayOfWeek(now: Date, timeZone: string = CAMPUS_TIMEZONE): number {
  const { weekday } = getDateParts(now, timeZone);
  return WEEKDAY_TO_ISO[weekday] ?? 1;
}

/** Hora de `now` en formato "HH:MM:SS" en la zona horaria del campus. */
export function getCampusTime(now: Date, timeZone: string = CAMPUS_TIMEZONE): string {
  const { hour, minute, second } = getDateParts(now, timeZone);
  return `${hour}:${minute}:${second}`;
}

/**
 * Calcula si el edificio está abierto ahora mismo a partir de sus horarios registrados.
 * Rango medio-abierto [open_time, close_time): a la hora exacta de cierre ya cuenta como cerrado.
 * Sin ningún horario registrado (para ningún día) -> "sin_horario", distinto de "cerrado".
 */
export function computeBuildingStatus(
  schedules: BuildingScheduleRow[],
  now: Date = new Date()
): BuildingStatusResult {
  if (schedules.length === 0) {
    return { status: "sin_horario" };
  }

  const dayOfWeek = getCampusDayOfWeek(now);
  const time = getCampusTime(now);

  const openSchedule = schedules.find(
    (s) => s.day_of_week === dayOfWeek && s.open_time <= time && time < s.close_time
  );

  if (openSchedule) {
    return { status: "abierto", until: openSchedule.close_time };
  }

  return { status: "cerrado" };
}
