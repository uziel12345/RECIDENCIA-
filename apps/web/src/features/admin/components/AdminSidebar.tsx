import type { CSSProperties } from "react";
import { Link, useLocation } from "react-router-dom";
import { hasPermission, type AuthPermission, type UserRole } from "@ito-map/shared";
import { ROUTES } from "../../../types/routes";

type NavItem = {
  label: string;
  path: string;
  permission?: AuthPermission;
};

const navItems: NavItem[] = [
  { label: "Dashboard", path: "/admin" },
  { label: "Edificios", path: ROUTES.ADMIN_BUILDINGS, permission: "can_view_buildings" },
  { label: "Usuarios", path: "/admin/users", permission: "can_manage_admin_users" },
  { label: "Navegacion", path: "/admin/navigation", permission: "can_edit_navigation" },
];

export function AdminSidebar({
  role,
  open,
  onClose,
}: {
  role: UserRole | null | undefined;
  open: boolean;
  onClose: () => void;
}) {
  const location = useLocation();
  const visibleItems = navItems.filter(
    (item) => !item.permission || hasPermission(role, item.permission)
  );

  return (
    <aside style={{ ...styles.sidebar, ...(open ? styles.openSidebar : {}) }}>
      <div style={styles.brand}>
        <strong>ITO Admin</strong>
        <button
          type="button"
          onClick={onClose}
          style={{ ...styles.closeButton, display: open ? "inline-flex" : "none" }}
        >
          x
        </button>
      </div>

      <nav style={styles.nav}>
        {visibleItems.map((item) => {
          const active =
            location.pathname === item.path ||
            (item.path !== "/admin" && location.pathname.startsWith(item.path));

          return (
            <Link
              key={item.path}
              to={item.path}
              onClick={onClose}
              style={{ ...styles.link, ...(active ? styles.activeLink : {}) }}
            >
              {item.label}
            </Link>
          );
        })}
      </nav>
    </aside>
  );
}

const styles: Record<string, CSSProperties> = {
  sidebar: {
    width: "260px",
    minHeight: "100vh",
    background: "#ffffff",
    borderRight: "1px solid #e2e8f0",
    padding: "22px",
    boxSizing: "border-box",
    position: "sticky",
    top: 0,
    alignSelf: "start",
  },
  openSidebar: {
    display: "block",
  },
  brand: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    color: "#0f172a",
    fontSize: "18px",
    marginBottom: "24px",
  },
  closeButton: {
    border: "1px solid #cbd5e1",
    borderRadius: "10px",
    background: "#ffffff",
    color: "#0f172a",
    cursor: "pointer",
    alignItems: "center",
    justifyContent: "center",
  },
  nav: {
    display: "grid",
    gap: "8px",
  },
  link: {
    display: "block",
    padding: "11px 12px",
    borderRadius: "14px",
    color: "#334155",
    textDecoration: "none",
    fontWeight: 800,
  },
  activeLink: {
    background: "#dbeafe",
    color: "#1d4ed8",
  },
};
