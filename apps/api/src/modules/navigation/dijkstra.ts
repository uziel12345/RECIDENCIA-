export type WeightedPathEdge = {
  from: string;
  to: string;
  weight: number;
  bidirectional?: boolean;
};

export type PathResult = {
  nodeIds: string[];
  totalWeight: number;
  found: boolean;
};

type Graph = Map<string, Array<{ to: string; weight: number }>>;

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

export function findShortestPathFromEdges(
  startNodeId: string,
  endNodeId: string,
  edges: WeightedPathEdge[]
): PathResult {
  if (!startNodeId || !endNodeId) {
    return {
      nodeIds: [],
      totalWeight: 0,
      found: false,
    };
  }

  if (startNodeId === endNodeId) {
    return {
      nodeIds: [startNodeId],
      totalWeight: 0,
      found: true,
    };
  }

  const { graph, nodeIds } = buildGraphFromEdges(edges);

  if (!nodeIds.has(startNodeId) || !nodeIds.has(endNodeId)) {
    return {
      nodeIds: [],
      totalWeight: 0,
      found: false,
    };
  }

  const distances = new Map<string, number>();
  const previous = new Map<string, string | null>();
  const unvisited = new Set<string>();

  for (const nodeId of nodeIds) {
    distances.set(nodeId, Infinity);
    previous.set(nodeId, null);
    unvisited.add(nodeId);
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
      return {
        nodeIds: reconstructPath(previous, endNodeId),
        totalWeight: currentMinDistance,
        found: true,
      };
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

  return {
    nodeIds: [],
    totalWeight: 0,
    found: false,
  };
}