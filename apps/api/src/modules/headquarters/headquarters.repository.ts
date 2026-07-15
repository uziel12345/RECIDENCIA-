import crypto from "node:crypto";
import type { Pool, RowDataPacket } from "mysql2/promise";
import { pool } from "../../db/connection.js";
import type { HeadquartersRow } from "./headquarters.types.js";

const HEADQUARTERS_SELECT_BASE = `
  SELECT
    hq.id,
    hq.building_id,
    b.code AS building_code,
    b.name AS building_name,
    hq.name,
    hq.head_name,
    hq.department_id,
    dp.name AS department_name,
    hq.schedule_text,
    hq.contact,
    hq.is_active,
    hq.deleted_at
  FROM headquarters hq
  INNER JOIN buildings b ON hq.building_id = b.id
  LEFT JOIN departments dp ON hq.department_id = dp.id AND dp.deleted_at IS NULL
`;

export class HeadquartersRepository {
  constructor(private readonly db: Pool = pool) {}

  async findAllActive(buildingId?: string): Promise<HeadquartersRow[]> {
    if (buildingId) {
      const [rows] = await this.db.query<HeadquartersRow[]>(
        `${HEADQUARTERS_SELECT_BASE}
         WHERE hq.deleted_at IS NULL AND hq.is_active = TRUE AND hq.building_id = ?
         ORDER BY b.name ASC, hq.name ASC`,
        [buildingId]
      );
      return rows;
    }
    const [rows] = await this.db.query<HeadquartersRow[]>(
      `${HEADQUARTERS_SELECT_BASE}
       WHERE hq.deleted_at IS NULL AND hq.is_active = TRUE
       ORDER BY b.name ASC, hq.name ASC`
    );
    return rows;
  }

  async findById(id: string): Promise<HeadquartersRow | null> {
    const [rows] = await this.db.query<HeadquartersRow[]>(
      `${HEADQUARTERS_SELECT_BASE} WHERE hq.id = ? AND hq.deleted_at IS NULL LIMIT 1`,
      [id]
    );
    return rows[0] ?? null;
  }

  async create(input: {
    building_id: string;
    name: string;
    head_name: string | null;
    department_id: string | null;
    schedule_text: string | null;
    contact: string | null;
    is_active: boolean;
  }): Promise<string> {
    const id = crypto.randomUUID();
    await this.db.query(
      `INSERT INTO headquarters
         (id, building_id, name, head_name, department_id, schedule_text, contact, is_active)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        id,
        input.building_id,
        input.name,
        input.head_name,
        input.department_id,
        input.schedule_text,
        input.contact,
        input.is_active,
      ]
    );
    return id;
  }

  async update(
    id: string,
    input: {
      building_id: string;
      name: string;
      head_name: string | null;
      department_id: string | null;
      schedule_text: string | null;
      contact: string | null;
      is_active: boolean;
    }
  ): Promise<void> {
    await this.db.query(
      `UPDATE headquarters
       SET building_id = ?, name = ?, head_name = ?, department_id = ?, schedule_text = ?,
           contact = ?, is_active = ?
       WHERE id = ? AND deleted_at IS NULL`,
      [
        input.building_id,
        input.name,
        input.head_name,
        input.department_id,
        input.schedule_text,
        input.contact,
        input.is_active,
        id,
      ]
    );
  }

  async updateStatus(id: string, isActive: boolean): Promise<void> {
    await this.db.query(
      `UPDATE headquarters SET is_active = ? WHERE id = ? AND deleted_at IS NULL`,
      [isActive, id]
    );
  }

  async softDelete(id: string): Promise<void> {
    await this.db.query(
      `UPDATE headquarters SET is_active = FALSE, deleted_at = NOW() WHERE id = ? AND deleted_at IS NULL`,
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

  async departmentExists(departmentId: string): Promise<boolean> {
    const [rows] = await this.db.query<RowDataPacket[]>(
      `SELECT id FROM departments WHERE id = ? AND deleted_at IS NULL LIMIT 1`,
      [departmentId]
    );
    return rows.length > 0;
  }
}
