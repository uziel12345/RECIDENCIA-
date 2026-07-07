import type { CSSProperties, ReactNode } from "react";
import { useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { ROLE_PERMISSIONS } from "@ito-map/shared";
import { useAdminAuthStore } from "../../../store/admin-auth-store";
import { AppFooter } from "../../../components/ui/AppFooter";
import { ROUTES } from "../../../types/routes";
import { useIsMobile } from "../../../hooks/useIsMobile";

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
  const isMobile = useIsMobile();
  const [pinnedOpen, setPinnedOpen] = useState(false);
  const [hoverPreview, setHoverPreview] = useState(false);
  const [hoveredRoute, setHoveredRoute] = useState<string | null>(null);
  const [tooltip, setTooltip] = useState<{ label: string; y: number } | null>(null);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const permissions = user ? ROLE_PERMISSIONS[user.role] : null;

  function handleLogout() {
    void logout().then(() => navigate(ROUTES.ADMIN_LOGIN, { replace: true }));
  }

  const visibleNav = NAV_ITEMS.filter(
    (item) => !item.permission || (permissions && permissions[item.permission])
  );
  const activeNav =
    visibleNav.find(
      (item) =>
        location.pathname === item.route ||
        (item.route === ROUTES.ADMIN_BUILDINGS &&
          location.pathname.startsWith("/admin/buildings/"))
    ) ?? visibleNav[0];

  const initials = user?.full_name
    ? user.full_name.split(" ").slice(0, 2).map((w) => w[0]).join("").toUpperCase()
    : (user?.username?.[0] ?? "A").toUpperCase();

  const expanded = isMobile ? false : pinnedOpen || hoverPreview;
  const collapsed = !expanded;
  const sidebarWidth = isMobile ? "100%" : expanded ? SIDEBAR_FULL : SIDEBAR_MINI;

  return (
    <div style={{ ...s.shell, ...(isMobile ? s.shellMobile : {}) }}>
      {/* Tooltip flotante para modo colapsado */}
      {collapsed && !isMobile && tooltip ? (
        <div style={{ ...s.tooltip, top: tooltip.y - 14 }}>
          {tooltip.label}
        </div>
      ) : null}

      <aside
        onMouseEnter={() => {
          if (!isMobile) setHoverPreview(true);
        }}
        onMouseLeave={() => {
          setHoverPreview(false);
          setHoveredRoute(null);
          setTooltip(null);
        }}
        style={{
          ...s.sidebar,
          ...(isMobile ? s.sidebarMobile : {}),
          width: sidebarWidth,
          minWidth: sidebarWidth,
          ...(isMobile ? { minWidth: 0 } : {}),
          transition: "width 0.22s ease, min-width 0.22s ease",
        }}
      >
        {/* Cabecera / brand */}
        <div style={isMobile ? s.brandMobile : collapsed ? s.brandMini : s.brand}>
          <div style={s.brandIcon}>
            <img src="/ICONO-TEC.jpeg" alt="ITO" style={{ width: 30, height: 30, objectFit: "contain" }} />
          </div>
          {!collapsed && (
            <div style={s.brandText}>
              <p style={s.brandName}>ITO Mapa</p>
              <p style={s.brandSub}>Panel Admin</p>
            </div>
          )}
        </div>

        {isMobile && (
          <div style={s.mobileTitle}>
            <span style={s.mobileTitleKicker}>Estás en</span>
            <strong style={s.mobileTitleText}>{activeNav?.label ?? "Panel"}</strong>
          </div>
        )}

        {isMobile && (
          <button
            type="button"
            onClick={() => setMobileMenuOpen(true)}
            style={s.mobileMenuBtn}
          >
            <span style={s.mobileMenuBtnIcon}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round">
                <line x1="4" y1="7" x2="20" y2="7" />
                <line x1="4" y1="12" x2="20" y2="12" />
                <line x1="4" y1="17" x2="20" y2="17" />
              </svg>
            </span>
            Menú
          </button>
        )}

        {/* Botón de colapsar / expandir */}
        {!isMobile && (
          <button
            type="button"
            onClick={() => {
              setPinnedOpen((current) => !current);
              setTooltip(null);
            }}
            title={pinnedOpen ? "Contraer menú" : "Expandir menú"}
            aria-pressed={pinnedOpen}
            aria-label={pinnedOpen ? "Contraer menú" : "Expandir menú"}
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
              style={{ transform: pinnedOpen ? "none" : "rotate(180deg)", transition: "transform 0.2s ease" }}
            >
              <polyline points="15 18 9 12 15 6" />
            </svg>
          </button>
        )}

        {!isMobile && <div style={s.divider} />}

        {/* Navegación */}
        {!isMobile && <nav style={collapsed ? s.navMini : s.nav}>
          {!collapsed && <p style={s.navSection}>Módulos</p>}
          {visibleNav.map((item) => {
            const active =
              location.pathname === item.route ||
              (item.route === ROUTES.ADMIN_BUILDINGS &&
                location.pathname.startsWith("/admin/buildings/"));
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
                title={collapsed && !isMobile ? item.label : undefined}
                style={{
                  ...s.navItem,
                  ...(isMobile ? s.navItemMobile : collapsed ? s.navItemMini : {}),
                  ...(active ? s.navItemActive : hovered ? s.navItemHover : {}),
                }}
              >
                <span style={{ ...s.navIcon, ...(active ? s.navIconActive : {}) }}>
                  {item.icon}
                </span>
                {(!collapsed || isMobile) && <span style={isMobile ? s.navLabelMobile : s.navLabel}>{item.label}</span>}
                {!collapsed && !isMobile && active && <span style={s.activeIndicator} />}
              </button>
            );
          })}
        </nav>}

        {!isMobile && <div style={s.spacer} />}
        {!isMobile && <div style={s.divider} />}

        {/* Sección de usuario */}
        {collapsed ? (
          <div style={isMobile ? s.userMiniMobile : s.userMini}>
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

        {!isMobile && <AppFooter variant="dark" />}
      </aside>

      {isMobile && mobileMenuOpen ? (
        <div style={s.mobileMenuOverlay} role="dialog" aria-modal="true">
          <div style={s.mobileMenuPanel}>
            <div style={s.mobileMenuHead}>
              <div>
                <p style={s.mobileMenuKicker}>Panel administrativo</p>
                <h2 style={s.mobileMenuTitle}>¿Qué quieres hacer?</h2>
              </div>
              <button
                type="button"
                onClick={() => setMobileMenuOpen(false)}
                style={s.mobileMenuClose}
                aria-label="Cerrar menú"
              >
                ×
              </button>
            </div>

            <div style={s.mobileMenuList}>
              {visibleNav.map((item) => {
                const active =
                  location.pathname === item.route ||
                  (item.route === ROUTES.ADMIN_BUILDINGS &&
                    location.pathname.startsWith("/admin/buildings/"));

                return (
                  <button
                    key={item.route}
                    type="button"
                    onClick={() => {
                      setMobileMenuOpen(false);
                      navigate(item.route);
                    }}
                    style={{
                      ...s.mobileMenuItem,
                      ...(active ? s.mobileMenuItemActive : {}),
                    }}
                  >
                    <span style={{ ...s.mobileMenuItemIcon, ...(active ? s.mobileMenuItemIconActive : {}) }}>
                      {item.icon}
                    </span>
                    <span style={s.mobileMenuItemText}>
                      <strong style={s.mobileMenuItemTitle}>{item.label}</strong>
                      <span style={s.mobileMenuItemHint}>
                        {getMobileHint(item.label)}
                      </span>
                    </span>
                    <span style={s.mobileMenuItemArrow}>›</span>
                  </button>
                );
              })}
            </div>

            <button type="button" onClick={handleLogout} style={s.mobileMenuLogout}>
              Cerrar sesión
            </button>
          </div>
        </div>
      ) : null}

      <main style={{ ...s.content, ...(isMobile ? s.contentMobile : {}), ...contentStyle }}>
        {!isMobile && (
          <div style={s.contentBrand} aria-hidden="true">
            <img src="/ICONO-TEC.jpeg" alt="" style={s.contentBrandIcon} />
            <span style={s.contentBrandText}>Panel Admin ITO</span>
          </div>
        )}
        {children}
      </main>
    </div>
  );
}

function getMobileHint(label: string) {
  switch (label) {
    case "Edificios":
      return "Agregar, editar o borrar edificios";
    case "Categorías":
      return "Organizar los tipos de edificios";
    case "Navegación":
      return "Editar caminos y rutas del mapa";
    case "Usuarios":
      return "Administrar cuentas del panel";
    case "Alumnos":
      return "Ver ubicación de alumnos";
    case "Profesores":
      return "Ver ubicación de profesores";
    default:
      return "Abrir esta sección";
  }
}

const s: Record<string, CSSProperties> = {
  shell: {
    display: "flex",
    height: "100vh",
    overflow: "hidden",
    background: "#0f172a",
    color: "#f1f5f9",
  },
  shellMobile: {
    flexDirection: "column",
    minHeight: "100dvh",
    height: "100dvh",
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
  sidebarMobile: {
    height: 72,
    minHeight: 72,
    borderRight: "none",
    borderBottom: "1px solid #334155",
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    padding: "9px 12px",
    overflowX: "auto",
    overflowY: "hidden",
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
  brandMobile: {
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    flexShrink: 0,
  },
  mobileTitle: {
    display: "flex",
    flexDirection: "column",
    justifyContent: "center",
    minWidth: 0,
    flex: 1,
  },
  mobileTitleKicker: {
    fontSize: 10,
    color: "#64748b",
    fontWeight: 800,
    textTransform: "uppercase",
    letterSpacing: "0.07em",
  },
  mobileTitleText: {
    overflow: "hidden",
    textOverflow: "ellipsis",
    whiteSpace: "nowrap",
    fontSize: 16,
    color: "#f1f5f9",
  },
  mobileMenuBtn: {
    display: "inline-flex",
    alignItems: "center",
    gap: 7,
    minHeight: 46,
    padding: "0 13px",
    border: "1px solid rgba(234,88,12,0.4)",
    borderRadius: 14,
    background: "#ea580c",
    color: "#fff",
    fontSize: 14,
    fontWeight: 800,
    cursor: "pointer",
    flexShrink: 0,
  },
  mobileMenuBtnIcon: {
    display: "grid",
    placeItems: "center",
  },
  brandIcon: {
    width: 36,
    height: 36,
    borderRadius: 9,
    background: "#ffffff",
    border: "1px solid rgba(234,88,12,0.22)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
    overflow: "hidden",
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
    color: "#f97316",
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
    color: "#f97316",
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
  navMobile: {
    display: "flex",
    flexDirection: "row",
    gap: 8,
    padding: 0,
    alignItems: "stretch",
    overflowX: "auto",
    flex: 1,
    minWidth: 0,
    scrollbarWidth: "none",
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
  navItemMobile: {
    flexDirection: "column",
    justifyContent: "center",
    gap: 5,
    width: 74,
    minWidth: 74,
    minHeight: 66,
    padding: "8px 7px",
    borderRadius: 14,
    textAlign: "center",
  },
  navItemHover: {
    background: "rgba(255,255,255,0.05)",
    color: "#cbd5e1",
  },
  navItemActive: {
    background: "rgba(234,88,12,0.13)",
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
    color: "#f97316",
  },
  navLabel: {
    flex: 1,
    whiteSpace: "nowrap",
  },
  navLabelMobile: {
    maxWidth: "100%",
    overflow: "hidden",
    textOverflow: "ellipsis",
    whiteSpace: "nowrap",
    fontSize: 10.5,
    lineHeight: 1.1,
    fontWeight: 700,
  },
  activeIndicator: {
    width: 6,
    height: 6,
    borderRadius: "50%",
    background: "#f97316",
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
  userMiniMobile: {
    display: "flex",
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    padding: 0,
    flexShrink: 0,
  },
  avatar: {
    width: 30,
    height: 30,
    borderRadius: 8,
    background: "linear-gradient(135deg, #f97316 0%, #c2410c 100%)",
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
    position: "relative",
  },
  contentMobile: {
    height: "calc(100dvh - 72px)",
    minHeight: 0,
  },
  mobileMenuOverlay: {
    position: "fixed",
    inset: 0,
    zIndex: 200,
    background: "rgba(2, 6, 23, 0.78)",
    padding: "12px",
    display: "flex",
    alignItems: "flex-end",
  },
  mobileMenuPanel: {
    width: "100%",
    maxHeight: "calc(100dvh - 24px)",
    overflowY: "auto",
    border: "1px solid #334155",
    borderRadius: 22,
    background: "#111c2d",
    boxShadow: "0 -20px 60px rgba(0,0,0,0.55)",
    padding: "16px",
  },
  mobileMenuHead: {
    display: "flex",
    justifyContent: "space-between",
    gap: 12,
    alignItems: "flex-start",
    marginBottom: 14,
  },
  mobileMenuKicker: {
    margin: "0 0 4px",
    fontSize: 11,
    color: "#f97316",
    fontWeight: 900,
    textTransform: "uppercase",
    letterSpacing: "0.08em",
  },
  mobileMenuTitle: {
    margin: 0,
    fontSize: 22,
    lineHeight: 1.1,
    color: "#f8fafc",
  },
  mobileMenuClose: {
    width: 42,
    height: 42,
    borderRadius: 14,
    border: "1px solid #334155",
    background: "#0f172a",
    color: "#cbd5e1",
    fontSize: 30,
    lineHeight: 1,
    cursor: "pointer",
    flexShrink: 0,
  },
  mobileMenuList: {
    display: "grid",
    gap: 10,
  },
  mobileMenuItem: {
    display: "grid",
    gridTemplateColumns: "48px minmax(0, 1fr) 22px",
    alignItems: "center",
    gap: 12,
    width: "100%",
    minHeight: 78,
    padding: "12px",
    borderRadius: 16,
    border: "1px solid #334155",
    background: "#162236",
    color: "#e2e8f0",
    textAlign: "left",
    cursor: "pointer",
  },
  mobileMenuItemActive: {
    borderColor: "rgba(234,88,12,0.52)",
    background: "rgba(234,88,12,0.16)",
  },
  mobileMenuItemIcon: {
    width: 48,
    height: 48,
    borderRadius: 14,
    display: "grid",
    placeItems: "center",
    background: "#0f172a",
    color: "#94a3b8",
  },
  mobileMenuItemIconActive: {
    background: "#ea580c",
    color: "#fff",
  },
  mobileMenuItemText: {
    minWidth: 0,
    display: "flex",
    flexDirection: "column",
    gap: 4,
  },
  mobileMenuItemTitle: {
    fontSize: 17,
    color: "#f8fafc",
  },
  mobileMenuItemHint: {
    fontSize: 12.5,
    lineHeight: 1.3,
    color: "#94a3b8",
  },
  mobileMenuItemArrow: {
    fontSize: 28,
    color: "#64748b",
    justifySelf: "center",
  },
  mobileMenuLogout: {
    width: "100%",
    minHeight: 50,
    marginTop: 12,
    borderRadius: 14,
    border: "1px solid rgba(239,68,68,0.32)",
    background: "rgba(239,68,68,0.1)",
    color: "#fca5a5",
    fontSize: 15,
    fontWeight: 800,
    cursor: "pointer",
  },
  contentBrand: {
    position: "absolute",
    top: 18,
    right: 24,
    zIndex: 8,
    display: "inline-flex",
    alignItems: "center",
    gap: 8,
    padding: "6px 10px 6px 6px",
    borderRadius: 999,
    background: "rgba(255,255,255,0.94)",
    border: "1px solid rgba(254,215,170,0.9)",
    boxShadow: "0 10px 24px rgba(15,23,42,0.18)",
    pointerEvents: "none",
  },
  contentBrandIcon: {
    width: 28,
    height: 28,
    objectFit: "contain",
    display: "block",
  },
  contentBrandText: {
    color: "#7c2d12",
    fontSize: 11,
    fontWeight: 800,
    letterSpacing: "0.02em",
    whiteSpace: "nowrap",
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
