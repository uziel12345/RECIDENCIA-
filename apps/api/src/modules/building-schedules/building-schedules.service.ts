import { ApiError } from "../../shared/errors/api-error.js";
import { BuildingSchedulesRepository } from "./building-schedules.repository.js";
import type {
  CreateBuildingScheduleInput,
  UpdateBuildingScheduleInput,
} from "./building-schedules.schema.js";

function assertOpenBeforeClose(openTime: string, closeTime: string) {
  if (openTime >= closeTime) {
    throw new ApiError(400, "La hora de apertura debe ser anterior a la hora de cierre");
  }
}

export class BuildingSchedulesService {
  constructor(private readonly repository = new BuildingSchedulesRepository()) {}

  async getAll(buildingId?: string) {
    return this.repository.findAllActive(buildingId);
  }

  async getById(id: string) {
    const schedule = await this.repository.findById(id);
    if (!schedule) {
      throw new ApiError(404, "Horario no encontrado");
    }
    return schedule;
  }

  async create(input: CreateBuildingScheduleInput) {
    const exists = await this.repository.buildingExists(input.building_id);
    if (!exists) {
      throw new ApiError(404, "El edificio indicado no existe");
    }
    assertOpenBeforeClose(input.open_time, input.close_time);

    const id = await this.repository.create({
      building_id: input.building_id,
      day_of_week: input.day_of_week,
      open_time: input.open_time,
      close_time: input.close_time,
      is_active: input.is_active ?? true,
    });

    return this.getById(id);
  }

  async update(id: string, input: UpdateBuildingScheduleInput) {
    const current = await this.getById(id);

    const buildingId = input.building_id ?? current.building_id;
    if (input.building_id && input.building_id !== current.building_id) {
      const exists = await this.repository.buildingExists(input.building_id);
      if (!exists) {
        throw new ApiError(404, "El edificio indicado no existe");
      }
    }

    const openTime = input.open_time ?? current.open_time;
    const closeTime = input.close_time ?? current.close_time;
    assertOpenBeforeClose(openTime, closeTime);

    await this.repository.update(id, {
      building_id: buildingId,
      day_of_week: input.day_of_week ?? current.day_of_week,
      open_time: openTime,
      close_time: closeTime,
      is_active:
        input.is_active !== undefined ? input.is_active : Boolean(current.is_active),
    });

    return this.getById(id);
  }

  async updateStatus(id: string, isActive: boolean) {
    await this.getById(id);
    await this.repository.updateStatus(id, isActive);
    return this.getById(id);
  }

  async remove(id: string) {
    await this.getById(id);
    await this.repository.softDelete(id);
    return { id, deleted: true };
  }
}
