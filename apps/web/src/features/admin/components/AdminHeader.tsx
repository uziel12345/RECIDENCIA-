import type { CSSProperties } from "react";
import type { AuthUser } from "@ito-map/shared";

export function AdminHeader({
  user,
  onMenuClick,
  onLogout,
}: {
  user: AuthUser | null;
  onMenuClick: () => void;
  onLogout: () => void;
}) {
  return (
    <header style={styles.header}>
      <button type="button" onClick={onMenuClick} style={styles.menuButton}>
        Menu
      </button>

      <div style={styles.userBox}>
        <div>
          <p style={styles.name}>{user?.full_name || user?.username || "Administrador"}</p>
          <p style={styles.role}>{user?.role || "admin"}</p>
        </div>

        <button type="button" onClick={onLogout} style={styles.logoutButton}>
          Cerrar sesion
        </button>
      </div>
    </header>
  );
}

const styles: Record<string, CSSProperties> = {
  header: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    gap: "16px",
    marginBottom: "22px",
  },
  menuButton: {
    border: "1px solid #cbd5e1",
    borderRadius: "14px",
    padding: "10px 14px",
    background: "#ffffff",
    color: "#0f172a",
    fontWeight: 800,
    cursor: "pointer",
  },
  userBox: {
    display: "flex",
    alignItems: "center",
    gap: "14px",
    marginLeft: "auto",
  },
  name: {
    margin: 0,
    color: "#0f172a",
    fontWeight: 800,
    textAlign: "right",
  },
  role: {
    margin: "3px 0 0",
    color: "#64748b",
    fontSize: "13px",
    textAlign: "right",
  },
  logoutButton: {
    border: "1px solid #cbd5e1",
    borderRadius: "14px",
    padding: "10px 14px",
    background: "#ffffff",
    color: "#0f172a",
    fontWeight: 800,
    cursor: "pointer",
  },
};
