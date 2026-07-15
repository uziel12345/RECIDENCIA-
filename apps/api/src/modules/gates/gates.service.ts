import { ApiError } from "../../shared/errors/api-error.js";
import { GatesRepository } from "./gates.repository.js";
import type { CreateGateInput, UpdateGateInput } from "./gates.schema.js";

export class GatesService {
  constructor(private readonly repository = new GatesRepository()) {}

  async getAll() {
    return this.repository.findAllActive();
  }

  async getAllForAdmin() {
    return this.repository.findAllForAdmin();
  }

  async getById(id: string) {
    const gate = await this.repository.findById(id);
    if (!gate) {
      throw new ApiError(404, "Puerta no encontrada");
    }
    return gate;
  }

  async create(input: CreateGateInput) {
    const id = await this.repository.create({
      name: input.name,
      description: input.description ?? null,
      access_type: input.access_type ?? "peatonal",
      status: input.status ?? "abierta",
      x: input.x,
      y: input.y ?? 0,
      z: input.z,
      is_active: input.is_active ?? true,
    });

    return this.getById(id);
  }

  async update(id: string, input: UpdateGateInput) {
    const current = await this.getById(id);

    await this.repository.update(id, {
      name: input.name ?? current.name,
      description:
        input.description !== undefined ? input.description : current.description,
      access_type: input.access_type ?? current.access_type,
      status: input.status ?? current.status,
      x: input.x ?? current.x,
      y: input.y ?? current.y,
      z: input.z ?? current.z,
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
