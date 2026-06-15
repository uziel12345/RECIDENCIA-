import { apiDelete, apiGet, apiPatch, apiPost, apiPut, apiUpload } from "./client.js";
import type {
  Building,
  BuildingCategory,
  BuildingImage,
  BuildingService,
  CreateBuildingInput,
  CreateBuildingServiceInput,
  UpdateBuildingInput,
  UpdateBuildingStatusInput,
} from "../types/building.types.js";

export type PaginatedBuildingsResponse = {
  data: Building[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
};

export function getBuildingsApi(): Promise<Building[]> {
  return apiGet<Building[]>("/buildings");
}

export function getCategoriesApi(): Promise<BuildingCategory[]> {
  return apiGet<BuildingCategory[]>("/buildings/categories");
}

export function getAdminBuildingsApi(): Promise<Building[]> {
  return apiGet<Building[]>("/buildings/admin/all");
}

export function getAdminBuildingsPaginatedApi(
  page: number,
  limit: number
): Promise<PaginatedBuildingsResponse> {
  return apiGet<PaginatedBuildingsResponse>(
    `/buildings/admin/paginated?page=${page}&limit=${limit}`
  );
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
  const formData = new FormData();
  formData.append("image", input.image);
  formData.append("title", input.title ?? "");
  formData.append("description", input.description ?? "");
  formData.append("image_type", input.image_type ?? "photo");
  formData.append("is_cover", String(input.is_cover ?? false));
  formData.append("sort_order", String(input.sort_order ?? 0));

  return apiUpload<BuildingImage>(
    `/building-images/buildings/${input.buildingId}/images`,
    formData
  );
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

export function getBuildingServicesApi(buildingId: string): Promise<BuildingService[]> {
  return apiGet<BuildingService[]>(`/buildings/${buildingId}/services`);
}

export function addBuildingServiceApi(
  buildingId: string,
  input: CreateBuildingServiceInput
): Promise<BuildingService> {
  return apiPost<BuildingService, CreateBuildingServiceInput>(
    `/buildings/${buildingId}/services`,
    input
  );
}

export function deleteBuildingServiceApi(
  buildingId: string,
  serviceId: string
): Promise<{ id: string }> {
  return apiDelete<{ id: string }>(`/buildings/${buildingId}/services/${serviceId}`);
}
