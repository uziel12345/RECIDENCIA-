import type { Pool } from "mysql2/promise";
import { pool } from "../../db/connection.js";
import type { SearchResultRow } from "./search.types.js";

// Búsqueda con LIKE %term% sobre columnas clave.
// Estrategia elegida: LIKE en lugar de FULLTEXT porque el volumen de datos del
// campus es pequeño (<10k filas por tabla) y no requiere cambios de schema.
// El índice de PK cubre los lookups de ID; los LIKE con comodín inicial
// hacen full-scan de tabla, aceptable a esta escala.
const RESULT_LIMIT = 20;

export class SearchRepository {
  constructor(private readonly db: Pool = pool) {}

  async searchBuildings(term: string): Promise<SearchResultRow[]> {
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
         AND (b.name LIKE ? OR b.code LIKE ? OR b.description LIKE ?)
       ORDER BY b.name ASC
       LIMIT ?`,
      [term, term, term, RESULT_LIMIT]
    );
    return rows;
  }

  async searchClassrooms(term: string): Promise<SearchResultRow[]> {
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
         AND (c.name LIKE ? OR c.code LIKE ? OR b.name LIKE ?)
       ORDER BY b.name ASC, c.code ASC
       LIMIT ?`,
      [term, term, term, RESULT_LIMIT]
    );
    return rows;
  }

  // kind = 'tramite' → SearchResultKind 'procedure'
  // kind = 'servicio' → SearchResultKind 'service'
  async searchProcedures(
    term: string,
    procedureKind: "tramite" | "servicio"
  ): Promise<SearchResultRow[]> {
    const resultKind = procedureKind === "tramite" ? "procedure" : "service";
    const kindLabel = procedureKind === "tramite" ? "Trámite" : "Servicio";

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
         AND (p.name LIKE ? OR p.description LIKE ?)
       ORDER BY p.name ASC
       LIMIT ?`,
      [resultKind, kindLabel, procedureKind, term, term, RESULT_LIMIT]
    );
    return rows;
  }
}
