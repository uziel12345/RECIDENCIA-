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

// Binary min-heap para priority queue O(log n)
class BinaryMinHeap {
  private heap: { f: number; id: string }[] = [];

  push(f: number, id: string): void {
    this.heap.push({ f, id });
    this.bubbleUp(this.heap.length - 1);
  }

  pop(): { f: number; id: string } | null {
    if (this.heap.length === 0) return null;
    const top = this.heap[0];
    const last = this.heap.pop()!;
    if (this.heap.length > 0) {
      this.heap[0] = last;
      this.sinkDown(0);
    }
    return top;
  }

  get size(): number {
    return this.heap.length;
  }

  private bubbleUp(i: number): void {
    while (i > 0) {
      const parent = (i - 1) >> 1;
      if (this.heap[parent].f <= this.heap[i].f) break;
      [this.heap[parent], this.heap[i]] = [this.heap[i], this.heap[parent]];
      i = parent;
    }
  }

  private sinkDown(i: number): void {
    const n = this.heap.length;
    while (true) {
      let min = i;
      const l = 2 * i + 1;
      const r = 2 * i + 2;
      if (l < n && this.heap[l].f < this.heap[min].f) min = l;
      if (r < n && this.heap[r].f < this.heap[min].f) min = r;
      if (min === i) break;
      [this.heap[min], this.heap[i]] = [this.heap[i], this.heap[min]];
      i = min;
    }
  }
}

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

  if (!posA || !posB) return Infinity;

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

// A* con heurística euclidiana — O((V+E) log V), encuentra la ruta más corta dirigiéndose al destino
function runAStar(
  startNodeId: string,
  endNodeId: string,
  graph: Graph,
  nodeMap: Map<string, PathNode>
): string[] {
  if (!startNodeId || !endNodeId) return [];
  if (startNodeId === endNodeId) return [startNodeId];

  if (!nodeMap.has(startNodeId) || !nodeMap.has(endNodeId)) {
    console.warn("Nodo inicial o final no existe en el grafo.");
    return [];
  }

  const endNode = nodeMap.get(endNodeId)!;
  const endPos = getNodePosition(endNode);

  function heuristic(nodeId: string): number {
    if (!endPos) return 0;
    const node = nodeMap.get(nodeId);
    if (!node) return 0;
    const pos = getNodePosition(node);
    if (!pos) return 0;
    const dx = pos.x - endPos.x;
    const dz = pos.z - endPos.z;
    return Math.sqrt(dx * dx + dz * dz);
  }

  const gScore = new Map<string, number>();
  const previous = new Map<string, string | null>();
  const closed = new Set<string>();
  const open = new BinaryMinHeap();

  gScore.set(startNodeId, 0);
  previous.set(startNodeId, null);
  open.push(heuristic(startNodeId), startNodeId);

  while (open.size > 0) {
    const current = open.pop()!;
    const currentId = current.id;

    if (currentId === endNodeId) {
      return reconstructPath(previous, endNodeId);
    }

    if (closed.has(currentId)) continue;
    closed.add(currentId);

    const currentG = gScore.get(currentId) ?? Infinity;
    const neighbors = graph.get(currentId) ?? [];

    for (const { to, weight } of neighbors) {
      if (closed.has(to)) continue;
      const tentativeG = currentG + weight;
      if (tentativeG < (gScore.get(to) ?? Infinity)) {
        gScore.set(to, tentativeG);
        previous.set(to, currentId);
        open.push(tentativeG + heuristic(to), to);
      }
    }
  }

  console.warn("No se encontró una ruta entre los nodos indicados.");
  return [];
}

// Dijkstra con MinHeap para grafos que no tienen coordenadas (solo aristas con pesos)
function runDijkstraWithHeap(
  startNodeId: string,
  endNodeId: string,
  graph: Graph,
  nodeIds: Set<string>
): string[] {
  if (!startNodeId || !endNodeId) return [];
  if (startNodeId === endNodeId) return [startNodeId];

  if (!nodeIds.has(startNodeId) || !nodeIds.has(endNodeId)) {
    console.warn("Nodo inicial o final no existe en el grafo.");
    return [];
  }

  const distances = new Map<string, number>();
  const previous = new Map<string, string | null>();
  const closed = new Set<string>();
  const open = new BinaryMinHeap();

  distances.set(startNodeId, 0);
  previous.set(startNodeId, null);
  open.push(0, startNodeId);

  while (open.size > 0) {
    const current = open.pop()!;
    const currentId = current.id;

    if (currentId === endNodeId) {
      return reconstructPath(previous, endNodeId);
    }

    if (closed.has(currentId)) continue;
    closed.add(currentId);

    const currentDist = distances.get(currentId) ?? Infinity;
    const neighbors = graph.get(currentId) ?? [];

    for (const { to, weight } of neighbors) {
      if (closed.has(to)) continue;
      const tentative = currentDist + weight;
      if (tentative < (distances.get(to) ?? Infinity)) {
        distances.set(to, tentative);
        previous.set(to, currentId);
        open.push(tentative, to);
      }
    }
  }

  console.warn("No se encontró una ruta entre los nodos indicados.");
  return [];
}

function buildGraphFromNodes(nodes: PathNode[]): {
  graph: Graph;
  nodeMap: Map<string, PathNode>;
} {
  const nodeMap = buildNodeMap(nodes);
  const graph: Graph = new Map();

  for (const node of nodes) {
    if (!Array.isArray(node.neighbors)) continue;

    const adjacencyList = graph.get(node.id) ?? [];

    for (const neighborId of node.neighbors) {
      const neighborNode = nodeMap.get(neighborId);
      if (!neighborNode) continue;

      const weight = distanceBetweenNodes(node, neighborNode);
      if (!Number.isFinite(weight)) continue;

      adjacencyList.push({ to: neighborId, weight });
    }

    graph.set(node.id, adjacencyList);
  }

  return { graph, nodeMap };
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

export function findPathFromNodes(
  startNodeId: string,
  endNodeId: string,
  nodes: PathNode[]
): string[] {
  const { graph, nodeMap } = buildGraphFromNodes(nodes);
  return runAStar(startNodeId, endNodeId, graph, nodeMap);
}

export function findPathFromEdges(
  startNodeId: string,
  endNodeId: string,
  edges: WeightedPathEdge[]
): string[] {
  const { graph, nodeIds } = buildGraphFromEdges(edges);
  return runDijkstraWithHeap(startNodeId, endNodeId, graph, nodeIds);
}

export default function findPath(
  startNodeId: string,
  endNodeId: string
): string[] {
  return findPathFromNodes(startNodeId, endNodeId, campusNodes as PathNode[]);
}
