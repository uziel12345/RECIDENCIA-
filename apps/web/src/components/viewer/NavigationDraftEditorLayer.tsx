import { useEffect, useMemo, useRef, useState } from "react";
import { Html, Line } from "@react-three/drei";
import { useThree, type ThreeEvent } from "@react-three/fiber";
import * as THREE from "three";
import type { Building, EdgePathType, NavigationNode } from "@ito-map/shared";
import {
  createBuildingEntrance,
  createNavigationEdge,
  createNavigationNode,
  deleteNavigationEdge,
  deleteNavigationNode,
  getNavigationEdges,
  getNavigationNodes,
  resetAllNavigation as resetAllNavigationService,
  type NavigationEdge,
} from "../../services/navigation.service";

// â”€â”€â”€ Types â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

type PathNodeItem =
  | { kind: "new"; id: number; x: number; z: number }
  | { kind: "existing"; nodeId: string; code: string; x: number; z: number };

type DraftPath = {
  id: number;
  nodes: PathNodeItem[];
  pathType: EdgePathType;
  isBidirectional: boolean;
};

type DraftEntranceNode = {
  id: number;
  x: number;
  z: number;
  buildingId: string;
  buildingName: string;
};

export type DraftEditorControls = {
  nodeType: "path" | "entrance" | "connect" | "edit";
  activePath: DraftPath | null;
  completedPaths: DraftPath[];
  entranceNodes: DraftEntranceNode[];
  draftSql: string;
  availableNodes: NavigationNode[];
  availableEdges: NavigationEdge[];
  selectedBuilding: { id: string; name: string } | null;
  edgePathType: EdgePathType;
  edgeBidirectional: boolean;
  saving: boolean;
  saveError: string | null;
  saveMessage: string | null;
  canFinalizePath: boolean;
  setNodeType: (type: "path" | "entrance" | "connect" | "edit") => void;
  setSelectedBuilding: (b: { id: string; name: string } | null) => void;
  setEdgePathType: (type: EdgePathType) => void;
  setEdgeBidirectional: (value: boolean) => void;
  extendPath: (item: PathNodeItem) => void;
  finalizePath: () => void;
  addEntranceNode: (x: number, z: number) => void;
  saveDraftToDatabase: () => Promise<void>;
  deleteExistingNode: (id: string) => Promise<void>;
  deleteExistingEdge: (id: string) => Promise<void>;
  undoLast: () => void;
  clearDraft: () => void;
  connectingFromId: string | null;
  connectingToId: string | null;
  connectEdgePathType: EdgePathType;
  setConnectingFromId: (id: string | null) => void;
  setConnectingToId: (id: string | null) => void;
  saveCurrentConnection: () => Promise<void>;
  setConnectEdgePathType: (type: EdgePathType) => void;
  editSelNode: NavigationNode | null;
  editConnectMode: boolean;
  editSubMode: "select" | "add-node";
  addNodeType: "intersection" | "building_access";
  setEditSelNode: (node: NavigationNode | null) => void;
  startEditConnect: () => void;
  connectEditNodes: (target: NavigationNode) => Promise<void>;
  deleteEditNode: () => Promise<void>;
  setEditSubMode: (mode: "select" | "add-node") => void;
  setAddNodeType: (type: "intersection" | "building_access") => void;
  addNodeToDatabase: (x: number, z: number) => Promise<void>;
  resetAllNavigation: () => Promise<void>;
};

// â”€â”€â”€ Constants â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

const DRAFT_Y = 3.1;
const DRAFT_PLANE_SIZE = 520;
const MAX_CLICK_MOVEMENT_PX = 5;
const GROUND_PLANE = new THREE.Plane(new THREE.Vector3(0, 1, 0), -DRAFT_Y);

const EDGE_PATH_LABELS: Record<EdgePathType, string> = {
  walkway: "Camino",
  hallway: "Pasillo",
  outdoor: "Exterior",
  ramp: "Rampa",
  stairs: "Escaleras",
};

// â”€â”€â”€ SQL generation â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

function sqlStr(value: string): string {
  return `'${value.replaceAll("'", "''")}'`;
}

function pathNodeCode(pathIdx: number, nodeIdx: number): string {
  return `draft_p${String(pathIdx + 1).padStart(2, "0")}_n${String(nodeIdx + 1).padStart(2, "0")}`;
}

function entranceCode(idx: number): string {
  return `draft_entrance_${String(idx + 1).padStart(2, "0")}`;
}

function buildNodeCodeMap(path: DraftPath, pathIdx: number): Map<number, string> {
  const map = new Map<number, string>();
  let newIdx = 0;
  for (const node of path.nodes) {
    if (node.kind === "new") {
      map.set(node.id, pathNodeCode(pathIdx, newIdx++));
    }
  }
  return map;
}

function resolveCode(node: PathNodeItem, codeMap: Map<number, string>): string {
  if (node.kind === "existing") return node.code;
  return codeMap.get(node.id) ?? "?";
}

