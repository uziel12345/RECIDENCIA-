import type { Pool } from "mysql2/promise";
import { pool } from "../../db/connection.js";
import type { GateSearchResultRow, SearchResultRow } from "./search.types.js";

// Búsqueda con LIKE %word% sobre columnas clave.
// Estrategia elegida: LIKE en lugar de FULLTEXT porque el volumen de datos del
// campus es pequeño (<10k filas por tabla) y no requiere cambios de schema.
// El índice de PK cubre los lookups de ID; los LIKE con comodín inicial
// hacen full-scan de tabla, aceptable a esta escala.
const RESULT_LIMIT = 20;

// Cada palabra debe aparecer en AL MENOS una de las columnas (OR), y TODAS
// las palabras deben cumplirse (AND) — así "control escolar" encuentra
// "Servicios Escolares y Control" sin importar el orden de las palabras.
// Los nombres de columna son literales fijos definidos en este archivo (no
// vienen del usuario), así que interpolarlos en el SQL es seguro; los valores
// de búsqueda siempre viajan parametrizados vía `?`.
function buildWordsClause(
  words: string[],
  columns: string[]
): { clause: string; params: string[] } {
  const params: string[] = [];
  const groups = words.map((word) => {
    const like = `%${word}%`;
    const columnChecks = columns.map((col) => {
      params.push(like);
      return `${col} LIKE ?`;
    });
    return `(${columnChecks.join(" OR ")})`;
  });
  return { clause: groups.join(" AND "), params };
}

export class SearchRepository {
  constructor(private readonly db: Pool = pool) {}

  async searchBuildings(words: string[]): Promise<SearchResultRow[]> {
    const { clause, params } = buildWordsClause(words, [
      "b.name",
      "b.code",
      "b.description",
    ]);
    const [rows] = await this.db.query<SearchResultRow[]>(
      `SELECT
         b.id,
         'building'                         AS kind,
         b.name                             AS title,
         CONCAT(b.code, ' · ', bc.name)    AS subtitle,
         b.id                               AS buildingId,
         b.name                             AS buildingName
       FROM buildings b
       INNER JOIN building_categories bc ON b.category_id = bc.id
       WHERE b.deleted_at IS NULL
         AND b.is_active = TRUE
         AND ${clause}
       ORDER BY b.name ASC
       LIMIT ?`,
      [...params, RESULT_LIMIT]
    );
    return rows;
  }

  async searchClassrooms(words: string[]): Promise<SearchResultRow[]> {
    // c.type se incluye para que palabras genéricas como "aula" o
    // "laboratorio" (que no aparecen en el código/nombre del espacio, solo
    // clasifican su tipo) sigan encontrando resultados cuando se combinan
    // con otra palabra específica, ej. "aula C1".
    const { clause, params } = buildWordsClause(words, [
      "c.name",
      "c.code",
      "c.type",
      "b.name",
    ]);
    const [rows] = await this.db.query<SearchResultRow[]>(
      `SELECT
         c.id,
         'classroom'                            AS kind,
         c.name                                 AS title,
         CONCAT(c.code, ' · ', b.name)         AS subtitle,
         c.building_id                          AS buildingId,
         b.name                                 AS buildingName
       FROM classrooms c
       INNER JOIN buildings b ON c.building_id = b.id
       WHERE c.deleted_at IS NULL
         AND c.is_active = TRUE
         AND ${clause}
       ORDER BY b.name ASC, c.code ASC
       LIMIT ?`,
      [...params, RESULT_LIMIT]
    );
    return rows;
  }

