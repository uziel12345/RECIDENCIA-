import {
  createBuildingEntranceApi,
  createNavigationEdgeApi,
  createNavigationNodeApi,
  deleteNavigationEdgeApi,
  deleteNavigationNodeApi,
  getBuildingEntrancesApi,
  getNavigationEdgesApi,
  getNavigationNodesApi,
  resetAllNavigationApi,
  type BuildingEntrance,
  type CreateBuildingEntranceInput,
  type CreateNavigationEdgeInput,
  type CreateNavigationNodeInput,
  type NavigationEdge,
  type NavigationNode,
} from "@ito-map/shared";

export type {
  BuildingEntrance,
  CreateBuildingEntranceInput,
  CreateNavigationEdgeInput,
  CreateNavigationNodeInput,
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

export async function createNavigationNode(
  input: CreateNavigationNodeInput
): Promise<NavigationNode> {
  return createNavigationNodeApi(input);
}

export async function createNavigationEdge(
  input: CreateNavigationEdgeInput
): Promise<NavigationEdge> {
  return createNavigationEdgeApi(input);
}

export async function createBuildingEntrance(
  input: CreateBuildingEntranceInput
): Promise<BuildingEntrance> {
  return createBuildingEntranceApi(input);
}

export async function deleteNavigationNode(id: string): Promise<{ id: string }> {
  return deleteNavigationNodeApi(id);
}

export async function deleteNavigationEdge(id: string): Promise<{ id: string }> {
  return deleteNavigationEdgeApi(id);
}

export async function resetAllNavigation(): Promise<void> {
  await resetAllNavigationApi();
}
