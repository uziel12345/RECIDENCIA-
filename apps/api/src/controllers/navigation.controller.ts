import type { Request, Response } from "express";
import { pool } from "../db/connection.js";
import { ApiError } from "../shared/errors/api-error.js";
import {
  calculateNavigationRoute,
  invalidateNavigationCache,
} from "../modules/navigation/navigation.service.js";

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

  res.setHeader("Cache-Control", "public, max-age=3600");

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

  res.setHeader("Cache-Control", "public, max-age=3600");

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
      n.name AS node_name
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
