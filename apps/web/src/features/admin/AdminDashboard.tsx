import type { CSSProperties } from "react";
import { Link } from "react-router-dom";
import { hasPermission } from "@ito-map/shared";
import { useAdminAuthStore } from "../../store/admin-auth-store";
import { ROUTES } from "../../types/routes";

export function AdminDashboard() {
  const { user } = useAdminAuthStore();
  const canManageAdminUsers = hasPermission(
    user?.role,
    "can_manage_admin_users"
  );

  return (
    <main style={styles.page}>
      <header style={styles.header}>
        <div>
          <p style={styles.overline}>Panel administrativo</p>
          <h1 style={styles.pageTitle}>Administracion</h1>
          <p style={styles.text}>Selecciona el modulo que quieres gestionar.</p>
        </div>
      </header>

      <section style={styles.grid}>
        <Link to={ROUTES.ADMIN_BUILDINGS} style={styles.card}>
          <h2 style={styles.sectionTitle}>Edificios</h2>
          <p style={styles.text}>Gestion de edificios del mapa.</p>
        </Link>

        {canManageAdminUsers ? (
          <Link to="/admin/users" style={styles.card}>
            <h2 style={styles.sectionTitle}>Usuarios admin</h2>
            <p style={styles.text}>Gestion de usuarios y roles.</p>
          </Link>
        ) : null}
      </section>
    </main>
  );
}

const styles: Record<string, CSSProperties> = {
  page: {
    minHeight: "100vh",
    background: "#f8fafc",
    padding: "28px",
    color: "#0f172a",
  },
  header: {
    marginBottom: "22px",
  },
  overline: {
    margin: "0 0 8px",
    color: "#2563eb",
    fontWeight: 800,
    fontSize: "14px",
  },
  pageTitle: {
    margin: 0,
    fontSize: "32px",
    lineHeight: 1.15,
  },
  text: {
    margin: "8px 0 0",
    color: "#64748b",
    lineHeight: 1.5,
  },
  grid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))",
    gap: "18px",
  },
  card: {
    display: "block",
    background: "#ffffff",
    border: "1px solid #e2e8f0",
    borderRadius: "22px",
    padding: "22px",
    boxShadow: "0 14px 35px rgba(15, 23, 42, 0.08)",
    color: "inherit",
    textDecoration: "none",
  },
  sectionTitle: {
    margin: 0,
    fontSize: "20px",
  },
};
