import { describe, expect, it } from "vitest";
import type { NavigationEdge, NavigationNode } from "@ito-map/shared";
import type { Building } from "../../types/building";
import {
  aStar,
  buildAdjacency,
  buildBuildingObstacles,
  distancePointToSegmentSq,
  edgeCrossesBuilding,
  getObstacleRadius,
  getObstaclePenalty,
  snapToNearest,
  type BuildingObstacle,
} from "./pathfinding";

// ── Factories ──────────────────────────────────────────────────────────────────

function node(id: string, x: number, z: number): NavigationNode {
  return {
    id,
    code: id,
    name: null,
    node_type: "waypoint",
    x,
    y: 0,
    z,
    latitude: null,
    longitude: null,
    floor_level: 0,
    is_walkable: true,
    is_active: true,
    metadata: null,
  };
}

function edge(
  from: string,
  to: string,
  distance: number,
  bidirectional = true
): NavigationEdge {
  return {
    id: `${from}-${to}`,
    from_node_id: from,
    to_node_id: to,
    distance,
    is_bidirectional: bidirectional,
    is_accessible: true,
    path_type: "walkway",
    is_active: true,
    metadata: null,
    dx: 0,
    dz: 0,
  };
}

function building(
  id: string,
  x: number | null,
  z: number | null,
  opts: Partial<Building> = {}
): Building {
  return {
    id,
    code: id,
    name: id,
    slug: id,
    description: null,
    model_node_name: id,
    x,
    y: null,
    z,
    latitude: null,
    longitude: null,
    is_active: true,
    is_priority: false,
    category_code: "SERV",
    category_name: "Servicios",
    category_color: null,
    cover_image_url: null,
    ...opts,
  };
}

// ── snapToNearest ──────────────────────────────────────────────────────────────

describe("snapToNearest", () => {
  it("returns null for empty nodes array", () => {
    expect(snapToNearest(0, 0, [])).toBeNull();
  });

  it("returns the only node when array has one element", () => {
    const n = node("A", 5, 10);
    expect(snapToNearest(0, 0, [n])).toBe(n);
  });

  it("returns the closest node by Euclidean distance", () => {
    const a = node("A", 0, 0);
    const b = node("B", 10, 0);
    const c = node("C", 3, 0);
    expect(snapToNearest(4, 0, [a, b, c])).toBe(c);
  });

  it("breaks ties by order in array (first wins)", () => {
    const a = node("A", 5, 0);
    const b = node("B", 5, 0);
    expect(snapToNearest(5, 0, [a, b])).toBe(a);
  });
});

// ── distancePointToSegmentSq ───────────────────────────────────────────────────

describe("distancePointToSegmentSq", () => {
  it("returns 0 when point is exactly on the segment", () => {
    expect(distancePointToSegmentSq(5, 0, 0, 0, 10, 0)).toBe(0);
  });

  it("returns 0 when point is at the start endpoint", () => {
    expect(distancePointToSegmentSq(0, 0, 0, 0, 10, 0)).toBe(0);
  });

  it("returns 0 when point is at the end endpoint", () => {
    expect(distancePointToSegmentSq(10, 0, 0, 0, 10, 0)).toBe(0);
  });

  it("returns squared perpendicular distance when point is beside segment", () => {
    // Point at (5, 3), segment from (0,0) to (10,0) → nearest is (5,0), dist² = 9
    expect(distancePointToSegmentSq(5, 3, 0, 0, 10, 0)).toBeCloseTo(9);
  });

  it("clamps to nearest endpoint when point is beyond segment end", () => {
    // Point at (15, 0), segment from (0,0) to (10,0) → nearest is (10,0), dist² = 25
    expect(distancePointToSegmentSq(15, 0, 0, 0, 10, 0)).toBeCloseTo(25);
  });

  it("handles zero-length segment (both endpoints equal)", () => {
    // Segment is a point at (5,5), query point at (5,8) → dist² = 9
    expect(distancePointToSegmentSq(5, 8, 5, 5, 5, 5)).toBeCloseTo(9);
  });
});

// ── getObstacleRadius ──────────────────────────────────────────────────────────

describe("getObstacleRadius", () => {
  it("returns 24 for gimnasio", () => {
    expect(getObstacleRadius(building("G", 0, 0, { name: "Gimnasio" }))).toBe(24);
  });

  it("returns 24 for biblioteca", () => {
    expect(getObstacleRadius(building("B", 0, 0, { name: "Biblioteca Central" }))).toBe(24);
  });

  it("returns 18 for aula category", () => {
    expect(
      getObstacleRadius(
        building("A", 0, 0, { category_code: "AULA", category_name: "Aulas" })
      )
    ).toBe(18);
  });

  it("returns 20 for laboratorio category", () => {
    expect(
      getObstacleRadius(
        building("L", 0, 0, { category_code: "LABORATORIO", category_name: "Laboratorio" })
      )
    ).toBe(20);
  });

  it("returns 13 for servicio category", () => {
    expect(
      getObstacleRadius(
        building("S", 0, 0, { category_code: "SERVICIO", category_name: "Servicios Generales" })
      )
    ).toBe(13);
  });

  it("returns 16 as default", () => {
    expect(
      getObstacleRadius(
        building("X", 0, 0, { name: "Edificio X", category_code: "ADM", category_name: "Admin" })
      )
    ).toBe(16);
  });
});

