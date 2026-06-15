import type { CSSProperties } from "react";
import { useEffect, useState, useCallback, useMemo } from "react";
import {
  getAdminBuildingsApi,
  getNavigationNodesApi,
  getNavigationEdgesApi,
  getBuildingEntrancesApi,
  type Building,
} from "@ito-map/shared";
import { CampusViewer } from "../../../components/viewer/CampusViewer";
import { AdminLayout } from "../components/AdminLayout";
import { getCategoryAccent } from "../../../components/ui/categoryAccent";

const PANEL_WIDTH = 268;

type NavHealth = {
  totalNodes: number;
  totalEdges: number;
  totalEntrances: number;
  isolatedNodes: number;
  buildingsWithoutEntrance: number;
  totalActiveBuildings: number;
};

type CategoryStat = { name: string; color: string; count: number };

export function AdminNavigationPage() {
  const [health, setHealth] = useState<NavHealth | null>(null);
  const [loadingHealth, setLoadingHealth] = useState(false);
  const [panelOpen, setPanelOpen] = useState(true);
  const [buildings, setBuildings] = useState<Building[]>([]);

  const loadHealth = useCallback(async () => {
    setLoadingHealth(true);
    try {
      const [allBuildings, nodes, edges, entrances] = await Promise.all([
        getAdminBuildingsApi(),
        getNavigationNodesApi(),
        getNavigationEdgesApi(),
        getBuildingEntrancesApi(),
      ]);

      setBuildings(allBuildings);

      const connectedIds = new Set<string>();
      for (const edge of edges) {
        connectedIds.add(edge.from_node_id);
        connectedIds.add(edge.to_node_id);
      }

      const buildingsWithEntrance = new Set(entrances.map((e) => e.building_id));
      const activeBuildings = allBuildings.filter((b) => b.is_active);

      setHealth({
        totalNodes: nodes.length,
        totalEdges: edges.length,
        totalEntrances: entrances.length,
        isolatedNodes: nodes.filter((n) => !connectedIds.has(n.id)).length,
        buildingsWithoutEntrance: activeBuildings.filter(
          (b) => !buildingsWithEntrance.has(b.id)
        ).length,
        totalActiveBuildings: activeBuildings.length,
      });
    } catch {
      // estadísticas no críticas, fallo silencioso
    } finally {
      setLoadingHealth(false);
    }
  }, []);

  useEffect(() => {
    void loadHealth();
  }, [loadHealth]);

  const categories = useMemo<CategoryStat[]>(() => {
    const seen = new Map<string, CategoryStat>();
    for (const b of buildings) {
      if (!b.is_active) continue;
      const name = b.category_name || "Otro";
      const accent = getCategoryAccent(b.category_name);
      const color = b.category_color || accent.fg;
      const existing = seen.get(name);
      if (existing) existing.count++;
      else seen.set(name, { name, color, count: 1 });
    }
    return Array.from(seen.values()).sort((a, b) => b.count - a.count);
  }, [buildings]);

  return (
    <AdminLayout contentStyle={s.contentFull}>
      <div style={s.workspace}>

        {/* Botón para reabrir el panel cuando está cerrado */}
        {!panelOpen && (
          <button
            type="button"
            onClick={() => setPanelOpen(true)}
            title="Mostrar panel"
            style={s.openPanelBtn}
          >
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="9 18 15 12 9 6" />
            </svg>
            <span style={s.openPanelLabel}>Panel</span>
          </button>
        )}

        {/* Panel lateral */}
        <aside
          style={{
            ...s.panel,
            width: panelOpen ? PANEL_WIDTH : 0,
            minWidth: panelOpen ? PANEL_WIDTH : 0,
            padding: panelOpen ? "12px 12px 14px" : 0,
            transition: "width 0.22s ease, min-width 0.22s ease, padding 0.22s ease",
          }}
        >
          {/* Cabecera compacta */}
          <div style={s.panelHeader}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#f97316" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0 }}>
              <circle cx="12" cy="12" r="10" />
              <polygon points="16.24 7.76 14.12 14.12 7.76 16.24 9.88 9.88 16.24 7.76" />
            </svg>
            <span style={s.panelTitle}>Editor de grafo</span>
            <button
              type="button"
              onClick={() => setPanelOpen(false)}
              title="Ocultar panel"
              style={s.closePanelBtn}
            >
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="15 18 9 12 15 6" />
              </svg>
            </button>
          </div>

          <div style={s.divider} />

          {/* Herramientas */}
          <div style={s.section}>
            <p style={s.sectionLabel}>Herramientas</p>
            <div style={s.infoCard}>
              <p style={s.infoText}>
                <strong style={s.chip}>Capas</strong> muestra nodos y caminos.{" "}
                <strong style={s.chip}>Problemas</strong> detecta conexiones inusuales.{" "}
                <strong style={s.chip}>Edición</strong> dibuja caminos y entradas.
              </p>
            </div>
          </div>

          {/* Categorías (antes flotante sobre el mapa) */}
          {categories.length > 0 && (
            <>
              <div style={s.divider} />
              <div style={s.section}>
                <p style={s.sectionLabel}>Categorías</p>
                <div style={s.catList}>
                  {categories.map((cat) => (
                    <div key={cat.name} style={s.catRow}>
                      <span style={{ ...s.catDot, background: cat.color }} />
                      <span style={s.catName}>{cat.name}</span>
                      <span style={s.catCount}>{cat.count}</span>
                    </div>
                  ))}
                </div>
              </div>
            </>
          )}

          <div style={s.divider} />

          {/* Salud del grafo */}
          <div style={s.section}>
            <div style={s.sectionRow}>
              <p style={s.sectionLabel}>Salud del grafo</p>
              <button
                type="button"
                onClick={() => void loadHealth()}
                disabled={loadingHealth}
                style={s.refreshBtn}
                title="Actualizar"
              >
                <svg
                  width="12"
                  height="12"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  style={loadingHealth ? { animation: "spin 1s linear infinite" } : undefined}
                >
                  <polyline points="23 4 23 10 17 10" />
                  <path d="M20.49 15a9 9 0 11-2.12-9.36L23 10" />
                </svg>
              </button>
            </div>

            {health === null ? (
              <p style={s.emptyText}>{loadingHealth ? "Cargando..." : "Sin datos"}</p>
            ) : (
              <>
                <div style={s.statsGroup}>
                  <StatCard label="Nodos" value={health.totalNodes} />
                  <StatCard label="Aristas" value={health.totalEdges} />
                  <StatCard label="Entradas" value={health.totalEntrances} />
                </div>
                <div style={s.alertGroup}>
                  <AlertRow label="Nodos aislados" value={health.isolatedNodes} warn={health.isolatedNodes > 0} />
                  <AlertRow label="Sin entrada" value={health.buildingsWithoutEntrance} total={health.totalActiveBuildings} warn={health.buildingsWithoutEntrance > 0} />
                </div>
              </>
            )}
          </div>

          {/* Estado */}
          <div style={s.statusBadge}>
            <span style={s.statusDot} />
            <span style={s.statusText}>Guardado y borradores habilitados</span>
          </div>
        </aside>

        {/* Mapa 3D */}
        <div style={s.mapShell}>
          <CampusViewer
            isMobile={false}
            mobilePanelOpen={false}
            enableAdminTools
            hideCategoryLegend
          />
        </div>
      </div>
    </AdminLayout>
  );
}

