import crypto from "node:crypto";
import type { Pool, RowDataPacket } from "../../db/mysql-compat-types.js";
import { pool } from "../../db/connection.js";
import type { BuildingScheduleRow } from "./building-schedules.types.js";

const BUILDING_SCHEDULE_SELECT_BASE = `
  SELECT
    bs.id,
    bs.building_id,
    b.code AS building_code,
    b.name AS building_name,
    bs.day_of_week,
    bs.open_time,
    bs.close_time,
    bs.is_active,
    bs.deleted_at
  FROM building_schedules bs
  INNER JOIN buildings b ON bs.building_id = b.id
`;

export class BuildingSchedulesRepository {
  constructor(private readonly db: Pool = pool) {}

  async findAllActive(buildingId?: string): Promise<BuildingScheduleRow[]> {
    if (buildingId) {
      const [rows] = await this.db.query<BuildingScheduleRow[]>(
        `${BUILDING_SCHEDULE_SELECT_BASE}
         WHERE bs.deleted_at IS NULL AND bs.is_active = TRUE AND bs.building_id = ?
         ORDER BY bs.day_of_week ASC, bs.open_time ASC`,
        [buildingId]
      );
      return rows;
    }
    const [rows] = await this.db.query<BuildingScheduleRow[]>(
      `${BUILDING_SCHEDULE_SELECT_BASE}
       WHERE bs.deleted_at IS NULL AND bs.is_active = TRUE
       ORDER BY bs.day_of_week ASC, bs.open_time ASC`
    );
    return rows;
  }

  async findById(id: string): Promise<BuildingScheduleRow | null> {
    const [rows] = await this.db.query<BuildingScheduleRow[]>(
      `${BUILDING_SCHEDULE_SELECT_BASE} WHERE bs.id = ? AND bs.deleted_at IS NULL LIMIT 1`,
      [id]
    );
    return rows[0] ?? null;
  }

  async create(input: {
    building_id: string;
    day_of_week: number;
    open_time: string;
    close_time: string;
    is_active: boolean;
  }): Promise<string> {
    const id = crypto.randomUUID();
    await this.db.query(
      `INSERT INTO building_schedules (id, building_id, day_of_week, open_time, close_time, is_active)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [id, input.building_id, input.day_of_week, input.open_time, input.close_time, input.is_active]
    );
    return id;
  }

  async update(
    id: string,
    input: {
      building_id: string;
      day_of_week: number;
      open_time: string;
      close_time: string;
      is_active: boolean;
    }
  ): Promise<void> {
    await this.db.query(
      `UPDATE building_schedules
       SET building_id = ?, day_of_week = ?, open_time = ?, close_time = ?, is_active = ?
       WHERE id = ? AND deleted_at IS NULL`,
      [input.building_id, input.day_of_week, input.open_time, input.close_time, input.is_active, id]
    );
  }

  async updateStatus(id: string, isActive: boolean): Promise<void> {
    await this.db.query(
      `UPDATE building_schedules SET is_active = ? WHERE id = ? AND deleted_at IS NULL`,
      [isActive, id]
    );
  }

  async softDelete(id: string): Promise<void> {
    await this.db.query(
      `UPDATE building_schedules SET is_active = FALSE, deleted_at = NOW() WHERE id = ? AND deleted_at IS NULL`,
      [id]
    );
  }

  async buildingExists(buildingId: string): Promise<boolean> {
    const [rows] = await this.db.query<RowDataPacket[]>(
      `SELECT id FROM buildings WHERE id = ? AND deleted_at IS NULL LIMIT 1`,
      [buildingId]
    );
    return rows.length > 0;
  }
}
