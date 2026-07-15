import { describe, expect, it } from "vitest";
import {
  buildingScheduleIdSchema,
  buildingScheduleStatusSchema,
  createBuildingScheduleSchema,
  updateBuildingScheduleSchema,
} from "./building-schedules.schema.js";

describe("createBuildingScheduleSchema", () => {
  it("accepts valid input with HH:MM", () => {
    const result = createBuildingScheduleSchema.safeParse({
      building_id: "550e8400-e29b-41d4-a716-446655440000",
      day_of_week: 1,
      open_time: "08:00",
      close_time: "15:00",
    });
    expect(result.success).toBe(true);
  });

  it("accepts valid input with HH:MM:SS", () => {
    const result = createBuildingScheduleSchema.safeParse({
      building_id: "550e8400-e29b-41d4-a716-446655440000",
      day_of_week: 7,
      open_time: "08:00:00",
      close_time: "15:30:00",
      is_active: false,
    });
    expect(result.success).toBe(true);
  });

  it("rejects day_of_week out of range", () => {
    expect(
      createBuildingScheduleSchema.safeParse({
        building_id: "550e8400-e29b-41d4-a716-446655440000",
        day_of_week: 0,
        open_time: "08:00",
        close_time: "15:00",
      }).success
    ).toBe(false);

    expect(
      createBuildingScheduleSchema.safeParse({
        building_id: "550e8400-e29b-41d4-a716-446655440000",
        day_of_week: 8,
        open_time: "08:00",
        close_time: "15:00",
      }).success
    ).toBe(false);
  });

  it("rejects malformed time strings", () => {
    expect(
      createBuildingScheduleSchema.safeParse({
        building_id: "550e8400-e29b-41d4-a716-446655440000",
        day_of_week: 1,
        open_time: "8:00",
        close_time: "15:00",
      }).success
    ).toBe(false);

    expect(
      createBuildingScheduleSchema.safeParse({
        building_id: "550e8400-e29b-41d4-a716-446655440000",
        day_of_week: 1,
        open_time: "25:00",
        close_time: "15:00",
      }).success
    ).toBe(false);
  });

  it("rejects missing building_id", () => {
    const result = createBuildingScheduleSchema.safeParse({
      day_of_week: 1,
      open_time: "08:00",
      close_time: "15:00",
    });
    expect(result.success).toBe(false);
  });

  it("rejects invalid building_id (not UUID)", () => {
    const result = createBuildingScheduleSchema.safeParse({
      building_id: "not-a-uuid",
      day_of_week: 1,
      open_time: "08:00",
      close_time: "15:00",
    });
    expect(result.success).toBe(false);
  });
});

describe("updateBuildingScheduleSchema", () => {
  it("accepts empty object (all fields optional)", () => {
    expect(updateBuildingScheduleSchema.safeParse({}).success).toBe(true);
  });

  it("accepts partial update with only close_time", () => {
    expect(
      updateBuildingScheduleSchema.safeParse({ close_time: "16:00" }).success
    ).toBe(true);
  });
});

describe("buildingScheduleIdSchema", () => {
  it("accepts valid UUID", () => {
    expect(
      buildingScheduleIdSchema.safeParse({ id: "550e8400-e29b-41d4-a716-446655440000" })
        .success
    ).toBe(true);
  });

  it("rejects non-UUID string", () => {
    expect(buildingScheduleIdSchema.safeParse({ id: "not-valid" }).success).toBe(false);
  });
});

describe("buildingScheduleStatusSchema", () => {
  it("accepts boolean is_active", () => {
    expect(buildingScheduleStatusSchema.safeParse({ is_active: true }).success).toBe(true);
    expect(buildingScheduleStatusSchema.safeParse({ is_active: false }).success).toBe(true);
  });

  it("rejects missing is_active", () => {
    expect(buildingScheduleStatusSchema.safeParse({}).success).toBe(false);
  });
});
