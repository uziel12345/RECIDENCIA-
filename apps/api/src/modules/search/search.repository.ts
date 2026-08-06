import type { Pool } from "../../db/mysql-compat-types.js";
import { pool } from "../../db/connection.js";
import type { GateSearchResultRow, SearchCandidateRow } from "./search.types.js";

const RESULT_LIMIT = 50;

function normalizedSql(column: string): string {
  return `regexp_replace(translate(lower(COALESCE(${column}, '')), 'áéíóúüñ', 'aeiouun'), '[^a-z0-9]+', '', 'g')`;
}

function aliasAggregate(entityType: string, entityId: string): string {
  return `(SELECT COALESCE(STRING_AGG(sa.alias, '|'), '')
    FROM search_aliases sa
    WHERE sa.entity_type = '${entityType}'
      AND sa.entity_id = ${entityId}
      AND sa.is_active = TRUE)`;
}

// Se recuperan candidatos con cualquier término útil. La relevancia, la
// cobertura de todos los términos y la tolerancia a errores se calculan una
// sola vez en SearchService. Los nombres de columnas son literales internos;
// todos los valores escritos por el usuario siguen viajando parametrizados.
function buildCandidateClause(
  words: string[],
  columns: string[],
  aliasEntity?: { type: string; id: string }
): { clause: string; params: string[] } {
  const checks: string[] = [];
  const params: string[] = [];

  for (const word of words) {
    const compact = word.replace(/[^a-z0-9]/g, "");
    if (!compact) continue;
    const patterns = compact.length >= 5
      ? [`%${compact}%`, `%${compact.slice(0, 3)}%`]
      : [`%${compact}%`];

    for (const pattern of patterns) {
      for (const column of columns) {
        checks.push(`${normalizedSql(column)} LIKE ?`);
        params.push(pattern);
      }
      if (aliasEntity) {
        checks.push(`EXISTS (
          SELECT 1 FROM search_aliases sa_match
          WHERE sa_match.entity_type = '${aliasEntity.type}'
            AND sa_match.entity_id = ${aliasEntity.id}
            AND sa_match.is_active = TRUE
            AND ${normalizedSql("sa_match.alias")} LIKE ?
        )`);
        params.push(pattern);
      }
    }
  }

  return { clause: checks.length ? `(${checks.join(" OR ")})` : "FALSE", params };
}

export class SearchRepository {
  constructor(private readonly db: Pool = pool) {}

  async searchBuildings(words: string[]): Promise<SearchCandidateRow[]> {
    const { clause, params } = buildCandidateClause(
      words,
      ["b.name", "b.code", "b.description", "bc.name"],
      { type: "building", id: "b.id" }
    );
    const [rows] = await this.db.query<SearchCandidateRow[]>(
      `SELECT b.id, 'building' AS kind, b.name AS title,
         CONCAT(b.code, ' · ', bc.name) AS subtitle,
         b.id AS "buildingId", b.name AS "buildingName",
         NULL AS "departmentId", NULL AS "departmentName",
         b.description, ${aliasAggregate("building", "b.id")} AS "aliasText",
         CONCAT_WS('|', b.code, bc.name) AS "keywordText",
         'confirmed' AS "validationStatus"
       FROM buildings b
       INNER JOIN building_categories bc ON b.category_id = bc.id
       WHERE b.deleted_at IS NULL AND b.is_active = TRUE AND ${clause}
       ORDER BY b.is_priority DESC, b.name ASC LIMIT ?`,
      [...params, RESULT_LIMIT]
    );
    return rows;
  }

  async searchClassrooms(words: string[]): Promise<SearchCandidateRow[]> {
    const { clause, params } = buildCandidateClause(
      words,
      ["c.name", "c.code", "c.type", "b.name", "b.code"],
      { type: "classroom", id: "c.id" }
    );
    const [rows] = await this.db.query<SearchCandidateRow[]>(
      `SELECT c.id, CASE WHEN c.type = 'oficina' THEN 'office' ELSE 'classroom' END AS kind, c.name AS title,
         CONCAT(c.code, ' · ', b.name) AS subtitle,
         c.building_id AS "buildingId", b.name AS "buildingName",
         NULL AS "departmentId", NULL AS "departmentName",
         c.description, ${aliasAggregate("classroom", "c.id")} AS "aliasText",
         CONCAT_WS('|', c.code, c.type, b.code) AS "keywordText",
         'confirmed' AS "validationStatus"
       FROM classrooms c
       INNER JOIN buildings b ON c.building_id = b.id
       WHERE c.deleted_at IS NULL AND c.is_active = TRUE
         AND b.deleted_at IS NULL AND b.is_active = TRUE AND ${clause}
       ORDER BY b.name ASC, c.code ASC LIMIT ?`,
      [...params, RESULT_LIMIT]
    );
    return rows;
  }

