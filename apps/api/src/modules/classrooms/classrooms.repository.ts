import crypto from "node:crypto";
import type { Pool, RowDataPacket } from "mysql2/promise";
import { pool } from "../../db/connection.js";
import type { ClassroomRow } from "./classrooms.types.js";

const CLASSROOM_SELECT_BASE = `
  SELECT
    c.id,
    c.building_id,
    b.code  AS building_code,
    b.name  AS building_name,
    c.code,
    c.name,
    c.description,
    c.floor,
    c.capacity,
    c.type,
    c.is_active,
    c.deleted_at
  FROM classrooms c
  INNER JOIN buildings b ON c.building_id = b.id
`;

export class ClassroomsRepository {
  constructor(private readonly db: Pool = pool) {}

  async findAllActive(buildingId?: string): Promise<ClassroomRow[]> {
    if (buildingId) {
      const [rows] = await this.db.query<ClassroomRow[]>(
        `${CLASSROOM_SELECT_BASE}
         WHERE c.deleted_at IS NULL AND c.is_active = TRUE AND c.building_id = ?
         ORDER BY b.name ASC, c.code ASC`,
        [buildingId]
      );
      return rows;
    }
    const [rows] = await this.db.query<ClassroomRow[]>(
      `${CLASSROOM_SELECT_BASE}
       WHERE c.deleted_at IS NULL AND c.is_active = TRUE
       ORDER BY b.name ASC, c.code ASC`
    );
    return rows;
  }

  async findById(id: string): Promise<ClassroomRow | null> {
    const [rows] = await this.db.query<ClassroomRow[]>(
      `${CLASSROOM_SELECT_BASE} WHERE c.id = ? AND c.deleted_at IS NULL LIMIT 1`,
      [id]
    );
    return rows[0] ?? null;
  }

  async findByBuildingAndCode(
    buildingId: string,
    code: string,
    excludeId?: string
  ): Promise<ClassroomRow | null> {
    const params: unknown[] = [buildingId, code];
    let sql = `${CLASSROOM_SELECT_BASE}
               WHERE c.building_id = ? AND c.code = ? AND c.deleted_at IS NULL`;
    if (excludeId) {
      sql += " AND c.id != ?";
      params.push(excludeId);
    }
    sql += " LIMIT 1";
    const [rows] = await this.db.query<ClassroomRow[]>(sql, params);
    return rows[0] ?? null;
  }

  async create(input: {
    building_id: string;
    code: string;
    name: string;
    description: string | null;
    floor: number;
    capacity: number | null;
    type: string;
    is_active: boolean;
  }): Promise<string> {
    const id = crypto.randomUUID();
    await this.db.query(
      `INSERT INTO classrooms (id, building_id, code, name, description, floor, capacity, type, is_active)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        id,
        input.building_id,
        input.code,
        input.name,
        input.description,
        input.floor,
        input.capacity,
        input.type,
        input.is_active,
      ]
    );
    return id;
  }

  async update(
    id: string,
    input: {
      building_id: string;
      code: string;
      name: string;
      description: string | null;
      floor: number;
      capacity: number | null;
      type: string;
      is_active: boolean;
    }
  ): Promise<void> {
    await this.db.query(
      `UPDATE classrooms
       SET building_id = ?, code = ?, name = ?, description = ?, floor = ?, capacity = ?, type = ?, is_active = ?
       WHERE id = ? AND deleted_at IS NULL`,
      [
        input.building_id,
        input.code,
        input.name,
        input.description,
        input.floor,
        input.capacity,
        input.type,
        input.is_active,
        id,
      ]
    );
  }

  async updateStatus(id: string, isActive: boolean): Promise<void> {
    await this.db.query(
      `UPDATE classrooms SET is_active = ? WHERE id = ? AND deleted_at IS NULL`,
      [isActive, id]
    );
  }

  async softDelete(id: string): Promise<void> {
    await this.db.query(
      `UPDATE classrooms SET is_active = FALSE, deleted_at = NOW() WHERE id = ? AND deleted_at IS NULL`,
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