function buildDraftSql(
  completedPaths: DraftPath[],
  activePath: DraftPath | null,
  entranceNodes: DraftEntranceNode[]
): string {
  const allPaths = activePath ? [...completedPaths, activePath] : completedPaths;

  if (allPaths.length === 0 && entranceNodes.length === 0) {
    return "-- Dibuja un camino en el mapa para comenzar.";
  }

  const parts: string[] = ["START TRANSACTION;"];

  // Nodos nuevos por camino
  for (let pi = 0; pi < allPaths.length; pi++) {
    const path = allPaths[pi];
    const newNodes = path.nodes.filter(
      (n): n is Extract<PathNodeItem, { kind: "new" }> => n.kind === "new"
    );

    if (newNodes.length > 0) {
      let newIdx = 0;
      const values = newNodes
        .map(
          (n) =>
            `  (${sqlStr(pathNodeCode(pi, newIdx++))}, ${sqlStr(`Camino ${pi + 1} nodo ${newIdx}`)}, 'intersection', ${n.x.toFixed(4)}, 0.0000, ${n.z.toFixed(4)}, 0, 1, 1, JSON_OBJECT('source', 'draft-editor'))`
        )
        .join(",\n");

      parts.push(
        `\n-- Camino ${pi + 1}: nodos nuevos (${newNodes.length})\nINSERT INTO navigation_nodes\n  (code, name, node_type, x, y, z, floor_level, is_walkable, is_active, metadata)\nVALUES\n${values}\nON DUPLICATE KEY UPDATE\n  node_type = VALUES(node_type), x = VALUES(x), y = VALUES(y), z = VALUES(z),\n  is_active = 1, updated_at = CURRENT_TIMESTAMP;`
      );
    }

    // Aristas consecutivas del camino
    if (path.nodes.length >= 2) {
      const codeMap2 = buildNodeCodeMap(path, pi);
      const edgeSqls: string[] = [];
      const bidir = path.isBidirectional ? 1 : 0;

      for (let ni = 0; ni < path.nodes.length - 1; ni++) {
        const from = path.nodes[ni];
        const to = path.nodes[ni + 1];
        const dist = Math.sqrt(
          Math.pow(from.x - to.x, 2) + Math.pow(from.z - to.z, 2)
        ).toFixed(2);

        edgeSqls.push(
          `INSERT INTO navigation_edges\n  (from_node_id, to_node_id, distance, path_type, is_bidirectional, is_accessible, metadata)\nSELECT fn.id, tn.id, ${dist}, ${sqlStr(path.pathType)}, ${bidir}, 1, JSON_OBJECT('source', 'draft-editor')\nFROM navigation_nodes fn, navigation_nodes tn\nWHERE fn.code = ${sqlStr(resolveCode(from, codeMap2))} AND tn.code = ${sqlStr(resolveCode(to, codeMap2))}\nON DUPLICATE KEY UPDATE\n  distance = VALUES(distance), path_type = VALUES(path_type),\n  is_bidirectional = VALUES(is_bidirectional), is_active = 1, updated_at = CURRENT_TIMESTAMP;`
        );
      }

      parts.push(`\n-- Camino ${pi + 1}: aristas (${edgeSqls.length})`);
      parts.push(...edgeSqls);
    }
  }

  // Nodos de entrada
  if (entranceNodes.length > 0) {
    const values = entranceNodes
      .map(
        (n, i) =>
          `  (${sqlStr(entranceCode(i))}, ${sqlStr(`Acceso ${n.buildingName}`)}, 'building_access', ${n.x.toFixed(4)}, 0.0000, ${n.z.toFixed(4)}, 0, 1, 1, JSON_OBJECT('source', 'draft-editor', 'building_id', ${sqlStr(n.buildingId)}))`
      )
      .join(",\n");

    parts.push(
      `\n-- Nodos de acceso a edificio (${entranceNodes.length})\nINSERT INTO navigation_nodes\n  (code, name, node_type, x, y, z, floor_level, is_walkable, is_active, metadata)\nVALUES\n${values}\nON DUPLICATE KEY UPDATE\n  node_type = VALUES(node_type), x = VALUES(x), y = VALUES(y), z = VALUES(z),\n  is_active = 1, updated_at = CURRENT_TIMESTAMP;`
    );

    // Auto-conectar entrada al nodo de camino mÃ¡s cercano
    const allPathNodes: { code: string; x: number; z: number }[] = [];
    allPaths.forEach((path, pi) => {
      const codeMap = buildNodeCodeMap(path, pi);
      path.nodes.forEach((node) => {
        allPathNodes.push({ code: resolveCode(node, codeMap), x: node.x, z: node.z });
      });
    });

    if (allPathNodes.length > 0) {
      parts.push(`\n-- ConexiÃ³n entrada â†’ nodo de camino mÃ¡s cercano`);
      entranceNodes.forEach((en, i) => {
        const ec = entranceCode(i);
        let nearest: { code: string; dist: number } | null = null;
        for (const pn of allPathNodes) {
          const dist = Math.sqrt(Math.pow(en.x - pn.x, 2) + Math.pow(en.z - pn.z, 2));
          if (!nearest || dist < nearest.dist) nearest = { code: pn.code, dist };
        }
        if (nearest) {
          parts.push(
            `INSERT INTO navigation_edges\n  (from_node_id, to_node_id, distance, path_type, is_bidirectional, is_accessible, metadata)\nSELECT fn.id, tn.id, ${nearest.dist.toFixed(2)}, 'walkway', 1, 1, JSON_OBJECT('source', 'draft-editor')\nFROM navigation_nodes fn, navigation_nodes tn\nWHERE fn.code = ${sqlStr(ec)} AND tn.code = ${sqlStr(nearest.code)}\nON DUPLICATE KEY UPDATE distance = VALUES(distance), is_active = 1, updated_at = CURRENT_TIMESTAMP;`
          );
        }
      });
    }

    // building_entrances
    parts.push(`\n-- Entradas de edificio`);
    entranceNodes.forEach((n, i) => {
      parts.push(
        `INSERT IGNORE INTO building_entrances\n  (building_id, node_id, entrance_name, entrance_type, is_primary, is_accessible)\nSELECT ${sqlStr(n.buildingId)}, id, ${sqlStr(`Acceso ${n.buildingName}`)}, 'main', 0, 1\nFROM navigation_nodes WHERE code = ${sqlStr(entranceCode(i))};`
      );
    });
  }

  parts.push("\nCOMMIT;");
  return parts.join("\n");
}

// â”€â”€â”€ Hook â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

function round4(v: number): number {
  return Number(v.toFixed(4));
}

