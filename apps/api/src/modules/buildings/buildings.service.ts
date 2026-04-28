import { ApiError } from "../../shared/errors/api-error.js";
import { BuildingsRepository } from "./buildings.repository.js";

export class BuildingsService {
  constructor(private readonly repository = new BuildingsRepository()) {}

  async getAll() {
    return this.repository.findAllActive();
  }

  async getById(id: string) {
    if (!id || id.trim() === "") {
      throw new ApiError(400, "El id del edificio es obligatorio");
    }

    const building = await this.repository.findById(id);

    if (!building) {
      throw new ApiError(404, "Edificio no encontrado");
    }

    return building;
  }

  async getImagesByBuildingId(id: string) {
    if (!id || id.trim() === "") {
      throw new ApiError(400, "El id del edificio es obligatorio");
    }

    const building = await this.repository.findById(id);

    if (!building) {
      throw new ApiError(404, "Edificio no encontrado");
    }

    return this.repository.findImagesByBuildingId(id);
  }

  async create(input: {
    code?: string;
    name?: string;
    slug?: string;
    description?: string | null;
    model_node_name?: string;
    x?: number | null;
    y?: number | null;
    z?: number | null;
    latitude?: number | null;
    longitude?: number | null;
    is_active?: boolean;
    is_priority?: boolean;
    category_code?: string;
  }) {
    if (!input.code || input.code.trim() === "") {
      throw new ApiError(400, "El código es obligatorio");
    }

    if (!input.name || input.name.trim() === "") {
      throw new ApiError(400, "El nombre es obligatorio");
    }

    if (!input.slug || input.slug.trim() === "") {
      throw new ApiError(400, "El slug es obligatorio");
    }

    if (!input.model_node_name || input.model_node_name.trim() === "") {
      throw new ApiError(400, "El model_node_name es obligatorio");
    }

    if (!input.category_code || input.category_code.trim() === "") {
      throw new ApiError(400, "El category_code es obligatorio");
    }

    const categoryId = await this.repository.findCategoryIdByCode(
      input.category_code.trim()
    );

    if (!categoryId) {
      throw new ApiError(400, "La categoría indicada no existe");
    }

    const createdId = await this.repository.createBuilding({
      code: input.code.trim(),
      name: input.name.trim(),
      slug: input.slug.trim(),
      description: input.description ?? null,
      model_node_name: input.model_node_name.trim(),
      x: input.x ?? null,
      y: input.y ?? null,
      z: input.z ?? null,
      latitude: input.latitude ?? null,
      longitude: input.longitude ?? null,
      is_active: input.is_active ?? true,
      is_priority: input.is_priority ?? false,
      category_id: categoryId,
    });

    return this.getById(createdId);
  }
}