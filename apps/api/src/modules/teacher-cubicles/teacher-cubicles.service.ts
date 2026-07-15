import { ApiError } from "../../shared/errors/api-error.js";
import { TeacherCubiclesRepository } from "./teacher-cubicles.repository.js";
import type {
  CreateTeacherCubicleInput,
  UpdateTeacherCubicleInput,
} from "./teacher-cubicles.schema.js";

export class TeacherCubiclesService {
  constructor(private readonly repository = new TeacherCubiclesRepository()) {}

  async getAll(buildingId?: string) {
    return this.repository.findAllActive(buildingId);
  }

  async getById(id: string) {
    const cubicle = await this.repository.findById(id);
    if (!cubicle) {
      throw new ApiError(404, "Cubículo no encontrado");
    }
    return cubicle;
  }

  async create(input: CreateTeacherCubicleInput) {
    const buildingOk = await this.repository.buildingExists(input.building_id);
    if (!buildingOk) {
      throw new ApiError(404, "El edificio indicado no existe");
    }

    if (input.professor_id) {
      const professorOk = await this.repository.professorExists(input.professor_id);
      if (!professorOk) {
        throw new ApiError(404, "El profesor indicado no existe");
      }
    }

    if (input.department_id) {
      const departmentOk = await this.repository.departmentExists(input.department_id);
      if (!departmentOk) {
        throw new ApiError(404, "El departamento indicado no existe");
      }
    }

    const duplicate = await this.repository.findByBuildingAndCode(
      input.building_id,
      input.code
    );
    if (duplicate) {
      throw new ApiError(
        409,
        `Ya existe un cubículo con el código '${input.code}' en ese edificio`
      );
    }

    const id = await this.repository.create({
      building_id: input.building_id,
      code: input.code,
      professor_id: input.professor_id ?? null,
      department_id: input.department_id ?? null,
      schedule_text: input.schedule_text ?? null,
      notes: input.notes ?? null,
      is_active: input.is_active ?? true,
    });

    return this.getById(id);
  }

  async update(id: string, input: UpdateTeacherCubicleInput) {
    const current = await this.repository.findById(id);
    if (!current) {
      throw new ApiError(404, "Cubículo no encontrado");
    }

    const buildingId = input.building_id ?? current.building_id;
    const code = input.code ?? current.code;

    if (input.building_id && input.building_id !== current.building_id) {
      const exists = await this.repository.buildingExists(input.building_id);
      if (!exists) {
        throw new ApiError(404, "El edificio indicado no existe");
      }
    }

    if (input.professor_id !== undefined && input.professor_id !== null) {
      const exists = await this.repository.professorExists(input.professor_id);
      if (!exists) {
        throw new ApiError(404, "El profesor indicado no existe");
      }
    }

    if (input.department_id !== undefined && input.department_id !== null) {
      const exists = await this.repository.departmentExists(input.department_id);
      if (!exists) {
        throw new ApiError(404, "El departamento indicado no existe");
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
          `Ya existe un cubículo con el código '${code}' en ese edificio`
        );
      }
    }

    await this.repository.update(id, {
      building_id: buildingId,
      code,
      professor_id:
        input.professor_id !== undefined ? input.professor_id : current.professor_id,
      department_id:
        input.department_id !== undefined ? input.department_id : current.department_id,
      schedule_text:
        input.schedule_text !== undefined ? input.schedule_text : current.schedule_text,
      notes: input.notes !== undefined ? input.notes : current.notes,
      is_active:
        input.is_active !== undefined ? input.is_active : Boolean(current.is_active),
    });

    return this.getById(id);
  }

  async updateStatus(id: string, isActive: boolean) {
    const cubicle = await this.repository.findById(id);
    if (!cubicle) {
      throw new ApiError(404, "Cubículo no encontrado");
    }
    await this.repository.updateStatus(id, isActive);
    return this.getById(id);
  }

  async remove(id: string) {
    const cubicle = await this.repository.findById(id);
    if (!cubicle) {
      throw new ApiError(404, "Cubículo no encontrado");
    }
    await this.repository.softDelete(id);
    return { id, deleted: true };
  }
}
