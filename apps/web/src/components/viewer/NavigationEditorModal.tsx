import { useMemo, useState } from "react";
import type { CSSProperties } from "react";
import type { Building, EdgePathType } from "@ito-map/shared";
import type { DraftEditorControls } from "./NavigationDraftEditorLayer";

const EDGE_PATH_LABELS: Record<EdgePathType, string> = {
  walkway: "Camino",
  hallway: "Pasillo",
  outdoor: "Exterior",
  ramp: "Rampa",
  stairs: "Escaleras",
};

const S = {
  select: {
    width: "100%",
    padding: "6px 8px",
    background: "#1e293b",
    border: "1px solid #334155",
    color: "#e2e8f0",
    fontSize: 12,
    borderRadius: 6,
    cursor: "pointer",
    outline: "none",
  } satisfies CSSProperties,

  btn: (variant: "primary" | "danger" | "ghost" = "ghost"): CSSProperties => ({
    padding: "7px 12px",
    fontSize: 12,
    borderRadius: 6,
    border: variant === "ghost" ? "1px solid #334155" : "none",
    cursor: "pointer",
    background:
      variant === "primary"
        ? "#ea580c"
        : variant === "danger"
          ? "#dc2626"
          : "#1e293b",
    color: "#f1f5f9",
    fontWeight: 600,
    transition: "opacity 0.1s",
  }),

  subTab: (active: boolean): CSSProperties => ({
    flex: 1,
    padding: "5px 6px",
    fontSize: 11,
    background: active ? "#1e3a5f" : "#1e293b",
    color: active ? "#fdba74" : "#64748b",
    border: active ? "1px solid #ea580c" : "1px solid #334155",
    cursor: "pointer",
    borderRadius: 4,
    fontWeight: active ? 700 : 400,
  }),

  info: (color: string = "#475569"): CSSProperties => ({
    color,
    fontSize: 11,
    padding: "8px 10px",
    background: "#0f1f35",
    borderRadius: 6,
    lineHeight: 1.5,
    border: "1px solid #1e293b",
  }),
};

type Props = {
  controls: DraftEditorControls;
  buildings: Building[];
  onClose: () => void;
};

