import { pool } from "../../db/connection.js";
import {
  findShortestPathFromEdges,
  type WeightedPathEdge,
} from "./dijkstra.js";

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

export type NavigationRouteResult = {
  node_ids: string[];
  nodes: NavigationNodeRow[];
  total_distance: number;
  estimated_seconds: number;
};

function getEdgeWeight(edge: NavigationEdgeRow): number {
  let weight = Number(edge.distance);

  if (edge.path_type === "stairs") weight *= 3.0;
  if (edge.path_type === "ramp") weight *= 1.4;
  if (edge.path_type === "outdoor") weight *= 1.2;
  if (edge.path_type === "hallway") weight *= 0.85;

  return weight;
}

function estimateWalkingSeconds(distanceMeters: number): number {
  const walkingSpeedMetersPerSecond = 1.4;
  return Math.round(distanceMeters / walkingSpeedMetersPerSecond);
}

function calculateRouteDistance(
  pathNodeIds: string[],
  edges: NavigationEdgeRow[]
): number {
  if (pathNodeIds.length < 2) return 0;

  let total = 0;

  for (let i = 0; i < pathNodeIds.length - 1; i += 1) {
    const from = pathNodeIds[i];
    const to = pathNodeIds[i + 1];

    const edge = edges.find((candidate) => {
      const direct =
        candidate.from_node_id === from && candidate.to_node_id === to;

      const reverse =
        Boolean(candidate.is_bidirectional) &&
        candidate.from_node_id === to &&
        candidate.to_node_id === from;

      return direct || reverse;
    });

    if (edge) {
      total += Number(edge.distance);
    }
  }

  return total;
}

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

export async function calculateNavigationRoute(
  fromNodeId: string,
  toNodeId: string
): Promise<NavigationRouteResult | null> {
  const nodes = await getActiveNavigationNodes();
  const edges = await getActiveNavigationEdges();

  const graphEdges: WeightedPathEdge[] = edges.map((edge) => ({
    from: edge.from_node_id,
    to: edge.to_node_id,
    weight: getEdgeWeight(edge),
    bidirectional: Boolean(edge.is_bidirectional),
  }));

  const result = findShortestPathFromEdges(fromNodeId, toNodeId, graphEdges);

  if (!result.found || result.nodeIds.length === 0) {
    return null;
  }

  const routeNodes = result.nodeIds
    .map((nodeId) => nodes.find((node) => node.id === nodeId) ?? null)
    .filter((node): node is NavigationNodeRow => node !== null);

  const totalDistance = calculateRouteDistance(result.nodeIds, edges);

  return {
    node_ids: result.nodeIds,
    nodes: routeNodes,
    total_distance: totalDistance,
    estimated_seconds: estimateWalkingSeconds(totalDistance),
  };
}