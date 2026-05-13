export type NavigationEdgeForRoute = {
  from_node_id: string;
  to_node_id: string;
  distance: number;
  is_bidirectional: boolean | number;
  path_type: string;
};

export function getEdgeWeight(edge: NavigationEdgeForRoute): number {
  let weight = Number(edge.distance);

  if (edge.path_type === "stairs") weight *= 3.0;
  if (edge.path_type === "ramp") weight *= 1.4;
  if (edge.path_type === "outdoor") weight *= 1.2;
  if (edge.path_type === "hallway") weight *= 0.85;

  return weight;
}

export function estimateWalkingSeconds(distanceMeters: number): number {
  const walkingSpeedMetersPerSecond = 1.4;
  return Math.round(distanceMeters / walkingSpeedMetersPerSecond);
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