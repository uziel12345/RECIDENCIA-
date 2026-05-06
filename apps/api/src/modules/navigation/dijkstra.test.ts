import { describe, expect, it } from "vitest";
import {
  findShortestPathFromEdges,
  type WeightedPathEdge,
} from "./dijkstra.js";

describe("findShortestPathFromEdges", () => {
  it("returns the shortest path when a valid route exists", () => {
    const edges: WeightedPathEdge[] = [
      { from: "A", to: "B", weight: 5, bidirectional: true },
      { from: "B", to: "C", weight: 5, bidirectional: true },
      { from: "A", to: "C", weight: 20, bidirectional: true },
    ];

    const result = findShortestPathFromEdges("A", "C", edges);

    expect(result).toEqual({
      nodeIds: ["A", "B", "C"],
      totalWeight: 10,
      found: true,
    });
  });

  it("supports bidirectional edges", () => {
    const edges: WeightedPathEdge[] = [
      { from: "A", to: "B", weight: 3, bidirectional: true },
      { from: "B", to: "C", weight: 4, bidirectional: true },
    ];

    const result = findShortestPathFromEdges("C", "A", edges);

    expect(result).toEqual({
      nodeIds: ["C", "B", "A"],
      totalWeight: 7,
      found: true,
    });
  });

  it("does not use reverse direction when an edge is not bidirectional", () => {
    const edges: WeightedPathEdge[] = [
      { from: "A", to: "B", weight: 3 },
      { from: "B", to: "C", weight: 4 },
    ];

    const result = findShortestPathFromEdges("C", "A", edges);

    expect(result).toEqual({
      nodeIds: [],
      totalWeight: 0,
      found: false,
    });
  });

  it("returns the same node when start and end are equal", () => {
    const edges: WeightedPathEdge[] = [
      { from: "A", to: "B", weight: 3, bidirectional: true },
    ];

    const result = findShortestPathFromEdges("A", "A", edges);

    expect(result).toEqual({
      nodeIds: ["A"],
      totalWeight: 0,
      found: true,
    });
  });

  it("returns not found when the destination is unreachable", () => {
    const edges: WeightedPathEdge[] = [
      { from: "A", to: "B", weight: 3, bidirectional: true },
      { from: "C", to: "D", weight: 4, bidirectional: true },
    ];

    const result = findShortestPathFromEdges("A", "D", edges);

    expect(result).toEqual({
      nodeIds: [],
      totalWeight: 0,
      found: false,
    });
  });

  it("returns not found when start or end node is empty", () => {
    const edges: WeightedPathEdge[] = [
      { from: "A", to: "B", weight: 3, bidirectional: true },
    ];

    expect(findShortestPathFromEdges("", "B", edges)).toEqual({
      nodeIds: [],
      totalWeight: 0,
      found: false,
    });

    expect(findShortestPathFromEdges("A", "", edges)).toEqual({
      nodeIds: [],
      totalWeight: 0,
      found: false,
    });
  });

  it("ignores invalid edges", () => {
    const edges = [
      { from: "A", to: "B", weight: 5, bidirectional: true },
      { from: "B", to: "C", weight: Number.NaN, bidirectional: true },
      { from: "A", to: "C", weight: 20, bidirectional: true },
      null,
    ] as unknown as WeightedPathEdge[];

    const result = findShortestPathFromEdges("A", "C", edges);

    expect(result).toEqual({
      nodeIds: ["A", "C"],
      totalWeight: 20,
      found: true,
    });
  });
});