import type { CSSProperties } from "react";
import { useNavigate } from "react-router-dom";
import { CampusViewer } from "../../../components/viewer/CampusViewer";
import { useAdminAuthStore } from "../../../store/admin-auth-store";
import { ROUTES } from "../../../types/routes";

export function AdminNavigationPage() {
  const { logout, user } = useAdminAuthStore();
  const navigate = useNavigate();

  function handleLogout() {
    logout();
    void navigate(ROUTES.ADMIN_LOGIN, { replace: true });
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
};
