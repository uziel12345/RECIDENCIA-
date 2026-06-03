import { randomUUID } from "node:crypto";
import type { Pool, RowDataPacket } from "mysql2/promise";
import { pool as defaultPool } from "../../db/connection.js";

// ── Row types ─────────────────────────────────────────────────────────────────

export interface NodeRow extends RowDataPacket {
  id: string;
  code: string;
  name: string | null;
  node_type: string;
  x: number;
  y: number;
  z: number;
  latitude: number | null;
  longitude: number | null;
  floor_level: number;
  is_walkable: boolean | number;
  is_active: boolean | number;
  metadata: Record<string, unknown> | null;
}

export interface EdgeRow extends RowDataPacket {
  id: string;
  from_node_id: string;
  to_node_id: string;
  distance: number;
  is_bidirectional: boolean | number;
  is_accessible: boolean | number;
  path_type: string;
  is_active: boolean | number;
  metadata: Record<string, unknown> | null;
  from_x?: number;
  from_y?: number;
  from_z?: number;
  to_x?: number;
  to_y?: number;
  to_z?: number;
}

export interface EntranceRow extends RowDataPacket {
  id: string;
  building_id: string;
  node_id: string;
  entrance_name: string | null;
  entrance_type: string;
  is_primary: boolean | number;
  is_accessible: boolean | number;
  building_code: string;
  building_name: string;
  node_code: string;
  node_name: string | null;
  node_x: number;
  node_y: number;
  node_z: number;
}

interface IdRow extends RowDataPacket {
  id: string;
}

// ── Input types ───────────────────────────────────────────────────────────────

export type CreateNodeInput = {
  code?: string;
  name?: string | null;
  node_type: string;
  x: number;
  y?: number;
  z: number;
  floor_level?: number;
  is_walkable?: boolean;
  metadata?: Record<string, unknown> | null;
};

export type CreateEdgeInput = {
  from_node_id: string;
  to_node_id: string;
  distance?: number;
  path_type?: string;
  is_bidirectional?: boolean;
  is_accessible?: boolean;
  metadata?: Record<string, unknown> | null;
};

export type CreateEntranceInput = {
  building_id: string;
  node_id: string;
  entrance_name?: string | null;
  entrance_type?: string;
  is_primary?: boolean;
  is_accessible?: boolean;
};

// ── SQL fragments ─────────────────────────────────────────────────────────────

const ENTRANCE_SELECT = `
  SELECT
    be.id,
    be.building_id,
    be.node_id,
    be.entrance_name,
    be.entrance_type,
    be.is_primary,
    be.is_accessible,
    b.code  AS building_code,
    b.name  AS building_name,
    n.code  AS node_code,
    n.name  AS node_name,
    n.x     AS node_x,
    n.y     AS node_y,
    n.z     AS node_z
  FROM building_entrances be
  INNER JOIN buildings b         ON be.building_id = b.id
  INNER JOIN navigation_nodes n  ON be.node_id     = n.id
`;

// ── Repository ────────────────────────────────────────────────────────────────

export class NavigationRepository {
  constructor(private readonly db: Pool = defaultPool) {}

  // ── Nodes ──────────────────────────────────────────────────────────────────

  async findNodeById(id: string): Promise<NodeRow | null> {
    const [rows] = await this.db.query<NodeRow[]>(
      `SELECT id, code, name, node_type, x, y, z, latitude, longitude,
              floor_level, is_walkable, is_active, metadata
       FROM navigation_nodes WHERE id = ? LIMIT 1`,
      [id]
    );
    return rows[0] ?? null;
  }

  async findAllActiveNodes(): Promise<NodeRow[]> {
    const [rows] = await this.db.query<NodeRow[]>(`
      SELECT id, code, name, node_type, x, y, z, latitude, longitude,
             floor_level, is_walkable, is_active, metadata
      FROM navigation_nodes
      WHERE is_active = TRUE
      ORDER BY code ASC
    `);
    return rows;
  }

  async insertNode(input: CreateNodeInput): Promise<string> {
    const code = input.code ?? `nav-${randomUUID().slice(0, 8)}`;
    const metadata = input.metadata
      ? JSON.stringify(input.metadata)
      : JSON.stringify({ source: "admin-editor" });

    await this.db.query(
      `INSERT INTO navigation_nodes
         (id, code, name, node_type, x, y, z, floor_level, is_walkable, is_active, metadata)
       VALUES (UUID(), ?, ?, ?, ?, ?, ?, ?, ?, 1, ?)`,
      [
        code,
        input.name ?? null,
        input.node_type,
        input.x,
        input.y ?? 0,
        input.z,
        input.floor_level ?? 0,
        input.is_walkable ?? true,
        metadata,
      ]
    );

    const [rows] = await this.db.query<IdRow[]>(
      "SELECT id FROM navigation_nodes WHERE code = ? ORDER BY created_at DESC LIMIT 1",
      [code]
    );
    const id = rows[0]?.id;
    if (!id) throw new Error("No se pudo recuperar el id del nodo creado");
    return id;
  }

  async deactivateNode(id: string): Promise<void> {
    await this.db.query(
      "UPDATE navigation_nodes SET is_active = FALSE, updated_at = CURRENT_TIMESTAMP WHERE id = ?",
      [id]
    );
  }

  async deactivateEdgesForNode(nodeId: string): Promise<void> {
    await this.db.query(
      `UPDATE navigation_edges
       SET is_active = FALSE, updated_at = CURRENT_TIMESTAMP
       WHERE from_node_id = ? OR to_node_id = ?`,
      [nodeId, nodeId]
    );
  }