  // kind = 'tramite' → SearchResultKind 'procedure'
  // kind = 'servicio' → SearchResultKind 'service'
  async searchProcedures(
    words: string[],
    procedureKind: "tramite" | "servicio"
  ): Promise<SearchResultRow[]> {
    const resultKind = procedureKind === "tramite" ? "procedure" : "service";
    const kindLabel = procedureKind === "tramite" ? "Trámite" : "Servicio";
    const { clause, params } = buildWordsClause(words, [
      "p.name",
      "p.description",
    ]);

    const [rows] = await this.db.query<SearchResultRow[]>(
      `SELECT
         p.id,
         ?                                                                  AS kind,
         p.name                                                             AS title,
         ?                                                                  AS subtitle,
         (SELECT bp.building_id FROM building_procedures bp
            WHERE bp.procedure_id = p.id
            ORDER BY bp.created_at ASC LIMIT 1)                            AS buildingId,
         (SELECT b2.name FROM building_procedures bp2
            INNER JOIN buildings b2 ON bp2.building_id = b2.id
            WHERE bp2.procedure_id = p.id
            ORDER BY bp2.created_at ASC LIMIT 1)                           AS buildingName
       FROM procedures p
       WHERE p.deleted_at IS NULL
         AND p.is_active = TRUE
         AND p.kind = ?
         AND ${clause}
       ORDER BY p.name ASC
       LIMIT ?`,
      [resultKind, kindLabel, procedureKind, ...params, RESULT_LIMIT]
    );
    return rows;
  }

  async searchDepartments(words: string[]): Promise<SearchResultRow[]> {
    const { clause, params } = buildWordsClause(words, [
      "d.name",
      "d.description",
    ]);
    const [rows] = await this.db.query<SearchResultRow[]>(
      `SELECT
         d.id,
         'department'                        AS kind,
         d.name                              AS title,
         CONCAT('Departamento · ', b.name) AS subtitle,
         d.building_id                       AS buildingId,
         b.name                              AS buildingName
       FROM departments d
       INNER JOIN buildings b ON d.building_id = b.id
       WHERE d.deleted_at IS NULL
         AND d.is_active = TRUE
         AND ${clause}
       ORDER BY d.name ASC
       LIMIT ?`,
      [...params, RESULT_LIMIT]
    );
    return rows;
  }

  // teacher_cubicles no tiene columna "name" (solo `code`) — se empareja por
  // código de cubículo y por el nombre del profesor asignado (si existe).
  async searchCubicles(words: string[]): Promise<SearchResultRow[]> {
    const { clause, params } = buildWordsClause(words, [
      "tc.code",
      "p.full_name",
    ]);
    const [rows] = await this.db.query<SearchResultRow[]>(
      `SELECT
         tc.id,
         'cubicle'                                    AS kind,
         tc.code                                       AS title,
         CONCAT(COALESCE(p.full_name, 'Cubículo'), ' · ', b.name) AS subtitle,
         tc.building_id                                AS buildingId,
         b.name                                        AS buildingName
       FROM teacher_cubicles tc
       INNER JOIN buildings b ON tc.building_id = b.id
       LEFT JOIN professors p ON tc.professor_id = p.id AND p.deleted_at IS NULL
       WHERE tc.deleted_at IS NULL
         AND tc.is_active = TRUE
         AND ${clause}
       ORDER BY b.name ASC, tc.code ASC
       LIMIT ?`,
      [...params, RESULT_LIMIT]
    );
    return rows;
  }

  async searchHeadquarters(words: string[]): Promise<SearchResultRow[]> {
    const { clause, params } = buildWordsClause(words, ["h.name"]);
    const [rows] = await this.db.query<SearchResultRow[]>(
      `SELECT
         h.id,
         'headquarters'                    AS kind,
         h.name                            AS title,
         CONCAT('Jefatura · ', b.name)    AS subtitle,
         h.building_id                     AS buildingId,
         b.name                            AS buildingName
       FROM headquarters h
       INNER JOIN buildings b ON h.building_id = b.id
       WHERE h.deleted_at IS NULL
         AND h.is_active = TRUE
         AND ${clause}
       ORDER BY h.name ASC
       LIMIT ?`,
      [...params, RESULT_LIMIT]
    );
    return rows;
  }

  async searchGates(words: string[]): Promise<GateSearchResultRow[]> {
    const { clause, params } = buildWordsClause(words, [
      "g.name",
      "g.description",
    ]);
    const [rows] = await this.db.query<GateSearchResultRow[]>(
      `SELECT
         g.id,
         'gate'      AS kind,
         g.name      AS title,
         'Acceso al campus' AS subtitle,
         NULL        AS buildingId,
         NULL        AS buildingName,
         g.x         AS x,
         g.z         AS z
       FROM gates g
       WHERE g.deleted_at IS NULL
         AND g.is_active = TRUE
         AND ${clause}
       ORDER BY g.name ASC
       LIMIT ?`,
      [...params, RESULT_LIMIT]
    );
    return rows;
  }
}
