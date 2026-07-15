import { BuildingsService } from "../buildings/buildings.service.js";
import { ClassroomsRepository } from "../classrooms/classrooms.repository.js";
import { DepartmentsRepository } from "../departments/departments.repository.js";
import { TeacherCubiclesRepository } from "../teacher-cubicles/teacher-cubicles.repository.js";
import { HeadquartersRepository } from "../headquarters/headquarters.repository.js";
import { BuildingSchedulesRepository } from "../building-schedules/building-schedules.repository.js";
import { ProceduresService } from "../procedures/procedures.service.js";
import { computeBuildingStatus, getCampusDayOfWeek } from "./building-details.utils.js";

export class BuildingDetailsService {
  constructor(
    private readonly buildingsService = new BuildingsService(),
    private readonly classroomsRepository = new ClassroomsRepository(),
    private readonly departmentsRepository = new DepartmentsRepository(),
    private readonly teacherCubiclesRepository = new TeacherCubiclesRepository(),
    private readonly headquartersRepository = new HeadquartersRepository(),
    private readonly buildingSchedulesRepository = new BuildingSchedulesRepository(),
    private readonly proceduresService = new ProceduresService()
  ) {}

  async getFullDetails(buildingId: string, now: Date = new Date()) {
    // Se consulta primero para devolver un 404 limpio antes de disparar el resto de queries.
    const building = await this.buildingsService.getById(buildingId);

    const [classrooms, departments, teacherCubicles, headquarters, schedules, procedures] =
      await Promise.all([
        this.classroomsRepository.findAllActive(buildingId),
        this.departmentsRepository.findAllActive(buildingId),
        this.teacherCubiclesRepository.findAllActive(buildingId),
        this.headquartersRepository.findAllActive(buildingId),
        this.buildingSchedulesRepository.findAllActive(buildingId),
        this.proceduresService.getByBuilding(buildingId),
      ]);

    const status = computeBuildingStatus(schedules, now);
    const todayDayOfWeek = getCampusDayOfWeek(now);

    return {
      building,
      status,
      schedule: {
        week: schedules,
        today: schedules.filter((s) => s.day_of_week === todayDayOfWeek),
      },
      classrooms,
      departments,
      teacherCubicles,
      headquarters,
      procedures,
    };
  }
}
