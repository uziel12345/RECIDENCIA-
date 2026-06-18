import {
  createBuildingEntranceApi,
  createNavigationEdgeApi,
  createNavigationNodeApi,
  deleteNavigationEdgeApi,
  deleteNavigationNodeApi,
  deleteOrphanAccessNodesApi,
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

export const NAVIGATION_DATA_CHANGED_EVENT = "ito:navigation-data-changed";

function notifyNavigationDataChanged() {
  window.dispatchEvent(new CustomEvent(NAVIGATION_DATA_CHANGED_EVENT));
}

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
  const node = await createNavigationNodeApi(input);
  notifyNavigationDataChanged();
  return node;
}

export async function createNavigationEdge(
  input: CreateNavigationEdgeInput
): Promise<NavigationEdge> {
  const edge = await createNavigationEdgeApi(input);
  notifyNavigationDataChanged();
  return edge;
}

export async function createBuildingEntrance(
  input: CreateBuildingEntranceInput
): Promise<BuildingEntrance> {
  const entrance = await createBuildingEntranceApi(input);
  notifyNavigationDataChanged();
  return entrance;
}

export async function deleteNavigationNode(id: string): Promise<{ id: string }> {
  const result = await deleteNavigationNodeApi(id);
  notifyNavigationDataChanged();
  return result;
}

export async function deleteNavigationEdge(id: string): Promise<{ id: string }> {
  const result = await deleteNavigationEdgeApi(id);
  notifyNavigationDataChanged();
  return result;
}

export async function deleteOrphanAccessNodes(): Promise<{ count: number }> {
  const result = await deleteOrphanAccessNodesApi();
  notifyNavigationDataChanged();
  return result;
}

export async function resetAllNavigation(): Promise<void> {
  await resetAllNavigationApi();
  notifyNavigationDataChanged();
}
