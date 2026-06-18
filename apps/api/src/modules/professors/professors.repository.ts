import crypto from "node:crypto";
import type { Pool, RowDataPacket } from "mysql2/promise";
import { pool } from "../../db/connection.js";
import type {
  ProfessorRow,
  ProfessorLocationRow,
  ProfessorScheduleSearchRow,
} from "./professors.types.js";

const PROFESSOR_SELECT = `
  SELECT id, employee_number, rfc, full_name, email, department, is_active, deleted_at
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

  async findByRfc(rfc: string): Promise<ProfessorRow | null> {
    const [rows] = await this.db.query<ProfessorRow[]>(
      `${PROFESSOR_SELECT} WHERE rfc = ? AND deleted_at IS NULL LIMIT 1`,
      [rfc]
    );
    return rows[0] ?? null;
  }

  async findByName(query: string): Promise<ProfessorRow[]> {
    const [rows] = await this.db.query<ProfessorRow[]>(
      `${PROFESSOR_SELECT}
       WHERE full_name LIKE ? AND deleted_at IS NULL AND is_active = TRUE
       ORDER BY full_name ASC
       LIMIT 10`,
      [`%${query}%`]
    );
    return rows;
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
    rfc?: string | null;
    full_name: string;
    email: string | null;
    department: string;
    is_active: boolean;
  }): Promise<string> {
    const id = crypto.randomUUID();
    await this.db.query(
      `INSERT INTO professors (id, employee_number, rfc, full_name, email, department, is_active)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [
        id,
        input.employee_number,
        input.rfc ?? null,
        input.full_name,
        input.email,
        input.department,
        input.is_active,
      ]
    );
    return id;
  }

  async update(
    id: string,
    input: {
      employee_number: string;
      rfc?: string | null;
      full_name: string;
      email: string | null;
      department: string;
      is_active: boolean;
    }
  ): Promise<void> {
    await this.db.query(
      `UPDATE professors
       SET employee_number = ?, rfc = ?, full_name = ?, email = ?, department = ?, is_active = ?
       WHERE id = ? AND deleted_at IS NULL`,
      [
        input.employee_number,
        input.rfc ?? null,
        input.full_name,
        input.email,
        input.department,
        input.is_active,
        id,
      ]
    );
  }

  async upsertImportedProfessor(input: {
    rfc: string;
    full_name: string;
    department: string;
  }): Promise<ProfessorRow> {
    const existing = await this.findByRfc(input.rfc);
    if (existing) {
      await this.db.query(
        `UPDATE professors
         SET full_name = ?, department = ?, is_active = TRUE
         WHERE id = ? AND deleted_at IS NULL`,
        [input.full_name, input.department, existing.id]
      );
      return {
        ...existing,
        rfc: input.rfc,
        full_name: input.full_name,
        department: input.department,
        is_active: true,
      };
    }

    const id = crypto.randomUUID();
    await this.db.query(
      `INSERT INTO professors (id, employee_number, rfc, full_name, email, department, is_active)
       VALUES (?, ?, ?, ?, NULL, ?, TRUE)`,
      [id, input.rfc, input.rfc, input.full_name, input.department]
    );
    return {
      id,
      employee_number: input.rfc,
      rfc: input.rfc,
      full_name: input.full_name,
      email: null,
      department: input.department,
      is_active: true,
      deleted_at: null,
    } as ProfessorRow;
  }

  async findClassroomByCode(code: string): Promise<{ id: string } | null> {
    const [rows] = await this.db.query<RowDataPacket[]>(
      `SELECT id FROM classrooms WHERE code = ? AND deleted_at IS NULL LIMIT 1`,
      [code]
    );
    const row = rows[0];
    return row ? { id: String(row.id) } : null;
  }

  async createImportedSchedule(input: {
    professor_id: string;
    classroom_id: string;
    subject: string;
    subject_code: string | null;
    subject_name: string | null;
    group_code: string | null;
    career_code: string | null;
    career_name: string | null;
    day_of_week: number;
    start_time: string;
    end_time: string;
    period: string;
  }): Promise<string> {
    const id = crypto.randomUUID();
    await this.db.query(
      `INSERT INTO schedules
         (id, subject, professor_id, classroom_id, day_of_week, start_time, end_time, period,
          subject_code, subject_name, group_code, career_code, career_name)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        id,
        input.subject,
        input.professor_id,
        input.classroom_id,
        input.day_of_week,
        input.start_time,
        input.end_time,
        input.period,
        input.subject_code,
        input.subject_name,
        input.group_code,
        input.career_code,
        input.career_name,
      ]
    );
    return id;
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
        s.subject_code,
        s.subject_name,
        s.group_code,
        s.career_code,
        s.career_name,
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

  async findSchedulesForProfessor(
    professorId: string,
    opts: { period?: string; at?: string }
  ): Promise<ProfessorScheduleSearchRow[]> {
    const params: unknown[] = [professorId];
    let sql = `
      SELECT
        s.id AS schedule_id,
        s.subject,
        s.subject_code,
        s.subject_name,
        s.group_code,
        s.career_code,
        s.career_name,
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
    `;
    if (opts.period) {
      sql += " AND s.period = ?";
      params.push(opts.period);
    }
    if (opts.at) {
      sql += " AND s.start_time <= ? AND s.end_time > ?";
      params.push(opts.at, opts.at);
    }
    sql += " ORDER BY s.period DESC, s.day_of_week ASC, s.start_time ASC";
    const [rows] = await this.db.query<ProfessorScheduleSearchRow[]>(sql, params);
    return rows;
  }
}
