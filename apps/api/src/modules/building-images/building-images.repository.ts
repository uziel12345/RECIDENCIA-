import crypto from "node:crypto";
import type { Pool, ResultSetHeader } from "../../db/mysql-compat-types.js";
import { pool } from "../../db/connection.js";
import type {
  BuildingImageRow,
  CreateBuildingImageInput,
} from "./building-images.types.js";

export class BuildingImagesRepository {
  constructor(private readonly db: Pool = pool) {}

  async findByBuildingId(buildingId: string): Promise<BuildingImageRow[]> {
    const [rows] = await this.db.query<BuildingImageRow[]>(
      `
      SELECT
        id,
        building_id,
        image_url,
        image_type,
        title,
        description,
        is_cover,
        sort_order,
        is_active,
        created_at,
        updated_at
      FROM building_images
      WHERE building_id = ?
      ORDER BY is_cover DESC, sort_order ASC, created_at ASC
      `,
      [buildingId]
    );

    return rows;
  }

  async findActiveByBuildingId(buildingId: string): Promise<BuildingImageRow[]> {
    const [rows] = await this.db.query<BuildingImageRow[]>(
      `
      SELECT
        id,
        building_id,
        image_url,
        image_type,
        title,
        description,
        is_cover,
        sort_order,
        is_active,
        created_at,
        updated_at
      FROM building_images
      WHERE building_id = ? AND is_active = TRUE
      ORDER BY is_cover DESC, sort_order ASC, created_at ASC
      `,
      [buildingId]
    );

    return rows;
  }

  async findById(id: string): Promise<BuildingImageRow | null> {
    const [rows] = await this.db.query<BuildingImageRow[]>(
      `
      SELECT
        id,
        building_id,
        image_url,
        image_type,
        title,
        description,
        is_cover,
        sort_order,
        is_active,
        created_at,
        updated_at
      FROM building_images
      WHERE id = ?
      LIMIT 1
      `,
      [id]
    );

    return rows[0] ?? null;
  }

  async clearCoverByBuildingId(buildingId: string): Promise<void> {
    await this.db.query(
      `
      UPDATE building_images
      SET is_cover = FALSE
      WHERE building_id = ?
      `,
      [buildingId]
    );
  }

  async create(input: CreateBuildingImageInput): Promise<string> {
    const id = crypto.randomUUID();

    await this.db.query(
      `
      INSERT INTO building_images (
        id,
        building_id,
        image_url,
        image_type,
        title,
        description,
        is_cover,
        sort_order,
        is_active
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, TRUE)
      `,
      [
        id,
        input.building_id,
        input.image_url,
        input.image_type,
        input.title,
        input.description,
        input.is_cover,
        input.sort_order,
      ]
    );

    return id;
  }

  async updateStatus(id: string, isActive: boolean): Promise<void> {
    await this.db.query(
      `
      UPDATE building_images
      SET is_active = ?
      WHERE id = ?
      `,
      [isActive, id]
    );
  }

  async deleteById(id: string): Promise<boolean> {
    const [result] = await this.db.query<ResultSetHeader>(
      `
      DELETE FROM building_images
      WHERE id = ?
      `,
      [id]
    );

    return result.affectedRows > 0;
  }
}