  async searchProcedures(
    words: string[],
    procedureKind: "tramite" | "servicio"
  ): Promise<SearchCandidateRow[]> {
    const resultKind = procedureKind === "tramite" ? "procedure" : "service";
    const kindLabel = procedureKind === "tramite" ? "Trámite" : "Servicio";
    const { clause, params } = buildCandidateClause(
      words,
      ["p.name", "p.description", "p.internal_location", "d.name"],
      { type: "procedure", id: "p.id" }
    );
    const [rows] = await this.db.query<SearchCandidateRow[]>(
      `SELECT p.id, ? AS kind, p.name AS title, ? AS subtitle,
         (SELECT bp.building_id FROM building_procedures bp
            WHERE bp.procedure_id = p.id ORDER BY bp.created_at ASC LIMIT 1) AS "buildingId",
         (SELECT b2.name FROM building_procedures bp2
            INNER JOIN buildings b2 ON bp2.building_id = b2.id
            WHERE bp2.procedure_id = p.id ORDER BY bp2.created_at ASC LIMIT 1) AS "buildingName",
         p.department_id AS "departmentId", d.name AS "departmentName",
         p.description, ${aliasAggregate("procedure", "p.id")} AS "aliasText",
         CONCAT_WS('|', p.internal_location, p.schedule_text, d.name) AS "keywordText",
         p.validation_status AS "validationStatus"
       FROM procedures p
       LEFT JOIN departments d ON d.id = p.department_id AND d.deleted_at IS NULL
       WHERE p.deleted_at IS NULL AND p.is_active = TRUE AND p.kind = ? AND ${clause}
       ORDER BY p.name ASC LIMIT ?`,
      [resultKind, kindLabel, procedureKind, ...params, RESULT_LIMIT]
    );
    return rows;
  }

  async searchDepartments(words: string[]): Promise<SearchCandidateRow[]> {
    const { clause, params } = buildCandidateClause(
      words,
      ["d.name", "d.description", "b.name", "b.code"],
      { type: "department", id: "d.id" }
    );
    const [rows] = await this.db.query<SearchCandidateRow[]>(
      `SELECT d.id, 'department' AS kind, d.name AS title,
         CONCAT('Departamento · ', b.name) AS subtitle,
         d.building_id AS "buildingId", b.name AS "buildingName",
         d.id AS "departmentId", d.name AS "departmentName", d.description,
         ${aliasAggregate("department", "d.id")} AS "aliasText",
         b.code AS "keywordText", 'confirmed' AS "validationStatus"
       FROM departments d
       INNER JOIN buildings b ON d.building_id = b.id
       WHERE d.deleted_at IS NULL AND d.is_active = TRUE
         AND b.deleted_at IS NULL AND b.is_active = TRUE AND ${clause}
       ORDER BY d.name ASC LIMIT ?`,
      [...params, RESULT_LIMIT]
    );
    return rows;
  }

  async searchCubicles(words: string[]): Promise<SearchCandidateRow[]> {
    const { clause, params } = buildCandidateClause(
      words,
      ["tc.code", "p.full_name", "d.name", "b.name"],
      { type: "cubicle", id: "tc.id" }
    );
    const [rows] = await this.db.query<SearchCandidateRow[]>(
      `SELECT tc.id, CASE WHEN p.id IS NULL THEN 'cubicle' ELSE 'person' END AS kind,
         COALESCE(p.full_name, tc.code) AS title,
         CONCAT(tc.code, ' · ', b.name) AS subtitle,
         tc.building_id AS "buildingId", b.name AS "buildingName",
         tc.department_id AS "departmentId", d.name AS "departmentName",
         NULL AS description, ${aliasAggregate("cubicle", "tc.id")} AS "aliasText",
         CONCAT_WS('|', tc.code, p.full_name, d.name) AS "keywordText",
         'confirmed' AS "validationStatus"
       FROM teacher_cubicles tc
       INNER JOIN buildings b ON tc.building_id = b.id
       LEFT JOIN professors p ON tc.professor_id = p.id AND p.deleted_at IS NULL
       LEFT JOIN departments d ON tc.department_id = d.id AND d.deleted_at IS NULL
       WHERE tc.deleted_at IS NULL AND tc.is_active = TRUE AND ${clause}
       ORDER BY b.name ASC, tc.code ASC LIMIT ?`,
      [...params, RESULT_LIMIT]
    );
    return rows;
  }

