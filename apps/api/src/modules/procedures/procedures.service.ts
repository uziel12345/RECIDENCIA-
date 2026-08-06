import { ApiError } from "../../shared/errors/api-error.js";
import { ProceduresRepository } from "./procedures.repository.js";
import type {
  CreateProcedureInput,
  CreateRequirementInput,
  LinkProcedureInput,
  UpdateProcedureInput,
  UpdateRequirementInput,
} from "./procedures.schema.js";

export class ProceduresService {
  constructor(private readonly repository = new ProceduresRepository()) {}

  async getAll(filters: { kind?: string; buildingId?: string }) {
    return this.repository.findAllActive(filters);
  }

  async getAllForAdmin(filters: { kind?: string }) {
    return this.repository.findAllForAdmin(filters);
  }

  async getById(id: string) {
    const procedure = await this.repository.findById(id);
    if (!procedure) throw new ApiError(404, "Trámite/servicio no encontrado");

    const [requirements, buildings] = await Promise.all([
      this.repository.findRequirementsByProcedure(id),
      this.repository.findBuildingsByProcedure(id),
    ]);

    return { ...procedure, requirements, buildings };
  }

  async getByBuilding(buildingId: string) {
    const exists = await this.repository.buildingExists(buildingId);
    if (!exists) throw new ApiError(404, "Edificio no encontrado");

    const procedures = await this.repository.findByBuilding(buildingId);
    if (procedures.length === 0) return [];

    const ids = procedures.map((p) => p.id);
    const requirements = await this.repository.findRequirementsByProcedureIds(ids);

    return procedures.map((p) => ({
      ...p,
      requirements: requirements.filter((r) => r.procedure_id === p.id),
    }));
  }

  async create(input: CreateProcedureInput) {
    const duplicate = await this.repository.findBySlug(input.slug);
    if (duplicate) {
      throw new ApiError(409, `Ya existe un trámite/servicio con el slug '${input.slug}'`);
    }

    if (input.department_id) {
      const departmentExists = await this.repository.departmentExists(input.department_id);
      if (!departmentExists) {
        throw new ApiError(404, "El departamento indicado no existe");
      }
    }

    if (input.building_id) {
      const buildingExists = await this.repository.buildingExists(input.building_id);
      if (!buildingExists) throw new ApiError(404, "El edificio indicado no existe");
    }

    const validationStatus = input.validation_status ??
      (input.department_id && input.building_id ? "confirmed" : "pending_validation");

    const id = await this.repository.create({
      name: input.name,
      slug: input.slug,
      description: input.description ?? null,
      resource_url: input.resource_url ?? null,
      kind: input.kind,
      department_id: input.department_id ?? null,
      internal_location: input.internal_location ?? null,
      schedule_text: input.schedule_text ?? null,
      validation_status: validationStatus,
      is_active: input.is_active ?? true,
    });

    if (input.building_id) {
      await this.repository.linkBuilding(input.building_id, id, null);
    }

    if (input.requirements && input.requirements.length > 0) {
      await this.repository.createRequirements(id, input.requirements);
    }

    return this.getById(id);
  }

  async update(id: string, input: UpdateProcedureInput) {
    const current = await this.repository.findById(id);
    if (!current) throw new ApiError(404, "Trámite/servicio no encontrado");

    const slug = input.slug ?? current.slug;

    if (input.slug !== undefined && input.slug !== current.slug) {
      const duplicate = await this.repository.findBySlug(slug, id);
      if (duplicate) {
        throw new ApiError(409, `Ya existe un trámite/servicio con el slug '${slug}'`);
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
      name: input.name ?? current.name,
      slug,
      description:
        input.description !== undefined ? input.description : current.description,
      resource_url:
        input.resource_url !== undefined ? input.resource_url : current.resource_url,
      kind: input.kind ?? current.kind,
      department_id:
        input.department_id !== undefined ? input.department_id : current.department_id,
      internal_location:
        input.internal_location !== undefined
          ? input.internal_location
          : current.internal_location,
      schedule_text:
        input.schedule_text !== undefined ? input.schedule_text : current.schedule_text,
      validation_status:
        input.validation_status !== undefined
          ? input.validation_status
          : current.validation_status,
      is_active:
        input.is_active !== undefined ? input.is_active : Boolean(current.is_active),
    });

    if (input.requirements !== undefined) {
      await this.repository.replaceRequirements(id, input.requirements);
    }

    return this.getById(id);
  }

  async getServicesByBuilding(buildingId: string) {
    return (await this.getByBuilding(buildingId)).filter(
      (procedure) => procedure.kind === "servicio"
    );
  }

  async updateStatus(id: string, isActive: boolean) {
    const procedure = await this.repository.findById(id);
    if (!procedure) throw new ApiError(404, "Trámite/servicio no encontrado");
    await this.repository.updateStatus(id, isActive);
    return this.getById(id);
  }

  async remove(id: string) {
    const procedure = await this.repository.findById(id);
    if (!procedure) throw new ApiError(404, "Trámite/servicio no encontrado");
    await this.repository.softDelete(id);
    return { id, deleted: true };
  }

  async addRequirement(procedureId: string, input: CreateRequirementInput) {
    const procedure = await this.repository.findById(procedureId);
    if (!procedure) throw new ApiError(404, "Trámite/servicio no encontrado");
    const reqId = await this.repository.addRequirement(procedureId, input);
    return this.repository.findRequirementById(reqId);
  }

  async updateRequirement(requirementId: string, input: UpdateRequirementInput) {
    const requirement = await this.repository.findRequirementById(requirementId);
    if (!requirement) throw new ApiError(404, "Requisito no encontrado");
    await this.repository.updateRequirement(requirementId, input);
    return this.repository.findRequirementById(requirementId);
  }

  async deleteRequirement(requirementId: string) {
    const requirement = await this.repository.findRequirementById(requirementId);
    if (!requirement) throw new ApiError(404, "Requisito no encontrado");
    await this.repository.deleteRequirement(requirementId);
    return { id: requirementId, deleted: true };
  }

  async linkBuilding(buildingId: string, input: LinkProcedureInput) {
    const buildingExists = await this.repository.buildingExists(buildingId);
    if (!buildingExists) throw new ApiError(404, "Edificio no encontrado");

    const procedure = await this.repository.findById(input.procedure_id);
    if (!procedure) throw new ApiError(404, "Trámite/servicio no encontrado");

    const existing = await this.repository.findBuildingProcedure(
      buildingId,
      input.procedure_id
    );
    if (existing) {
      throw new ApiError(409, "Este trámite/servicio ya está asociado a ese edificio");
    }

    await this.repository.linkBuilding(
      buildingId,
      input.procedure_id,
      input.notes ?? null
    );

    return {
      building_id: buildingId,
      procedure_id: input.procedure_id,
      notes: input.notes ?? null,
    };
  }

  async unlinkBuilding(buildingId: string, procedureId: string) {
    const existing = await this.repository.findBuildingProcedure(
      buildingId,
      procedureId
    );
    if (!existing) {
      throw new ApiError(
        404,
        "Este trámite/servicio no está asociado a ese edificio"
      );
    }
    await this.repository.unlinkBuilding(buildingId, procedureId);
    return { building_id: buildingId, procedure_id: procedureId, deleted: true };
  }
}