// ── buildBuildingObstacles ─────────────────────────────────────────────────────

describe("buildBuildingObstacles", () => {
  it("includes active buildings with valid coordinates", () => {
    const result = buildBuildingObstacles([building("A", 10, 20)]);
    expect(result).toHaveLength(1);
    expect(result[0]).toMatchObject({ id: "A", x: 10, z: 20 });
  });

  it("excludes inactive buildings", () => {
    const result = buildBuildingObstacles([building("A", 10, 20, { is_active: false })]);
    expect(result).toHaveLength(0);
  });

  it("excludes buildings with null x", () => {
    const result = buildBuildingObstacles([building("A", null, 20)]);
    expect(result).toHaveLength(0);
  });

  it("excludes buildings with null z", () => {
    const result = buildBuildingObstacles([building("A", 10, null)]);
    expect(result).toHaveLength(0);
  });

  it("assigns the correct radius from getObstacleRadius", () => {
    const result = buildBuildingObstacles([building("G", 0, 0, { name: "Gimnasio" })]);
    expect(result[0]!.radius).toBe(24);
  });
});

// ── edgeCrossesBuilding ────────────────────────────────────────────────────────

describe("edgeCrossesBuilding", () => {
  const obstacle: BuildingObstacle = { id: "O", name: "O", x: 50, z: 0, radius: 10 };

  it("returns false when no obstacles", () => {
    expect(edgeCrossesBuilding(node("A", 0, 0), node("B", 100, 0), [])).toBe(false);
  });

  it("returns true when edge passes through obstacle center", () => {
    // Edge from (0,0) to (100,0) passes through obstacle at (50,0) r=10
    expect(edgeCrossesBuilding(node("A", 0, 0), node("B", 100, 0), [obstacle])).toBe(true);
  });

  it("returns false when edge passes far from obstacle", () => {
    // Edge from (0, 30) to (100, 30) is 30 units away from obstacle at (50,0)
    expect(edgeCrossesBuilding(node("A", 0, 30), node("B", 100, 30), [obstacle])).toBe(false);
  });

  it("skips check when from-node is inside obstacle radius threshold", () => {
    // from is at (50,0) = exactly on obstacle center → fromDist = 0 < radius*0.45 → skip
    expect(edgeCrossesBuilding(node("A", 50, 0), node("B", 200, 0), [obstacle])).toBe(false);
  });

  it("skips check when to-node is inside obstacle radius threshold", () => {
    expect(edgeCrossesBuilding(node("A", -100, 0), node("B", 50, 0), [obstacle])).toBe(false);
  });
});

// ── getObstaclePenalty ─────────────────────────────────────────────────────────

describe("getObstaclePenalty", () => {
  const obstacle: BuildingObstacle = { id: "O", name: "O", x: 50, z: 0, radius: 10 };

  it("returns 1 when edge does not cross any building", () => {
    expect(getObstaclePenalty(node("A", 0, 30), node("B", 100, 30), [obstacle])).toBe(1);
  });

  it("returns 4 when edge crosses a building", () => {
    expect(getObstaclePenalty(node("A", 0, 0), node("B", 100, 0), [obstacle])).toBe(4);
  });
});

// ── buildAdjacency ─────────────────────────────────────────────────────────────

describe("buildAdjacency", () => {
  it("adds both directions for bidirectional edge", () => {
    const nodes = [node("A", 0, 0), node("B", 10, 0)];
    const edges = [edge("A", "B", 10, true)];
    const nodeById = new Map(nodes.map((n) => [n.id, n]));
    const adj = buildAdjacency(edges, nodeById, []);

    expect(adj.get("A")).toHaveLength(1);
    expect(adj.get("B")).toHaveLength(1);
    expect(adj.get("A")![0]!.nodeId).toBe("B");
    expect(adj.get("B")![0]!.nodeId).toBe("A");
  });

  it("adds only forward direction for unidirectional edge", () => {
    const nodes = [node("A", 0, 0), node("B", 10, 0)];
    const edges = [edge("A", "B", 10, false)];
    const nodeById = new Map(nodes.map((n) => [n.id, n]));
    const adj = buildAdjacency(edges, nodeById, []);

    expect(adj.get("A")).toHaveLength(1);
    expect(adj.get("B")).toBeUndefined();
  });

  it("skips edge when from-node is missing from nodeById", () => {
    const nodes = [node("B", 10, 0)];
    const edges = [edge("A", "B", 10)];
    const nodeById = new Map(nodes.map((n) => [n.id, n]));
    const adj = buildAdjacency(edges, nodeById, []);

    expect(adj.size).toBe(0);
  });

  it("skips edge when to-node is missing from nodeById", () => {
    const nodes = [node("A", 0, 0)];
    const edges = [edge("A", "B", 10)];
    const nodeById = new Map(nodes.map((n) => [n.id, n]));
    const adj = buildAdjacency(edges, nodeById, []);

    expect(adj.size).toBe(0);
  });

  it("applies obstacle penalty (4x) when edge crosses a building", () => {
    const a = node("A", 0, 0);
    const b = node("B", 100, 0);
    const nodes = [a, b];
    const edges = [edge("A", "B", 10)];
    const nodeById = new Map(nodes.map((n) => [n.id, n]));
    const obstacle: BuildingObstacle = { id: "O", name: "O", x: 50, z: 0, radius: 10 };

    const adjWithPenalty = buildAdjacency(edges, nodeById, [obstacle]);
    const adjNoPenalty = buildAdjacency(edges, nodeById, []);

    const weightWith = adjWithPenalty.get("A")![0]!.weight;
    const weightWithout = adjNoPenalty.get("A")![0]!.weight;

    expect(weightWith).toBe(weightWithout * 4);
  });
});

