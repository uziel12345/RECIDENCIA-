import { describe, expect, it } from "vitest";
import {
  computeBuildingStatus,
  getCampusDayOfWeek,
  getCampusTime,
} from "./building-details.utils.js";

// 2026-07-08 es miércoles (día ISO 3). Todas las horas están en America/Mexico_City (UTC-6 sin DST).
const WEDNESDAY_NOON_UTC = new Date("2026-07-08T18:00:00Z"); // 12:00:00 en Mexico_City
const WEDNESDAY_MIDNIGHT_UTC = new Date("2026-07-08T06:00:00Z"); // 00:00:00 en Mexico_City

function schedule(day_of_week: number, open_time: string, close_time: string) {
  return {
    id: `sched-${day_of_week}-${open_time}`,
    building_id: "building-1",
    building_code: "DIR",
    building_name: "Dirección",
    day_of_week,
    open_time,
    close_time,
    is_active: true,
    deleted_at: null,
  } as const;
}

describe("getCampusDayOfWeek / getCampusTime", () => {
  it("derives ISO weekday and HH:MM:SS in America/Mexico_City", () => {
    expect(getCampusDayOfWeek(WEDNESDAY_NOON_UTC)).toBe(3);
    expect(getCampusTime(WEDNESDAY_NOON_UTC)).toBe("12:00:00");
  });

  it("handles midnight without the ICU 24:00 quirk", () => {
    expect(getCampusTime(WEDNESDAY_MIDNIGHT_UTC)).toBe("00:00:00");
  });
});

describe("computeBuildingStatus", () => {
  it("returns sin_horario when there are no schedules at all", () => {
    expect(computeBuildingStatus([], WEDNESDAY_NOON_UTC)).toEqual({ status: "sin_horario" });
  });

  it("returns abierto when now falls inside today's range", () => {
    const schedules = [schedule(3, "08:00:00", "15:00:00")];
    expect(computeBuildingStatus(schedules, WEDNESDAY_NOON_UTC)).toEqual({
      status: "abierto",
      until: "15:00:00",
    });
  });

  it("returns cerrado when schedules exist but none cover the current time (gap)", () => {
    const schedules = [
      schedule(3, "08:00:00", "10:00:00"),
      schedule(3, "14:00:00", "18:00:00"),
    ];
    expect(computeBuildingStatus(schedules, WEDNESDAY_NOON_UTC)).toEqual({ status: "cerrado" });
  });

  it("returns cerrado when today's schedule doesn't match the weekday", () => {
    const schedules = [schedule(1, "08:00:00", "15:00:00")]; // Lunes, hoy es miércoles
    expect(computeBuildingStatus(schedules, WEDNESDAY_NOON_UTC)).toEqual({ status: "cerrado" });
  });

  it("treats the range as half-open: exactly at close_time counts as cerrado", () => {
    const exactlyAtClose = new Date("2026-07-08T21:00:00Z"); // 15:00:00 en Mexico_City
    const schedules = [schedule(3, "08:00:00", "15:00:00")];
    expect(computeBuildingStatus(schedules, exactlyAtClose)).toEqual({ status: "cerrado" });
  });

  it("treats exactly at open_time as abierto", () => {
    const exactlyAtOpen = new Date("2026-07-08T14:00:00Z"); // 08:00:00 en Mexico_City
    const schedules = [schedule(3, "08:00:00", "15:00:00")];
    expect(computeBuildingStatus(schedules, exactlyAtOpen)).toEqual({
      status: "abierto",
      until: "15:00:00",
    });
  });
});
