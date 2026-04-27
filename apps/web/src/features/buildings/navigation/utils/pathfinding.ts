import { campusNodes } from "../data/campusNodes";

type NodePosition = {
  x: number;
  y?: number;
  z: number;
};

export type PathNode = {
  id: string;
  x?: number;
  y?: number;
  z?: number;
  position?: NodePosition;
  neighbors?: string[];
};

export type WeightedPathEdge = {
  from: string;
  to: string;
  weight: number;
  bidirectional?: boolean;
};

type Graph = Map<string, Array<{ to: string; weight: number }>>;

function getNodePosition(node: PathNode): NodePosition | null {
  if (typeof node.x === "number" && typeof node.z === "number") {
    return {
      x: node.x,
      y: typeof node.y === "number" ? node.y : 0,
      z: node.z,
    };
  }

  if (
    node.position &&
    typeof node.position.x === "number" &&
    typeof node.position.z === "number"
  ) {
    return {
      x: node.position.x,
      y: typeof node.position.y === "number" ? node.position.y : 0,
      z: node.position.z,
    };
  }

  return null;
}

function distanceBetweenNodes(a: PathNode, b: PathNode): number {
  const posA = getNodePosition(a);
  const posB = getNodePosition(b);

  if (!posA || !posB) {
    return Infinity;
  }

  const dx = posA.x - posB.x;
  const dy = (posA.y ?? 0) - (posB.y ?? 0);
  const dz = posA.z - posB.z;

  return Math.sqrt(dx * dx + dy * dy + dz * dz);
}

function buildNodeMap(nodes: PathNode[]): Map<string, PathNode> {
  const nodeMap = new Map<string, PathNode>();

  for (const node of nodes) {
    if (typeof node.id === "string" && node.id.length > 0) {
      nodeMap.set(node.id, node);
    }
  }

  return nodeMap;
}

function reconstructPath(
  previous: Map<string, string | null>,
  endNodeId: string
): string[] {
  const path: string[] = [];
  let current: string | null = endNodeId;

  while (current !== null) {
    path.unshift(current);
    current = previous.get(current) ?? null;
  }

  return path;
}

function runDijkstra(
  startNodeId: string,
  endNodeId: string,
  graph: Graph,
  nodeIds: Iterable<string>
): string[] {
  if (!startNodeId || !endNodeId) {
    return [];
  }

  if (startNodeId === endNodeId) {
    return [startNodeId];
  }

  const distances = new Map<string, number>();
  const previous = new Map<string, string | null>();
  const unvisited = new Set<string>();

  for (const nodeId of nodeIds) {
    distances.set(nodeId, Infinity);
    previous.set(nodeId, null);
    unvisited.add(nodeId);
  }

  if (!unvisited.has(startNodeId) || !unvisited.has(endNodeId)) {
    console.warn("Nodo inicial o final no existe en el grafo.");
    return [];
  }

  distances.set(startNodeId, 0);

  while (unvisited.size > 0) {
    let currentNodeId: string | null = null;
    let currentMinDistance = Infinity;

    for (const nodeId of unvisited) {
      const distance = distances.get(nodeId) ?? Infinity;

      if (distance < currentMinDistance) {
        currentMinDistance = distance;
        currentNodeId = nodeId;
      }
    }

    if (currentNodeId === null || currentMinDistance === Infinity) {
      break;
    }

    if (currentNodeId === endNodeId) {
      return reconstructPath(previous, endNodeId);
    }

    unvisited.delete(currentNodeId);

    const neighbors = graph.get(currentNodeId) ?? [];

    for (const neighbor of neighbors) {
      if (!unvisited.has(neighbor.to)) {
        continue;
      }

      const tentativeDistance =
        (distances.get(currentNodeId) ?? Infinity) + neighbor.weight;

      if (tentativeDistance < (distances.get(neighbor.to) ?? Infinity)) {
        distances.set(neighbor.to, tentativeDistance);
        previous.set(neighbor.to, currentNodeId);
      }
    }
  }

  console.warn("No se encontró una ruta entre los nodos indicados.");
  return [];
}

function buildGraphFromNodes(nodes: PathNode[]): {
  graph: Graph;
  nodeIds: Set<string>;
} {
  const nodeMap = buildNodeMap(nodes);
  const graph: Graph = new Map();
  const nodeIds = new Set<string>();

  for (const node of nodes) {
    nodeIds.add(node.id);

    if (!Array.isArray(node.neighbors)) {
      continue;
    }

    const adjacencyList = graph.get(node.id) ?? [];

    for (const neighborId of node.neighbors) {
      const neighborNode = nodeMap.get(neighborId);

      if (!neighborNode) {
        continue;
      }

      const weight = distanceBetweenNodes(node, neighborNode);

      if (!Number.isFinite(weight)) {
        continue;
      }

      adjacencyList.push({
        to: neighborId,
        weight,
      });
    }

    graph.set(node.id, adjacencyList);
  }

  return { graph, nodeIds };
}

function buildGraphFromEdges(edges: WeightedPathEdge[]): {
  graph: Graph;
  nodeIds: Set<string>;
} {
  const graph: Graph = new Map();
  const nodeIds = new Set<string>();

  for (const edge of edges) {
    if (
      !edge ||
      typeof edge.from !== "string" ||
      typeof edge.to !== "string" ||
      !Number.isFinite(edge.weight)
    ) {
      continue;
    }

    nodeIds.add(edge.from);
    nodeIds.add(edge.to);

    const fromList = graph.get(edge.from) ?? [];
    fromList.push({
      to: edge.to,
      weight: edge.weight,
    });
    graph.set(edge.from, fromList);

    if (edge.bidirectional) {
      const toList = graph.get(edge.to) ?? [];
      toList.push({
        to: edge.from,
        weight: edge.weight,
      });
      graph.set(edge.to, toList);
    }
  }

  return { graph, nodeIds };
}

export function findPathFromNodes(
  startNodeId: string,
  endNodeId: string,
  nodes: PathNode[]
): string[] {
  const { graph, nodeIds } = buildGraphFromNodes(nodes);
  return runDijkstra(startNodeId, endNodeId, graph, nodeIds);
}

export function findPathFromEdges(
  startNodeId: string,
  endNodeId: string,
  edges: WeightedPathEdge[]
): string[] {
  const { graph, nodeIds } = buildGraphFromEdges(edges);
  return runDijkstra(startNodeId, endNodeId, graph, nodeIds);
}

export default function findPath(
  startNodeId: string,
  endNodeId: string
): string[] {
  return findPathFromNodes(startNodeId, endNodeId, campusNodes as PathNode[]);
}