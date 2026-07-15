import crypto from "node:crypto";
import type { Pool, RowDataPacket } from "mysql2/promise";
import { pool } from "../../db/connection.js";
import type {
  BuildingForProcedureRow,
  ProcedureForAdminRow,
  ProcedureForBuildingRow,
  ProcedureRequirementRow,
  ProcedureRow,
} from "./procedures.types.js";

export class ProceduresRepository {
  constructor(private readonly db: Pool = pool) {}

  async findAllActive(filters: {
    kind?: string;
    buildingId?: string;
  }): Promise<ProcedureRow[]> {
    const params: unknown[] = [];
    let sql: string;

    const PROCEDURE_COLUMNS_NO_DEPT_JOIN = `
      p.id, p.name, p.slug, p.description, p.resource_url, p.kind,
      p.department_id, NULL AS department_name, p.internal_location, p.schedule_text,
      p.is_active, p.deleted_at
    `;

    if (filters.buildingId) {
      sql = `
        SELECT ${PROCEDURE_COLUMNS_NO_DEPT_JOIN}
        FROM procedures p
        INNER JOIN building_procedures bp ON bp.procedure_id = p.id
        WHERE p.deleted_at IS NULL AND p.is_active = TRUE AND bp.building_id = ?
      `;
      params.push(filters.buildingId);
    } else {
      sql = `
        SELECT ${PROCEDURE_COLUMNS_NO_DEPT_JOIN}
        FROM procedures p
        WHERE p.deleted_at IS NULL AND p.is_active = TRUE
      `;
    }

    if (filters.kind) {
      sql += " AND p.kind = ?";
      params.push(filters.kind);
    }

    sql += " ORDER BY p.kind ASC, p.name ASC";

    const [rows] = await this.db.query<ProcedureRow[]>(sql, params);
    return rows;
  }

  async findAllForAdmin(filters: { kind?: string }): Promise<ProcedureForAdminRow[]> {
    const params: unknown[] = [];
    let sql = `
      SELECT p.id, p.name, p.slug, p.description, p.resource_url, p.kind,
        p.department_id, NULL AS department_name, p.internal_location, p.schedule_text,
        p.is_active, p.deleted_at,
        (SELECT COUNT(*) FROM building_procedures bp WHERE bp.procedure_id = p.id) AS building_count
      FROM procedures p
      WHERE p.deleted_at IS NULL
    `;

    if (filters.kind) {
      sql += " AND p.kind = ?";
      params.push(filters.kind);
    }

    sql += " ORDER BY p.is_active DESC, p.kind ASC, p.name ASC";

    const [rows] = await this.db.query<ProcedureForAdminRow[]>(sql, params);
    return rows;
  }

  async findById(id: string): Promise<ProcedureRow | null> {
    const [rows] = await this.db.query<ProcedureRow[]>(
      `SELECT p.id, p.name, p.slug, p.description, p.resource_url, p.kind,
              p.department_id, dep.name AS department_name, p.internal_location, p.schedule_text,
              p.is_active, p.deleted_at
       FROM procedures p
       LEFT JOIN departments dep ON dep.id = p.department_id AND dep.deleted_at IS NULL
       WHERE p.id = ? AND p.deleted_at IS NULL LIMIT 1`,
      [id]
    );
    return rows[0] ?? null;
  }

  async findBySlug(slug: string, excludeId?: string): Promise<ProcedureRow | null> {
    let sql = `SELECT id, name, slug, description, resource_url, kind,
                      department_id, NULL AS department_name, internal_location, schedule_text,
                      is_active, deleted_at
               FROM procedures WHERE slug = ? AND deleted_at IS NULL`;
    const params: unknown[] = [slug];
    if (excludeId) {
      sql += " AND id != ?";
      params.push(excludeId);
    }
    sql += " LIMIT 1";
    const [rows] = await this.db.query<ProcedureRow[]>(sql, params);
    return rows[0] ?? null;
  }

  async findRequirementsByProcedure(
    procedureId: string
  ): Promise<ProcedureRequirementRow[]> {
    const [rows] = await this.db.query<ProcedureRequirementRow[]>(
      `SELECT id, procedure_id, description, type, is_mandatory, display_order
       FROM procedure_requirements
       WHERE procedure_id = ?
       ORDER BY display_order ASC, id ASC`,
      [procedureId]
    );
    return rows;
  }

