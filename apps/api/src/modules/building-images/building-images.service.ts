import path from "node:path";
import fs from "node:fs/promises";
import { ApiError } from "../../shared/errors/api-error.js";
import { BuildingsRepository } from "../buildings/buildings.repository.js";
import { BuildingImagesRepository } from "./building-images.repository.js";

type UploadedImageFile = {
  filename: string;
};

type CreateImageInput = {
  buildingId: string;
  file: UploadedImageFile | undefined;
  title?: string;
  description?: string;
  image_type?: string;
  is_cover?: boolean | string;
  sort_order?: number | string;
};

export class BuildingImagesService {
  constructor(
    private readonly repository = new BuildingImagesRepository(),
    private readonly buildingsRepository = new BuildingsRepository()
  ) {}

  async getImagesForBuilding(buildingId: string, includeInactive = false) {
    await this.ensureBuildingExists(buildingId);

    if (includeInactive) {
      return this.repository.findByBuildingId(buildingId);
    }

    return this.repository.findActiveByBuildingId(buildingId);
  }

  async createImage(input: CreateImageInput) {
    await this.ensureBuildingExists(input.buildingId);

    if (!input.file) {
      throw new ApiError(400, "La imagen es obligatoria");
    }

    const isCover = this.parseBoolean(input.is_cover);
    const sortOrder = this.parseNumber(input.sort_order);

    if (isCover) {
      await this.repository.clearCoverByBuildingId(input.buildingId);
    }

    const imageUrl = `/uploads/buildings/${input.file.filename}`;

    const createdId = await this.repository.create({
      building_id: input.buildingId,
      image_url: imageUrl,
      image_type: input.image_type?.trim() || "general",
      title: input.title?.trim() || null,
      description: input.description?.trim() || null,
      is_cover: isCover,
      sort_order: sortOrder,
    });

    const image = await this.repository.findById(createdId);

    if (!image) {
      throw new ApiError(500, "No se pudo recuperar la imagen creada");
    }

    return image;
  }

  async updateImageStatus(imageId: string, isActive: boolean) {
    const image = await this.repository.findById(imageId);

    if (!image) {
      throw new ApiError(404, "Imagen no encontrada");
    }

    await this.repository.updateStatus(imageId, isActive);

    const updatedImage = await this.repository.findById(imageId);

    if (!updatedImage) {
      throw new ApiError(500, "No se pudo recuperar la imagen actualizada");
    }

    return updatedImage;
  }

  async removeImage(imageId: string) {
    const image = await this.repository.findById(imageId);

    if (!image) {
      throw new ApiError(404, "Imagen no encontrada");
    }

    await this.repository.deleteById(imageId);

    await this.removeLocalFile(image.image_url);

    return {
      id: imageId,
      deleted: true,
    };
  }

  private async ensureBuildingExists(buildingId: string) {
    if (!buildingId || buildingId.trim() === "") {
      throw new ApiError(400, "El id del edificio es obligatorio");
    }

    const building = await this.buildingsRepository.findById(buildingId);

    if (!building) {
      throw new ApiError(404, "Edificio no encontrado");
    }
  }

  private parseBoolean(value: boolean | string | undefined): boolean {
    if (typeof value === "boolean") return value;

    if (typeof value === "string") {
      return value.toLowerCase() === "true" || value === "1";
    }

    return false;
  }

  private parseNumber(value: number | string | undefined): number {
    if (typeof value === "number" && Number.isFinite(value)) {
      return value;
    }

    if (typeof value === "string" && value.trim() !== "") {
      const parsed = Number(value);

      if (Number.isFinite(parsed)) {
        return parsed;
      }
    }

    return 0;
  }

  private async removeLocalFile(imageUrl: string) {
    if (!imageUrl.startsWith("/uploads/buildings/")) {
      return;
    }

    const fileName = path.basename(imageUrl);
    const filePath = path.resolve(
      process.cwd(),
      "uploads",
      "buildings",
      fileName
    );

    try {
      await fs.unlink(filePath);
    } catch {
      // Si el archivo físico no existe, no fallamos la eliminación.
    }
  }
}