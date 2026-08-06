import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { CampusViewer } from "../../../components/viewer/CampusViewer";
import { ChevronLeftIcon, ChevronRightIcon } from "../../../components/ui/Icons";
import { useIsMobile } from "../../../hooks/useIsMobile";
import { useAdminAuthStore } from "../../../store/admin-auth-store";
import { ROUTES } from "../../../types/routes";
import { BuildingSidebar } from "../../buildings/components/BuildingSidebar";
import { MapSearchOverlay } from "../../buildings/components/MapSearchOverlay";
import { AdminLayout } from "../components/AdminLayout";

export function AdminMapPage() {
  const isMobile = useIsMobile();
  const navigate = useNavigate();
  const user = useAdminAuthStore((state) => state.user);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const userName = user?.full_name || user?.username || "Administrador";

  return (
    <AdminLayout contentStyle={{ overflow: "hidden" }}>
      <div
        className={`admin-map-page${
          isMobile
            ? " admin-map-page--mobile"
            : ` student-page student-page--fullmap${
                sidebarCollapsed ? " is-sidebar-collapsed" : ""
              }`
        }`}
      >
        {!isMobile ? (
          <aside
            className="student-page__sidebar"
            style={{ overflow: "hidden", minWidth: 0 }}
          >
            <div className="student-page__sidebar-header">
              <div className="student-page__user">
                <div className="student-page__user-avatar">
                  <img
                    src="/ICONO-TEC.jpeg"
                    alt=""
                    className="student-page__user-logo"
                  />
                </div>
                <div className="student-page__user-info">
                  <span className="student-page__user-name">{userName}</span>
                  <span className="student-page__user-role">
                    Mapa administrativo
                  </span>
                </div>
              </div>
              <button
                type="button"
                className="admin-map-page__buildings-link"
                onClick={() => navigate(ROUTES.ADMIN_BUILDINGS)}
              >
                Edificios
              </button>
            </div>

            <div className="admin-map-page__calibration-note">
              <strong>Calibración GPS activa</strong>
              <span>
                Inicia el seguimiento y valida el marcador en un tercer punto
                conocido del campus.
              </span>
            </div>

            <div className="student-page__sidebar-content ito-tab-panel">
              <BuildingSidebar
                isMobile={false}
                showGreeting={false}
                showSearchPanel={false}
                userName={userName}
              />
            </div>
          </aside>
        ) : null}

        <main className={isMobile ? "admin-map-page__main" : "student-page__main"}>
          <div
            className={isMobile ? "admin-map-page__viewer" : "student-page__viewer"}
            style={{ position: "relative" }}
          >
            {!isMobile ? (
              <>
                <button
                  type="button"
                  className="ito-sidebar-toggle"
                  onClick={() => setSidebarCollapsed((current) => !current)}
                  title={sidebarCollapsed ? "Mostrar panel" : "Ocultar panel"}
                >
                  {sidebarCollapsed ? (
                    <ChevronRightIcon size={14} />
                  ) : (
                    <ChevronLeftIcon size={14} />
                  )}
                </button>
                <MapSearchOverlay />
              </>
            ) : (
              <button
                type="button"
                className="admin-map-page__mobile-back"
                onClick={() => navigate(ROUTES.ADMIN_BUILDINGS)}
              >
                Edificios
              </button>
            )}

            <CampusViewer
              isMobile={isMobile}
              mobilePanelOpen={false}
              enableAdminTools
              enableLocationCalibrationTools
              hideCategoryLegend={isMobile}
              mapXOffset={!isMobile && !sidebarCollapsed ? -75 : 0}
            />
          </div>
        </main>
      </div>
    </AdminLayout>
  );
}