// ── aStar ──────────────────────────────────────────────────────────────────────

describe("aStar", () => {
  it("returns [goal] when start equals goal", () => {
    const nodes = [node("A", 0, 0)];
    const nodeById = new Map(nodes.map((n) => [n.id, n]));
    const adj = buildAdjacency([], nodeById, []);
    expect(aStar("A", "A", nodeById, adj)).toEqual(["A"]);
  });

  it("returns null when start node is not in nodeById", () => {
    const nodes = [node("B", 10, 0)];
    const nodeById = new Map(nodes.map((n) => [n.id, n]));
    expect(aStar("X", "B", nodeById, new Map())).toBeNull();
  });

  it("returns null when no path exists (disconnected graph)", () => {
    const nodes = [node("A", 0, 0), node("B", 10, 0), node("C", 50, 0)];
    const edges = [edge("A", "B", 10)];
    const nodeById = new Map(nodes.map((n) => [n.id, n]));
    const adj = buildAdjacency(edges, nodeById, []);
    expect(aStar("A", "C", nodeById, adj)).toBeNull();
  });

  it("finds the direct path on a simple two-node graph", () => {
    const nodes = [node("A", 0, 0), node("B", 10, 0)];
    const edges = [edge("A", "B", 10)];
    const nodeById = new Map(nodes.map((n) => [n.id, n]));
    const adj = buildAdjacency(edges, nodeById, []);
    expect(aStar("A", "B", nodeById, adj)).toEqual(["A", "B"]);
  });

  it("finds the shortest path (not just any path)", () => {
    // A --5-- B --5-- C   (cost 10)
    // A ------3------ C   (cost 3, direct shortcut)
    const nodes = [node("A", 0, 0), node("B", 5, 0), node("C", 10, 0)];
    const edges = [
      edge("A", "B", 5),
      edge("B", "C", 5),
      edge("A", "C", 3),
    ];
    const nodeById = new Map(nodes.map((n) => [n.id, n]));
    const adj = buildAdjacency(edges, nodeById, []);
    expect(aStar("A", "C", nodeById, adj)).toEqual(["A", "C"]);
  });

  it("traverses multiple hops when needed", () => {
    const nodes = [node("A", 0, 0), node("B", 5, 0), node("C", 10, 0)];
    const edges = [edge("A", "B", 5), edge("B", "C", 5)];
    const nodeById = new Map(nodes.map((n) => [n.id, n]));
    const adj = buildAdjacency(edges, nodeById, []);
    expect(aStar("A", "C", nodeById, adj)).toEqual(["A", "B", "C"]);
  });

  it("avoids edge with high obstacle penalty when cheaper path exists", () => {
    // Obstacle at (10, 0) r=5 sits on A→C direct segment but NOT on A→B or B→C.
    // A=(0,0) B=(10,30) C=(20,0)
    // Edge weights approximate geometric distances so the Euclidean heuristic stays admissible:
    //   A→B ≈ √1000≈32, B→C ≈ √1000≈32, A→C=20 (penalized 4× → 80)
    // A→B→C costs 64 < A→C cost 80 → A* must pick A→B→C.
    const a = node("A", 0, 0);
    const b = node("B", 10, 30);
    const c = node("C", 20, 0);

    const nodes = [a, b, c];
    const edgesArr = [
      edge("A", "B", 32),
      edge("B", "C", 32),
      edge("A", "C", 20),
    ];
    const nodeById = new Map(nodes.map((n) => [n.id, n]));
    const obstacle: BuildingObstacle = { id: "O", name: "O", x: 10, z: 0, radius: 5 };
    const adj = buildAdjacency(edgesArr, nodeById, [obstacle]);

    const path = aStar("A", "C", nodeById, adj);
    expect(path).toEqual(["A", "B", "C"]);
  });

  it("respects unidirectional edges (no reverse travel)", () => {
    const nodes = [node("A", 0, 0), node("B", 10, 0)];
    const edges = [edge("A", "B", 10, false)]; // one-way A→B
    const nodeById = new Map(nodes.map((n) => [n.id, n]));
    const adj = buildAdjacency(edges, nodeById, []);
    expect(aStar("B", "A", nodeById, adj)).toBeNull();
  });
});
