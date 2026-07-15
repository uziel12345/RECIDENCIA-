import type { Building } from "./building.types.js";
import type { BuildingSchedule } from "./building-schedule.types.js";
import type { Classroom } from "./classroom.types.js";
import type { Department } from "./department.types.js";
import type { Headquarters } from "./headquarters.types.js";
import type { ProcedureForBuilding } from "./procedure.types.js";
import type { TeacherCubicle } from "./teacher-cubicle.types.js";

export type BuildingOpenStatus = "abierto" | "cerrado" | "sin_horario";

export type BuildingScheduleStatus = {
  status: BuildingOpenStatus;
  until?: string;
};

export type BuildingFullDetails = {
  building: Building;
  status: BuildingScheduleStatus;
  schedule: {
    week: BuildingSchedule[];
    today: BuildingSchedule[];
  };
  classrooms: Classroom[];
  departments: Department[];
  teacherCubicles: TeacherCubicle[];
  headquarters: Headquarters[];
  procedures: ProcedureForBuilding[];
};
