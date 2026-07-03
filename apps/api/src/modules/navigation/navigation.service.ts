import { pool } from "../../db/connection.js";

export type NavigationNodeRow = {
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
};

export type NavigationEdgeRow = {
  id: string;
  from_node_id: string;
  to_node_id: string;
  distance: number;
  is_bidirectional: boolean | number;
  is_accessible: boolean | number;
  path_type: string;
  is_active: boolean | number;
  metadata: Record<string, unknown> | null;
};

type NavigationGraphCache = {
  nodes: NavigationNodeRow[];
  edges: NavigationEdgeRow[];
  expiresAt: number;
};

const NAVIGATION_CACHE_TTL_MS = 5 * 60 * 1000;

let navigationGraphCache: NavigationGraphCache | null = null;

async function getActiveNavigationNodes(): Promise<NavigationNodeRow[]> {
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
    WHERE is_active = TRUE AND is_walkable = TRUE
    ORDER BY code ASC
  `);

  return rows as NavigationNodeRow[];
}

async function getActiveNavigationEdges(): Promise<NavigationEdgeRow[]> {
  const [rows] = await pool.query(`
    SELECT
      id,
      from_node_id,
      to_node_id,
      distance,
      is_bidirectional,
      is_accessible,
      path_type,
      is_active,
      metadata
    FROM navigation_edges
    WHERE is_active = TRUE AND is_accessible = TRUE
    ORDER BY created_at ASC
  `);

  return rows as NavigationEdgeRow[];
}

async function getNavigationGraph(): Promise<{
  nodes: NavigationNodeRow[];
  edges: NavigationEdgeRow[];
}> {
  const now = Date.now();

  if (navigationGraphCache && navigationGraphCache.expiresAt > now) {
    return {
      nodes: navigationGraphCache.nodes,
      edges: navigationGraphCache.edges,
    };
  }

  const [nodes, edges] = await Promise.all([
    getActiveNavigationNodes(),
    getActiveNavigationEdges(),
  ]);

  navigationGraphCache = {
    nodes,
    edges,
    expiresAt: now + NAVIGATION_CACHE_TTL_MS,
  };

  return {
    nodes,
    edges,
  };
}

export function invalidateNavigationCache(): void {
  navigationGraphCache = null;
}
