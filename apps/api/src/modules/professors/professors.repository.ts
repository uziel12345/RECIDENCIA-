import crypto from "node:crypto";
import type { Pool, RowDataPacket } from "mysql2/promise";
import { pool } from "../../db/connection.js";
import type { ProfessorRow, ProfessorLocationRow } from "./professors.types.js";

const PROFESSOR_SELECT = `
  SELECT id, employee_number, full_name, email, department, is_active, deleted_at
  FROM professors
`;

export class ProfessorsRepository {
  constructor(private readonly db: Pool = pool) {}

  async findAll(): Promise<ProfessorRow[]> {
    const [rows] = await this.db.query<ProfessorRow[]>(
      `${PROFESSOR_SELECT} WHERE deleted_at IS NULL ORDER BY full_name ASC`
    );
    return rows;
  }

  async findById(id: string): Promise<ProfessorRow | null> {
    const [rows] = await this.db.query<ProfessorRow[]>(
      `${PROFESSOR_SELECT} WHERE id = ? AND deleted_at IS NULL LIMIT 1`,
      [id]
    );
    return rows[0] ?? null;
  }

  async findByEmployeeNumber(employeeNumber: string): Promise<ProfessorRow | null> {
    const [rows] = await this.db.query<ProfessorRow[]>(
      `${PROFESSOR_SELECT} WHERE employee_number = ? AND deleted_at IS NULL LIMIT 1`,
      [employeeNumber]
    );
    return rows[0] ?? null;
  }

  async findByEmployeeNumberExcluding(
    employeeNumber: string,
    excludeId: string
  ): Promise<ProfessorRow | null> {
    const [rows] = await this.db.query<ProfessorRow[]>(
      `${PROFESSOR_SELECT} WHERE employee_number = ? AND id != ? AND deleted_at IS NULL LIMIT 1`,
      [employeeNumber, excludeId]
    );
    return rows[0] ?? null;
  }

  async create(input: {
    employee_number: string;
    full_name: string;
    email: string | null;
    department: string;
    is_active: boolean;
  }): Promise<string> {
    const id = crypto.randomUUID();
    await this.db.query(
      `INSERT INTO professors (id, employee_number, full_name, email, department, is_active)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [id, input.employee_number, input.full_name, input.email, input.department, input.is_active]
    );
    return id;
  }

  async update(
    id: string,
    input: {
      employee_number: string;
      full_name: string;
      email: string | null;
      department: string;
      is_active: boolean;
    }
  ): Promise<void> {
    await this.db.query(
      `UPDATE professors
       SET employee_number = ?, full_name = ?, email = ?, department = ?, is_active = ?
       WHERE id = ? AND deleted_at IS NULL`,
      [input.employee_number, input.full_name, input.email, input.department, input.is_active, id]
    );
  }

  async updateStatus(id: string, isActive: boolean): Promise<void> {
    await this.db.query(
      `UPDATE professors SET is_active = ? WHERE id = ? AND deleted_at IS NULL`,
      [isActive, id]
    );
  }

  async softDelete(id: string): Promise<void> {
    await this.db.query(
      `UPDATE professors SET is_active = FALSE, deleted_at = NOW() WHERE id = ? AND deleted_at IS NULL`,
      [id]
    );
  }

  async findCurrentLocation(
    professorId: string,
    dayOfWeek: number,
    timeHHMMSS: string,
    period?: string
  ): Promise<ProfessorLocationRow | null> {
    const params: unknown[] = [professorId, dayOfWeek, timeHHMMSS, timeHHMMSS];
    let sql = `
      SELECT
        s.id   AS schedule_id,
        s.subject,
        s.day_of_week,
        TIME_FORMAT(s.start_time, '%H:%i') AS start_time,
        TIME_FORMAT(s.end_time,   '%H:%i') AS end_time,
        s.period,
        c.id   AS classroom_id,
        c.code AS classroom_code,
        c.name AS classroom_name,
        c.floor AS classroom_floor,
        b.id   AS building_id,
        b.code AS building_code,
        b.name AS building_name
      FROM schedules s
      JOIN classrooms c ON s.classroom_id = c.id AND c.deleted_at IS NULL
      JOIN buildings  b ON c.building_id  = b.id AND b.deleted_at IS NULL
      WHERE s.professor_id = ?
        AND s.day_of_week  = ?
        AND s.start_time  <= ?
        AND s.end_time     > ?
    `;
    if (period) {
      sql += " AND s.period = ?";
      params.push(period);
    }
    sql += " ORDER BY s.start_time ASC LIMIT 1";
    const [rows] = await this.db.query<ProfessorLocationRow[]>(sql, params);
    return rows[0] ?? null;
  }
}
