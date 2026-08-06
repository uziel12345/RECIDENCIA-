import type {
  CampusStreet,
  InstitutionalPosition,
  QuickQuery,
} from "@ito-map/shared";
import { ApiError } from "../../shared/errors/api-error.js";
import {
  CampusCatalogRepository,
  type PositionRow,
} from "./campus-catalog.repository.js";

function aliases(value: string | null): string[] {
  return value ? value.split("|").map((item) => item.trim()).filter(Boolean) : [];
}

function mapPosition(row: PositionRow): InstitutionalPosition {
  return {
    id: row.id,
    title: row.title,
    aliases: aliases(row.alias_text),
    personName: row.person_name,
    departmentId: row.department_id,
    departmentName: row.department_name,
    buildingId: row.building_id,
    buildingName: row.building_name,
    officeName: row.office_name,
    isPublic: Boolean(row.is_public),
    isActive: Boolean(row.is_active),
    searchKeywords: row.search_keywords ?? [],
  };
}

export class CampusCatalogService {
  constructor(private readonly repository = new CampusCatalogRepository()) {}

  async getStreets(): Promise<CampusStreet[]> {
    const rows = await this.repository.findStreets();
    return rows.map((row) => ({
      id: row.id,
      name: row.name,
      aliases: aliases(row.alias_text),
      position: { x: Number(row.x), y: Number(row.y), z: Number(row.z) },
      rotation: row.rotation == null ? null : Number(row.rotation),
      description: row.description,
      isVisible: Boolean(row.is_visible),
    }));
  }

  async getQuickQueries(): Promise<QuickQuery[]> {
    const rows = await this.repository.findQuickQueries();
    return rows.map((row) => ({
      id: row.id,
      label: row.label,
      query: row.query,
      category: row.category,
      icon: row.icon,
      priority: Number(row.priority),
    }));
  }

  async getPositions(buildingId?: string): Promise<InstitutionalPosition[]> {
    return (await this.repository.findPositions(buildingId)).map(mapPosition);
  }

  async getPosition(id: string): Promise<InstitutionalPosition> {
    const row = await this.repository.findPositionById(id);
    if (!row) throw new ApiError(404, "Cargo institucional no encontrado");
    return mapPosition(row);
  }
}
