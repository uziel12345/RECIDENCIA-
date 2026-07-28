import crypto from "node:crypto";
import type { Pool, RowDataPacket } from "../../db/mysql-compat-types.js";
import { pool } from "../../db/connection.js";
import type { StudentRow, StudentLocationRow, StudentScheduleRow } from "./students.types.js";

const STUDENT_SELECT = `
  SELECT id, control_number, full_name, email, program, semester, is_active, deleted_at
  FROM students
`;

export class StudentsRepository {
  constructor(private readonly db: Pool = pool) {}

  async findAll(): Promise<StudentRow[]> {
    const [rows] = await this.db.query<StudentRow[]>(
      `${STUDENT_SELECT} WHERE deleted_at IS NULL ORDER BY full_name ASC`
    );
    return rows;
  }

  async findById(id: string): Promise<StudentRow | null> {
    const [rows] = await this.db.query<StudentRow[]>(
      `${STUDENT_SELECT} WHERE id = ? AND deleted_at IS NULL LIMIT 1`,
      [id]
    );
    return rows[0] ?? null;
  }

  async findByControlNumber(controlNumber: string): Promise<StudentRow | null> {
    const [rows] = await this.db.query<StudentRow[]>(
      `${STUDENT_SELECT} WHERE control_number = ? AND deleted_at IS NULL LIMIT 1`,
      [controlNumber]
    );
    return rows[0] ?? null;
  }

  async findByControlNumberExcluding(
    controlNumber: string,
    excludeId: string
  ): Promise<StudentRow | null> {
    const [rows] = await this.db.query<StudentRow[]>(
      `${STUDENT_SELECT} WHERE control_number = ? AND id != ? AND deleted_at IS NULL LIMIT 1`,
      [controlNumber, excludeId]
    );
    return rows[0] ?? null;
  }

  async create(input: {
    control_number: string;
    full_name: string;
    email: string | null;
    program: string;
    semester: number;
    is_active: boolean;
  }): Promise<string> {
    const id = crypto.randomUUID();
    await this.db.query(
      `INSERT INTO students (id, control_number, full_name, email, program, semester, is_active)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [id, input.control_number, input.full_name, input.email, input.program, input.semester, input.is_active]
    );
    return id;
  }

  async update(
    id: string,
    input: {
      control_number: string;
      full_name: string;
      email: string | null;
      program: string;
      semester: number;
      is_active: boolean;
    }
  ): Promise<void> {
    await this.db.query(
      `UPDATE students
       SET control_number = ?, full_name = ?, email = ?, program = ?, semester = ?, is_active = ?
       WHERE id = ? AND deleted_at IS NULL`,
      [input.control_number, input.full_name, input.email, input.program, input.semester, input.is_active, id]
    );
  }

  async updateStatus(id: string, isActive: boolean): Promise<void> {
    await this.db.query(
      `UPDATE students SET is_active = ? WHERE id = ? AND deleted_at IS NULL`,
      [isActive, id]
    );
  }

  async softDelete(id: string): Promise<void> {
    await this.db.query(
      `UPDATE students SET is_active = FALSE, deleted_at = NOW() WHERE id = ? AND deleted_at IS NULL`,
      [id]
    );
  }

  async findCurrentLocation(
    studentId: string,
    dayOfWeek: number,
    timeHHMMSS: string,
    period?: string
  ): Promise<StudentLocationRow | null> {
    const params: unknown[] = [studentId, dayOfWeek, timeHHMMSS, timeHHMMSS];
    let sql = `
      SELECT
        s.id   AS schedule_id,
        s.subject,
        s.day_of_week,
        TO_CHAR(s.start_time, 'HH24:MI') AS start_time,
        TO_CHAR(s.end_time, 'HH24:MI') AS end_time,
        s.period,
        c.id   AS classroom_id,
        c.code AS classroom_code,
        c.name AS classroom_name,
        c.floor AS classroom_floor,
        b.id   AS building_id,
        b.code AS building_code,
        b.name AS building_name
      FROM student_schedules ss
      JOIN schedules s ON ss.schedule_id = s.id
      JOIN classrooms c ON s.classroom_id = c.id AND c.deleted_at IS NULL
      JOIN buildings  b ON c.building_id  = b.id AND b.deleted_at IS NULL
      WHERE ss.student_id = ?
        AND s.day_of_week  = ?
        AND s.start_time  <= ?
        AND s.end_time     > ?
    `;
    if (period) {
      sql += " AND s.period = ?";
      params.push(period);
    }
    sql += " ORDER BY s.start_time ASC LIMIT 1";
    const [rows] = await this.db.query<StudentLocationRow[]>(sql, params);
    return rows[0] ?? null;
  }

  async findAllSchedulesByControlNumber(
    controlNumber: string,
    period?: string
  ): Promise<StudentScheduleRow[]> {
    const params: unknown[] = [controlNumber];
    let sql = `
      SELECT
        sc.id,
        sc.subject,
        sc.professor_id,
        p.full_name   AS professor_name,
        c.id          AS classroom_id,
        c.code        AS classroom_code,
        c.name        AS classroom_name,
        b.id          AS building_id,
        b.code        AS building_code,
        b.name        AS building_name,
        sc.day_of_week,
        TO_CHAR(sc.start_time, 'HH24:MI') AS start_time,
        TO_CHAR(sc.end_time, 'HH24:MI') AS end_time,
        sc.period
      FROM students st
      JOIN student_schedules ss ON ss.student_id = st.id
      JOIN schedules sc ON ss.schedule_id = sc.id
      LEFT JOIN professors p ON sc.professor_id = p.id AND p.deleted_at IS NULL
      JOIN classrooms c ON sc.classroom_id = c.id AND c.deleted_at IS NULL
      JOIN buildings  b ON c.building_id   = b.id AND b.deleted_at IS NULL
      WHERE st.control_number = ? AND st.deleted_at IS NULL AND st.is_active = TRUE
    `;
    if (period) {
      sql += " AND sc.period = ?";
      params.push(period);
    }
    sql += " ORDER BY sc.day_of_week ASC, sc.start_time ASC";
    const [rows] = await this.db.query<StudentScheduleRow[]>(sql, params);
    return rows;
  }
}