  async deactivateEntrancesForNode(nodeId: string): Promise<void> {
    await this.db.query(
      "UPDATE building_entrances SET is_accessible = FALSE WHERE node_id = ?",
      [nodeId]
    );
  }

  // ── Edges ──────────────────────────────────────────────────────────────────

  async findEdgeById(id: string): Promise<EdgeRow | null> {
    const [rows] = await this.db.query<EdgeRow[]>(
      `SELECT e.id, e.from_node_id, e.to_node_id, e.distance,
              e.is_bidirectional, e.is_accessible, e.path_type, e.is_active, e.metadata,
              n1.x AS from_x, n1.z AS from_z,
              n2.x AS to_x,   n2.z AS to_z
       FROM navigation_edges e
       INNER JOIN navigation_nodes n1 ON e.from_node_id = n1.id
       INNER JOIN navigation_nodes n2 ON e.to_node_id   = n2.id
       WHERE e.id = ? LIMIT 1`,
      [id]
    );
    return rows[0] ?? null;
  }

  async findAllActiveEdges(): Promise<EdgeRow[]> {
    const [rows] = await this.db.query<EdgeRow[]>(`
      SELECT e.id, e.from_node_id, e.to_node_id, e.distance,
             e.is_bidirectional, e.is_accessible, e.path_type, e.is_active, e.metadata,
             n1.x AS from_x, n1.y AS from_y, n1.z AS from_z,
             n2.x AS to_x,   n2.y AS to_y,   n2.z AS to_z
      FROM navigation_edges e
      INNER JOIN navigation_nodes n1 ON e.from_node_id = n1.id
      INNER JOIN navigation_nodes n2 ON e.to_node_id   = n2.id
      WHERE e.is_active = TRUE
      ORDER BY e.created_at ASC
    `);
    return rows;
  }

  async findNodesByIds(ids: [string, string]): Promise<NodeRow[]> {
    const [rows] = await this.db.query<NodeRow[]>(
      "SELECT id, x, z FROM navigation_nodes WHERE id IN (?, ?) AND is_active = TRUE",
      ids
    );
    return rows;
  }

  async upsertEdge(input: CreateEdgeInput & { distance: number }): Promise<void> {
    const metadata = input.metadata
      ? JSON.stringify(input.metadata)
      : JSON.stringify({ source: "admin-editor" });

    await this.db.query(
      `INSERT INTO navigation_edges
         (id, from_node_id, to_node_id, distance, path_type,
          is_bidirectional, is_accessible, is_active, metadata)
       VALUES (UUID(), ?, ?, ?, ?, ?, ?, 1, ?)
       ON DUPLICATE KEY UPDATE
         distance         = VALUES(distance),
         path_type        = VALUES(path_type),
         is_bidirectional = VALUES(is_bidirectional),
         is_active        = 1,
         updated_at       = CURRENT_TIMESTAMP`,
      [
        input.from_node_id,
        input.to_node_id,
        Number(input.distance.toFixed(2)),
        input.path_type ?? "walkway",
        input.is_bidirectional ?? true,
        input.is_accessible ?? true,
        metadata,
      ]
    );
  }

  async findEdgeByFromTo(fromId: string, toId: string): Promise<string | null> {
    const [rows] = await this.db.query<IdRow[]>(
      `SELECT id FROM navigation_edges
       WHERE from_node_id = ? AND to_node_id = ?
       ORDER BY created_at DESC LIMIT 1`,
      [fromId, toId]
    );
    return rows[0]?.id ?? null;
  }

  async deactivateEdge(id: string): Promise<void> {
    await this.db.query(
      "UPDATE navigation_edges SET is_active = FALSE, updated_at = CURRENT_TIMESTAMP WHERE id = ?",
      [id]
    );
  }

  // ── Entrances ──────────────────────────────────────────────────────────────

  async findAllEntrances(): Promise<EntranceRow[]> {
    const [rows] = await this.db.query<EntranceRow[]>(
      `${ENTRANCE_SELECT} ORDER BY b.name ASC`
    );
    return rows;
  }

  async insertEntrance(input: CreateEntranceInput): Promise<void> {
    await this.db.query(
      `INSERT INTO building_entrances
         (id, building_id, node_id, entrance_name, entrance_type, is_primary, is_accessible)
       VALUES (UUID(), ?, ?, ?, ?, ?, ?)`,
      [
        input.building_id,
        input.node_id,
        input.entrance_name ?? null,
        input.entrance_type ?? "main",
        input.is_primary ?? false,
        input.is_accessible ?? true,
      ]
    );
  }

  async findEntranceByBuildingAndNode(
    buildingId: string,
    nodeId: string
  ): Promise<EntranceRow | null> {
    const [rows] = await this.db.query<EntranceRow[]>(
      `${ENTRANCE_SELECT}
       WHERE be.building_id = ? AND be.node_id = ?
       ORDER BY be.id DESC LIMIT 1`,
      [buildingId, nodeId]
    );
    return rows[0] ?? null;
  }

  // ── Reset ──────────────────────────────────────────────────────────────────

  async deleteAllData(): Promise<void> {
    await this.db.query("DELETE FROM building_entrances");
    await this.db.query("DELETE FROM navigation_edges");
    await this.db.query("DELETE FROM navigation_nodes");
  }
}
