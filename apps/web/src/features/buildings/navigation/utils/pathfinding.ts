import { campusNodes } from "../data/campusNodes";
import { getDistanceBetweenNodes } from "./distance";
import type { CampusNode } from "../types/campus-node";

function getNodeById(nodeId: string): CampusNode | undefined {
  return campusNodes.find((node) => node.id === nodeId);
}

export function findShortestPath(
  startNodeId: string,
  endNodeId: string
): CampusNode[] {
  const distances = new Map<string, number>();
  const previous = new Map<string, string | null>();
  const unvisited = new Set<string>();

  for (const node of campusNodes) {
    distances.set(node.id, Infinity);
    previous.set(node.id, null);
    unvisited.add(node.id);
  }

  distances.set(startNodeId, 0);

  while (unvisited.size > 0) {
    let currentNodeId: string | null = null;
    let shortestDistance = Infinity;

    for (const nodeId of unvisited) {
      const distance = distances.get(nodeId) ?? Infinity;

      if (distance < shortestDistance) {
        shortestDistance = distance;
        currentNodeId = nodeId;
      }
    }

    if (!currentNodeId) {
      break;
    }

    if (currentNodeId === endNodeId) {
      break;
    }

    unvisited.delete(currentNodeId);

    const currentNode = getNodeById(currentNodeId);

    if (!currentNode) {
      continue;
    }

    for (const neighborId of currentNode.neighbors) {
      if (!unvisited.has(neighborId)) {
        continue;
      }

      const neighborNode = getNodeById(neighborId);

      if (!neighborNode) {
        continue;
      }

      const currentDistance = distances.get(currentNodeId) ?? Infinity;
      const edgeDistance = getDistanceBetweenNodes(currentNode, neighborNode);
      const totalDistance = currentDistance + edgeDistance;

      if (totalDistance < (distances.get(neighborId) ?? Infinity)) {
        distances.set(neighborId, totalDistance);
        previous.set(neighborId, currentNodeId);
      }
    }
  }

  const path: CampusNode[] = [];
  let currentStep: string | null = endNodeId;

  while (currentStep) {
    const node = getNodeById(currentStep);

    if (node) {
      path.unshift(node);
    }

    currentStep = previous.get(currentStep) ?? null;
  }

  if (path.length === 0 || path[0]?.id !== startNodeId) {
    return [];
  }

  return path;
}