  async searchHeadquarters(words: string[]): Promise<SearchCandidateRow[]> {
    const { clause, params } = buildCandidateClause(
      words,
      ["h.name", "d.name", "b.name"],
      { type: "headquarters", id: "h.id" }
    );
    const [rows] = await this.db.query<SearchCandidateRow[]>(
      `SELECT h.id, 'headquarters' AS kind, h.name AS title,
         CONCAT('Jefatura · ', b.name) AS subtitle,
         h.building_id AS "buildingId", b.name AS "buildingName",
         h.department_id AS "departmentId", d.name AS "departmentName",
         NULL AS description, ${aliasAggregate("headquarters", "h.id")} AS "aliasText",
         d.name AS "keywordText", 'confirmed' AS "validationStatus"
       FROM headquarters h
       INNER JOIN buildings b ON h.building_id = b.id
       LEFT JOIN departments d ON h.department_id = d.id AND d.deleted_at IS NULL
       WHERE h.deleted_at IS NULL AND h.is_active = TRUE AND ${clause}
       ORDER BY h.name ASC LIMIT ?`,
      [...params, RESULT_LIMIT]
    );
    return rows;
  }

  async searchGates(words: string[]): Promise<GateSearchResultRow[]> {
    const { clause, params } = buildCandidateClause(
      words,
      ["g.name", "g.description", "g.access_type"],
      { type: "gate", id: "g.id" }
    );
    const [rows] = await this.db.query<GateSearchResultRow[]>(
      `SELECT g.id, 'gate' AS kind, g.name AS title, 'Acceso al campus' AS subtitle,
         NULL AS "buildingId", NULL AS "buildingName", NULL AS "departmentId",
         NULL AS "departmentName", g.description,
         ${aliasAggregate("gate", "g.id")} AS "aliasText",
         g.access_type AS "keywordText", 'confirmed' AS "validationStatus",
         g.x AS x, g.z AS z
       FROM gates g
       WHERE g.deleted_at IS NULL AND g.is_active = TRUE AND ${clause}
       ORDER BY g.name ASC LIMIT ?`,
      [...params, RESULT_LIMIT]
    );
    return rows;
  }

  async searchPositions(words: string[]): Promise<SearchCandidateRow[]> {
    const { clause, params } = buildCandidateClause(
      words,
      ["ip.title", "ip.person_name", "ip.office_name", "d.name", "b.name", "array_to_string(ip.search_keywords, ' ')"],
      { type: "position", id: "ip.id" }
    );
    const [rows] = await this.db.query<SearchCandidateRow[]>(
      `SELECT ip.id, 'position' AS kind, ip.title AS title,
         CASE WHEN b.name IS NULL THEN 'Cargo institucional · Ubicación pendiente de validación'
              ELSE CONCAT('Cargo institucional · ', b.name) END AS subtitle,
         ip.building_id AS "buildingId", b.name AS "buildingName",
         ip.department_id AS "departmentId", d.name AS "departmentName",
         ip.office_name AS description, ${aliasAggregate("position", "ip.id")} AS "aliasText",
         array_to_string(ip.search_keywords, '|') AS "keywordText",
         CASE WHEN ip.building_id IS NULL THEN 'pending_validation' ELSE 'confirmed' END AS "validationStatus"
       FROM institutional_positions ip
       LEFT JOIN buildings b ON ip.building_id = b.id AND b.deleted_at IS NULL
       LEFT JOIN departments d ON ip.department_id = d.id AND d.deleted_at IS NULL
       WHERE ip.is_public = TRUE AND ip.is_active = TRUE AND ip.deleted_at IS NULL AND ${clause}
       ORDER BY ip.title ASC LIMIT ?`,
      [...params, RESULT_LIMIT]
    );
    return rows;
  }

  async searchStreets(words: string[]): Promise<SearchCandidateRow[]> {
    const { clause, params } = buildCandidateClause(
      words,
      ["cs.name", "cs.description"],
      { type: "street", id: "cs.id" }
    );
    const [rows] = await this.db.query<SearchCandidateRow[]>(
      `SELECT cs.id, 'street' AS kind, cs.name AS title, 'Calle cercana al campus' AS subtitle,
         NULL AS "buildingId", NULL AS "buildingName", NULL AS "departmentId",
         NULL AS "departmentName", cs.description,
         ${aliasAggregate("street", "cs.id")} AS "aliasText",
         'calle|avenida|calzada' AS "keywordText", 'confirmed' AS "validationStatus",
         cs.x AS x, cs.z AS z
       FROM campus_streets cs
       WHERE cs.is_active = TRUE AND cs.is_visible = TRUE AND ${clause}
       ORDER BY cs.name ASC LIMIT ?`,
      [...params, RESULT_LIMIT]
    );
    return rows;
  }
}