export function NavigationEditorModal({ controls, buildings, onClose }: Props) {
  const {
    nodeType,
    setNodeType,
    activePath,
    completedPaths,
    entranceNodes,
    availableNodes,
    availableEdges,
    selectedBuilding,
    setSelectedBuilding,
    edgePathType,
    setEdgePathType,
    edgeBidirectional,
    setEdgeBidirectional,
    canFinalizePath,
    finalizePath,
    undoLast,
    clearDraft,
    saving,
    saveError,
    saveMessage,
    saveDraftToDatabase,
    connectingFromId,
    connectingToId,
    setConnectingFromId,
    setConnectingToId,
    connectEdgePathType,
    setConnectEdgePathType,
    saveCurrentConnection,
    editSelNode,
    editConnectMode,
    editSubMode,
    addNodeType,
    setEditSelNode,
    startEditConnect,
    deleteEditNode,
    setEditSubMode,
    setAddNodeType,
    deleteExistingEdge,
    resetAllNavigation,
    deleteOrphanAccessNodes,
    draftEntranceLinks,
    removeEntranceLink,
    saveEntranceLinks,
  } = controls;

  const [confirmReset, setConfirmReset] = useState(false);
  const [confirmOrphan, setConfirmOrphan] = useState(false);

  const hasAnything =
    completedPaths.length > 0 || activePath !== null || entranceNodes.length > 0;

  const connectedNodeIds = useMemo(() => {
    const ids = new Set<string>();
    for (const edge of availableEdges) {
      ids.add(edge.from_node_id);
      ids.add(edge.to_node_id);
    }
    return ids;
  }, [availableEdges]);

  const isolatedCount = useMemo(
    () => availableNodes.filter((n) => !connectedNodeIds.has(n.id)).length,
    [availableNodes, connectedNodeIds]
  );

  const tabs = [
    { id: "path" as const, label: "Caminos" },
    { id: "connect" as const, label: "Conectar" },
    { id: "edit" as const, label: "Nodos" },
    { id: "entrance" as const, label: "Entradas" },
  ];

  const tabStyle = (active: boolean): CSSProperties => ({
    flex: 1,
    padding: "9px 4px",
    fontSize: 11,
    fontWeight: active ? 700 : 400,
    background: active ? "#1e3a5f" : "transparent",
    color: active ? "#fdba74" : "#64748b",
    border: "none",
    cursor: "pointer",
    borderBottom: active ? "2px solid #f97316" : "2px solid transparent",
    transition: "all 0.12s",
    letterSpacing: "0.02em",
  });

  const nodeEdges = editSelNode
    ? availableEdges.filter(
        (e) => e.from_node_id === editSelNode.id || e.to_node_id === editSelNode.id
      )
    : [];

  return (
    <div
      style={{
        position: "absolute",
        inset: 0,
        zIndex: 50,
        display: "flex",
        pointerEvents: "none",
      }}
    >
      {/* ── Left panel ── */}
      <div
        style={{
          width: 320,
          display: "flex",
          flexDirection: "column",
          background: "#0b1628",
          pointerEvents: "auto",
          boxShadow: "4px 0 32px rgba(0,0,0,0.6)",
          overflow: "hidden",
          userSelect: "none",
        }}
      >
        {/* Header */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            padding: "14px 16px 12px",
            borderBottom: "1px solid #1a2d4a",
            background: "#07111f",
            flexShrink: 0,
          }}
        >
          <div>
            <div style={{ color: "#f1f5f9", fontWeight: 700, fontSize: 15 }}>
              Editor de Navegación
            </div>
            <div style={{ color: "#475569", fontSize: 11, marginTop: 2 }}>
              {availableNodes.length} nodos &middot; {availableEdges.length} aristas
              {isolatedCount > 0 && (
                <span
                  style={{
                    marginLeft: 6,
                    color: "#f97316",
                    fontWeight: 700,
                    background: "rgba(249,115,22,0.15)",
                    padding: "1px 6px",
                    borderRadius: 4,
                  }}
                >
                  {isolatedCount} sin conexión
                </span>
              )}
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            title="Cerrar editor"
            style={{
              background: "transparent",
              border: "1px solid #334155",
              color: "#94a3b8",
              width: 30,
              height: 30,
              borderRadius: 6,
              cursor: "pointer",
              fontSize: 14,
              fontWeight: 700,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              flexShrink: 0,
            }}
          >
            ✕
          </button>
        </div>

        {/* Tabs */}
        <div
          style={{
            display: "flex",
            borderBottom: "1px solid #1a2d4a",
            flexShrink: 0,
          }}
        >
          {tabs.map((tab) => (
            <button
              key={tab.id}
              type="button"
              style={tabStyle(nodeType === tab.id)}
              onClick={() => setNodeType(tab.id)}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Tab content */}
        <div
          style={{
            flex: 1,
            overflowY: "auto",
            padding: "14px 16px",
            display: "flex",
            flexDirection: "column",
            gap: 10,
          }}
        >
          {/* ══ CAMINOS ══ */}
          {nodeType === "path" && (
            <>
              <div style={{ color: "#64748b", fontSize: 11, fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.06em" }}>
                Tipo de arista
              </div>
              <select
                value={edgePathType}
                onChange={(e) => setEdgePathType(e.target.value as EdgePathType)}
                style={S.select}
              >
                {(["walkway", "hallway", "outdoor", "ramp", "stairs"] as EdgePathType[]).map(
                  (t) => (
                    <option key={t} value={t}>
                      {EDGE_PATH_LABELS[t]}
                    </option>
                  )
                )}
              </select>

              <label
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 8,
                  color: "#94a3b8",
                  fontSize: 12,
                  cursor: "pointer",
                }}
              >
                <input
                  type="checkbox"
                  checked={edgeBidirectional}
                  onChange={(e) => setEdgeBidirectional(e.target.checked)}
                />
                Bidireccional
              </label>

              <div style={S.info()}>
                {!activePath
                  ? completedPaths.length > 0
                    ? `${completedPaths.length} camino${completedPaths.length > 1 ? "s" : ""} finalizado${completedPaths.length > 1 ? "s" : ""}. Haz clic para iniciar otro.`
                    : "Haz clic en el mapa para iniciar un camino."
                  : activePath.nodes.length === 1
                    ? "1 nodo colocado. Sigue haciendo clic para extender."
                    : `${activePath.nodes.length} nodos. Continúa o finaliza el camino.`}
              </div>

              {availableNodes.length > 0 && (
                <div style={{ color: "#334155", fontSize: 11 }}>
                  {availableNodes.length} nodos existentes visibles (azul).
                </div>
              )}

              <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                {canFinalizePath && (
                  <button
                    type="button"
                    style={{ ...S.btn("primary"), width: "100%" }}
                    onClick={finalizePath}
                  >
                    Finalizar camino
                  </button>
                )}
                <button
                  type="button"
                  style={{ ...S.btn("primary"), width: "100%", opacity: !hasAnything || saving ? 0.5 : 1 }}
                  disabled={!hasAnything || saving}
                  onClick={saveDraftToDatabase}
                >
                  {saving ? "Guardando..." : "Guardar en BD"}
                </button>
                <div style={{ display: "flex", gap: 6 }}>
                  <button
                    type="button"
                    style={{ ...S.btn(), flex: 1, opacity: !hasAnything ? 0.4 : 1 }}
                    disabled={!hasAnything}
                    onClick={undoLast}
                  >
                    Deshacer
                  </button>
                  <button
                    type="button"
                    style={{ ...S.btn(), flex: 1, opacity: !hasAnything ? 0.4 : 1 }}
                    disabled={!hasAnything}
                    onClick={clearDraft}
                  >
                    Limpiar borrador
                  </button>
                </div>
              </div>
            </>
          )}

          {/* ══ CONECTAR ══ */}
          {nodeType === "connect" && (
            <>
              <div style={{ color: "#64748b", fontSize: 11, fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.06em" }}>
                Tipo de conexión
              </div>
              <select
                value={connectEdgePathType}
                onChange={(e) => setConnectEdgePathType(e.target.value as EdgePathType)}
                style={S.select}
              >
                {(["walkway", "hallway", "outdoor", "ramp", "stairs"] as EdgePathType[]).map(
                  (t) => (
                    <option key={t} value={t}>
                      {EDGE_PATH_LABELS[t]}
                    </option>
                  )
                )}
              </select>

              <div
                style={S.info(
                  connectingFromId && connectingToId
                    ? "#22d3ee"
                    : connectingFromId
                      ? "#facc15"
                      : "#475569"
                )}
              >
                {!connectingFromId
                  ? "Haz clic en un nodo para seleccionar el origen."
                  : !connectingToId
                    ? "Origen (amarillo) listo. Haz clic en el nodo destino."
                    : (() => {
                        const from = availableNodes.find((n) => n.id === connectingFromId);
                        const to = availableNodes.find((n) => n.id === connectingToId);
                        return `Conexión: ${from?.code ?? "?"} ↔ ${to?.code ?? "?"}`;
                      })()}
              </div>

              {connectingFromId && connectingToId && (
                <button
                  type="button"
                  style={{ ...S.btn("primary"), width: "100%", opacity: saving ? 0.5 : 1 }}
                  disabled={saving}
                  onClick={saveCurrentConnection}
                >
                  {saving ? "Guardando..." : "Guardar conexión"}
                </button>
              )}

              {connectingFromId && (
                <button
                  type="button"
                  style={{ ...S.btn(), width: "100%" }}
                  onClick={() => {
                    setConnectingFromId(null);
                    setConnectingToId(null);
                  }}
                >
                  Cancelar selección
                </button>
              )}
            </>
          )}

          {/* ══ NODOS ══ */}
          {nodeType === "edit" && (
            <>
              {/* Sub-tabs */}
              <div style={{ display: "flex", gap: 6 }}>
                <button
                  type="button"
                  style={S.subTab(editSubMode === "select")}
                  onClick={() => setEditSubMode("select")}
                >
                  Seleccionar
                </button>
                <button
                  type="button"
                  style={S.subTab(editSubMode === "add-node")}
                  onClick={() => setEditSubMode("add-node")}
                >
                  Agregar nodo
                </button>
              </div>

              {/* Agregar nodo */}
              {editSubMode === "add-node" && (
                <>
                  <select
                    value={addNodeType}
                    onChange={(e) =>
                      setAddNodeType(e.target.value as "intersection" | "entrance")
                    }
                    style={S.select}
                  >
                    <option value="intersection">Intersección (camino)</option>
                    <option value="entrance">Acceso a edificio</option>
                  </select>
                  <div style={S.info()}>
                    {saving
                      ? "Guardando nodo..."
                      : "Haz clic en el mapa para colocar y guardar."}
                  </div>
                </>
              )}

              {/* Seleccionar */}
              {editSubMode === "select" && (
                <>
                  <div style={{ color: "#64748b", fontSize: 11, fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.06em" }}>
                    Tipo de arista al conectar
                  </div>
                  <select
                    value={connectEdgePathType}
                    onChange={(e) =>
                      setConnectEdgePathType(e.target.value as EdgePathType)
                    }
                    style={S.select}
                  >
                    {(["walkway", "hallway", "outdoor", "ramp", "stairs"] as EdgePathType[]).map(
                      (t) => (
                        <option key={t} value={t}>
                          {EDGE_PATH_LABELS[t]}
                        </option>
                      )
                    )}
                  </select>

                  {!editSelNode ? (
                    <div style={S.info()}>
                      {availableNodes.length} nodos disponibles. Haz clic en uno para seleccionarlo.
                      {isolatedCount > 0 && (
                        <span style={{ display: "block", marginTop: 6, color: "#f97316", fontWeight: 600 }}>
                          ⚠ {isolatedCount} nodo{isolatedCount !== 1 ? "s" : ""} sin conexiones (naranja en el mapa).
                        </span>
                      )}
                    </div>
                  ) : (
                    <div
                      style={{
                        display: "flex",
                        flexDirection: "column",
                        gap: 8,
                      }}
                    >
                      {/* Node card */}
                      <div
                        style={{
                          padding: "10px 12px",
                          background: "#0f1f35",
                          borderRadius: 8,
                          borderLeft: "3px solid #facc15",
                        }}
                      >
                        <div
                          style={{
                            color: "#facc15",
                            fontWeight: 700,
                            fontSize: 13,
                          }}
                        >
                          {editSelNode.code}
                        </div>
                        <div
                          style={{
                            color: "#64748b",
                            fontSize: 11,
                            marginTop: 3,
                          }}
                        >
                          {editSelNode.node_type} &middot; x
                          {Number(editSelNode.x).toFixed(2)} z
                          {Number(editSelNode.z).toFixed(2)}
                        </div>
                      </div>

                      {/* Actions */}
                      <div style={{ display: "flex", gap: 6 }}>
                        <button
                          type="button"
                          style={{ ...S.btn(), flex: 1 }}
                          onClick={() => setEditSelNode(null)}
                        >
                          Deseleccionar
                        </button>
                        <button
                          type="button"
                          style={{
                            ...S.btn("danger"),
                            flex: 1,
                            opacity: saving ? 0.5 : 1,
                          }}
                          disabled={saving}
                          onClick={deleteEditNode}
                        >
                          Eliminar nodo
                        </button>
                      </div>

                      {!editConnectMode ? (
                        <button
                          type="button"
                          style={{ ...S.btn("primary"), width: "100%" }}
                          onClick={startEditConnect}
                        >
                          Conectar a otro nodo
                        </button>
                      ) : (
                        <>
                          <button
                            type="button"
                            style={{ ...S.btn(), width: "100%" }}
                            onClick={() => setEditSelNode(editSelNode)}
                          >
                            Cancelar conexión
                          </button>
                          <div style={S.info("#22d3ee")}>
                            Haz clic en el nodo destino (cian) para crear la arista.
                          </div>
                        </>
                      )}

                      {/* Edges list */}
                      {nodeEdges.length === 0 ? (
                        <div style={{ color: "#334155", fontSize: 11 }}>
                          Sin aristas conectadas.
                        </div>
                      ) : (
                        <div>
                          <div
                            style={{
                              color: "#64748b",
                              fontSize: 11,
                              marginBottom: 6,
                              fontWeight: 600,
                            }}
                          >
                            Aristas conectadas ({nodeEdges.length})
                          </div>
                          {nodeEdges.map((edge) => {
                            const otherId =
                              edge.from_node_id === editSelNode.id
                                ? edge.to_node_id
                                : edge.from_node_id;
                            const other = availableNodes.find(
                              (n) => n.id === otherId
                            );
                            return (
                              <div
                                key={edge.id}
                                style={{
                                  display: "flex",
                                  alignItems: "center",
                                  gap: 6,
                                  padding: "5px 0",
                                  borderBottom: "1px solid #1a2d4a",
                                }}
                              >
                                <span
                                  style={{
                                    flex: 1,
                                    color: "#94a3b8",
                                    fontSize: 11,
                                  }}
                                >
                                  ↔ {other?.code ?? otherId.slice(0, 8)}{" "}
                                  <span style={{ color: "#475569" }}>
                                    · {edge.path_type}
                                  </span>
                                </span>
                                <button
                                  type="button"
                                  disabled={saving}
                                  style={{
                                    padding: "2px 8px",
                                    background: "#7f1d1d",
                                    border: "none",
                                    color: "#fca5a5",
                                    borderRadius: 4,
                                    cursor: "pointer",
                                    fontSize: 11,
                                    opacity: saving ? 0.5 : 1,
                                  }}
                                  onClick={() => deleteExistingEdge(edge.id)}
                                >
                                  ✕
                                </button>
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  )}
                </>
              )}
            </>
          )}

          {/* ══ ENTRADAS ══ */}
          {nodeType === "entrance" && (
            <>
              <div style={{ color: "#64748b", fontSize: 11, fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.06em" }}>
                Edificio
              </div>
              <select
                value={selectedBuilding?.id ?? ""}
                onChange={(e) => {
                  const b = buildings.find((b) => b.id === e.target.value) ?? null;
                  setSelectedBuilding(b ? { id: b.id, name: b.name } : null);
                }}
                style={S.select}
              >
                <option value="">— Selecciona un edificio —</option>
                {buildings.map((b) => (
                  <option key={b.id} value={b.id}>
                    {b.name}
                  </option>
                ))}
              </select>

              <div style={S.info(selectedBuilding ? "#86efac" : "#475569")}>
                {!selectedBuilding
                  ? "Selecciona un edificio para comenzar."
                  : "Haz clic sobre un nodo verde del mapa para vincularlo como acceso del edificio. Clic de nuevo para desvincular."}
              </div>

              {/* ── Entradas vinculadas a nodos existentes ── */}
              {draftEntranceLinks.length > 0 && (
                <>
                  <div style={{ color: "#64748b", fontSize: 11, fontWeight: 600 }}>
                    Entradas a guardar ({draftEntranceLinks.length})
                  </div>
                  {draftEntranceLinks.map((link) => (
                    <div
                      key={link.id}
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: 6,
                        padding: "5px 8px",
                        background: "#0a2010",
                        borderRadius: 6,
                        fontSize: 11,
                        border: "1px solid #14532d",
                      }}
                    >
                      <span style={{ flex: 1, color: "#86efac" }}>
                        {link.buildingName}
                      </span>
                      <span style={{ color: "#475569", fontSize: 10 }}>
                        {link.nodeCode}
                      </span>
                      <button
                        type="button"
                        disabled={saving}
                        onClick={() => removeEntranceLink(link.id)}
                        style={{
                          padding: "1px 7px",
                          background: "#7f1d1d",
                          border: "none",
                          color: "#fca5a5",
                          borderRadius: 4,
                          cursor: "pointer",
                          fontSize: 11,
                          opacity: saving ? 0.5 : 1,
                        }}
                      >
                        ✕
                      </button>
                    </div>
                  ))}
                  <button
                    type="button"
                    style={{ ...S.btn("primary"), width: "100%", opacity: saving ? 0.5 : 1 }}
                    disabled={saving}
                    onClick={saveEntranceLinks}
                  >
                    {saving ? "Guardando..." : `Guardar ${draftEntranceLinks.length} entrada${draftEntranceLinks.length !== 1 ? "s" : ""}`}
                  </button>
                  <button
                    type="button"
                    style={{ ...S.btn(), width: "100%" }}
                    onClick={clearDraft}
                  >
                    Limpiar
                  </button>
                </>
              )}

              {/* ── Entradas nuevas colocadas en el mapa ── */}
              {entranceNodes.length > 0 && (
                <>
                  <div style={{ color: "#64748b", fontSize: 11, fontWeight: 600, marginTop: 4 }}>
                    Nodos nuevos en borrador ({entranceNodes.length})
                  </div>
                  {entranceNodes.map((en) => (
                    <div
                      key={en.id}
                      style={{
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "space-between",
                        padding: "5px 10px",
                        background: "#0f1f35",
                        borderRadius: 6,
                        fontSize: 11,
                        border: "1px solid #1a2d4a",
                      }}
                    >
                      <span style={{ color: "#94a3b8" }}>{en.buildingName}</span>
                      <span style={{ color: "#475569" }}>
                        x{en.x.toFixed(1)} z{en.z.toFixed(1)}
                      </span>
                    </div>
                  ))}
                  <button
                    type="button"
                    style={{ ...S.btn("primary"), width: "100%", opacity: saving ? 0.5 : 1 }}
                    disabled={saving}
                    onClick={saveDraftToDatabase}
                  >
                    {saving ? "Guardando..." : "Guardar nodos nuevos en BD"}
                  </button>
                  <button
                    type="button"
                    style={{ ...S.btn(), width: "100%" }}
                    onClick={clearDraft}
                  >
                    Limpiar borrador
                  </button>
                </>
              )}
            </>
          )}
        </div>

        {/* ── Danger zone ── */}
        <div
          style={{
            padding: "12px 16px",
            borderTop: "1px solid #1a2d4a",
            flexShrink: 0,
            display: "flex",
            flexDirection: "column",
            gap: 8,
          }}
        >
          {/* Limpiar accesos sin conexión */}
          {!confirmOrphan ? (
            <button
              type="button"
              onClick={() => setConfirmOrphan(true)}
              style={{
                width: "100%",
                padding: "8px",
                background: "transparent",
                border: "1px solid #78350f",
                color: "#fbbf24",
                fontSize: 12,
                borderRadius: 6,
                cursor: "pointer",
                fontWeight: 600,
              }}
            >
              Limpiar accesos sin conexión
            </button>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
              <div
                style={{
                  color: "#fbbf24",
                  fontSize: 11,
                  textAlign: "center",
                  padding: "4px 0",
                }}
              >
                ¿Eliminar todos los accesos sin aristas?
              </div>
              <div style={{ display: "flex", gap: 6 }}>
                <button
                  type="button"
                  style={{ ...S.btn(), flex: 1 }}
                  onClick={() => setConfirmOrphan(false)}
                >
                  Cancelar
                </button>
                <button
                  type="button"
                  style={{
                    ...S.btn("danger"),
                    flex: 1,
                    opacity: saving ? 0.5 : 1,
                    background: "#78350f",
                    borderColor: "#78350f",
                  }}
                  disabled={saving}
                  onClick={async () => {
                    await deleteOrphanAccessNodes();
                    setConfirmOrphan(false);
                  }}
                >
                  {saving ? "..." : "Sí, limpiar"}
                </button>
              </div>
            </div>
          )}

          {!confirmReset ? (
            <button
              type="button"
              onClick={() => setConfirmReset(true)}
              style={{
                width: "100%",
                padding: "8px",
                background: "transparent",
                border: "1px solid #7f1d1d",
                color: "#f87171",
                fontSize: 12,
                borderRadius: 6,
                cursor: "pointer",
                fontWeight: 600,
              }}
            >
              Eliminar todo el grafo
            </button>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
              <div
                style={{
                  color: "#f87171",
                  fontSize: 11,
                  textAlign: "center",
                  padding: "4px 0",
                }}
              >
                ¿Eliminar TODOS los nodos, aristas y entradas?
              </div>
              <div style={{ display: "flex", gap: 6 }}>
                <button
                  type="button"
                  style={{ ...S.btn(), flex: 1 }}
                  onClick={() => setConfirmReset(false)}
                >
                  Cancelar
                </button>
                <button
                  type="button"
                  style={{
                    ...S.btn("danger"),
                    flex: 1,
                    opacity: saving ? 0.5 : 1,
                  }}
                  disabled={saving}
                  onClick={async () => {
                    await resetAllNavigation();
                    setConfirmReset(false);
                  }}
                >
                  {saving ? "..." : "Sí, eliminar todo"}
                </button>
              </div>
            </div>
          )}
        </div>

        {/* ── Status bar ── */}
        {(saveError || saveMessage) && (
          <div
            style={{
              padding: "8px 16px",
              background: saveError ? "#2d0a0a" : "#071a10",
              borderTop: `1px solid ${saveError ? "#7f1d1d" : "#166534"}`,
              color: saveError ? "#fca5a5" : "#86efac",
              fontSize: 11,
              lineHeight: 1.5,
              flexShrink: 0,
            }}
          >
            {saveError || saveMessage}
          </div>
        )}
      </div>
    </div>
  );
}

