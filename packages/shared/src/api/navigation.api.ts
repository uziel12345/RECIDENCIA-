import { apiGet } from "./client.js";
import { apiDelete, apiPost } from "./client.js";
import type {
  BuildingEntrance,
  CreateBuildingEntranceInput,
  CreateNavigationEdgeInput,
  CreateNavigationNodeInput,
  NavigationEdge,
  NavigationNode,
  RouteResult,
} from "../types/navigation.types.js";

export function getNavigationNodesApi(): Promise<NavigationNode[]> {
  return apiGet<NavigationNode[]>(withNoCache("/navigation/nodes"));
}

export function getNavigationEdgesApi(): Promise<NavigationEdge[]> {
  return apiGet<NavigationEdge[]>(withNoCache("/navigation/edges"));
}

export function getBuildingEntrancesApi(): Promise<BuildingEntrance[]> {
  return apiGet<BuildingEntrance[]>(
    withNoCache("/navigation/building-entrances")
  );
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

export function createNavigationNodeApi(
  input: CreateNavigationNodeInput
): Promise<NavigationNode> {
  return apiPost<NavigationNode, CreateNavigationNodeInput>(
    "/navigation/nodes",
    input
  );
}

export function createNavigationEdgeApi(
  input: CreateNavigationEdgeInput
): Promise<NavigationEdge> {
  return apiPost<NavigationEdge, CreateNavigationEdgeInput>(
    "/navigation/edges",
    input
  );
}

export function createBuildingEntranceApi(
  input: CreateBuildingEntranceInput
): Promise<BuildingEntrance> {
  return apiPost<BuildingEntrance, CreateBuildingEntranceInput>(
    "/navigation/building-entrances",
    input
  );
}

export function deleteNavigationNodeApi(id: string): Promise<{ id: string }> {
  return apiDelete<{ id: string }>(`/navigation/nodes/${encodeURIComponent(id)}`);
}

export function deleteNavigationEdgeApi(id: string): Promise<{ id: string }> {
  return apiDelete<{ id: string }>(`/navigation/edges/${encodeURIComponent(id)}`);
}

export function resetAllNavigationApi(): Promise<void> {
  return apiDelete<void>("/navigation/all");
}

function withNoCache(endpoint: string): string {
  const separator = endpoint.includes("?") ? "&" : "?";
  return `${endpoint}${separator}_=${Date.now()}`;
}
