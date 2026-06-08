import crypto from "node:crypto";
import type { Pool, RowDataPacket } from "mysql2/promise";
import { pool } from "../../db/connection.js";
import type { ScheduleRow, ClassroomScheduleRow } from "./schedules.types.js";

const SCHEDULE_SELECT_BASE = `
  SELECT
    s.id,
    s.subject,
    s.professor_id,
    p.full_name AS professor_name,
    s.classroom_id,
    c.code      AS classroom_code,
    c.name      AS classroom_name,
    c.building_id,
    b.name      AS building_name,
    s.day_of_week,
    TIME_FORMAT(s.start_time, '%H:%i') AS start_time,
    TIME_FORMAT(s.end_time,   '%H:%i') AS end_time,
    s.period
  FROM schedules s
  JOIN professors p ON s.professor_id  = p.id
  JOIN classrooms c ON s.classroom_id  = c.id AND c.deleted_at IS NULL
  JOIN buildings  b ON c.building_id   = b.id AND b.deleted_at IS NULL
`;

export class SchedulesRepository {
  constructor(private readonly db: Pool = pool) {}

  async findAll(period?: string): Promise<ScheduleRow[]> {
    const params: unknown[] = [];
    let sql = `${SCHEDULE_SELECT_BASE} WHERE 1=1`;
    if (period) {
      sql += " AND s.period = ?";
      params.push(period);
    }
    sql += " ORDER BY s.period DESC, s.day_of_week ASC, s.start_time ASC";
    const [rows] = await this.db.query<ScheduleRow[]>(sql, params);
    return rows;
  }

  async findById(id: string): Promise<ScheduleRow | null> {
    const [rows] = await this.db.query<ScheduleRow[]>(
      `${SCHEDULE_SELECT_BASE} WHERE s.id = ? LIMIT 1`,
      [id]
    );
    return rows[0] ?? null;
  }

  async findByClassroom(
    classroomId: string,
    period?: string,
    day?: number
  ): Promise<ClassroomScheduleRow[]> {
    const params: unknown[] = [classroomId];
    let sql = `
      SELECT
        id,
        subject,
        day_of_week,
        TIME_FORMAT(start_time, '%H:%i') AS start_time,
        TIME_FORMAT(end_time,   '%H:%i') AS end_time,
        period
      FROM schedules
      WHERE classroom_id = ?
    `;
    if (period) {
      sql += " AND period = ?";
      params.push(period);
    }
    if (day !== undefined) {
      sql += " AND day_of_week = ?";
      params.push(day);
    }
    sql += " ORDER BY day_of_week ASC, start_time ASC";
    const [rows] = await this.db.query<ClassroomScheduleRow[]>(sql, params);
    return rows;
  }

  async create(input: {
    subject: string;
    professor_id: string;
    classroom_id: string;
    day_of_week: number;
    start_time: string;
    end_time: string;
    period: string;
  }): Promise<string> {
    const id = crypto.randomUUID();
    await this.db.query(
      `INSERT INTO schedules
         (id, subject, professor_id, classroom_id, day_of_week, start_time, end_time, period)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        id,
        input.subject,
        input.professor_id,
        input.classroom_id,
        input.day_of_week,
        input.start_time,
        input.end_time,
        input.period,
      ]
    );
    return id;
  }

  async update(
    id: string,
    input: {
      subject: string;
      professor_id: string;
      classroom_id: string;
      day_of_week: number;
      start_time: string;
      end_time: string;
      period: string;
    }
  ): Promise<void> {
    await this.db.query(
      `UPDATE schedules
       SET subject = ?, professor_id = ?, classroom_id = ?,
           day_of_week = ?, start_time = ?, end_time = ?, period = ?
       WHERE id = ?`,
      [
        input.subject,
        input.professor_id,
        input.classroom_id,
        input.day_of_week,
        input.start_time,
        input.end_time,
        input.period,
        id,
      ]
    );
  }

  async remove(id: string): Promise<void> {
    await this.db.query(`DELETE FROM schedules WHERE id = ?`, [id]);
  }

  async linkStudent(scheduleId: string, studentId: string): Promise<void> {
    await this.db.query(
      `INSERT IGNORE INTO student_schedules (student_id, schedule_id) VALUES (?, ?)`,
      [studentId, scheduleId]
    );
  }

  async unlinkStudent(scheduleId: string, studentId: string): Promise<void> {
    await this.db.query(
      `DELETE FROM student_schedules WHERE student_id = ? AND schedule_id = ?`,
      [studentId, scheduleId]
    );
  }

  async professorExists(professorId: string): Promise<boolean> {
    const [rows] = await this.db.query<RowDataPacket[]>(
      `SELECT id FROM professors WHERE id = ? AND deleted_at IS NULL LIMIT 1`,
      [professorId]
    );
    return rows.length > 0;
  }

  async classroomExists(classroomId: string): Promise<boolean> {
    const [rows] = await this.db.query<RowDataPacket[]>(
      `SELECT id FROM classrooms WHERE id = ? AND deleted_at IS NULL LIMIT 1`,
      [classroomId]
    );
    return rows.length > 0;
  }

  async studentExists(studentId: string): Promise<boolean> {
    const [rows] = await this.db.query<RowDataPacket[]>(
      `SELECT id FROM students WHERE id = ? AND deleted_at IS NULL LIMIT 1`,
      [studentId]
    );
    return rows.length > 0;
  }
}
