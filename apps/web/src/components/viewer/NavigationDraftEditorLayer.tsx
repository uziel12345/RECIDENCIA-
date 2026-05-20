import { useEffect, useMemo, useRef, useState } from "react";
import { Html, Line } from "@react-three/drei";
import { useThree, type ThreeEvent } from "@react-three/fiber";
import * as THREE from "three";
import type { Building, EdgePathType, NavigationNode } from "@ito-map/shared";
import { getNavigationNodes } from "../../services/navigation.service";

// ─── Types ───────────────────────────────────────────────────────────────────

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
  nodeType: "path" | "entrance";
  activePath: DraftPath | null;
  completedPaths: DraftPath[];
  entranceNodes: DraftEntranceNode[];
  draftSql: string;
  availableNodes: NavigationNode[];
  selectedBuilding: { id: string; name: string } | null;
  edgePathType: EdgePathType;
  edgeBidirectional: boolean;
  canFinalizePath: boolean;
  setNodeType: (type: "path" | "entrance") => void;
  setSelectedBuilding: (b: { id: string; name: string } | null) => void;
  setEdgePathType: (type: EdgePathType) => void;
  setEdgeBidirectional: (value: boolean) => void;
  extendPath: (item: PathNodeItem) => void;
  finalizePath: () => void;
  addEntranceNode: (x: number, z: number) => void;
  undoLast: () => void;
  clearDraft: () => void;
};

// ─── Constants ────────────────────────────────────────────────────────────────

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

// ─── SQL generation ───────────────────────────────────────────────────────────

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

    // Auto-conectar entrada al nodo de camino más cercano
    const allPathNodes: { code: string; x: number; z: number }[] = [];
    allPaths.forEach((path, pi) => {
      const codeMap = buildNodeCodeMap(path, pi);
      path.nodes.forEach((node) => {
        allPathNodes.push({ code: resolveCode(node, codeMap), x: node.x, z: node.z });
      });
    });

    if (allPathNodes.length > 0) {
      parts.push(`\n-- Conexión entrada → nodo de camino más cercano`);
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

// ─── Hook ─────────────────────────────────────────────────────────────────────

function round4(v: number): number {
  return Number(v.toFixed(4));
}

// eslint-disable-next-line react-refresh/only-export-components
export function useDraftEditor(): DraftEditorControls {
  const [nodeType, setNodeTypeState] = useState<"path" | "entrance">("path");
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

  // Carga nodos existentes de la BD mientras se dibuja en modo camino
  useEffect(() => {
    let cancelled = false;

    if (nodeType !== "path") {
      queueMicrotask(() => {
        if (!cancelled) setAvailableNodes([]);
      });
      return;
    }

    getNavigationNodes().then((nodes) => {
      if (!cancelled) setAvailableNodes(nodes.filter((n) => n.is_active));
    });
    return () => {
      cancelled = true;
    };
  }, [nodeType]);

  const draftSql = useMemo(
    () => buildDraftSql(completedPaths, activePath, entranceNodes),
    [completedPaths, activePath, entranceNodes]
  );

  const canFinalizePath = activePath !== null && activePath.nodes.length >= 2;

  function setNodeType(type: "path" | "entrance") {
    setNodeTypeState(type);
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

  function clearDraft() {
    setActivePath(null);
    setCompletedPaths([]);
    setEntranceNodes([]);
  }

  return {
    nodeType,
    activePath,
    completedPaths,
    entranceNodes,
    draftSql,
    availableNodes,
    selectedBuilding,
    edgePathType,
    edgeBidirectional,
    canFinalizePath,
    setNodeType,
    setSelectedBuilding,
    setEdgePathType,
    setEdgeBidirectional,
    extendPath,
    finalizePath,
    addEntranceNode,
    undoLast,
    clearDraft,
  };
}

// ─── 3D Layer ─────────────────────────────────────────────────────────────────

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
    extendPath,
    addEntranceNode,
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
    } else {
      addEntranceNode(parentPoint.x, parentPoint.z);
    }
  }

  if (!active) return null;

  // Puntos de la ruta activa para dibujar la línea de preview
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

      {/* Nodos existentes de la BD — clickeables para conectar caminos */}
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
                      <strong>Último nodo</strong>
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
    </>
  );
}

// ─── 2D Panel ─────────────────────────────────────────────────────────────────

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
  } = controls;

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
        : `${n} nodos. Continúa o finaliza el camino.`;
    }
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
    return parts.join(" · ");
  })();

  return (
    <div className="ito-draft-editor-panel">
      <strong>Editor de navegación</strong>

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
          <option value="">— Selecciona un edificio —</option>
          {buildings.map((b) => (
            <option key={b.id} value={b.id}>
              {b.name}
            </option>
          ))}
        </select>
      )}

      {/* Estado contextual */}
      {nodeType === "path" && availableNodes.length > 0 && (
        <span>{availableNodes.length} nodos existentes visibles (azules).</span>
      )}
      <span>{statusText}</span>

      {statsLabel && <span>{statsLabel}</span>}

      <span className="ito-draft-editor-panel__error">
        Selección de edificios pausada.
      </span>

      {/* Acciones */}
      <div className="ito-draft-editor-panel__actions">
        {canFinalizePath && (
          <button type="button" onClick={controls.finalizePath}>
            Finalizar camino
          </button>
        )}
        <button type="button" onClick={controls.undoLast} disabled={!hasAnything}>
          Deshacer
        </button>
        <button type="button" onClick={controls.clearDraft} disabled={!hasAnything}>
          Limpiar
        </button>
      </div>

      <textarea readOnly value={draftSql} aria-label="SQL generado" />
    </div>
  );
}
