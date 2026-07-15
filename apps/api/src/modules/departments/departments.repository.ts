import crypto from "node:crypto";
import type { Pool, RowDataPacket } from "mysql2/promise";
import { pool } from "../../db/connection.js";
import type { DepartmentRow } from "./departments.types.js";

const DEPARTMENT_SELECT_BASE = `
  SELECT
    d.id,
    d.building_id,
    b.code AS building_code,
    b.name AS building_name,
    d.name,
    d.description,
    d.schedule_text,
    d.head_name,
    d.contact,
    d.is_active,
    d.deleted_at
  FROM departments d
  INNER JOIN buildings b ON d.building_id = b.id
`;

export class DepartmentsRepository {
  constructor(private readonly db: Pool = pool) {}

  async findAllActive(buildingId?: string): Promise<DepartmentRow[]> {
    if (buildingId) {
      const [rows] = await this.db.query<DepartmentRow[]>(
        `${DEPARTMENT_SELECT_BASE}
         WHERE d.deleted_at IS NULL AND d.is_active = TRUE AND d.building_id = ?
         ORDER BY b.name ASC, d.name ASC`,
        [buildingId]
      );
      return rows;
    }
    const [rows] = await this.db.query<DepartmentRow[]>(
      `${DEPARTMENT_SELECT_BASE}
       WHERE d.deleted_at IS NULL AND d.is_active = TRUE
       ORDER BY b.name ASC, d.name ASC`
    );
    return rows;
  }

  async findById(id: string): Promise<DepartmentRow | null> {
    const [rows] = await this.db.query<DepartmentRow[]>(
      `${DEPARTMENT_SELECT_BASE} WHERE d.id = ? AND d.deleted_at IS NULL LIMIT 1`,
      [id]
    );
    return rows[0] ?? null;
  }

  async create(input: {
    building_id: string;
    name: string;
    description: string | null;
    schedule_text: string | null;
    head_name: string | null;
    contact: string | null;
    is_active: boolean;
  }): Promise<string> {
    const id = crypto.randomUUID();
    await this.db.query(
      `INSERT INTO departments
         (id, building_id, name, description, schedule_text, head_name, contact, is_active)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        id,
        input.building_id,
        input.name,
        input.description,
        input.schedule_text,
        input.head_name,
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
      description: string | null;
      schedule_text: string | null;
      head_name: string | null;
      contact: string | null;
      is_active: boolean;
    }
  ): Promise<void> {
    await this.db.query(
      `UPDATE departments
       SET building_id = ?, name = ?, description = ?, schedule_text = ?,
           head_name = ?, contact = ?, is_active = ?
       WHERE id = ? AND deleted_at IS NULL`,
      [
        input.building_id,
        input.name,
        input.description,
        input.schedule_text,
        input.head_name,
        input.contact,
        input.is_active,
        id,
      ]
    );
  }

  async updateStatus(id: string, isActive: boolean): Promise<void> {
    await this.db.query(
      `UPDATE departments SET is_active = ? WHERE id = ? AND deleted_at IS NULL`,
      [isActive, id]
    );
  }

  async softDelete(id: string): Promise<void> {
    await this.db.query(
      `UPDATE departments SET is_active = FALSE, deleted_at = NOW() WHERE id = ? AND deleted_at IS NULL`,
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
