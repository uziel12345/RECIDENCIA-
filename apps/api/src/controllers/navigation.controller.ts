import type { Request, Response } from "express";
import { randomUUID } from "node:crypto";
import { pool } from "../db/connection.js";
import { ApiError } from "../shared/errors/api-error.js";
import { sendSuccess } from "../shared/http/response.js";
import {
  calculateNavigationRoute,
  invalidateNavigationCache,
} from "../modules/navigation/navigation.service.js";

function getParam(req: Request, key: string): string {
  const value = req.params[key];
  return Array.isArray(value) ? value[0] ?? "" : value ?? "";
}

async function getNodeById(id: string) {
  const [rows] = await pool.query(
    `
    SELECT
      id, code, name, node_type, x, y, z, latitude, longitude, floor_level,
      is_walkable, is_active, metadata
    FROM navigation_nodes
    WHERE id = ?
    LIMIT 1
  `,
    [id]
  );

  return (rows as any[])[0] ?? null;
}

async function getEdgeById(id: string) {
  const [rows] = await pool.query(
    `
    SELECT
      e.id,
      e.from_node_id,
      e.to_node_id,
      e.distance,
      e.is_bidirectional,
      e.is_accessible,
      e.path_type,
      e.is_active,
      e.metadata,
      n1.x AS from_x,
      n1.z AS from_z,
      n2.x AS to_x,
      n2.z AS to_z
    FROM navigation_edges e
    INNER JOIN navigation_nodes n1 ON e.from_node_id = n1.id
    INNER JOIN navigation_nodes n2 ON e.to_node_id = n2.id
    WHERE e.id = ?
    LIMIT 1
  `,
    [id]
  );

  const edge = (rows as any[])[0];
  if (!edge) return null;

  return {
    id: edge.id,
    from_node_id: edge.from_node_id,
    to_node_id: edge.to_node_id,
    distance: Number(edge.distance),
    is_bidirectional: Boolean(edge.is_bidirectional),
    is_accessible: Boolean(edge.is_accessible),
    path_type: edge.path_type,
    is_active: Boolean(edge.is_active),
    metadata: edge.metadata,
    dx: Math.abs(Number(edge.from_x) - Number(edge.to_x)),
    dz: Math.abs(Number(edge.from_z) - Number(edge.to_z)),
  };
}

export async function getNavigationNodes(_req: Request, res: Response) {
  const [rows] = await pool.query(`
    SELECT
      id,
      code,
      name,
      node_type,
      x,
      y,
      z,
      latitude,
      longitude,
      floor_level,
      is_walkable,
      is_active,
      metadata
    FROM navigation_nodes
    WHERE is_active = TRUE
    ORDER BY code ASC
  `);

  res.setHeader("Cache-Control", "no-store");

  return res.status(200).json({
    success: true,
    data: rows,
  });
}

export async function getNavigationEdges(_req: Request, res: Response) {
  const [rows] = await pool.query(`
    SELECT
      e.id,
      e.from_node_id,
      e.to_node_id,
      e.distance,
      e.is_bidirectional,
      e.is_accessible,
      e.path_type,
      e.is_active,
      e.metadata,
      n1.x AS from_x,
      n1.y AS from_y,
      n1.z AS from_z,
      n2.x AS to_x,
      n2.y AS to_y,
      n2.z AS to_z
    FROM navigation_edges e
    INNER JOIN navigation_nodes n1 ON e.from_node_id = n1.id
    INNER JOIN navigation_nodes n2 ON e.to_node_id = n2.id
    WHERE e.is_active = TRUE
    ORDER BY e.created_at ASC
  `);

  const data = (rows as any[]).map((edge) => {
    const dx = Math.abs(Number(edge.from_x) - Number(edge.to_x));
    const dz = Math.abs(Number(edge.from_z) - Number(edge.to_z));

    return {
      id: edge.id,
      from_node_id: edge.from_node_id,
      to_node_id: edge.to_node_id,
      distance: Number(edge.distance),
      is_bidirectional: Boolean(edge.is_bidirectional),
      is_accessible: Boolean(edge.is_accessible),
      path_type: edge.path_type,
      is_active: Boolean(edge.is_active),
      metadata: edge.metadata,
      dx,
      dz,
    };
  });

  res.setHeader("Cache-Control", "no-store");

  return res.status(200).json({
    success: true,
    data,
  });
}

export async function getBuildingEntrances(_req: Request, res: Response) {
  const [rows] = await pool.query(`
    SELECT
      be.id,
      be.building_id,
      be.node_id,
      be.entrance_name,
      be.entrance_type,
      be.is_primary,
      be.is_accessible,
      b.code AS building_code,
      b.name AS building_name,
      n.code AS node_code,
      n.name AS node_name,
      n.x AS node_x,
      n.y AS node_y,
      n.z AS node_z
    FROM building_entrances be
    INNER JOIN buildings b ON be.building_id = b.id
    INNER JOIN navigation_nodes n ON be.node_id = n.id
    ORDER BY b.name ASC
  `);

  return res.status(200).json({
    success: true,
    data: rows,
  });
}

