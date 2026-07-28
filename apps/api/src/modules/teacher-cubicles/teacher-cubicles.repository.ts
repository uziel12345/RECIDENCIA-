import crypto from "node:crypto";
import type { Pool, RowDataPacket } from "../../db/mysql-compat-types.js";
import { pool } from "../../db/connection.js";
import type { TeacherCubicleRow } from "./teacher-cubicles.types.js";

const TEACHER_CUBICLE_SELECT_BASE = `
  SELECT
    tc.id,
    tc.building_id,
    b.code  AS building_code,
    b.name  AS building_name,
    tc.code,
    tc.professor_id,
    p.full_name AS professor_name,
    tc.department_id,
    dp.name AS department_name,
    tc.schedule_text,
    tc.notes,
    tc.is_active,
    tc.deleted_at
  FROM teacher_cubicles tc
  INNER JOIN buildings b ON tc.building_id = b.id
  LEFT JOIN professors p ON tc.professor_id = p.id AND p.deleted_at IS NULL
  LEFT JOIN departments dp ON tc.department_id = dp.id AND dp.deleted_at IS NULL
`;

export class TeacherCubiclesRepository {
  constructor(private readonly db: Pool = pool) {}

  async findAllActive(buildingId?: string): Promise<TeacherCubicleRow[]> {
    if (buildingId) {
      const [rows] = await this.db.query<TeacherCubicleRow[]>(
        `${TEACHER_CUBICLE_SELECT_BASE}
         WHERE tc.deleted_at IS NULL AND tc.is_active = TRUE AND tc.building_id = ?
         ORDER BY b.name ASC, tc.code ASC`,
        [buildingId]
      );
      return rows;
    }
    const [rows] = await this.db.query<TeacherCubicleRow[]>(
      `${TEACHER_CUBICLE_SELECT_BASE}
       WHERE tc.deleted_at IS NULL AND tc.is_active = TRUE
       ORDER BY b.name ASC, tc.code ASC`
    );
    return rows;
  }

  async findById(id: string): Promise<TeacherCubicleRow | null> {
    const [rows] = await this.db.query<TeacherCubicleRow[]>(
      `${TEACHER_CUBICLE_SELECT_BASE} WHERE tc.id = ? AND tc.deleted_at IS NULL LIMIT 1`,
      [id]
    );
    return rows[0] ?? null;
  }

  async findByBuildingAndCode(
    buildingId: string,
    code: string,
    excludeId?: string
  ): Promise<TeacherCubicleRow | null> {
    const params: unknown[] = [buildingId, code];
    let sql = `${TEACHER_CUBICLE_SELECT_BASE}
               WHERE tc.building_id = ? AND tc.code = ? AND tc.deleted_at IS NULL`;
    if (excludeId) {
      sql += " AND tc.id != ?";
      params.push(excludeId);
    }
    sql += " LIMIT 1";
    const [rows] = await this.db.query<TeacherCubicleRow[]>(sql, params);
    return rows[0] ?? null;
  }

  async create(input: {
    building_id: string;
    code: string;
    professor_id: string | null;
    department_id: string | null;
    schedule_text: string | null;
    notes: string | null;
    is_active: boolean;
  }): Promise<string> {
    const id = crypto.randomUUID();
    await this.db.query(
      `INSERT INTO teacher_cubicles
         (id, building_id, code, professor_id, department_id, schedule_text, notes, is_active)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        id,
        input.building_id,
        input.code,
        input.professor_id,
        input.department_id,
        input.schedule_text,
        input.notes,
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
      professor_id: string | null;
      department_id: string | null;
      schedule_text: string | null;
      notes: string | null;
      is_active: boolean;
    }
  ): Promise<void> {
    await this.db.query(
      `UPDATE teacher_cubicles
       SET building_id = ?, code = ?, professor_id = ?, department_id = ?,
           schedule_text = ?, notes = ?, is_active = ?
       WHERE id = ? AND deleted_at IS NULL`,
      [
        input.building_id,
        input.code,
        input.professor_id,
        input.department_id,
        input.schedule_text,
        input.notes,
        input.is_active,
        id,
      ]
    );
  }

  async updateStatus(id: string, isActive: boolean): Promise<void> {
    await this.db.query(
      `UPDATE teacher_cubicles SET is_active = ? WHERE id = ? AND deleted_at IS NULL`,
      [isActive, id]
    );
  }

  async softDelete(id: string): Promise<void> {
    await this.db.query(
      `UPDATE teacher_cubicles SET is_active = FALSE, deleted_at = NOW() WHERE id = ? AND deleted_at IS NULL`,
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

  async professorExists(professorId: string): Promise<boolean> {
    const [rows] = await this.db.query<RowDataPacket[]>(
      `SELECT id FROM professors WHERE id = ? AND deleted_at IS NULL LIMIT 1`,
      [professorId]
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
