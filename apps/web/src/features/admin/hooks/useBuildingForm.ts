import type {
  Building,
  CreateBuildingInput,
  UpdateBuildingInput,
} from "@ito-map/shared";

export type BuildingFormState = {
  code: string;
  name: string;
  slug: string;
  description: string;
  model_node_name: string;
  x: string;
  y: string;
  z: string;
  latitude: string;
  longitude: string;
  category_code: string;
  is_priority: boolean;
};

export const initialFormState: BuildingFormState = {
  code: "",
  name: "",
  slug: "",
  description: "",
  model_node_name: "",
  x: "",
  y: "",
  z: "",
  latitude: "",
  longitude: "",
  category_code: "",
  is_priority: false,
};

export function toNullableNumber(value: string): number | null {
  const trimmed = value.trim();

  if (!trimmed) return null;

  const parsed = Number(trimmed);

  return Number.isFinite(parsed) ? parsed : null;
}

export function createSlug(value: string): string {
  return value
    .trim()
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

export function safeText(value: unknown): string {
  if (typeof value === "string") return value;
  if (value === null || value === undefined) return "";
  return String(value);
}

export function numberToFormValue(value: number | null | undefined): string {
  if (value === null || value === undefined) return "";
  return String(value);
}

export function mapBuildingToForm(building: Building): BuildingFormState {
  return {
    code: safeText(building.code),
    name: safeText(building.name),
    slug: safeText(building.slug),
    description: safeText(building.description),
    model_node_name: safeText(building.model_node_name),
    x: numberToFormValue(building.x),
    y: numberToFormValue(building.y),
    z: numberToFormValue(building.z),
    latitude: numberToFormValue(building.latitude),
    longitude: numberToFormValue(building.longitude),
    category_code: safeText(building.category_code),
    is_priority: Boolean(building.is_priority),
  };
}

export function buildCreateInput(form: BuildingFormState): CreateBuildingInput {
  return {
    code: form.code.trim(),
    name: form.name.trim(),
    slug: form.slug.trim() || createSlug(form.name),
    description: form.description.trim() || null,
    model_node_name: form.model_node_name.trim(),
    x: toNullableNumber(form.x),
    y: toNullableNumber(form.y),
    z: toNullableNumber(form.z),
    latitude: toNullableNumber(form.latitude),
    longitude: toNullableNumber(form.longitude),
    category_code: form.category_code.trim(),
    is_active: true,
    is_priority: form.is_priority,
  };
}

export function buildUpdateInput(
  form: BuildingFormState,
  currentBuilding: Building
): UpdateBuildingInput {
  return {
    code: form.code.trim(),
    name: form.name.trim(),
    slug: form.slug.trim() || createSlug(form.name),
    description: form.description.trim() || null,
    model_node_name: form.model_node_name.trim(),
    x: toNullableNumber(form.x),
    y: toNullableNumber(form.y),
    z: toNullableNumber(form.z),
    latitude: toNullableNumber(form.latitude),
    longitude: toNullableNumber(form.longitude),
    category_code: form.category_code.trim(),
    is_active: Boolean(currentBuilding.is_active),
    is_priority: form.is_priority,
  };
}