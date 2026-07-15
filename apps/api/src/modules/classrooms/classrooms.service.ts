import { ApiError } from "../../shared/errors/api-error.js";
import { ClassroomsRepository } from "./classrooms.repository.js";
import type { CreateClassroomInput, UpdateClassroomInput } from "./classrooms.schema.js";

export class ClassroomsService {
  constructor(private readonly repository = new ClassroomsRepository()) {}

  async getAll(buildingId?: string) {
    return this.repository.findAllActive(buildingId);
  }

  async getById(id: string) {
    const classroom = await this.repository.findById(id);
    if (!classroom) {
      throw new ApiError(404, "Aula no encontrada");
    }
    return classroom;
  }

  async create(input: CreateClassroomInput) {
    const exists = await this.repository.buildingExists(input.building_id);
    if (!exists) {
      throw new ApiError(404, "El edificio indicado no existe");
    }

    const duplicate = await this.repository.findByBuildingAndCode(
      input.building_id,
      input.code
    );
    if (duplicate) {
      throw new ApiError(
        409,
        `Ya existe un aula con el código '${input.code}' en ese edificio`
      );
    }

    const id = await this.repository.create({
      building_id: input.building_id,
      code: input.code,
      name: input.name,
      description: input.description ?? null,
      floor: input.floor ?? 0,
      capacity: input.capacity ?? null,
      type: input.type ?? "aula",
      is_active: input.is_active ?? true,
    });

    return this.getById(id);
  }

  async update(id: string, input: UpdateClassroomInput) {
    const current = await this.repository.findById(id);
    if (!current) {
      throw new ApiError(404, "Aula no encontrada");
    }

    const buildingId = input.building_id ?? current.building_id;
    const code = input.code ?? current.code;

    if (input.building_id && input.building_id !== current.building_id) {
      const exists = await this.repository.buildingExists(input.building_id);
      if (!exists) {
        throw new ApiError(404, "El edificio indicado no existe");
      }
    }

    if (input.code !== undefined || input.building_id !== undefined) {
      const duplicate = await this.repository.findByBuildingAndCode(
        buildingId,
        code,
        id
      );
      if (duplicate) {
        throw new ApiError(
          409,
          `Ya existe un aula con el código '${code}' en ese edificio`
        );
      }
    }

    await this.repository.update(id, {
      building_id: buildingId,
      code,
      name: input.name ?? current.name,
      description:
        input.description !== undefined ? input.description : current.description,
      floor: input.floor ?? current.floor,
      capacity: input.capacity !== undefined ? input.capacity : current.capacity,
      type: input.type ?? current.type,
      is_active:
        input.is_active !== undefined ? input.is_active : Boolean(current.is_active),
    });

    return this.getById(id);
  }

  async updateStatus(id: string, isActive: boolean) {
    const classroom = await this.repository.findById(id);
    if (!classroom) {
      throw new ApiError(404, "Aula no encontrada");
    }
    await this.repository.updateStatus(id, isActive);
    return this.getById(id);
  }

  async remove(id: string) {
    const classroom = await this.repository.findById(id);
    if (!classroom) {
      throw new ApiError(404, "Aula no encontrada");
    }
    await this.repository.softDelete(id);
    return { id, deleted: true };
  }
}