  async findRequirementsByProcedureIds(
    ids: string[]
  ): Promise<ProcedureRequirementRow[]> {
    if (ids.length === 0) return [];
    const [rows] = await this.db.query<ProcedureRequirementRow[]>(
      `SELECT id, procedure_id, description, type, is_mandatory, display_order
       FROM procedure_requirements
       WHERE procedure_id IN (?)
       ORDER BY procedure_id, display_order ASC, id ASC`,
      [ids]
    );
    return rows;
  }

  async findBuildingsByProcedure(
    procedureId: string
  ): Promise<BuildingForProcedureRow[]> {
    const [rows] = await this.db.query<BuildingForProcedureRow[]>(
      `SELECT b.id, b.code, b.name, bp.notes
       FROM building_procedures bp
       INNER JOIN buildings b ON bp.building_id = b.id
       WHERE bp.procedure_id = ? AND b.deleted_at IS NULL
       ORDER BY b.name ASC`,
      [procedureId]
    );
    return rows;
  }

  async findByBuilding(buildingId: string): Promise<ProcedureForBuildingRow[]> {
    const [rows] = await this.db.query<ProcedureForBuildingRow[]>(
      `SELECT p.id, p.name, p.slug, p.description, p.resource_url, p.kind,
              p.department_id, dep.name AS department_name, p.internal_location, p.schedule_text,
              p.is_active, bp.notes
       FROM building_procedures bp
       INNER JOIN procedures p ON bp.procedure_id = p.id
       LEFT JOIN departments dep ON dep.id = p.department_id AND dep.deleted_at IS NULL
       WHERE bp.building_id = ? AND p.deleted_at IS NULL AND p.is_active = TRUE
       ORDER BY p.kind ASC, p.name ASC`,
      [buildingId]
    );
    return rows;
  }

  async create(input: {
    name: string;
    slug: string;
    description: string | null;
    resource_url: string | null;
    kind: string;
    department_id: string | null;
    internal_location: string | null;
    schedule_text: string | null;
    is_active: boolean;
  }): Promise<string> {
    const id = crypto.randomUUID();
    await this.db.query(
      `INSERT INTO procedures
         (id, name, slug, description, resource_url, kind, department_id, internal_location, schedule_text, is_active)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        id,
        input.name,
        input.slug,
        input.description,
        input.resource_url,
        input.kind,
        input.department_id,
        input.internal_location,
        input.schedule_text,
        input.is_active,
      ]
    );
    return id;
  }

  async createRequirements(
    procedureId: string,
    reqs: Array<{
      description: string;
      type?: string;
      is_mandatory?: boolean;
      display_order?: number;
    }>
  ): Promise<void> {
    if (reqs.length === 0) return;
    const values = reqs.map((r) => [
      crypto.randomUUID(),
      procedureId,
      r.description,
      r.type ?? "requisito",
      r.is_mandatory ?? true,
      r.display_order ?? 0,
    ]);
    await this.db.query(
      `INSERT INTO procedure_requirements (id, procedure_id, description, type, is_mandatory, display_order)
       VALUES ?`,
      [values]
    );
  }

  async update(
    id: string,
    input: {
      name: string;
      slug: string;
      description: string | null;
      resource_url: string | null;
      kind: string;
      department_id: string | null;
      internal_location: string | null;
      schedule_text: string | null;
      is_active: boolean;
    }
  ): Promise<void> {
    await this.db.query(
      `UPDATE procedures
       SET name = ?, slug = ?, description = ?, resource_url = ?, kind = ?,
           department_id = ?, internal_location = ?, schedule_text = ?, is_active = ?
       WHERE id = ? AND deleted_at IS NULL`,
      [
        input.name,
        input.slug,
        input.description,
        input.resource_url,
        input.kind,
        input.department_id,
        input.internal_location,
        input.schedule_text,
        input.is_active,
        id,
      ]
    );
  }

  async replaceRequirements(
    procedureId: string,
    reqs: Array<{
      description: string;
      type?: string;
      is_mandatory?: boolean;
      display_order?: number;
    }>
  ): Promise<void> {
    await this.db.query(
      `DELETE FROM procedure_requirements WHERE procedure_id = ?`,
      [procedureId]
    );
    await this.createRequirements(procedureId, reqs);
  }

  async updateStatus(id: string, isActive: boolean): Promise<void> {
    await this.db.query(
      `UPDATE procedures SET is_active = ? WHERE id = ? AND deleted_at IS NULL`,
      [isActive, id]
    );
  }

  async softDelete(id: string): Promise<void> {
    await this.db.query(
      `UPDATE procedures SET is_active = FALSE, deleted_at = NOW()
       WHERE id = ? AND deleted_at IS NULL`,
      [id]
    );
  }

  async findRequirementById(id: string): Promise<ProcedureRequirementRow | null> {
    const [rows] = await this.db.query<ProcedureRequirementRow[]>(
      `SELECT id, procedure_id, description, type, is_mandatory, display_order
       FROM procedure_requirements WHERE id = ? LIMIT 1`,
      [id]
    );
    return rows[0] ?? null;
  }

  async addRequirement(
    procedureId: string,
    input: {
      description: string;
      type?: string;
      is_mandatory?: boolean;
      display_order?: number;
    }
  ): Promise<string> {
    const id = crypto.randomUUID();
    await this.db.query(
      `INSERT INTO procedure_requirements (id, procedure_id, description, type, is_mandatory, display_order)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [
        id,
        procedureId,
        input.description,
        input.type ?? "requisito",
        input.is_mandatory ?? true,
        input.display_order ?? 0,
      ]
    );
    return id;
  }

