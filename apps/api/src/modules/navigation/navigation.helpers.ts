import {
  buildEdgeDistanceMap,
  buildEdgeLookupKey,
  calculateRouteDistance,
  distanceToEstimatedSeconds,
  getNavigationEdgeWeight,
  type NavigationEdgeForRoute,
} from "@ito-map/shared/utils/navigation";

export type { NavigationEdgeForRoute };

export { buildEdgeDistanceMap, buildEdgeLookupKey, calculateRouteDistance };

export function estimateWalkingSeconds(distanceMeters: number): number {
  return distanceToEstimatedSeconds(distanceMeters);
}

export function getEdgeWeight(edge: NavigationEdgeForRoute): number {
  return getNavigationEdgeWeight(edge);
}
