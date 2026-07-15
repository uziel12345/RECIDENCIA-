import { beforeEach, describe, expect, it, vi } from "vitest";
import { BuildingDetailsService } from "./building-details.service.js";
import { ApiError } from "../../shared/errors/api-error.js";

const mockBuilding = { id: "building-1", code: "DIR", name: "Dirección" };
const mockClassrooms = [{ id: "classroom-1" }];
const mockDepartments = [{ id: "department-1" }];
const mockCubicles = [{ id: "cubicle-1" }];
const mockHeadquarters = [{ id: "hq-1" }];
const mockProcedures = [{ id: "proc-1", requirements: [] }];

function createMockBuildingsService() {
  return { getAll: vi.fn(), getById: vi.fn() };
}

function createMockRepository(items: unknown[]) {
  return { findAllActive: vi.fn().mockResolvedValue(items) };
}

function createMockProceduresService() {
  return { getByBuilding: vi.fn().mockResolvedValue(mockProcedures) };
}

function createService() {
  const buildingsService = createMockBuildingsService();
  const classroomsRepository = createMockRepository(mockClassrooms);
  const departmentsRepository = createMockRepository(mockDepartments);
  const teacherCubiclesRepository = createMockRepository(mockCubicles);
  const headquartersRepository = createMockRepository(mockHeadquarters);
  const buildingSchedulesRepository = createMockRepository([]);
  const proceduresService = createMockProceduresService();

  const service = new BuildingDetailsService(
    buildingsService as any,
    classroomsRepository as any,
    departmentsRepository as any,
    teacherCubiclesRepository as any,
    headquartersRepository as any,
    buildingSchedulesRepository as any,
    proceduresService as any
  );

  return {
    service,
    buildingsService,
    classroomsRepository,
    departmentsRepository,
    teacherCubiclesRepository,
    headquartersRepository,
    buildingSchedulesRepository,
    proceduresService,
  };
}

describe("BuildingDetailsService", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("propagates the 404 from buildingsService.getById without querying the rest", async () => {
    const deps = createService();
    deps.buildingsService.getById.mockRejectedValue(
      new ApiError(404, "Edificio no encontrado")
    );

    await expect(deps.service.getFullDetails("missing")).rejects.toMatchObject({
      statusCode: 404,
    });

    expect(deps.classroomsRepository.findAllActive).not.toHaveBeenCalled();
    expect(deps.proceduresService.getByBuilding).not.toHaveBeenCalled();
  });

  it("aggregates building + all child collections + sin_horario when there are no schedules", async () => {
    const deps = createService();
    deps.buildingsService.getById.mockResolvedValue(mockBuilding);

    const result = await deps.service.getFullDetails("building-1", new Date("2026-07-08T18:00:00Z"));

    expect(deps.classroomsRepository.findAllActive).toHaveBeenCalledWith("building-1");
    expect(deps.departmentsRepository.findAllActive).toHaveBeenCalledWith("building-1");
    expect(deps.teacherCubiclesRepository.findAllActive).toHaveBeenCalledWith("building-1");
    expect(deps.headquartersRepository.findAllActive).toHaveBeenCalledWith("building-1");
    expect(deps.buildingSchedulesRepository.findAllActive).toHaveBeenCalledWith("building-1");
    expect(deps.proceduresService.getByBuilding).toHaveBeenCalledWith("building-1");

    expect(result).toEqual({
      building: mockBuilding,
      status: { status: "sin_horario" },
      schedule: { week: [], today: [] },
      classrooms: mockClassrooms,
      departments: mockDepartments,
      teacherCubicles: mockCubicles,
      headquarters: mockHeadquarters,
      procedures: mockProcedures,
    });
  });

  it("computes abierto status and splits today's schedule from the full week", async () => {
    const deps = createService();
    deps.buildingsService.getById.mockResolvedValue(mockBuilding);
    const wednesdaySchedule = {
      id: "sched-1",
      building_id: "building-1",
      day_of_week: 3,
      open_time: "08:00:00",
      close_time: "15:00:00",
      is_active: true,
    };
    const mondaySchedule = { ...wednesdaySchedule, id: "sched-2", day_of_week: 1 };
    deps.buildingSchedulesRepository.findAllActive.mockResolvedValue([
      wednesdaySchedule,
      mondaySchedule,
    ]);

    // 2026-07-08 es miércoles; 18:00 UTC = 12:00 en America/Mexico_City (UTC-6, sin DST)
    const result = await deps.service.getFullDetails(
      "building-1",
      new Date("2026-07-08T18:00:00Z")
    );

    expect(result.status).toEqual({ status: "abierto", until: "15:00:00" });
    expect(result.schedule.week).toEqual([wednesdaySchedule, mondaySchedule]);
    expect(result.schedule.today).toEqual([wednesdaySchedule]);
  });
});
