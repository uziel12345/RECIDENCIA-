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

// Binary min-heap keyed by distance — O(log V) push/pop vs O(V) linear scan
class MinHeap {
  private heap: Array<{ nodeId: string; dist: number }> = [];

  get size(): number {
    return this.heap.length;
  }

  push(nodeId: string, dist: number): void {
    this.heap.push({ nodeId, dist });
    this.bubbleUp(this.heap.length - 1);
  }

  pop(): { nodeId: string; dist: number } | null {
    if (this.heap.length === 0) return null;
    const top = this.heap[0]!;
    const last = this.heap.pop()!;
    if (this.heap.length > 0) {
      this.heap[0] = last;
      this.sinkDown(0);
    }
    return top;
  }

  private bubbleUp(i: number): void {
    while (i > 0) {
      const parent = (i - 1) >> 1;
      if (this.heap[parent]!.dist <= this.heap[i]!.dist) break;
      [this.heap[parent], this.heap[i]] = [this.heap[i]!, this.heap[parent]!];
      i = parent;
    }
  }

  private sinkDown(i: number): void {
    const n = this.heap.length;
    for (;;) {
      let smallest = i;
      const left = 2 * i + 1;
      const right = 2 * i + 2;
      if (left < n && this.heap[left]!.dist < this.heap[smallest]!.dist) smallest = left;
      if (right < n && this.heap[right]!.dist < this.heap[smallest]!.dist) smallest = right;
      if (smallest === i) break;
      [this.heap[smallest], this.heap[i]] = [this.heap[i]!, this.heap[smallest]!];
      i = smallest;
    }
  }
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
    fromList.push({ to: edge.to, weight: edge.weight });
    graph.set(edge.from, fromList);

    if (edge.bidirectional) {
      const toList = graph.get(edge.to) ?? [];
      toList.push({ to: edge.from, weight: edge.weight });
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
    return { nodeIds: [], totalWeight: 0, found: false };
  }

  if (startNodeId === endNodeId) {
    return { nodeIds: [startNodeId], totalWeight: 0, found: true };
  }

  const { graph, nodeIds } = buildGraphFromEdges(edges);

  if (!nodeIds.has(startNodeId) || !nodeIds.has(endNodeId)) {
    return { nodeIds: [], totalWeight: 0, found: false };
  }

  const distances = new Map<string, number>();
  const previous = new Map<string, string | null>();

  for (const nodeId of nodeIds) {
    distances.set(nodeId, Infinity);
    previous.set(nodeId, null);
  }
  distances.set(startNodeId, 0);

  const heap = new MinHeap();
  heap.push(startNodeId, 0);

  while (heap.size > 0) {
    const { nodeId: currentNodeId, dist: currentDist } = heap.pop()!;

    // Lazy deletion: stale entry for a node already settled with a shorter path
    if (currentDist > (distances.get(currentNodeId) ?? Infinity)) continue;

    if (currentNodeId === endNodeId) {
      return {
        nodeIds: reconstructPath(previous, endNodeId),
        totalWeight: currentDist,
        found: true,
      };
    }

    for (const neighbor of graph.get(currentNodeId) ?? []) {
      const tentative = currentDist + neighbor.weight;
      if (tentative < (distances.get(neighbor.to) ?? Infinity)) {
        distances.set(neighbor.to, tentative);
        previous.set(neighbor.to, currentNodeId);
        heap.push(neighbor.to, tentative);
      }
    }
  }

  return { nodeIds: [], totalWeight: 0, found: false };
}
