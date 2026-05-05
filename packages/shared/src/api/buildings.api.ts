import { apiDelete, apiGet, apiPatch, apiPost, apiPut } from "./client.ts";
import type {
  Building,
  BuildingImage,
  CreateBuildingInput,
  UpdateBuildingInput,
  UpdateBuildingStatusInput,
} from "../types/building.types.ts";

export function getBuildingsApi(): Promise<Building[]> {
  return apiGet<Building[]>("/buildings");
}

export function getAdminBuildingsApi(): Promise<Building[]> {
  return apiGet<Building[]>("/buildings/admin/all");
}

export function getBuildingByIdApi(id: string): Promise<Building> {
  return apiGet<Building>(`/buildings/${id}`);
}

export function getBuildingImagesApi(id: string): Promise<BuildingImage[]> {
  return apiGet<BuildingImage[]>(`/buildings/${id}/images`);
}

export function getAdminBuildingImagesApi(
  buildingId: string
): Promise<BuildingImage[]> {
  return apiGet<BuildingImage[]>(
    `/building-images/buildings/${buildingId}/images?includeInactive=true`
  );
}

export async function uploadBuildingImageApi(input: {
  buildingId: string;
  image: File;
  title?: string;
  description?: string;
  image_type?: string;
  is_cover?: boolean;
  sort_order?: number;
}): Promise<BuildingImage> {
  const baseUrl = import.meta.env.VITE_API_URL || "/api";
  const token = localStorage.getItem("admin_token");

  const formData = new FormData();
  formData.append("image", input.image);
  formData.append("title", input.title ?? "");
  formData.append("description", input.description ?? "");
  formData.append("image_type", input.image_type ?? "photo");
  formData.append("is_cover", String(input.is_cover ?? false));
  formData.append("sort_order", String(input.sort_order ?? 0));

  const response = await fetch(
    `${baseUrl}/building-images/buildings/${input.buildingId}/images`,
    {
      method: "POST",
      headers: token
        ? {
            Authorization: `Bearer ${token}`,
          }
        : undefined,
      body: formData,
    }
  );

  const json = await response.json();

  if (!response.ok || !json.success) {
    throw new Error(json.message || "No se pudo subir la imagen");
  }

  return json.data;
}

export function updateBuildingImageStatusApi(
  imageId: string,
  input: { is_active: boolean }
): Promise<BuildingImage> {
  return apiPatch<BuildingImage, { is_active: boolean }>(
    `/building-images/images/${imageId}/status`,
    input
  );
}

export function deleteBuildingImageApi(
  imageId: string
): Promise<{ id: string; deleted: boolean }> {
  return apiDelete<{ id: string; deleted: boolean }>(
    `/building-images/images/${imageId}`
  );
}

export function createBuildingApi(input: CreateBuildingInput): Promise<Building> {
  return apiPost<Building, CreateBuildingInput>("/buildings", input);
}

export function updateBuildingApi(
  id: string,
  input: UpdateBuildingInput
): Promise<Building> {
  return apiPut<Building, UpdateBuildingInput>(`/buildings/${id}`, input);
}

export function updateBuildingStatusApi(
  id: string,
  input: UpdateBuildingStatusInput
): Promise<Building> {
  return apiPatch<Building, UpdateBuildingStatusInput>(
    `/buildings/${id}/status`,
    input
  );
}

export function deleteBuildingApi(
  id: string
): Promise<{ id: string; deleted: boolean }> {
  return apiDelete<{ id: string; deleted: boolean }>(`/buildings/${id}`);
}