function StatCard({ label, value }: { label: string; value: number }) {
  return (
    <div style={sc.card}>
      <span style={sc.value}>{value}</span>
      <span style={sc.label}>{label}</span>
    </div>
  );
}

function AlertRow({ label, value, total, warn }: { label: string; value: number; total?: number; warn: boolean }) {
  return (
    <div style={sa.row}>
      <span style={sa.label}>{label}</span>
      <span style={warn ? sa.warn : sa.ok}>
        {warn ? "⚠ " : "✓ "}
        {total !== undefined ? `${value}/${total}` : value}
      </span>
    </div>
  );
}

const s: Record<string, CSSProperties> = {
  contentFull: { overflow: "hidden", padding: 0, height: "100%" },
  workspace: { display: "flex", height: "100%", overflow: "hidden", position: "relative" },

  /* Panel */
  panel: {
    background: "#131e2e",
    borderRight: "1px solid #1e3050",
    display: "flex",
    flexDirection: "column",
    overflowY: "auto",
    overflowX: "hidden",
    height: "100%",
    flexShrink: 0,
    boxSizing: "border-box",
  },
  panelHeader: {
    display: "flex",
    alignItems: "center",
    gap: 7,
  },
  panelTitle: {
    flex: 1,
    fontSize: 12.5,
    fontWeight: 700,
    color: "#f1f5f9",
    whiteSpace: "nowrap",
    overflow: "hidden",
    textOverflow: "ellipsis",
  },

  /* Botón cerrar panel — visible, con fondo sutil */
  closePanelBtn: {
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    width: 24,
    height: 24,
    border: "1px solid #f97316",
    borderRadius: 6,
    background: "rgba(234,88,12,0.12)",
    color: "#60a5fa",
    cursor: "pointer",
    flexShrink: 0,
  },

  /* Botón abrir panel — tab visible pegado al borde del mapa */
  openPanelBtn: {
    position: "absolute",
    top: "50%",
    left: 0,
    transform: "translateY(-50%)",
    zIndex: 10,
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    gap: 4,
    width: 28,
    paddingTop: 10,
    paddingBottom: 10,
    border: "1px solid #f97316",
    borderLeft: "none",
    borderRadius: "0 8px 8px 0",
    background: "rgba(234,88,12,0.18)",
    backdropFilter: "blur(4px)",
    color: "#fdba74",
    cursor: "pointer",
    boxShadow: "3px 0 12px rgba(234,88,12,0.25)",
  },
  openPanelLabel: {
    fontSize: 9,
    fontWeight: 700,
    color: "#60a5fa",
    textTransform: "uppercase",
    letterSpacing: "0.08em",
    writingMode: "vertical-rl",
  },

  divider: { height: 1, background: "#1e3050", margin: "9px 0" },

  section: { display: "flex", flexDirection: "column", gap: 8 },
  sectionLabel: { margin: 0, fontSize: 10, fontWeight: 700, color: "#475569", textTransform: "uppercase", letterSpacing: "0.08em" },
  sectionRow: { display: "flex", alignItems: "center", justifyContent: "space-between" },

  infoCard: {
    background: "rgba(234,88,12,0.06)",
    border: "1px solid rgba(234,88,12,0.12)",
    borderRadius: 9,
    padding: "9px 11px",
  },
  infoText: { margin: 0, fontSize: 12, color: "#94a3b8", lineHeight: 1.6 },
  chip: {
    display: "inline-block",
    padding: "0px 5px",
    borderRadius: 4,
    background: "rgba(234,88,12,0.15)",
    color: "#fdba74",
    fontWeight: 700,
    fontSize: 11,
  },

  /* Categorías */
  catList: { display: "flex", flexDirection: "column", gap: 4 },
  catRow: { display: "flex", alignItems: "center", gap: 8, padding: "4px 8px", borderRadius: 7, background: "#1a2a40" },
  catDot: { width: 8, height: 8, borderRadius: "50%", flexShrink: 0 },
  catName: { flex: 1, fontSize: 12, color: "#cbd5e1", fontWeight: 500 },
  catCount: { fontSize: 11, fontWeight: 700, color: "#64748b" },

  refreshBtn: {
    display: "flex", alignItems: "center", justifyContent: "center",
    width: 24, height: 24,
    border: "1px solid #334155", borderRadius: 6,
    background: "transparent", color: "#64748b", cursor: "pointer",
  },
  statsGroup: { display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 6 },
  alertGroup: { display: "flex", flexDirection: "column", gap: 5 },
  emptyText: { margin: 0, fontSize: 12, color: "#475569" },

  statusBadge: {
    display: "flex", alignItems: "center", gap: 6,
    padding: "7px 10px",
    background: "rgba(34,197,94,0.07)",
    border: "1px solid rgba(34,197,94,0.14)",
    borderRadius: 8,
    marginTop: "auto",
  },
  statusDot: { width: 6, height: 6, borderRadius: "50%", background: "#22c55e", flexShrink: 0 },
  statusText: { fontSize: 11, color: "#86efac", fontWeight: 500 },

  mapShell: { flex: 1, height: "100%", minHeight: 0, minWidth: 0, overflow: "hidden", position: "relative" },
};

const sc: Record<string, CSSProperties> = {
  card: { background: "#1a2a40", border: "1px solid #1e3050", borderRadius: 9, padding: "9px 0", display: "flex", flexDirection: "column", alignItems: "center", gap: 2 },
  value: { fontSize: 19, fontWeight: 700, color: "#f1f5f9", lineHeight: 1 },
  label: { fontSize: 10, color: "#64748b", fontWeight: 500 },
};

const sa: Record<string, CSSProperties> = {
  row: { display: "flex", justifyContent: "space-between", alignItems: "center", padding: "5px 9px", background: "#1a2a40", borderRadius: 7, border: "1px solid #1e3050" },
  label: { fontSize: 11.5, color: "#94a3b8" },
  ok: { fontSize: 11.5, fontWeight: 700, color: "#22c55e" },
  warn: { fontSize: 11.5, fontWeight: 700, color: "#f59e0b" },
};