// eslint-disable-next-line react-refresh/only-export-components
export function useDraftEditor(): DraftEditorControls {
  const [nodeType, setNodeTypeState] = useState<"path" | "entrance" | "connect" | "edit">("path");
  const [activePath, setActivePath] = useState<DraftPath | null>(null);
  const [completedPaths, setCompletedPaths] = useState<DraftPath[]>([]);
  const [entranceNodes, setEntranceNodes] = useState<DraftEntranceNode[]>([]);
  const [selectedBuilding, setSelectedBuilding] = useState<{
    id: string;
    name: string;
  } | null>(null);
  const [edgePathType, setEdgePathTypeState] = useState<EdgePathType>("walkway");
  const [edgeBidirectional, setEdgeBidirectionalState] = useState(true);
  const [availableNodes, setAvailableNodes] = useState<NavigationNode[]>([]);
  const [availableEdges, setAvailableEdges] = useState<NavigationEdge[]>([]);
  const [refreshKey, setRefreshKey] = useState(0);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [saveMessage, setSaveMessage] = useState<string | null>(null);
  const [connectingFromId, setConnectingFromId] = useState<string | null>(null);
  const [connectingToId, setConnectingToId] = useState<string | null>(null);
  const [connectEdgePathType, setConnectEdgePathTypeState] = useState<EdgePathType>("walkway");
  const [editSelNode, setEditSelNodeState] = useState<NavigationNode | null>(null);
  const [editConnectMode, setEditConnectMode] = useState(false);
  const [editSubMode, setEditSubModeState] = useState<"select" | "add-node">("select");
  const [addNodeType, setAddNodeTypeState] = useState<"intersection" | "building_access">("intersection");

  // Carga nodos existentes de la BD (ambos modos los necesitan: path para snap visual, entrance para auto-conectar)
  useEffect(() => {
    let cancelled = false;

    Promise.all([getNavigationNodes(), getNavigationEdges()]).then(([nodes, edges]) => {
      if (!cancelled) {
        setAvailableNodes(nodes.filter((n) => n.is_active));
        setAvailableEdges(edges.filter((e) => e.is_active));
      }
    });
    return () => {
      cancelled = true;
    };
  }, [nodeType, refreshKey]);

  const draftSql = useMemo(
    () => buildDraftSql(completedPaths, activePath, entranceNodes),
    [completedPaths, activePath, entranceNodes]
  );

  const canFinalizePath = activePath !== null && activePath.nodes.length >= 2;

  function setNodeType(type: "path" | "entrance" | "connect" | "edit") {
    setNodeTypeState(type);
    if (type !== "connect") {
      setConnectingFromId(null);
      setConnectingToId(null);
    }
    if (type !== "edit") {
      setEditSelNodeState(null);
      setEditConnectMode(false);
      setEditSubModeState("select");
    }
  }

  function setConnectEdgePathType(type: EdgePathType) {
    setConnectEdgePathTypeState(type);
  }

  function setEdgePathType(type: EdgePathType) {
    setEdgePathTypeState(type);
    setActivePath((prev) => (prev ? { ...prev, pathType: type } : null));
  }

  function setEdgeBidirectional(value: boolean) {
    setEdgeBidirectionalState(value);
    setActivePath((prev) => (prev ? { ...prev, isBidirectional: value } : null));
  }

  function extendPath(item: PathNodeItem) {
    setActivePath((prev) => {
      if (!prev) {
        return {
          id: Date.now(),
          nodes: [item],
          pathType: edgePathType,
          isBidirectional: edgeBidirectional,
        };
      }
      return { ...prev, nodes: [...prev.nodes, item] };
    });
  }

  function finalizePath() {
    if (!activePath || activePath.nodes.length < 2) return;
    setCompletedPaths((prev) => [...prev, activePath]);
    setActivePath(null);
  }

  function addEntranceNode(x: number, z: number) {
    if (!selectedBuilding) return;
    setEntranceNodes((prev) => [
      ...prev,
      {
        id: Date.now(),
        x: round4(x),
        z: round4(z),
        buildingId: selectedBuilding.id,
        buildingName: selectedBuilding.name,
      },
    ]);
  }

  async function saveDraftToDatabase() {
    const allPaths = activePath ? [...completedPaths, activePath] : completedPaths;
    const hasPaths = allPaths.some((path) => path.nodes.length > 0);
    const hasEntrances = entranceNodes.length > 0;
    if (!hasPaths && !hasEntrances) return;

    setSaving(true);
    setSaveError(null);
    setSaveMessage(null);

    try {
      const savedPathNodes: { id: string; x: number; z: number }[] = [];

      for (let pi = 0; pi < allPaths.length; pi++) {
        const path = allPaths[pi];
        const resolved = new Map<number, { id: string; x: number; z: number }>();

        for (let ni = 0; ni < path.nodes.length; ni++) {
          const node = path.nodes[ni];
          if (node.kind === "existing") {
            const item = { id: node.nodeId, x: node.x, z: node.z };
            resolved.set(ni, item);
            savedPathNodes.push(item);
          } else {
            const created = await createNavigationNode({
              code: `nav-p${pi + 1}-n${ni + 1}-${Date.now().toString(36)}`,
              name: `Camino ${pi + 1} nodo ${ni + 1}`,
              node_type: "intersection",
              x: node.x,
              y: 0,
              z: node.z,
              metadata: { source: "admin-editor" },
            });
            const item = { id: created.id, x: Number(created.x), z: Number(created.z) };
            resolved.set(ni, item);
            savedPathNodes.push(item);
          }
        }

        for (let ni = 0; ni < path.nodes.length - 1; ni++) {
          const from = resolved.get(ni);
          const to = resolved.get(ni + 1);
          if (!from || !to) continue;

          await createNavigationEdge({
            from_node_id: from.id,
            to_node_id: to.id,
            path_type: path.pathType,
            is_bidirectional: path.isBidirectional,
            is_accessible: true,
            metadata: { source: "admin-editor" },
          });
        }
      }

      for (const entrance of entranceNodes) {
        const created = await createNavigationNode({
          code: `nav-access-${Date.now().toString(36)}-${entrance.id}`,
          name: `Acceso ${entrance.buildingName}`,
          node_type: "building_access",
          x: entrance.x,
          y: 0,
          z: entrance.z,
          metadata: {
            source: "admin-editor",
            building_id: entrance.buildingId,
          },
        });

        await createBuildingEntrance({
          building_id: entrance.buildingId,
          node_id: created.id,
          entrance_name: `Acceso ${entrance.buildingName}`,
          entrance_type: "main",
          is_primary: false,
          is_accessible: true,
        });

        const dbNodes = availableNodes.map((n) => ({
          id: n.id,
          x: Number(n.x),
          z: Number(n.z),
        }));
        const nearest = [...savedPathNodes, ...dbNodes].reduce<{
          id: string;
          distance: number;
        } | null>((current, node) => {
          const distance = Math.hypot(entrance.x - node.x, entrance.z - node.z);
          if (!current || distance < current.distance) return { id: node.id, distance };
          return current;
        }, null);

        if (nearest) {
          await createNavigationEdge({
            from_node_id: created.id,
            to_node_id: nearest.id,
            path_type: "walkway",
            is_bidirectional: true,
            is_accessible: true,
            metadata: { source: "admin-editor", auto_connected: true },
          });
        }
      }

      clearDraft();
      setRefreshKey((value) => value + 1);
      setSaveMessage("Cambios guardados en la base de datos.");
    } catch (error) {
      setSaveError(error instanceof Error ? error.message : "No se pudo guardar");
    } finally {
      setSaving(false);
    }
  }

  async function deleteExistingNode(id: string) {
    if (!id) return;
    setSaving(true);
    setSaveError(null);
    try {
      await deleteNavigationNode(id);
      setRefreshKey((value) => value + 1);
      setSaveMessage("Nodo desactivado.");
    } catch (error) {
      setSaveError(error instanceof Error ? error.message : "No se pudo eliminar el nodo");
    } finally {
      setSaving(false);
    }
  }

  async function deleteExistingEdge(id: string) {
    if (!id) return;
    setSaving(true);
    setSaveError(null);
    try {
      await deleteNavigationEdge(id);
      setRefreshKey((value) => value + 1);
      setSaveMessage("Arista desactivada.");
    } catch (error) {
      setSaveError(error instanceof Error ? error.message : "No se pudo eliminar la arista");
    } finally {
      setSaving(false);
    }
  }

  function undoLast() {
    if (activePath) {
      if (activePath.nodes.length <= 1) {
        setActivePath(null);
      } else {
        setActivePath({ ...activePath, nodes: activePath.nodes.slice(0, -1) });
      }
    } else if (completedPaths.length > 0) {
      setCompletedPaths((prev) => prev.slice(0, -1));
    } else if (entranceNodes.length > 0) {
      setEntranceNodes((prev) => prev.slice(0, -1));
    }
  }

  async function saveCurrentConnection() {
    const fromNode = availableNodes.find((n) => n.id === connectingFromId);
    const toNode = availableNodes.find((n) => n.id === connectingToId);
    if (!fromNode || !toNode) return;
    setSaving(true);
    setSaveError(null);
    setSaveMessage(null);
    try {
      const dist = Math.hypot(
        Number(fromNode.x) - Number(toNode.x),
        Number(fromNode.z) - Number(toNode.z)
      );
      await createNavigationEdge({
        from_node_id: fromNode.id,
        to_node_id: toNode.id,
        path_type: connectEdgePathType,
        is_bidirectional: true,
        is_accessible: true,
        metadata: { source: "admin-editor", distance: dist.toFixed(2) },
      });
      setConnectingToId(null);
      setRefreshKey((v) => v + 1);
      setSaveMessage(`Conexión guardada: ${fromNode.code} ↔ ${toNode.code}`);
    } catch (error) {
      setSaveError(error instanceof Error ? error.message : "No se pudo guardar la conexión");
    } finally {
      setSaving(false);
    }
  }

  function setEditSubMode(mode: "select" | "add-node") {
    setEditSubModeState(mode);
    if (mode === "add-node") {
      setEditSelNodeState(null);
      setEditConnectMode(false);
    }
  }

  function setAddNodeType(type: "intersection" | "building_access") {
    setAddNodeTypeState(type);
  }

  async function addNodeToDatabase(x: number, z: number) {
    setSaving(true);
    setSaveError(null);
    setSaveMessage(null);
    try {
      const suffix = Date.now().toString(36);
      const code =
        addNodeType === "building_access"
          ? `nav-acc-${suffix}`
          : `nav-int-${suffix}`;
      await createNavigationNode({
        code,
        name: addNodeType === "building_access" ? "Acceso" : "Nodo",
        node_type: addNodeType,
        x: round4(x),
        y: 0,
        z: round4(z),
        metadata: { source: "admin-editor" },
      });
      setRefreshKey((v) => v + 1);
      setSaveMessage(`Nodo creado en x:${x.toFixed(1)} z:${z.toFixed(1)}`);
    } catch (error) {
      setSaveError(error instanceof Error ? error.message : "No se pudo crear el nodo");
    } finally {
      setSaving(false);
    }
  }

  function setEditSelNode(node: NavigationNode | null) {
    setEditSelNodeState(node);
    setEditConnectMode(false);
  }

  function startEditConnect() {
    setEditConnectMode(true);
  }

  async function connectEditNodes(target: NavigationNode) {
    if (!editSelNode) return;
    setSaving(true);
    setSaveError(null);
    setSaveMessage(null);
    try {
      const distance = Math.hypot(
        Number(editSelNode.x) - Number(target.x),
        Number(editSelNode.z) - Number(target.z)
      );
      await createNavigationEdge({
        from_node_id: editSelNode.id,
        to_node_id: target.id,
        path_type: connectEdgePathType,
        is_bidirectional: true,
        is_accessible: true,
        metadata: { source: "admin-editor", distance: distance.toFixed(2) },
      });
      setEditConnectMode(false);
      setRefreshKey((v) => v + 1);
      setSaveMessage(`Arista creada: ${editSelNode.code} ↔ ${target.code}`);
    } catch (error) {
      setSaveError(error instanceof Error ? error.message : "No se pudo crear la arista");
    } finally {
      setSaving(false);
    }
  }

  async function deleteEditNode() {
    if (!editSelNode) return;
    setSaving(true);
    setSaveError(null);
    setSaveMessage(null);
    try {
      await deleteNavigationNode(editSelNode.id);
      setEditSelNodeState(null);
      setEditConnectMode(false);
      setRefreshKey((v) => v + 1);
      setSaveMessage("Nodo eliminado.");
    } catch (error) {
      setSaveError(error instanceof Error ? error.message : "No se pudo eliminar el nodo");
    } finally {
      setSaving(false);
    }
  }

  function clearDraft() {
    setActivePath(null);
    setCompletedPaths([]);
    setEntranceNodes([]);
    setConnectingFromId(null);
    setConnectingToId(null);
    setEditSelNodeState(null);
    setEditConnectMode(false);
    setEditSubModeState("select");
  }

  async function resetAllNavigation() {
    setSaving(true);
    setSaveError(null);
    setSaveMessage(null);
    try {
      await resetAllNavigationService();
      clearDraft();
      setRefreshKey((v) => v + 1);
      setSaveMessage("Grafo limpiado. Tablas vacías.");
    } catch (error) {
      setSaveError(error instanceof Error ? error.message : "No se pudo limpiar el grafo");
    } finally {
      setSaving(false);
    }
  }

  return {
    nodeType,
    activePath,
    completedPaths,
    entranceNodes,
    draftSql,
    availableNodes,
    availableEdges,
    selectedBuilding,
    edgePathType,
    edgeBidirectional,
    saving,
    saveError,
    saveMessage,
    canFinalizePath,
    setNodeType,
    setSelectedBuilding,
    setEdgePathType,
    setEdgeBidirectional,
    extendPath,
    finalizePath,
    addEntranceNode,
    saveDraftToDatabase,
    deleteExistingNode,
    deleteExistingEdge,
    undoLast,
    clearDraft,
    connectingFromId,
    connectingToId,
    connectEdgePathType,
    setConnectingFromId,
    setConnectingToId,
    saveCurrentConnection,
    setConnectEdgePathType,
    editSelNode,
    editConnectMode,
    editSubMode,
    addNodeType,
    setEditSelNode,
    startEditConnect,
    connectEditNodes,
    deleteEditNode,
    setEditSubMode,
    setAddNodeType,
    addNodeToDatabase,
    resetAllNavigation,
  };
}

