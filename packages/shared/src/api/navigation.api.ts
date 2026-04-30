import { apiGet } from "./client.ts";
import type {
  BuildingEntrance,
  NavigationEdge,
  NavigationNode,
  RouteResult,
} from "../types/navigation.types.ts";

export function getNavigationNodesApi(): Promise<NavigationNode[]> {
  return apiGet<NavigationNode[]>("/navigation/nodes");
}

export function getNavigationEdgesApi(): Promise<NavigationEdge[]> {
  return apiGet<NavigationEdge[]>("/navigation/edges");
}

export function getBuildingEntrancesApi(): Promise<BuildingEntrance[]> {
  return apiGet<BuildingEntrance[]>("/navigation/building-entrances");
}

export function getNavigationRouteApi(
  fromNodeId: string,
  toNodeId: string
): Promise<RouteResult> {
  const params = new URLSearchParams({
    fromNodeId,
    toNodeId,
  });

  return apiGet<RouteResult>(`/navigation/route?${params.toString()}`);
}