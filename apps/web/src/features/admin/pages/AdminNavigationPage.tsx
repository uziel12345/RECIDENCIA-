import type { CSSProperties } from "react";
import { useEffect, useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import {
  getAdminBuildingsApi,
  getNavigationNodesApi,
  getNavigationEdgesApi,
  getBuildingEntrancesApi,
} from "@ito-map/shared";
import { CampusViewer } from "../../../components/viewer/CampusViewer";
import { useAdminAuthStore } from "../../../store/admin-auth-store";
import { ROUTES } from "../../../types/routes";

type NavHealth = {
  totalNodes: number;
  totalEdges: number;
  totalEntrances: number;
  isolatedNodes: number;
  buildingsWithoutEntrance: number;
  totalActiveBuildings: number;
};

export function AdminNavigationPage() {
  const { logout, user } = useAdminAuthStore();
  const navigate = useNavigate();
  const [health, setHealth] = useState<NavHealth | null>(null);
  const [loadingHealth, setLoadingHealth] = useState(false);

  const loadHealth = useCallback(async () => {
    setLoadingHealth(true);
    try {
      const [buildings, nodes, edges, entrances] = await Promise.all([
        getAdminBuildingsApi(),
        getNavigationNodesApi(),
        getNavigationEdgesApi(),
        getBuildingEntrancesApi(),
      ]);

      const connectedIds = new Set<string>();
      for (const edge of edges) {
        connectedIds.add(edge.from_node_id);
        connectedIds.add(edge.to_node_id);
      }

      const buildingsWithEntrance = new Set(entrances.map((e) => e.building_id));
      const activeBuildings = buildings.filter((b) => b.is_active);

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

  function handleLogout() {
    void logout().then(() => navigate(ROUTES.ADMIN_LOGIN, { replace: true }));
  }

  return (
    <main style={styles.page}>
      <header style={styles.header}>
        <div>
          <p style={styles.overline}>Panel administrativo</p>
          <h1 style={styles.title}>Navegacion del campus</h1>
          <p style={styles.text}>
            Revisa nodos, aristas y caminos sobre el mapa completo antes de
            aplicar cambios en base de datos.
          </p>
        </div>

        <div style={styles.headerActions}>
          <span style={styles.userBadge}>
            {user?.full_name || user?.username || "Administrador"}
          </span>

          <button
            type="button"
            onClick={() => navigate(ROUTES.ADMIN_BUILDINGS)}
            style={styles.secondaryButton}
          >
            Edificios
          </button>

          <button type="button" onClick={handleLogout} style={styles.secondaryButton}>
            Cerrar sesion
          </button>
        </div>
      </header>

      <section style={styles.workspace}>
        <aside style={styles.sidePanel}>
          <strong style={styles.panelTitle}>Herramientas</strong>
          <p style={styles.panelText}>
            Usa el boton de capas para mostrar todos los nodos y caminos. El
            modo de problemas ayuda a detectar conexiones largas o raras.
          </p>
          <p style={styles.panelText}>
            Usa el boton de edicion para dibujar caminos nuevos o entradas a
            edificios. Ahora puedes guardar el borrador directo en base de datos
            o desactivar nodos y aristas existentes.
          </p>
          <div style={styles.statusBox}>
            <strong>Estado</strong>
            <span>Visualizacion, borradores y guardado habilitados.</span>
            <span>Las eliminaciones desactivan datos para conservar historial.</span>
          </div>

          <div style={styles.healthBox}>
            <div style={styles.healthHeader}>
              <strong style={styles.panelTitle}>Salud del grafo</strong>
              <button
                type="button"
                onClick={() => void loadHealth()}
                disabled={loadingHealth}
                style={styles.refreshBtn}
              >
                {loadingHealth ? "..." : "↻"}
              </button>
            </div>

            {health === null ? (
              <p style={{ ...styles.panelText, color: "#64748b" }}>
                {loadingHealth ? "Cargando..." : "Sin datos"}
              </p>
            ) : (
              <>
                <div style={styles.statRow}>
                  <span style={styles.statLabel}>Nodos</span>
                  <span style={styles.statValue}>{health.totalNodes}</span>
                </div>
                <div style={styles.statRow}>
                  <span style={styles.statLabel}>Aristas</span>
                  <span style={styles.statValue}>{health.totalEdges}</span>
                </div>
                <div style={styles.statRow}>
                  <span style={styles.statLabel}>Entradas</span>
                  <span style={styles.statValue}>{health.totalEntrances}</span>
                </div>

                <div style={styles.divider} />

                <div style={styles.statRow}>
                  <span style={styles.statLabel}>Nodos aislados</span>
                  <span
                    style={
                      health.isolatedNodes > 0
                        ? styles.warnValue
                        : styles.okValue
                    }
                  >
                    {health.isolatedNodes > 0
                      ? `⚠ ${health.isolatedNodes}`
                      : "✓ 0"}
                  </span>
                </div>

                <div style={styles.statRow}>
                  <span style={styles.statLabel}>Edificios sin entrada</span>
                  <span
                    style={
                      health.buildingsWithoutEntrance > 0
                        ? styles.warnValue
                        : styles.okValue
                    }
                  >
                    {health.buildingsWithoutEntrance > 0
                      ? `⚠ ${health.buildingsWithoutEntrance}/${health.totalActiveBuildings}`
                      : `✓ 0/${health.totalActiveBuildings}`}
                  </span>
                </div>
              </>
            )}
          </div>
        </aside>

        <div style={styles.mapShell}>
          <CampusViewer
            isMobile={false}
            mobilePanelOpen={false}
            enableAdminTools
          />
        </div>
      </section>
    </main>
  );
}

const styles: Record<string, CSSProperties> = {
  page: {
    minHeight: "100vh",
    background: "#eaf1f8",
    color: "#0f172a",
    display: "grid",
    gridTemplateRows: "auto 1fr",
  },
  header: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "flex-start",
    gap: 20,
    padding: "18px 22px",
    background: "#ffffff",
    borderBottom: "1px solid #dbe3ef",
    boxShadow: "0 8px 24px rgba(15, 23, 42, 0.06)",
    zIndex: 2,
  },
  headerActions: {
    display: "flex",
    alignItems: "center",
    gap: 10,
    flexWrap: "wrap",
    justifyContent: "flex-end",
  },
  overline: {
    margin: "0 0 5px",
    color: "#2563eb",
    fontSize: 13,
    fontWeight: 900,
  },
  title: {
    margin: 0,
    fontSize: 28,
    lineHeight: 1.1,
  },
  text: {
    margin: "7px 0 0",
    color: "#64748b",
    lineHeight: 1.45,
    maxWidth: 720,
  },
  userBadge: {
    border: "1px solid #dbe3ef",
    borderRadius: 999,
    padding: "9px 12px",
    background: "#f8fafc",
    color: "#334155",
    fontWeight: 800,
    fontSize: 13,
  },
  secondaryButton: {
    border: "1px solid #cbd5e1",
    borderRadius: 12,
    padding: "10px 13px",
    background: "#ffffff",
    color: "#0f172a",
    fontWeight: 850,
    cursor: "pointer",
  },
  workspace: {
    minHeight: 0,
    display: "grid",
    gridTemplateColumns: "320px minmax(0, 1fr)",
    gap: 14,
    padding: 14,
  },
  sidePanel: {
    background: "#ffffff",
    border: "1px solid #dbe3ef",
    borderRadius: 16,
    padding: 18,
    boxShadow: "0 12px 28px rgba(15, 23, 42, 0.08)",
    alignSelf: "start",
  },
  panelTitle: {
    display: "block",
    marginBottom: 10,
    fontSize: 16,
  },
  panelText: {
    margin: "0 0 12px",
    color: "#475569",
    lineHeight: 1.5,
    fontSize: 14,
  },
  statusBox: {
    display: "grid",
    gap: 7,
    marginTop: 14,
    padding: 13,
    borderRadius: 14,
    background: "#eff6ff",
    border: "1px solid #bfdbfe",
    color: "#1e3a8a",
    fontSize: 13,
    lineHeight: 1.35,
  },
  mapShell: {
    minHeight: 0,
    height: "calc(100vh - 112px)",
    overflow: "hidden",
    border: "1px solid #cbd5e1",
    borderRadius: 18,
    background: "#eef4fb",
    boxShadow: "0 18px 42px rgba(15, 23, 42, 0.12)",
  },
  healthBox: {
    marginTop: 16,
    padding: 13,
    borderRadius: 14,
    background: "#f8fafc",
    border: "1px solid #e2e8f0",
  },
  healthHeader: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 10,
  },
  refreshBtn: {
    background: "none",
    border: "1px solid #cbd5e1",
    borderRadius: 8,
    padding: "3px 8px",
    cursor: "pointer",
    fontSize: 14,
    color: "#475569",
  },
  statRow: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    padding: "4px 0",
    fontSize: 13,
  },
  statLabel: {
    color: "#64748b",
  },
  statValue: {
    fontWeight: 700,
    color: "#0f172a",
  },
  okValue: {
    fontWeight: 700,
    color: "#16a34a",
  },
  warnValue: {
    fontWeight: 700,
    color: "#d97706",
  },
  divider: {
    borderTop: "1px solid #e2e8f0",
    margin: "8px 0",
  },
};
