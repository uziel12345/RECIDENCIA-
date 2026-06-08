import { describe, it, expect } from "vitest";
import {
  createScheduleSchema,
  updateScheduleSchema,
  scheduleIdSchema,
  classroomScheduleQuerySchema,
  linkStudentSchema,
} from "./schedules.schema.js";

const validCreate = {
  subject: "Cálculo Diferencial",
  professor_id: "550e8400-e29b-41d4-a716-446655440001",
  classroom_id: "550e8400-e29b-41d4-a716-446655440002",
  day_of_week: 1,
  start_time: "09:00",
  end_time: "11:00",
  period: "2026-1",
};

describe("createScheduleSchema", () => {
  it("accepts valid input", () => {
    expect(createScheduleSchema.safeParse(validCreate).success).toBe(true);
  });

  it("requires subject", () => {
    const { subject: _, ...rest } = validCreate;
    expect(createScheduleSchema.safeParse(rest).success).toBe(false);
  });

  it("requires professor_id as UUID", () => {
    expect(
      createScheduleSchema.safeParse({ ...validCreate, professor_id: "not-uuid" }).success
    ).toBe(false);
  });

  it("requires classroom_id as UUID", () => {
    expect(
      createScheduleSchema.safeParse({ ...validCreate, classroom_id: "not-uuid" }).success
    ).toBe(false);
  });

  it("rejects day_of_week = 0", () => {
    expect(createScheduleSchema.safeParse({ ...validCreate, day_of_week: 0 }).success).toBe(false);
  });

  it("rejects day_of_week = 8", () => {
    expect(createScheduleSchema.safeParse({ ...validCreate, day_of_week: 8 }).success).toBe(false);
  });

  it("accepts day_of_week 1 through 7", () => {
    for (let d = 1; d <= 7; d++) {
      expect(createScheduleSchema.safeParse({ ...validCreate, day_of_week: d }).success).toBe(true);
    }
  });

  it("rejects invalid time format for start_time", () => {
    expect(
      createScheduleSchema.safeParse({ ...validCreate, start_time: "9:00" }).success
    ).toBe(false);
  });

  it("rejects end_time before start_time", () => {
    expect(
      createScheduleSchema.safeParse({ ...validCreate, start_time: "11:00", end_time: "09:00" }).success
    ).toBe(false);
  });

  it("rejects invalid period format", () => {
    expect(
      createScheduleSchema.safeParse({ ...validCreate, period: "2026" }).success
    ).toBe(false);
  });

  it("accepts period with two-digit semester", () => {
    expect(
      createScheduleSchema.safeParse({ ...validCreate, period: "2026-10" }).success
    ).toBe(true);
  });
});

describe("updateScheduleSchema", () => {
  it("accepts empty object", () => {
    expect(updateScheduleSchema.safeParse({}).success).toBe(true);
  });

  it("accepts partial subject update", () => {
    expect(updateScheduleSchema.safeParse({ subject: "Álgebra" }).success).toBe(true);
  });

  it("rejects end_time before start_time when both provided", () => {
    expect(
      updateScheduleSchema.safeParse({ start_time: "11:00", end_time: "09:00" }).success
    ).toBe(false);
  });
});

describe("scheduleIdSchema", () => {
  it("accepts valid UUID", () => {
    expect(
      scheduleIdSchema.safeParse({ id: "550e8400-e29b-41d4-a716-446655440000" }).success
    ).toBe(true);
  });

  it("rejects non-UUID", () => {
    expect(scheduleIdSchema.safeParse({ id: "sched-1" }).success).toBe(false);
  });
});

describe("classroomScheduleQuerySchema", () => {
  it("accepts empty object", () => {
    expect(classroomScheduleQuerySchema.safeParse({}).success).toBe(true);
  });

  it("accepts valid period", () => {
    expect(classroomScheduleQuerySchema.safeParse({ period: "2026-1" }).success).toBe(true);
  });

  it("accepts valid day as number string (coerced)", () => {
    expect(classroomScheduleQuerySchema.safeParse({ day: "3" }).success).toBe(true);
  });

  it("rejects day out of range", () => {
    expect(classroomScheduleQuerySchema.safeParse({ day: "8" }).success).toBe(false);
  });
});

describe("linkStudentSchema", () => {
  it("accepts valid UUID student_id", () => {
    expect(
      linkStudentSchema.safeParse({ student_id: "550e8400-e29b-41d4-a716-446655440000" }).success
    ).toBe(true);
  });

  it("rejects non-UUID student_id", () => {
    expect(linkStudentSchema.safeParse({ student_id: "stu-1" }).success).toBe(false);
  });
});
