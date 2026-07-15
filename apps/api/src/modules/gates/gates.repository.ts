import crypto from "node:crypto";
import type { Pool } from "mysql2/promise";
import { pool } from "../../db/connection.js";
import type { GateAccessType, GateRow, GateStatus } from "./gates.types.js";

const GATE_SELECT_BASE = `
  SELECT id, name, description, access_type, status, x, y, z, is_active, deleted_at
  FROM gates
`;

export class GatesRepository {
  constructor(private readonly db: Pool = pool) {}

  async findAllActive(): Promise<GateRow[]> {
    const [rows] = await this.db.query<GateRow[]>(
      `${GATE_SELECT_BASE}
       WHERE deleted_at IS NULL AND is_active = TRUE
       ORDER BY name ASC`
    );
    return rows;
  }

  async findAllForAdmin(): Promise<GateRow[]> {
    const [rows] = await this.db.query<GateRow[]>(
      `${GATE_SELECT_BASE}
       WHERE deleted_at IS NULL
       ORDER BY is_active DESC, name ASC`
    );
    return rows;
  }

  async findById(id: string): Promise<GateRow | null> {
    const [rows] = await this.db.query<GateRow[]>(
      `${GATE_SELECT_BASE} WHERE id = ? AND deleted_at IS NULL LIMIT 1`,
      [id]
    );
    return rows[0] ?? null;
  }

  async create(input: {
    name: string;
    description: string | null;
    access_type: GateAccessType;
    status: GateStatus;
    x: number;
    y: number;
    z: number;
    is_active: boolean;
  }): Promise<string> {
    const id = crypto.randomUUID();
    await this.db.query(
      `INSERT INTO gates
         (id, name, description, access_type, status, x, y, z, is_active)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        id,
        input.name,
        input.description,
        input.access_type,
        input.status,
        input.x,
        input.y,
        input.z,
        input.is_active,
      ]
    );
    return id;
  }

  async update(
    id: string,
    input: {
      name: string;
      description: string | null;
      access_type: GateAccessType;
      status: GateStatus;
      x: number;
      y: number;
      z: number;
      is_active: boolean;
    }
  ): Promise<void> {
    await this.db.query(
      `UPDATE gates
       SET name = ?, description = ?, access_type = ?, status = ?,
           x = ?, y = ?, z = ?, is_active = ?
       WHERE id = ? AND deleted_at IS NULL`,
      [
        input.name,
        input.description,
        input.access_type,
        input.status,
        input.x,
        input.y,
        input.z,
        input.is_active,
        id,
      ]
    );
  }

  async updateStatus(id: string, isActive: boolean): Promise<void> {
    await this.db.query(
      `UPDATE gates SET is_active = ? WHERE id = ? AND deleted_at IS NULL`,
      [isActive, id]
    );
  }

  async softDelete(id: string): Promise<void> {
    await this.db.query(
      `UPDATE gates SET is_active = FALSE, deleted_at = NOW() WHERE id = ? AND deleted_at IS NULL`,
      [id]
    );
  }
}