  async updateRequirement(
    id: string,
    input: {
      description?: string;
      type?: string;
      is_mandatory?: boolean;
      display_order?: number;
    }
  ): Promise<void> {
    const fields: string[] = [];
    const params: unknown[] = [];
    if (input.description !== undefined) {
      fields.push("description = ?");
      params.push(input.description);
    }
    if (input.type !== undefined) {
      fields.push("type = ?");
      params.push(input.type);
    }
    if (input.is_mandatory !== undefined) {
      fields.push("is_mandatory = ?");
      params.push(input.is_mandatory);
    }
    if (input.display_order !== undefined) {
      fields.push("display_order = ?");
      params.push(input.display_order);
    }
    if (fields.length === 0) return;
    params.push(id);
    await this.db.query(
      `UPDATE procedure_requirements SET ${fields.join(", ")} WHERE id = ?`,
      params
    );
  }

  async deleteRequirement(id: string): Promise<void> {
    await this.db.query(
      `DELETE FROM procedure_requirements WHERE id = ?`,
      [id]
    );
  }

  async linkBuilding(
    buildingId: string,
    procedureId: string,
    notes: string | null
  ): Promise<void> {
    await this.db.query(
      `INSERT INTO building_procedures (building_id, procedure_id, notes) VALUES (?, ?, ?)`,
      [buildingId, procedureId, notes]
    );
  }

  async unlinkBuilding(buildingId: string, procedureId: string): Promise<void> {
    await this.db.query(
      `DELETE FROM building_procedures WHERE building_id = ? AND procedure_id = ?`,
      [buildingId, procedureId]
    );
  }

  async findBuildingProcedure(
    buildingId: string,
    procedureId: string
  ): Promise<{ building_id: string; procedure_id: string } | null> {
    const [rows] = await this.db.query<RowDataPacket[]>(
      `SELECT building_id, procedure_id FROM building_procedures
       WHERE building_id = ? AND procedure_id = ? LIMIT 1`,
      [buildingId, procedureId]
    );
    return rows[0] ? { building_id: rows[0].building_id as string, procedure_id: rows[0].procedure_id as string } : null;
  }

  async buildingExists(id: string): Promise<boolean> {
    const [rows] = await this.db.query<RowDataPacket[]>(
      `SELECT id FROM buildings WHERE id = ? AND deleted_at IS NULL LIMIT 1`,
      [id]
    );
    return rows.length > 0;
  }

  async departmentExists(id: string): Promise<boolean> {
    const [rows] = await this.db.query<RowDataPacket[]>(
      `SELECT id FROM departments WHERE id = ? AND deleted_at IS NULL LIMIT 1`,
      [id]
    );
    return rows.length > 0;
  }
}
