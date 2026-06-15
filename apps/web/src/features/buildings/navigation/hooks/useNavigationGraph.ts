import { useCallback, useEffect, useState } from "react";
import * as THREE from "three";
import type { NavigationNode } from "@ito-map/shared";
import {
  getNavigationEdges,
  getNavigationNodes,
} from "../../../../services/navigation.service";
import { useBuildings } from "../../../../hooks/useBuildings";
import {
  aStar,
  buildAdjacency,
  buildBuildingObstacles,
  snapToNearest,
  type AdjMap,
} from "../utils/pathfinding";

type GraphState =
  | { status: "loading" }
  | { status: "error"; message: string }
  | {
      status: "ready";
      nodes: NavigationNode[];
      nodeById: Map<string, NavigationNode>;
      adjacency: AdjMap;
    };

export function useNavigationGraph() {
  const {
    buildings,
    loading: buildingsLoading,
    error: buildingsError,
  } = useBuildings();
  const [graphState, setGraphState] = useState<GraphState>({ status: "loading" });

  useEffect(() => {
    let mounted = true;

    if (buildingsLoading) {
      setGraphState({ status: "loading" });
      mounted = false;
      return;
    }

    if (buildingsError) {
      setGraphState({ status: "error", message: buildingsError });
      mounted = false;
      return;
    }

    Promise.all([getNavigationNodes(), getNavigationEdges()])
      .then(([nodes, edges]) => {
        if (!mounted) return;
        const nodeById = new Map(nodes.map((n) => [n.id, n]));
        const obstacles = buildBuildingObstacles(buildings);
        const adjacency = buildAdjacency(edges, nodeById, obstacles);
        setGraphState({ status: "ready", nodes, nodeById, adjacency });
      })
      .catch((err: unknown) => {
        if (!mounted) return;
        const message =
          err instanceof Error ? err.message : "Error cargando grafo de navegacion";
        if (import.meta.env.DEV) console.error("[NavGraph] Error cargando grafo", err);
        setGraphState({ status: "error", message });
      });

    return () => {
      mounted = false;
    };
  }, [buildings, buildingsError, buildingsLoading]);

  const findPath = useCallback(
    (from: THREE.Vector3, to: THREE.Vector3, goalNodeId?: string): THREE.Vector3[] => {
      if (graphState.status !== "ready") return [];

      const { nodes, nodeById, adjacency } = graphState;

      const startNode = snapToNearest(from.x, from.z, nodes);
      const goalNode = goalNodeId
        ? (nodeById.get(goalNodeId) ?? snapToNearest(to.x, to.z, nodes))
        : snapToNearest(to.x, to.z, nodes);

      if (!startNode || !goalNode) return [];

      const nodeIds = aStar(startNode.id, goalNode.id, nodeById, adjacency);

      if (!nodeIds || nodeIds.length === 0) return [];

      const path = nodeIds.map((id) => {
        const n = nodeById.get(id)!;
        return new THREE.Vector3(n.x, n.y, n.z);
      });

      // El ultimo punto es la coordenada exacta de la entrada del edificio.
      // El primer punto es el nodo de snap, no la posicion GPS cruda.
      path[path.length - 1] = to.clone();

      return path;
    },
    [graphState]
  );

  return {
    findPath,
    isReady: graphState.status === "ready",
    error: graphState.status === "error" ? graphState.message : null,
  };
}
