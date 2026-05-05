import crypto from "node:crypto";
import type { Pool, RowDataPacket } from "mysql2/promise";
import { pool } from "../../db/connection.js";
import type { BuildingImageRow, BuildingRow } from "./buildings.types.js";

interface CategoryIdRow extends RowDataPacket {
  id: string;
}

export class BuildingsRepository {
  constructor(private readonly db: Pool = pool) {}

  async findAllActive(): Promise<BuildingRow[]> {
    const [rows] = await this.db.query<BuildingRow[]>(`
      SELECT
        b.id,
        b.code,
        b.name,
        b.slug,
        b.description,
        b.model_node_name,
        b.x,
        b.y,
        b.z,
        b.latitude,
        b.longitude,
        b.is_active,
        b.is_priority,
        bc.code AS category_code,
        bc.name AS category_name,
        bc.color_hex AS category_color
      FROM buildings b
      INNER JOIN building_categories bc ON b.category_id = bc.id
      WHERE b.is_active = TRUE
      ORDER BY b.name ASC
    `);

    return rows;
  }

  async findAllForAdmin(): Promise<BuildingRow[]> {
    const [rows] = await this.db.query<BuildingRow[]>(`
      SELECT
        b.id,
        b.code,
        b.name,
        b.slug,
        b.description,
        b.model_node_name,
        b.x,
        b.y,
        b.z,
        b.latitude,
        b.longitude,
        b.is_active,
        b.is_priority,
        bc.code AS category_code,
        bc.name AS category_name,
        bc.color_hex AS category_color
      FROM buildings b
      INNER JOIN building_categories bc ON b.category_id = bc.id
      ORDER BY b.is_active DESC, b.name ASC
    `);

    return rows;
  }

  async findById(id: string): Promise<BuildingRow | null> {
    const [rows] = await this.db.query<BuildingRow[]>(
      `
      SELECT
        b.id,
        b.code,
        b.name,
        b.slug,
        b.description,
        b.model_node_name,
        b.x,
        b.y,
        b.z,
        b.latitude,
        b.longitude,
        b.is_active,
        b.is_priority,
        bc.code AS category_code,
        bc.name AS category_name,
        bc.color_hex AS category_color
      FROM buildings b
      INNER JOIN building_categories bc ON b.category_id = bc.id
      WHERE b.id = ?
      LIMIT 1
      `,
      [id]
    );

    return rows[0] ?? null;
  }

  async findImagesByBuildingId(buildingId: string): Promise<BuildingImageRow[]> {
    const [rows] = await this.db.query<BuildingImageRow[]>(
      `
      SELECT
        bi.id,
        bi.image_url,
        bi.image_type,
        bi.title,
        bi.description,
        bi.is_cover,
        bi.sort_order,
        bi.is_active
      FROM building_images bi
      WHERE bi.building_id = ? AND bi.is_active = TRUE
      ORDER BY bi.sort_order ASC, bi.created_at ASC
      `,
      [buildingId]
    );

    return rows;
  }

  async findCategoryIdByCode(categoryCode: string): Promise<string | null> {
    const [rows] = await this.db.query<CategoryIdRow[]>(
      `
      SELECT id
      FROM building_categories
      WHERE code = ?
      LIMIT 1
      `,
      [categoryCode]
    );

    return rows[0]?.id ?? null;
  }

  async createBuilding(input: {
    code: string;
    name: string;
    slug: string;
    description: string | null;
    model_node_name: string;
    x: number | null;
    y: number | null;
    z: number | null;
    latitude: number | null;
    longitude: number | null;
    is_active: boolean;
    is_priority: boolean;
    category_id: string;
  }): Promise<string> {
    const id = crypto.randomUUID();

    await this.db.query(
      `
      INSERT INTO buildings (
        id,
        category_id,
        code,
        name,
        slug,
        description,
        model_node_name,
        x,
        y,
        z,
        latitude,
        longitude,
        is_active,
        is_priority
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `,
      [
        id,
        input.category_id,
        input.code,
        input.name,
        input.slug,
        input.description,
        input.model_node_name,
        input.x,
        input.y,
        input.z,
        input.latitude,
        input.longitude,
        input.is_active,
        input.is_priority,
      ]
    );

    return id;
  }

  async updateBuilding(
    id: string,
    input: {
      code: string;
      name: string;
      slug: string;
      description: string | null;
      model_node_name: string;
      x: number | null;
      y: number | null;
      z: number | null;
      latitude: number | null;
      longitude: number | null;
      is_active: boolean;
      is_priority: boolean;
      category_id: string;
    }
  ): Promise<void> {
    await this.db.query(
      `
      UPDATE buildings
      SET
        category_id = ?,
        code = ?,
        name = ?,
        slug = ?,
        description = ?,
        model_node_name = ?,
        x = ?,
        y = ?,
        z = ?,
        latitude = ?,
        longitude = ?,
        is_active = ?,
        is_priority = ?
      WHERE id = ?
      `,
      [
        input.category_id,
        input.code,
        input.name,
        input.slug,
        input.description,
        input.model_node_name,
        input.x,
        input.y,
        input.z,
        input.latitude,
        input.longitude,
        input.is_active,
        input.is_priority,
        id,
      ]
    );
  }

  async updateBuildingStatus(id: string, isActive: boolean): Promise<void> {
    await this.db.query(
      `
      UPDATE buildings
      SET is_active = ?
      WHERE id = ?
      `,
      [isActive, id]
    );
  }

  async softDeleteBuilding(id: string): Promise<void> {
    await this.db.query(
      `
      UPDATE buildings
      SET is_active = FALSE
      WHERE id = ?
      `,
      [id]
    );
  }
}