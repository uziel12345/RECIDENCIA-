import type { CSSProperties, ReactNode } from "react";
import { useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { ROLE_PERMISSIONS } from "@ito-map/shared";
import { useAdminAuthStore } from "../../../store/admin-auth-store";
import { ROUTES } from "../../../types/routes";

interface AdminLayoutProps {
  children: ReactNode;
  contentStyle?: CSSProperties;
}

interface NavItem {
  label: string;
  route: string;
  permission?: keyof (typeof ROLE_PERMISSIONS)[keyof typeof ROLE_PERMISSIONS];
  icon: ReactNode;
}

const NAV_ITEMS: NavItem[] = [
  {
    label: "Edificios",
    route: ROUTES.ADMIN_BUILDINGS,
    icon: (
      <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M3 9.5L12 3l9 6.5V20a1 1 0 01-1 1H4a1 1 0 01-1-1V9.5z" />
        <path d="M9 21V12h6v9" />
      </svg>
    ),
  },
  {
    label: "Categorías",
    route: ROUTES.ADMIN_CATEGORIES,
    icon: (
      <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M4 6h16M4 10h16M4 14h16M4 18h16" />
      </svg>
    ),
  },
  {
    label: "Navegación",
    route: ROUTES.ADMIN_NAVIGATION,
    permission: "can_edit_navigation",
    icon: (
      <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="12" r="10" />
        <polygon points="16.24 7.76 14.12 14.12 7.76 16.24 9.88 9.88 16.24 7.76" />
      </svg>
    ),
  },
  {
    label: "Usuarios",
    route: ROUTES.ADMIN_USERS,
    permission: "can_manage_admin_users",
    icon: (
      <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2" />
        <circle cx="9" cy="7" r="4" />
        <path d="M23 21v-2a4 4 0 00-3-3.87M16 3.13a4 4 0 010 7.75" />
      </svg>
    ),
  },
  {
    label: "Alumnos",
    route: ROUTES.ADMIN_STUDENT_LOCATION,
    permission: "can_view_student_location",
    icon: (
      <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M22 10v6M2 10l10-5 10 5-10 5z" />
        <path d="M6 12v5c3 3 9 3 12 0v-5" />
      </svg>
    ),
  },
  {
    label: "Profesores",
    route: ROUTES.ADMIN_PROFESSOR_LOCATION,
    permission: "can_view_professor_location",
    icon: (
      <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M2 3h6a4 4 0 014 4v14a3 3 0 00-3-3H2z" />
        <path d="M22 3h-6a4 4 0 00-4 4v14a3 3 0 013-3h7z" />
      </svg>
    ),
  },
];

const SIDEBAR_FULL = 220;
const SIDEBAR_MINI = 52;

export function AdminLayout({ children, contentStyle }: AdminLayoutProps) {
  const { user, logout } = useAdminAuthStore();
  const navigate = useNavigate();
  const location = useLocation();
  const [collapsed, setCollapsed] = useState(false);
  const [hoveredRoute, setHoveredRoute] = useState<string | null>(null);
  const [tooltip, setTooltip] = useState<{ label: string; y: number } | null>(null);

  const permissions = user ? ROLE_PERMISSIONS[user.role] : null;

  function handleLogout() {
    void logout().then(() => navigate(ROUTES.ADMIN_LOGIN, { replace: true }));
  }

  const visibleNav = NAV_ITEMS.filter(
    (item) => !item.permission || (permissions && permissions[item.permission])
  );

  const initials = user?.full_name
    ? user.full_name.split(" ").slice(0, 2).map((w) => w[0]).join("").toUpperCase()
    : (user?.username?.[0] ?? "A").toUpperCase();

  const sidebarWidth = collapsed ? SIDEBAR_MINI : SIDEBAR_FULL;

  return (
    <div style={s.shell}>
      {/* Tooltip flotante para modo colapsado */}
      {collapsed && tooltip ? (
        <div style={{ ...s.tooltip, top: tooltip.y - 14 }}>
          {tooltip.label}
        </div>
      ) : null}

      <aside
        style={{
          ...s.sidebar,
          width: sidebarWidth,
          minWidth: sidebarWidth,
          transition: "width 0.2s ease, min-width 0.2s ease",
        }}
      >
        {/* Cabecera / brand */}
        <div style={collapsed ? s.brandMini : s.brand}>
          <div style={s.brandIcon}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#3b82f6" strokeWidth="2.5">
              <path d="M3 9.5L12 3l9 6.5V20a1 1 0 01-1 1H4a1 1 0 01-1-1V9.5z" />
            </svg>
          </div>
          {!collapsed && (
            <div style={s.brandText}>
              <p style={s.brandName}>ITO Mapa</p>
              <p style={s.brandSub}>Panel Admin</p>
            </div>
          )}
        </div>

        {/* Botón de colapsar / expandir */}
        <button
          type="button"
          onClick={() => setCollapsed((c) => !c)}
          title={collapsed ? "Expandir menú" : "Colapsar menú"}
          style={collapsed ? s.toggleBtnMini : s.toggleBtn}
        >
          <svg
            width="14"
            height="14"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
            style={{ transform: collapsed ? "rotate(180deg)" : "none", transition: "transform 0.2s ease" }}
          >
            <polyline points="15 18 9 12 15 6" />
          </svg>
        </button>

        <div style={s.divider} />

        {/* Navegación */}
        <nav style={collapsed ? s.navMini : s.nav}>
          {!collapsed && <p style={s.navSection}>Módulos</p>}
          {visibleNav.map((item) => {
            const active = location.pathname === item.route;
            const hovered = hoveredRoute === item.route;
            return (
              <button
                key={item.route}
                type="button"
                onClick={() => navigate(item.route)}
                onMouseEnter={(e) => {
                  setHoveredRoute(item.route);
                  if (collapsed) {
                    const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
                    setTooltip({ label: item.label, y: rect.top + rect.height / 2 });
                  }
                }}
                onMouseLeave={() => {
                  setHoveredRoute(null);
                  setTooltip(null);
                }}
                title={collapsed ? item.label : undefined}
                style={{
                  ...s.navItem,
                  ...(collapsed ? s.navItemMini : {}),
                  ...(active ? s.navItemActive : hovered ? s.navItemHover : {}),
                }}
              >
                <span style={{ ...s.navIcon, ...(active ? s.navIconActive : {}) }}>
                  {item.icon}
                </span>
                {!collapsed && <span style={s.navLabel}>{item.label}</span>}
                {!collapsed && active && <span style={s.activeIndicator} />}
              </button>
            );
          })}
        </nav>

        <div style={s.spacer} />
        <div style={s.divider} />

        {/* Sección de usuario */}
        {collapsed ? (
          <div style={s.userMini}>
            <div style={s.avatar} title={user?.full_name || user?.username}>{initials}</div>
            <button
              type="button"
              onClick={handleLogout}
              title="Cerrar sesión"
              style={s.logoutBtnMini}
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4" />
                <polyline points="16 17 21 12 16 7" />
                <line x1="21" y1="12" x2="9" y2="12" />
              </svg>
            </button>
          </div>
        ) : (
          <div style={s.userSection}>
            <div style={s.avatar}>{initials}</div>
            <div style={s.userMeta}>
              <p style={s.userName}>{user?.full_name || user?.username || "Admin"}</p>
              <p style={s.userRole}>{user?.role ?? "—"}</p>
            </div>
            <button
              type="button"
              onClick={handleLogout}
              title="Cerrar sesión"
              style={s.logoutBtn}
            >
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4" />
                <polyline points="16 17 21 12 16 7" />
                <line x1="21" y1="12" x2="9" y2="12" />
              </svg>
            </button>
          </div>
        )}
      </aside>

      <main style={{ ...s.content, ...contentStyle }}>{children}</main>
    </div>
  );
}

const s: Record<string, CSSProperties> = {
  shell: {
    display: "flex",
    height: "100vh",
    overflow: "hidden",
    background: "#0f172a",
    color: "#f1f5f9",
  },
  sidebar: {
    background: "#1e293b",
    borderRight: "1px solid #334155",
    display: "flex",
    flexDirection: "column",
    padding: "16px 0 14px",
    overflow: "hidden",
    flexShrink: 0,
  },
  brand: {
    display: "flex",
    alignItems: "center",
    gap: 10,
    padding: "0 14px 0 16px",
    marginBottom: 8,
  },
  brandMini: {
    display: "flex",
    justifyContent: "center",
    padding: "0 0 8px",
  },
  brandIcon: {
    width: 32,
    height: 32,
    borderRadius: 9,
    background: "rgba(59,130,246,0.12)",
    border: "1px solid rgba(59,130,246,0.22)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
  },
  brandText: {
    overflow: "hidden",
  },
  brandName: {
    margin: 0,
    fontSize: 13,
    fontWeight: 700,
    color: "#f1f5f9",
    whiteSpace: "nowrap",
  },
  brandSub: {
    margin: 0,
    fontSize: 10.5,
    color: "#64748b",
    fontWeight: 500,
    whiteSpace: "nowrap",
  },
  toggleBtn: {
    display: "flex",
    alignItems: "center",
    justifyContent: "flex-end",
    paddingRight: 10,
    paddingLeft: 10,
    paddingTop: 0,
    paddingBottom: 0,
    marginBottom: 4,
    background: "none",
    border: "none",
    cursor: "pointer",
    color: "#3b82f6",
    width: "100%",
    height: 22,
  },
  toggleBtnMini: {
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    padding: "0",
    marginBottom: 4,
    background: "none",
    border: "none",
    cursor: "pointer",
    color: "#3b82f6",
    width: "100%",
    height: 22,
  },
  divider: {
    height: 1,
    background: "#2d3f55",
    margin: "10px 0",
  },
  nav: {
    display: "flex",
    flexDirection: "column",
    gap: 2,
    padding: "0 8px",
  },
  navMini: {
    display: "flex",
    flexDirection: "column",
    gap: 2,
    padding: "0 6px",
    alignItems: "center",
  },
  navSection: {
    margin: "0 0 5px 8px",
    fontSize: 10,
    fontWeight: 700,
    color: "#475569",
    textTransform: "uppercase",
    letterSpacing: "0.08em",
  },
  navItem: {
    display: "flex",
    alignItems: "center",
    gap: 9,
    padding: "9px 10px",
    borderRadius: 9,
    border: "none",
    background: "transparent",
    color: "#94a3b8",
    cursor: "pointer",
    fontSize: 13.5,
    fontWeight: 500,
    textAlign: "left",
    width: "100%",
    position: "relative",
  },
  navItemMini: {
    justifyContent: "center",
    padding: "9px",
    width: 38,
  },
  navItemHover: {
    background: "rgba(255,255,255,0.05)",
    color: "#cbd5e1",
  },
  navItemActive: {
    background: "rgba(59,130,246,0.13)",
    color: "#f8fafc",
    fontWeight: 600,
  },
  navIcon: {
    display: "flex",
    alignItems: "center",
    color: "#64748b",
    flexShrink: 0,
  },
  navIconActive: {
    color: "#3b82f6",
  },
  navLabel: {
    flex: 1,
    whiteSpace: "nowrap",
  },
  activeIndicator: {
    width: 6,
    height: 6,
    borderRadius: "50%",
    background: "#3b82f6",
    flexShrink: 0,
  },
  spacer: {
    flex: 1,
  },
  userSection: {
    display: "flex",
    alignItems: "center",
    gap: 8,
    padding: "0 10px 0 12px",
  },
  userMini: {
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    gap: 8,
    padding: "0 0 2px",
  },
  avatar: {
    width: 30,
    height: 30,
    borderRadius: 8,
    background: "linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontSize: 11.5,
    fontWeight: 700,
    color: "#fff",
    flexShrink: 0,
    cursor: "default",
  },
  userMeta: {
    flex: 1,
    minWidth: 0,
  },
  userName: {
    margin: 0,
    fontSize: 12,
    fontWeight: 600,
    color: "#e2e8f0",
    whiteSpace: "nowrap",
    overflow: "hidden",
    textOverflow: "ellipsis",
  },
  userRole: {
    margin: 0,
    fontSize: 10.5,
    color: "#64748b",
    whiteSpace: "nowrap",
  },
  logoutBtn: {
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    width: 28,
    height: 28,
    border: "1px solid #334155",
    borderRadius: 7,
    background: "transparent",
    color: "#64748b",
    cursor: "pointer",
    flexShrink: 0,
  },
  logoutBtnMini: {
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    width: 28,
    height: 28,
    border: "1px solid #334155",
    borderRadius: 7,
    background: "transparent",
    color: "#64748b",
    cursor: "pointer",
  },
  content: {
    flex: 1,
    minWidth: 0,
    height: "100%",
    overflowY: "auto",
    background: "#0f172a",
  },
  tooltip: {
    position: "fixed",
    left: SIDEBAR_MINI + 8,
    zIndex: 100,
    background: "#1e293b",
    border: "1px solid #334155",
    borderRadius: 8,
    padding: "6px 12px",
    fontSize: 12.5,
    fontWeight: 600,
    color: "#f1f5f9",
    pointerEvents: "none",
    whiteSpace: "nowrap",
    boxShadow: "0 4px 16px rgba(0,0,0,0.4)",
  },
};
