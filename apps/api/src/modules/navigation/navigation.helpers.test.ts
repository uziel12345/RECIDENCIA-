import { describe, expect, it } from "vitest";
import {
  buildEdgeDistanceMap,
  buildEdgeLookupKey,
  calculateRouteDistance,
  estimateWalkingSeconds,
  getEdgeWeight,
  type NavigationEdgeForRoute,
} from "./navigation.helpers.js";

describe("navigation helpers", () => {
  it("builds a stable edge lookup key", () => {
    expect(buildEdgeLookupKey("A", "B")).toBe("A::B");
  });

  it("calculates edge weight using path type penalties", () => {
    const baseEdge: NavigationEdgeForRoute = {
      from_node_id: "A",
      to_node_id: "B",
      distance: 10,
      is_bidirectional: true,
      path_type: "sidewalk",
    };

    expect(getEdgeWeight({ ...baseEdge, path_type: "sidewalk" })).toBe(10);
    expect(getEdgeWeight({ ...baseEdge, path_type: "stairs" })).toBe(30);
    expect(getEdgeWeight({ ...baseEdge, path_type: "ramp" })).toBe(14);
    expect(getEdgeWeight({ ...baseEdge, path_type: "outdoor" })).toBe(12);
    expect(getEdgeWeight({ ...baseEdge, path_type: "hallway" })).toBe(8.5);
  });

  it("estimates walking time in seconds", () => {
    expect(estimateWalkingSeconds(14)).toBe(10);
    expect(estimateWalkingSeconds(15)).toBe(11);
  });

  it("creates distance map for direct and bidirectional edges", () => {
    const edges: NavigationEdgeForRoute[] = [
      {
        from_node_id: "A",
        to_node_id: "B",
        distance: 10,
        is_bidirectional: true,
        path_type: "sidewalk",
      },
      {
        from_node_id: "B",
        to_node_id: "C",
        distance: 20,
        is_bidirectional: false,
        path_type: "sidewalk",
      },
    ];

    const distanceMap = buildEdgeDistanceMap(edges);

    expect(distanceMap.get("A::B")).toBe(10);
    expect(distanceMap.get("B::A")).toBe(10);
    expect(distanceMap.get("B::C")).toBe(20);
    expect(distanceMap.get("C::B")).toBeUndefined();
  });

  it("calculates total route distance using original edge distance", () => {
    const edges: NavigationEdgeForRoute[] = [
      {
        from_node_id: "A",
        to_node_id: "B",
        distance: 10,
        is_bidirectional: true,
        path_type: "stairs",
      },
      {
        from_node_id: "B",
        to_node_id: "C",
        distance: 20,
        is_bidirectional: true,
        path_type: "hallway",
      },
    ];

    expect(calculateRouteDistance(["A", "B", "C"], edges)).toBe(30);
    expect(calculateRouteDistance(["C", "B", "A"], edges)).toBe(30);
  });

  it("returns zero when route has fewer than two nodes", () => {
    const edges: NavigationEdgeForRoute[] = [
      {
        from_node_id: "A",
        to_node_id: "B",
        distance: 10,
        is_bidirectional: true,
        path_type: "sidewalk",
      },
    ];

    expect(calculateRouteDistance([], edges)).toBe(0);
    expect(calculateRouteDistance(["A"], edges)).toBe(0);
  });

  it("ignores missing edges by adding zero distance for that segment", () => {
    const edges: NavigationEdgeForRoute[] = [
      {
        from_node_id: "A",
        to_node_id: "B",
        distance: 10,
        is_bidirectional: true,
        path_type: "sidewalk",
      },
    ];

    expect(calculateRouteDistance(["A", "B", "C"], edges)).toBe(10);
  });
});