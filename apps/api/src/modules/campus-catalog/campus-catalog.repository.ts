import { pool } from "../../db/connection.js";
import type { Pool, RowDataPacket } from "../../db/mysql-compat-types.js";

export interface StreetRow extends RowDataPacket {
  id: string;
  name: string;
  alias_text: string | null;
  x: number;
  y: number;
  z: number;
  rotation: number | null;
  description: string | null;
  is_visible: boolean;
}

export interface PositionRow extends RowDataPacket {
  id: string;
  title: string;
  alias_text: string | null;
  person_name: string | null;
  department_id: string | null;
  department_name: string | null;
  building_id: string | null;
  building_name: string | null;
  office_name: string | null;
  is_public: boolean;
  is_active: boolean;
  search_keywords: string[] | null;
}

export interface QuickQueryRow extends RowDataPacket {
  id: string;
  label: string;
  query: string;
  category: "building" | "department" | "service" | "procedure" | "person" | "position" | "classroom";
  icon: string | null;
  priority: number;
}

export class CampusCatalogRepository {
  constructor(private readonly db: Pool = pool) {}

  async findStreets(): Promise<StreetRow[]> {
    const [rows] = await this.db.query<StreetRow[]>(
      `SELECT cs.id, cs.name, cs.x, cs.y, cs.z, cs.rotation,
              cs.description, cs.is_visible,
              (SELECT STRING_AGG(sa.alias, '|') FROM search_aliases sa
               WHERE sa.entity_type = 'street' AND sa.entity_id = cs.id
                 AND sa.is_active = TRUE) AS alias_text
       FROM campus_streets cs
       WHERE cs.is_active = TRUE
       ORDER BY cs.display_order ASC, cs.name ASC`
    );
    return rows;
  }

  async findQuickQueries(): Promise<QuickQueryRow[]> {
    const [rows] = await this.db.query<QuickQueryRow[]>(
      `SELECT id, label, query, category, icon, priority
       FROM quick_queries
       WHERE is_active = TRUE
       ORDER BY priority DESC, label ASC`
    );
    return rows;
  }

  async findPositions(buildingId?: string): Promise<PositionRow[]> {
    const params: unknown[] = [];
    const buildingFilter = buildingId ? "AND ip.building_id = ?" : "";
    if (buildingId) params.push(buildingId);
    const [rows] = await this.db.query<PositionRow[]>(
      `SELECT ip.id, ip.title, ip.person_name, ip.department_id,
              d.name AS department_name, ip.building_id, b.name AS building_name,
              ip.office_name, ip.is_public, ip.is_active, ip.search_keywords,
              (SELECT STRING_AGG(sa.alias, '|') FROM search_aliases sa
               WHERE sa.entity_type = 'position' AND sa.entity_id = ip.id
                 AND sa.is_active = TRUE) AS alias_text
       FROM institutional_positions ip
       LEFT JOIN departments d ON d.id = ip.department_id AND d.deleted_at IS NULL
       LEFT JOIN buildings b ON b.id = ip.building_id AND b.deleted_at IS NULL
       WHERE ip.deleted_at IS NULL AND ip.is_active = TRUE AND ip.is_public = TRUE
         ${buildingFilter}
       ORDER BY ip.title ASC`,
      params
    );
    return rows;
  }

  async findPositionById(id: string): Promise<PositionRow | null> {
    const [rows] = await this.db.query<PositionRow[]>(
      `SELECT ip.id, ip.title, ip.person_name, ip.department_id,
              d.name AS department_name, ip.building_id, b.name AS building_name,
              ip.office_name, ip.is_public, ip.is_active, ip.search_keywords,
              (SELECT STRING_AGG(sa.alias, '|') FROM search_aliases sa
               WHERE sa.entity_type = 'position' AND sa.entity_id = ip.id
                 AND sa.is_active = TRUE) AS alias_text
       FROM institutional_positions ip
       LEFT JOIN departments d ON d.id = ip.department_id AND d.deleted_at IS NULL
       LEFT JOIN buildings b ON b.id = ip.building_id AND b.deleted_at IS NULL
       WHERE ip.deleted_at IS NULL AND ip.is_active = TRUE AND ip.is_public = TRUE
         AND ip.id = ?
       LIMIT 1`,
      [id]
    );
    return rows[0] ?? null;
  }
}
