import type { NavigationNode } from "../types/navigation.types.js";

export function formatDistance(meters: number): string {
  if (!Number.isFinite(meters)) return "0 m";

  if (meters < 1000) {
    return `${Math.round(meters)} m`;
  }

  return `${(meters / 1000).toFixed(1)} km`;
}

export function formatDuration(seconds: number): string {
  if (!Number.isFinite(seconds)) return "0 min";

  if (seconds < 60) {
    return `${Math.round(seconds)} seg`;
  }

  const minutes = Math.round(seconds / 60);

  if (minutes < 60) {
    return `${minutes} min`;
  }

  const hours = Math.floor(minutes / 60);
  const remainingMinutes = minutes % 60;

  return `${hours} h ${remainingMinutes} min`;
}

export function formatPositiveDistance(meters: number): string {
  if (!Number.isFinite(meters) || meters <= 0) return "";
  return formatDistance(meters);
}

export function formatPositiveDuration(seconds: number): string {
  if (!Number.isFinite(seconds) || seconds <= 0) return "";
  return formatDuration(seconds);
}

export function distanceBetweenNodes(
  a: NavigationNode,
  b: NavigationNode
): number {
  const dx = a.x - b.x;
  const dy = a.y - b.y;
  const dz = a.z - b.z;

  return Math.sqrt(dx * dx + dy * dy + dz * dz);
}

export const WALKING_SPEED_METERS_PER_SECOND = 1.4;

export function distanceToEstimatedSeconds(distanceMeters: number): number {
  return Math.round(distanceMeters / WALKING_SPEED_METERS_PER_SECOND);
}

export type NavigationEdgeForRoute = {
  from_node_id: string;
  to_node_id: string;
  distance: number;
  is_bidirectional: boolean | number;
  path_type: string;
};

export function getNavigationEdgeWeight(edge: NavigationEdgeForRoute): number {
  let weight = Number(edge.distance);

  if (edge.path_type === "stairs") weight *= 3.0;
  if (edge.path_type === "ramp") weight *= 1.4;
  if (edge.path_type === "outdoor") weight *= 1.2;
  if (edge.path_type === "hallway") weight *= 0.85;

  return weight;
}

export function buildEdgeLookupKey(
  fromNodeId: string,
  toNodeId: string
): string {
  return `${fromNodeId}::${toNodeId}`;
}

export function buildEdgeDistanceMap(
  edges: NavigationEdgeForRoute[]
): Map<string, number> {
  const edgeDistanceMap = new Map<string, number>();

  for (const edge of edges) {
    const distance = Number(edge.distance);

    edgeDistanceMap.set(
      buildEdgeLookupKey(edge.from_node_id, edge.to_node_id),
      distance
    );

    if (Boolean(edge.is_bidirectional)) {
      edgeDistanceMap.set(
        buildEdgeLookupKey(edge.to_node_id, edge.from_node_id),
        distance
      );
    }
  }

  return edgeDistanceMap;
}

export function calculateRouteDistance(
  pathNodeIds: string[],
  edges: NavigationEdgeForRoute[]
): number {
  if (pathNodeIds.length < 2) return 0;

  const edgeDistanceMap = buildEdgeDistanceMap(edges);
  let total = 0;

  for (let i = 0; i < pathNodeIds.length - 1; i += 1) {
    const from = pathNodeIds[i];
    const to = pathNodeIds[i + 1];

    total += edgeDistanceMap.get(buildEdgeLookupKey(from, to)) ?? 0;
  }

  return total;
}
