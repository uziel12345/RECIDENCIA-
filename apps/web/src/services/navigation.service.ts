import {
  getBuildingEntrancesApi,
  getNavigationEdgesApi,
  getNavigationNodesApi,
  type BuildingEntrance,
  type NavigationEdge,
  type NavigationNode,
} from "@ito-map/shared";

export type {
  BuildingEntrance,
  NavigationEdge,
  NavigationNode,
} from "@ito-map/shared";

export async function getNavigationNodes(): Promise<NavigationNode[]> {
  return getNavigationNodesApi();
}

export async function getNavigationEdges(): Promise<NavigationEdge[]> {
  return getNavigationEdgesApi();
}

export async function getBuildingEntrances(): Promise<BuildingEntrance[]> {
  return getBuildingEntrancesApi();
}