// â”€â”€â”€ 3D Layer â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

type NavigationDraftEditorLayerProps = {
  active: boolean;
  controls: DraftEditorControls;
};

export function NavigationDraftEditorLayer({
  active,
  controls,
}: NavigationDraftEditorLayerProps) {
  const planeRef = useRef<THREE.Mesh>(null);
  const { camera, pointer, raycaster } = useThree();
  const pointerStartRef = useRef<{ clientX: number; clientY: number } | null>(null);

  const {
    nodeType,
    activePath,
    completedPaths,
    entranceNodes,
    availableNodes,
    availableEdges,
    extendPath,
    addEntranceNode,
    connectingFromId,
    connectingToId,
    setConnectingFromId,
    setConnectingToId,
    editSelNode,
    editConnectMode,
    editSubMode,
    setEditSelNode,
    connectEditNodes,
    addNodeToDatabase,
  } = controls;

  function handlePlanePointerDown(event: ThreeEvent<PointerEvent>) {
    if (!active || !planeRef.current) return;
    if (event.button !== 0) return;
    event.stopPropagation();
    pointerStartRef.current = {
      clientX: event.nativeEvent.clientX,
      clientY: event.nativeEvent.clientY,
    };
  }

  function handlePlanePointerUp(event: ThreeEvent<PointerEvent>) {
    if (!active || !planeRef.current || !pointerStartRef.current) return;
    event.stopPropagation();
    const start = pointerStartRef.current;
    pointerStartRef.current = null;
    const movement = Math.hypot(
      event.nativeEvent.clientX - start.clientX,
      event.nativeEvent.clientY - start.clientY
    );
    if (movement > MAX_CLICK_MOVEMENT_PX) return;
    raycaster.setFromCamera(pointer, camera);
    const worldPoint = new THREE.Vector3();
    if (!raycaster.ray.intersectPlane(GROUND_PLANE, worldPoint)) return;
    const parentPoint =
      planeRef.current.parent?.worldToLocal(worldPoint.clone()) ?? worldPoint.clone();

    if (nodeType === "path") {
      extendPath({ kind: "new", id: Date.now(), x: round4(parentPoint.x), z: round4(parentPoint.z) });
    } else if (nodeType === "entrance") {
      addEntranceNode(parentPoint.x, parentPoint.z);
    } else if (nodeType === "edit" && editSubMode === "add-node") {
      addNodeToDatabase(parentPoint.x, parentPoint.z);
    }
  }

  if (!active) return null;

  // Puntos de la ruta activa para dibujar la lÃ­nea de preview
  const activeLinePoints = activePath
    ? activePath.nodes.map((n) => new THREE.Vector3(n.x, DRAFT_Y + 0.3, n.z))
    : [];

  return (
    <>
      {/* Plano invisible de captura de clics */}
      <mesh
        ref={planeRef}
        position={[0, DRAFT_Y - 0.15, 0]}
        rotation={[-Math.PI / 2, 0, 0]}
        onPointerDown={handlePlanePointerDown}
        onPointerUp={handlePlanePointerUp}
      >
        <planeGeometry args={[DRAFT_PLANE_SIZE, DRAFT_PLANE_SIZE]} />
        <meshBasicMaterial transparent opacity={0} depthWrite={false} />
      </mesh>

      {/* Nodos existentes de la BD â€” clickeables para conectar caminos */}
      {nodeType === "path" &&
        availableNodes.map((node) => (
          <group key={node.id} position={[Number(node.x), DRAFT_Y, Number(node.z)]}>
            <mesh
              onPointerDown={(e) => {
                e.stopPropagation();
                extendPath({
                  kind: "existing",
                  nodeId: node.id,
                  code: node.code,
                  x: Number(node.x),
                  z: Number(node.z),
                });
              }}
            >
              <sphereGeometry args={[0.75, 10, 10]} />
              <meshBasicMaterial color="#2563eb" transparent opacity={0.55} />
            </mesh>
          </group>
        ))}

      {/* Caminos completados */}
      {completedPaths.map((path) => {
        const points = path.nodes.map(
          (n) => new THREE.Vector3(n.x, DRAFT_Y + 0.3, n.z)
        );
        return (
          <group key={path.id}>
            {points.length >= 2 && (
              <Line points={points} color="#22c55e" lineWidth={3} transparent opacity={0.85} />
            )}
            {path.nodes.map((node, ni) => (
              <mesh key={ni} position={[node.x, DRAFT_Y + 0.15, node.z]}>
                <sphereGeometry args={[0.9, 14, 14]} />
                <meshBasicMaterial color="#16a34a" />
              </mesh>
            ))}
          </group>
        );
      })}

      {/* Camino activo */}
      {activePath && (
        <group>
          {activeLinePoints.length >= 2 && (
            <Line
              points={activeLinePoints}
              color="#f97316"
              lineWidth={4}
              transparent
              opacity={0.9}
            />
          )}
          {activePath.nodes.map((node, ni) => {
            const isLast = ni === activePath.nodes.length - 1;
            return (
              <group key={ni} position={[node.x, DRAFT_Y + 0.15, node.z]}>
                <mesh>
                  <sphereGeometry args={[isLast ? 1.4 : 1.0, 14, 14]} />
                  <meshBasicMaterial color={isLast ? "#facc15" : "#f97316"} />
                </mesh>
                {isLast && (
                  <Html position={[0, 3.2, 0]} center>
                    <div className="ito-nav-debug-label ito-nav-debug-label--draft">
                      <strong>Ãšltimo nodo</strong>
                      <span>
                        x {node.x.toFixed(1)}, z {node.z.toFixed(1)}
                      </span>
                    </div>
                  </Html>
                )}
              </group>
            );
          })}
        </group>
      )}

      {/* Nodos de entrada a edificio */}
      {entranceNodes.map((node, i) => (
        <group key={node.id} position={[node.x, DRAFT_Y + 0.15, node.z]}>
          <mesh>
            <sphereGeometry args={[1.1, 14, 14]} />
            <meshBasicMaterial color="#f43f5e" />
          </mesh>
          {i === entranceNodes.length - 1 && (
            <Html position={[0, 3.2, 0]} center>
              <div className="ito-nav-debug-label ito-nav-debug-label--snap">
                <strong>{node.buildingName}</strong>
                <span>
                  x {node.x.toFixed(1)}, z {node.z.toFixed(1)}
                </span>
              </div>
            </Html>
          )}
        </group>
      ))}

      {/* ── Modo Conectar ── origen → destino → guardar */}
      {nodeType === "connect" &&
        availableNodes.map((node) => {
          const isFrom = node.id === connectingFromId;
          const isTo = node.id === connectingToId;
          const color = isFrom
            ? "#facc15"
            : isTo
              ? "#22d3ee"
              : node.node_type === "building_access"
                ? "#f43f5e"
                : "#2563eb";
          return (
            <group key={node.id} position={[Number(node.x), DRAFT_Y + 0.15, Number(node.z)]}>
              <mesh
                onPointerDown={(e) => {
                  e.stopPropagation();
                  if (!connectingFromId) {
                    setConnectingFromId(node.id);
                    setConnectingToId(null);
                  } else if (isFrom) {
                    setConnectingFromId(null);
                    setConnectingToId(null);
                  } else {
                    setConnectingToId(node.id);
                  }
                }}
              >
                <sphereGeometry args={[isFrom || isTo ? 1.4 : 1.0, 14, 14]} />
                <meshBasicMaterial color={color} />
              </mesh>
              {isFrom && (
                <Html position={[0, 3.5, 0]} center>
                  <div className="ito-nav-debug-label ito-nav-debug-label--snap">
                    <strong>Origen</strong><span>{node.code}</span>
                  </div>
                </Html>
              )}
              {isTo && (
                <Html position={[0, 3.5, 0]} center>
                  <div className="ito-nav-debug-label ito-nav-debug-label--draft">
                    <strong>Destino</strong><span>{node.code}</span>
                  </div>
                </Html>
              )}
            </group>
          );
        })}

      {/* Preview línea origen→destino */}
      {nodeType === "connect" && connectingFromId && connectingToId && (() => {
        const from = availableNodes.find((n) => n.id === connectingFromId);
        const to = availableNodes.find((n) => n.id === connectingToId);
        if (!from || !to) return null;
        return (
          <Line
            points={[
              new THREE.Vector3(Number(from.x), DRAFT_Y + 0.5, Number(from.z)),
              new THREE.Vector3(Number(to.x), DRAFT_Y + 0.5, Number(to.z)),
            ]}
            color="#22d3ee"
            lineWidth={4}
            transparent
            opacity={0.85}
          />
        );
      })()}

      {/* ── Modo Editar ── seleccionar nodo, conectar, eliminar nodo/arista */}
      {nodeType === "edit" &&
        availableEdges.map((edge) => {
          const from = availableNodes.find((n) => n.id === edge.from_node_id);
          const to = availableNodes.find((n) => n.id === edge.to_node_id);
          if (!from || !to) return null;
          const isRelated =
            editSelNode?.id === edge.from_node_id || editSelNode?.id === edge.to_node_id;
          return (
            <Line
              key={edge.id}
              points={[
                new THREE.Vector3(Number(from.x), DRAFT_Y + 0.2, Number(from.z)),
                new THREE.Vector3(Number(to.x), DRAFT_Y + 0.2, Number(to.z)),
              ]}
              color={isRelated ? "#f97316" : "#4b5563"}
              lineWidth={isRelated ? 3 : 1.5}
              transparent
              opacity={isRelated ? 0.95 : 0.35}
            />
          );
        })}

      {nodeType === "edit" &&
        availableNodes.map((node) => {
          const isSelected = editSelNode?.id === node.id;
          const isConnectTarget = editConnectMode && !isSelected;
          const color = isSelected
            ? "#facc15"
            : isConnectTarget
              ? "#22d3ee"
              : node.node_type === "building_access"
                ? "#f43f5e"
                : "#6366f1";
          return (
            <group key={node.id} position={[Number(node.x), DRAFT_Y + 0.15, Number(node.z)]}>
              <mesh
                onPointerDown={(e) => {
                  e.stopPropagation();
                  if (editConnectMode && editSelNode && !isSelected) {
                    connectEditNodes(node);
                  } else {
                    setEditSelNode(isSelected ? null : node);
                  }
                }}
              >
                <sphereGeometry args={[isSelected ? 1.6 : 1.1, 14, 14]} />
                <meshBasicMaterial color={color} />
              </mesh>
              {isSelected && (
                <Html position={[0, 4.5, 0]} center>
                  <div className="ito-nav-debug-label ito-nav-debug-label--snap">
                    <strong>{node.code}</strong>
                    <span>{node.node_type}</span>
                  </div>
                </Html>
              )}
            </group>
          );
        })}
    </>
  );
}