export async function createNavigationNode(req: Request, res: Response) {
  const input = req.body;
  const code = input.code || `nav-${randomUUID().slice(0, 8)}`;
  const metadata = input.metadata
    ? JSON.stringify(input.metadata)
    : JSON.stringify({ source: "admin-editor" });

  const [result] = await pool.query(
    `
    INSERT INTO navigation_nodes
      (id, code, name, node_type, x, y, z, floor_level, is_walkable, is_active, metadata)
    VALUES
      (UUID(), ?, ?, ?, ?, ?, ?, ?, ?, 1, ?)
  `,
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

  const insertId = (result as any).insertId;
  const [rows] = await pool.query(
    "SELECT id FROM navigation_nodes WHERE code = ? ORDER BY created_at DESC LIMIT 1",
    [code]
  );
  const id = (rows as any[])[0]?.id;

  if (!id && !insertId) {
    throw new ApiError(500, "No se pudo crear el nodo de navegacion");
  }

  invalidateNavigationCache();
  return sendSuccess(res, await getNodeById(id), 201, "Nodo creado correctamente");
}

export async function createNavigationEdge(req: Request, res: Response) {
  const input = req.body;
  const [nodeRows] = await pool.query(
    "SELECT id, x, z FROM navigation_nodes WHERE id IN (?, ?) AND is_active = TRUE",
    [input.from_node_id, input.to_node_id]
  );
  const nodes = nodeRows as any[];

  if (nodes.length !== 2) {
    throw new ApiError(400, "Los nodos origen y destino deben existir");
  }

  const from = nodes.find((node) => node.id === input.from_node_id);
  const to = nodes.find((node) => node.id === input.to_node_id);
  const distance =
    input.distance ??
    Math.hypot(Number(from.x) - Number(to.x), Number(from.z) - Number(to.z));
  const metadata = input.metadata
    ? JSON.stringify(input.metadata)
    : JSON.stringify({ source: "admin-editor" });

  await pool.query(
    `
    INSERT INTO navigation_edges
      (id, from_node_id, to_node_id, distance, path_type, is_bidirectional, is_accessible, is_active, metadata)
    VALUES
      (UUID(), ?, ?, ?, ?, ?, ?, 1, ?)
  `,
    [
      input.from_node_id,
      input.to_node_id,
      Number(distance.toFixed(2)),
      input.path_type ?? "walkway",
      input.is_bidirectional ?? true,
      input.is_accessible ?? true,
      metadata,
    ]
  );

  const [rows] = await pool.query(
    `
    SELECT id
    FROM navigation_edges
    WHERE from_node_id = ? AND to_node_id = ?
    ORDER BY created_at DESC
    LIMIT 1
  `,
    [input.from_node_id, input.to_node_id]
  );
  const id = (rows as any[])[0]?.id;

  invalidateNavigationCache();
  return sendSuccess(res, await getEdgeById(id), 201, "Arista creada correctamente");
}

export async function createBuildingEntrance(req: Request, res: Response) {
  const input = req.body;

  await pool.query(
    `
    INSERT INTO building_entrances
      (id, building_id, node_id, entrance_name, entrance_type, is_primary, is_accessible)
    VALUES
      (UUID(), ?, ?, ?, ?, ?, ?)
  `,
    [
      input.building_id,
      input.node_id,
      input.entrance_name ?? null,
      input.entrance_type ?? "main",
      input.is_primary ?? false,
      input.is_accessible ?? true,
    ]
  );

  const [rows] = await pool.query(
    `
    SELECT
      be.id,
      be.building_id,
      be.node_id,
      be.entrance_name,
      be.entrance_type,
      be.is_primary,
      be.is_accessible,
      b.code AS building_code,
      b.name AS building_name,
      n.code AS node_code,
      n.name AS node_name,
      n.x AS node_x,
      n.y AS node_y,
      n.z AS node_z
    FROM building_entrances be
    INNER JOIN buildings b ON be.building_id = b.id
    INNER JOIN navigation_nodes n ON be.node_id = n.id
    WHERE be.building_id = ? AND be.node_id = ?
    ORDER BY be.id DESC
    LIMIT 1
  `,
    [input.building_id, input.node_id]
  );

  invalidateNavigationCache();
  return sendSuccess(res, (rows as any[])[0], 201, "Entrada creada correctamente");
}

export async function deleteNavigationNode(req: Request, res: Response) {
  const id = getParam(req, "id");

  await pool.query(
    `
    UPDATE navigation_edges
    SET is_active = FALSE, updated_at = CURRENT_TIMESTAMP
    WHERE from_node_id = ? OR to_node_id = ?
  `,
    [id, id]
  );
  await pool.query(
    "UPDATE building_entrances SET is_accessible = FALSE WHERE node_id = ?",
    [id]
  );
  await pool.query(
    "UPDATE navigation_nodes SET is_active = FALSE, updated_at = CURRENT_TIMESTAMP WHERE id = ?",
    [id]
  );

  invalidateNavigationCache();
  return sendSuccess(res, { id }, 200, "Nodo desactivado correctamente");
}

export async function deleteNavigationEdge(req: Request, res: Response) {
  const id = getParam(req, "id");

  await pool.query(
    "UPDATE navigation_edges SET is_active = FALSE, updated_at = CURRENT_TIMESTAMP WHERE id = ?",
    [id]
  );

  invalidateNavigationCache();
  return sendSuccess(res, { id }, 200, "Arista desactivada correctamente");
}

export async function getNavigationRoute(req: Request, res: Response) {
  const fromNodeId = String(req.query.fromNodeId ?? "").trim();
  const toNodeId = String(req.query.toNodeId ?? "").trim();

  if (!fromNodeId || !toNodeId) {
    throw new ApiError(400, "Los parámetros fromNodeId y toNodeId son obligatorios");
  }

  const route = await calculateNavigationRoute(fromNodeId, toNodeId);

  if (!route) {
    throw new ApiError(404, "No se encontró una ruta entre los nodos indicados");
  }

  return res.status(200).json({
    success: true,
    data: route,
  });
}

export async function invalidateNavigationCacheController(
  _req: Request,
  res: Response
) {
  invalidateNavigationCache();

  return res.status(200).json({
    success: true,
    message: "Cache de navegación invalidado correctamente",
  });
}
