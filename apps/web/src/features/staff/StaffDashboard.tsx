import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { CampusViewer } from "../../components/viewer/CampusViewer";
import { useAuthStore } from "../../store/auth-store";
import { getBuildings } from "../../services/buildings.service";
import type { Building } from "../buildings/types/building";
import { ROUTES } from "../../types/routes";
import {
  BuildingIcon,
  MapIcon,
  LogOutIcon,
  LayersIcon,
} from "../shared/Icons";
import { BuildingManager } from "./components/BuildingManager";
import { NavigationEditor } from "./components/NavigationEditor";

type TabId = "buildings" | "navigation" | "map";

export function StaffDashboard() {
  const navigate = useNavigate();
  const { logout, user } = useAuthStore();

  const [buildings, setBuildings] = useState<Building[]>([]);
  const [activeTab, setActiveTab] = useState<TabId>("buildings");
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadBuildings();
  }, []);

  function loadBuildings() {
    setIsLoading(true);

    getBuildings()
      .then(setBuildings)
      .finally(() => setIsLoading(false));
  }

  const handleLogout = () => {
    logout();
    navigate(ROUTES.WELCOME);
  };

  const activeCount = buildings.filter((building) => building.is_active).length;
  const inactiveCount = buildings.filter((building) => !building.is_active).length;

  return (
    <div className="staff-dashboard">
      <aside className="staff-dashboard__sidebar">
        <div className="staff-dashboard__header">
          <div className="staff-dashboard__brand">
            <div className="staff-dashboard__brand-icon">
              <MapIcon size={22} />
            </div>

            <div className="staff-dashboard__brand-text">
              <span className="staff-dashboard__brand-title">Mapa ITO</span>
              <span className="staff-dashboard__brand-role">
                Panel de Personal
              </span>
            </div>
          </div>
        </div>

        <div className="staff-dashboard__user">
          <div className="staff-dashboard__user-avatar">
            <BuildingIcon size={18} />
          </div>

          <div className="staff-dashboard__user-info">
            <span className="staff-dashboard__user-name">
              {user?.name || "Personal"}
            </span>
            <span className="staff-dashboard__user-email">{user?.email}</span>
          </div>
        </div>

        <nav className="staff-dashboard__nav">
          <button
            type="button"
            className={`staff-dashboard__nav-item ${
              activeTab === "buildings" ? "is-active" : ""
            }`}
            onClick={() => setActiveTab("buildings")}
          >
            <BuildingIcon size={18} />
            <span>Edificios</span>
            <span className="staff-dashboard__nav-badge">
              {buildings.length}
            </span>
          </button>

          <button
            type="button"
            className={`staff-dashboard__nav-item ${
              activeTab === "navigation" ? "is-active" : ""
            }`}
            onClick={() => setActiveTab("navigation")}
          >
            <LayersIcon size={18} />
            <span>Navegacion</span>
          </button>

          <button
            type="button"
            className={`staff-dashboard__nav-item ${
              activeTab === "map" ? "is-active" : ""
            }`}
            onClick={() => setActiveTab("map")}
          >
            <MapIcon size={18} />
            <span>Vista del Mapa</span>
          </button>
        </nav>

        <div className="staff-dashboard__stats">
          <div className="staff-dashboard__stat">
            <span className="staff-dashboard__stat-value">{activeCount}</span>
            <span className="staff-dashboard__stat-label">Activos</span>
          </div>

          <div className="staff-dashboard__stat">
            <span className="staff-dashboard__stat-value">{inactiveCount}</span>
            <span className="staff-dashboard__stat-label">Inactivos</span>
          </div>
        </div>

        <div className="staff-dashboard__footer">
          <button
            type="button"
            className="staff-dashboard__logout"
            onClick={handleLogout}
          >
            <LogOutIcon size={18} />
            <span>Cerrar Sesion</span>
          </button>
        </div>
      </aside>

      <main className="staff-dashboard__main">
        {activeTab === "buildings" && (
          <BuildingManager
            buildings={buildings}
            isLoading={isLoading}
            onRefresh={loadBuildings}
          />
        )}

        {activeTab === "navigation" && <NavigationEditor />}

        {activeTab === "map" && (
          <div className="staff-dashboard__map">
            <CampusViewer isMobile={false} mobilePanelOpen={false} />
          </div>
        )}
      </main>
    </div>
  );
}