// â”€â”€â”€ 2D Panel â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

type NavigationDraftEditorPanelProps = {
  controls: DraftEditorControls;
  buildings: Building[];
};

export function NavigationDraftEditorPanel({
  controls,
  buildings,
}: NavigationDraftEditorPanelProps) {
  const {
    nodeType,
    activePath,
    completedPaths,
    entranceNodes,
    draftSql,
    selectedBuilding,
    edgePathType,
    edgeBidirectional,
    canFinalizePath,
    availableNodes,
    availableEdges,
    saving,
    saveError,
    saveMessage,
  } = controls;
  const [nodeToDelete, setNodeToDelete] = useState("");
  const [edgeToDelete, setEdgeToDelete] = useState("");

  const totalPathNodes = [
    ...completedPaths.flatMap((p) => p.nodes),
    ...(activePath?.nodes ?? []),
  ].filter((n) => n.kind === "new").length;

  const statusText = (() => {
    if (nodeType === "path") {
      if (!activePath) {
        return completedPaths.length > 0
          ? `${completedPaths.length} camino${completedPaths.length > 1 ? "s" : ""} terminado${completedPaths.length > 1 ? "s" : ""}. Haz clic para iniciar otro.`
          : "Haz clic en el mapa para iniciar un camino.";
      }
      const n = activePath.nodes.length;
      return n === 1
        ? "1 nodo colocado. Sigue haciendo clic para extender."
        : `${n} nodos. ContinÃºa o finaliza el camino.`;
    }
    if (nodeType === "connect") return "";
    if (nodeType === "edit") return "";
    if (!selectedBuilding) return "Selecciona un edificio para colocar su entrada.";
    return `Colocando accesos de "${selectedBuilding.name}".`;
  })();

  const hasAnything =
    completedPaths.length > 0 ||
    activePath !== null ||
    entranceNodes.length > 0;

  const statsLabel = (() => {
    const parts = [
      totalPathNodes > 0 && `${totalPathNodes} nodos`,
      completedPaths.length > 0 && `${completedPaths.length} camino${completedPaths.length > 1 ? "s" : ""}`,
      entranceNodes.length > 0 && `${entranceNodes.length} entrada${entranceNodes.length > 1 ? "s" : ""}`,
    ].filter(Boolean);
    return parts.join(" Â· ");
  })();

  return (
    <div className="ito-draft-editor-panel">
      <strong>Editor de navegaciÃ³n</strong>

      {/* Tabs */}
      <div className="ito-draft-editor-panel__tabs">
        <button
          type="button"
          className={nodeType === "path" ? "is-active" : ""}
          onClick={() => controls.setNodeType("path")}
        >
          Dibujar camino
        </button>
        <button
          type="button"
          className={nodeType === "entrance" ? "is-active" : ""}
          onClick={() => controls.setNodeType("entrance")}
        >
          Nodo de entrada
        </button>
        <button
          type="button"
          className={nodeType === "connect" ? "is-active" : ""}
          onClick={() => controls.setNodeType("connect")}
        >
          Conectar
        </button>
        <button
          type="button"
          className={nodeType === "edit" ? "is-active" : ""}
          onClick={() => controls.setNodeType("edit")}
        >
          Editar
        </button>
      </div>

      {/* Opciones de camino */}
      {nodeType === "path" && (
        <div className="ito-draft-editor-panel__edge-options">
          <select
            className="ito-draft-editor-panel__building-select"
            value={edgePathType}
            onChange={(e) => controls.setEdgePathType(e.target.value as EdgePathType)}
          >
            {(["walkway", "hallway", "outdoor", "ramp", "stairs"] as EdgePathType[]).map(
              (t) => (
                <option key={t} value={t}>
                  {EDGE_PATH_LABELS[t]}
                </option>
              )
            )}
          </select>
          <label className="ito-draft-editor-panel__checkbox">
            <input
              type="checkbox"
              checked={edgeBidirectional}
              onChange={(e) => controls.setEdgeBidirectional(e.target.checked)}
            />
            Bidireccional
          </label>
        </div>
      )}

      {/* Selector de edificio */}
      {nodeType === "entrance" && (
        <select
          className="ito-draft-editor-panel__building-select"
          value={selectedBuilding?.id ?? ""}
          onChange={(e) => {
            const b = buildings.find((b) => b.id === e.target.value) ?? null;
            controls.setSelectedBuilding(b ? { id: b.id, name: b.name } : null);
          }}
        >
          <option value="">â€” Selecciona un edificio â€”</option>
          {buildings.map((b) => (
            <option key={b.id} value={b.id}>
              {b.name}
            </option>
          ))}
        </select>
      )}

      {/* Modo Conectar */}
      {nodeType === "connect" && (
        <>
          <select
            className="ito-draft-editor-panel__building-select"
            value={controls.connectEdgePathType}
            onChange={(e) => controls.setConnectEdgePathType(e.target.value as EdgePathType)}
          >
            {(["walkway", "hallway", "outdoor", "ramp", "stairs"] as EdgePathType[]).map((t) => (
              <option key={t} value={t}>{EDGE_PATH_LABELS[t]}</option>
            ))}
          </select>
          <span>
            {!controls.connectingFromId
              ? "Clic en cualquier nodo para seleccionar origen."
              : !controls.connectingToId
                ? "Origen (amarillo) listo. Clic en nodo destino."
                : (() => {
                    const from = controls.availableNodes.find((n) => n.id === controls.connectingFromId);
                    const to = controls.availableNodes.find((n) => n.id === controls.connectingToId);
                    return `${from?.code ?? "?"} ↔ ${to?.code ?? "?"}`;
                  })()}
          </span>

          {controls.connectingFromId && controls.connectingToId && (
            <button
              type="button"
              disabled={saving}
              onClick={controls.saveCurrentConnection}
              style={{ fontWeight: 700 }}
            >
              {saving ? "Guardando..." : "Guardar conexión"}
            </button>
          )}

          {controls.connectingFromId && (
            <button
              type="button"
              onClick={() => {
                controls.setConnectingFromId(null);
                controls.setConnectingToId(null);
              }}
            >
              Cancelar
            </button>
          )}
        </>
      )}

      {/* Modo Editar */}
      {nodeType === "edit" && (() => {
        const sel = controls.editSelNode;
        const isAddMode = controls.editSubMode === "add-node";
        const nodeEdges = sel
          ? availableEdges.filter(
              (e) => e.from_node_id === sel.id || e.to_node_id === sel.id
            )
          : [];
        return (
          <>
            {/* Sub-modo toggle */}
            <div className="ito-draft-editor-panel__tabs" style={{ marginBottom: 4 }}>
              <button
                type="button"
                className={!isAddMode ? "is-active" : ""}
                onClick={() => controls.setEditSubMode("select")}
              >
                Seleccionar
              </button>
              <button
                type="button"
                className={isAddMode ? "is-active" : ""}
                onClick={() => controls.setEditSubMode("add-node")}
              >
                Agregar nodo
              </button>
            </div>

            {/* ── Agregar nodo ── */}
            {isAddMode && (
              <>
                <select
                  className="ito-draft-editor-panel__building-select"
                  value={controls.addNodeType}
                  onChange={(e) =>
                    controls.setAddNodeType(e.target.value as "intersection" | "building_access")
                  }
                >
                  <option value="intersection">Camino (intersection)</option>
                  <option value="building_access">Entrada (building_access)</option>
                </select>
                <span style={{ fontSize: 11 }}>
                  {saving ? "Guardando nodo..." : "Clic en el mapa para colocar y guardar."}
                </span>
              </>
            )}

            {/* ── Seleccionar ── */}
            {!isAddMode && (
              <>
                <select
                  className="ito-draft-editor-panel__building-select"
                  value={controls.connectEdgePathType}
                  onChange={(e) => controls.setConnectEdgePathType(e.target.value as EdgePathType)}
                >
                  {(["walkway", "hallway", "outdoor", "ramp", "stairs"] as EdgePathType[]).map((t) => (
                    <option key={t} value={t}>{EDGE_PATH_LABELS[t]}</option>
                  ))}
                </select>

                {!sel && (
                  <span style={{ fontSize: 11 }}>
                    {availableNodes.length} nodos. Clic en uno para seleccionarlo.
                  </span>
                )}

                {sel && (
                  <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
                    <strong style={{ fontSize: 11 }}>{sel.code}</strong>
                    <span style={{ fontSize: 10, opacity: 0.7 }}>
                      {sel.node_type} · x{Number(sel.x).toFixed(1)} z{Number(sel.z).toFixed(1)}
                    </span>

                    <div className="ito-draft-editor-panel__actions" style={{ marginTop: 2 }}>
                      {!controls.editConnectMode ? (
                        <button type="button" onClick={controls.startEditConnect}>
                          Conectar a otro
                        </button>
                      ) : (
                        <button type="button" onClick={() => controls.setEditSelNode(sel)}>
                          Cancelar
                        </button>
                      )}
                      <button
                        type="button"
                        disabled={saving}
                        onClick={controls.deleteEditNode}
                        style={{ background: "#dc2626" }}
                      >
                        Eliminar nodo
                      </button>
                    </div>

                    {controls.editConnectMode && (
                      <span style={{ fontSize: 10 }}>
                        Clic en nodo destino (cian) para crear arista.
                      </span>
                    )}

                    {nodeEdges.length > 0 && (
                      <div style={{ display: "flex", flexDirection: "column", gap: 3, marginTop: 4 }}>
                        <strong style={{ fontSize: 11 }}>Aristas ({nodeEdges.length}):</strong>
                        {nodeEdges.map((edge) => {
                          const otherId =
                            edge.from_node_id === sel.id ? edge.to_node_id : edge.from_node_id;
                          const other = availableNodes.find((n) => n.id === otherId);
                          return (
                            <div
                              key={edge.id}
                              style={{ display: "flex", alignItems: "center", gap: 4, fontSize: 10 }}
                            >
                              <span style={{ flex: 1 }}>
                                ↔ {other?.code ?? otherId.slice(0, 8)} · {edge.path_type}
                              </span>
                              <button
                                type="button"
                                disabled={saving}
                                style={{ padding: "0 5px", fontSize: 10, background: "#dc2626" }}
                                onClick={() => controls.deleteExistingEdge(edge.id)}
                              >
                                ✕
                              </button>
                            </div>
                          );
                        })}
                      </div>
                    )}

                    {nodeEdges.length === 0 && (
                      <span style={{ fontSize: 10, opacity: 0.6 }}>Sin aristas conectadas.</span>
                    )}
                  </div>
                )}
              </>
            )}
          </>
        );
      })()}

      {/* Estado contextual */}
      {nodeType === "path" && availableNodes.length > 0 && (
        <span>{availableNodes.length} nodos existentes visibles (azules).</span>
      )}
      <span>{statusText}</span>

      {statsLabel && <span>{statsLabel}</span>}
      {saveError && (
        <span className="ito-draft-editor-panel__error">{saveError}</span>
      )}
      {saveMessage && (
        <span className="ito-draft-editor-panel__snap">{saveMessage}</span>
      )}

      {/* Acciones */}
      <div className="ito-draft-editor-panel__actions">
        {canFinalizePath && (
          <button type="button" onClick={controls.finalizePath}>
            Finalizar camino
          </button>
        )}
        <button
          type="button"
          onClick={controls.saveDraftToDatabase}
          disabled={!hasAnything || saving}
        >
          {saving ? "Guardando..." : "Guardar en BD"}
        </button>
        <button type="button" onClick={controls.undoLast} disabled={!hasAnything}>
          Deshacer
        </button>
        <button type="button" onClick={controls.clearDraft} disabled={!hasAnything}>
          Limpiar
        </button>
      </div>

      <div className="ito-draft-editor-panel__edge-options">
        <select
          className="ito-draft-editor-panel__building-select"
          value={nodeToDelete}
          onChange={(event) => setNodeToDelete(event.target.value)}
        >
          <option value="">Eliminar nodo...</option>
          {availableNodes.map((node) => (
            <option key={node.id} value={node.id}>
              {node.code} - {node.name ?? node.node_type}
            </option>
          ))}
        </select>
        <button
          type="button"
          disabled={!nodeToDelete || saving}
          onClick={async () => {
            await controls.deleteExistingNode(nodeToDelete);
            setNodeToDelete("");
          }}
        >
          Eliminar nodo
        </button>
      </div>

      <div className="ito-draft-editor-panel__edge-options">
        <select
          className="ito-draft-editor-panel__building-select"
          value={edgeToDelete}
          onChange={(event) => setEdgeToDelete(event.target.value)}
        >
          <option value="">Eliminar arista...</option>
          {availableEdges.map((edge) => (
            <option key={edge.id} value={edge.id}>
              {edge.from_node_id.slice(0, 8)} - {edge.to_node_id.slice(0, 8)}
            </option>
          ))}
        </select>
        <button
          type="button"
          disabled={!edgeToDelete || saving}
          onClick={async () => {
            await controls.deleteExistingEdge(edgeToDelete);
            setEdgeToDelete("");
          }}
        >
          Eliminar arista
        </button>
      </div>

      <textarea readOnly value={draftSql} aria-label="SQL generado" />
    </div>
  );
}

