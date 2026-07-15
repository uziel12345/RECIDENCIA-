import { ApiError } from "../../shared/errors/api-error.js";
import { DepartmentsRepository } from "./departments.repository.js";
import type { CreateDepartmentInput, UpdateDepartmentInput } from "./departments.schema.js";

export class DepartmentsService {
  constructor(private readonly repository = new DepartmentsRepository()) {}

  async getAll(buildingId?: string) {
    return this.repository.findAllActive(buildingId);
  }

  async getById(id: string) {
    const department = await this.repository.findById(id);
    if (!department) {
      throw new ApiError(404, "Departamento no encontrado");
    }
    return department;
  }

  async create(input: CreateDepartmentInput) {
    const exists = await this.repository.buildingExists(input.building_id);
    if (!exists) {
      throw new ApiError(404, "El edificio indicado no existe");
    }

    const id = await this.repository.create({
      building_id: input.building_id,
      name: input.name,
      description: input.description ?? null,
      schedule_text: input.schedule_text ?? null,
      head_name: input.head_name ?? null,
      contact: input.contact ?? null,
      is_active: input.is_active ?? true,
    });

    return this.getById(id);
  }

  async update(id: string, input: UpdateDepartmentInput) {
    const current = await this.getById(id);

    const buildingId = input.building_id ?? current.building_id;

    if (input.building_id && input.building_id !== current.building_id) {
      const exists = await this.repository.buildingExists(input.building_id);
      if (!exists) {
        throw new ApiError(404, "El edificio indicado no existe");
      }
    }

    await this.repository.update(id, {
      building_id: buildingId,
      name: input.name ?? current.name,
      description:
        input.description !== undefined ? input.description : current.description,
      schedule_text:
        input.schedule_text !== undefined ? input.schedule_text : current.schedule_text,
      head_name: input.head_name !== undefined ? input.head_name : current.head_name,
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
