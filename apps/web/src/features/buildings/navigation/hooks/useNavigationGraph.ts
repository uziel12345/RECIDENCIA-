import { useCallback, useEffect, useState } from "react";
import * as THREE from "three";
import type { BuildingEntrance, NavigationNode } from "@ito-map/shared";
import {
  getBuildingEntrances,
  getNavigationEdges,
  getNavigationNodes,
  NAVIGATION_DATA_CHANGED_EVENT,
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
      entrances: BuildingEntrance[];
    };

export function useNavigationGraph() {
  const {
    buildings,
    loading: buildingsLoading,
    error: buildingsError,
  } = useBuildings();
  const [graphState, setGraphState] = useState<GraphState>({ status: "loading" });
  const [refreshKey, setRefreshKey] = useState(0);

  // Solo recarga cuando cambia la navegación explícitamente (no en cada focus de ventana)
  useEffect(() => {
    function refreshGraph() {
      setRefreshKey((value) => value + 1);
    }
    window.addEventListener(NAVIGATION_DATA_CHANGED_EVENT, refreshGraph);
    return () => {
      window.removeEventListener(NAVIGATION_DATA_CHANGED_EVENT, refreshGraph);
    };
  }, []);

  useEffect(() => {
    let mounted = true;

    if (buildingsLoading) {
      queueMicrotask(() => {
        if (mounted) setGraphState({ status: "loading" });
      });
      return;
    }

    if (buildingsError) {
      queueMicrotask(() => {
        if (mounted) setGraphState({ status: "error", message: buildingsError });
      });
      return;
    }

    // Una sola petición que trae todo el grafo + entradas
    Promise.all([getNavigationNodes(), getNavigationEdges(), getBuildingEntrances()])
      .then(([nodes, edges, allEntrances]) => {
        if (!mounted) return;
        const nodeById = new Map(nodes.map((n) => [n.id, n]));
        const obstacles = buildBuildingObstacles(buildings);
        const adjacency = buildAdjacency(edges, nodeById, obstacles);
        const entrances = allEntrances.filter((e) => e.is_accessible);
        setGraphState({ status: "ready", nodes, nodeById, adjacency, entrances });
      })
      .catch((err: unknown) => {
        if (!mounted) return;
        const message =
          err instanceof Error ? err.message : "Error cargando grafo de navegación";
        if (import.meta.env.DEV) console.error("[NavGraph] Error cargando grafo", err);
        setGraphState({ status: "error", message });
      });

    return () => {
      mounted = false;
    };
  }, [buildings, buildingsError, buildingsLoading, refreshKey]);

  const findPath = useCallback(
    (from: THREE.Vector3, to: THREE.Vector3, goalNodeId?: string): THREE.Vector3[] => {
      if (graphState.status !== "ready") return [];

      const { nodes, nodeById, adjacency } = graphState;

      const startNode = snapToNearest(from.x, from.z, nodes);

      // Intenta usar el nodo exacto de la entrada. Si ese nodo no tiene ningún
      // edge en el grafo (entrada creada pero no conectada aún), cae al nodo
      // más cercano para no bloquear la ruta completamente.
      const exactGoal = goalNodeId ? nodeById.get(goalNodeId) : null;
      const goalNode = (exactGoal && adjacency.has(exactGoal.id))
        ? exactGoal
        : snapToNearest(to.x, to.z, nodes);

      if (!startNode || !goalNode) return [];

      const nodeIds = aStar(startNode.id, goalNode.id, nodeById, adjacency);

      if (!nodeIds || nodeIds.length === 0) return [];

      const path = nodeIds.map((id) => {
        const n = nodeById.get(id)!;
        return new THREE.Vector3(n.x, n.y, n.z);
      });

      path[path.length - 1] = to.clone();

      return path;
    },
    [graphState]
  );

  return {
    findPath,
    isReady: graphState.status === "ready",
    error: graphState.status === "error" ? graphState.message : null,
    entrances: graphState.status === "ready" ? graphState.entrances : [],
  };
}
