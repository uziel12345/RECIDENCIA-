import { ApiError } from "../../shared/errors/api-error.js";
import { HeadquartersRepository } from "./headquarters.repository.js";
import type { CreateHeadquartersInput, UpdateHeadquartersInput } from "./headquarters.schema.js";

export class HeadquartersService {
  constructor(private readonly repository = new HeadquartersRepository()) {}

  async getAll(buildingId?: string) {
    return this.repository.findAllActive(buildingId);
  }

  async getById(id: string) {
    const headquarters = await this.repository.findById(id);
    if (!headquarters) {
      throw new ApiError(404, "Jefatura no encontrada");
    }
    return headquarters;
  }

  async create(input: CreateHeadquartersInput) {
    const exists = await this.repository.buildingExists(input.building_id);
    if (!exists) {
      throw new ApiError(404, "El edificio indicado no existe");
    }

    if (input.department_id) {
      const departmentExists = await this.repository.departmentExists(input.department_id);
      if (!departmentExists) {
        throw new ApiError(404, "El departamento indicado no existe");
      }
    }

    const id = await this.repository.create({
      building_id: input.building_id,
      name: input.name,
      head_name: input.head_name ?? null,
      department_id: input.department_id ?? null,
      schedule_text: input.schedule_text ?? null,
      contact: input.contact ?? null,
      is_active: input.is_active ?? true,
    });

    return this.getById(id);
  }

  async update(id: string, input: UpdateHeadquartersInput) {
    const current = await this.getById(id);

    const buildingId = input.building_id ?? current.building_id;

    if (input.building_id && input.building_id !== current.building_id) {
      const exists = await this.repository.buildingExists(input.building_id);
      if (!exists) {
        throw new ApiError(404, "El edificio indicado no existe");
      }
    }

    if (
      input.department_id !== undefined &&
      input.department_id !== null &&
      input.department_id !== current.department_id
    ) {
      const departmentExists = await this.repository.departmentExists(input.department_id);
      if (!departmentExists) {
        throw new ApiError(404, "El departamento indicado no existe");
      }
    }

    await this.repository.update(id, {
      building_id: buildingId,
      name: input.name ?? current.name,
      head_name: input.head_name !== undefined ? input.head_name : current.head_name,
      department_id:
        input.department_id !== undefined ? input.department_id : current.department_id,
      schedule_text:
        input.schedule_text !== undefined ? input.schedule_text : current.schedule_text,
      contact: input.contact !== undefined ? input.contact : current.contact,
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
