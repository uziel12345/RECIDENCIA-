import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { CampusViewer } from "../../components/viewer/CampusViewer";
import { useAuthStore } from "../../store/auth-store";
import { getBuildings } from "../../services/buildings.service";
import type { Building } from "../buildings/types/building";
import { ROUTES } from "../../types/routes";
import {
  ShieldIcon,
  MapIcon,
  SettingsIcon,
  LogOutIcon,
  BuildingIcon,
  UsersIcon,
  LayersIcon,
} from "../shared/Icons";
import { BuildingManager } from "../staff/components/BuildingManager";
import { NavigationEditor } from "../staff/components/NavigationEditor";
import { UserManager } from "./components/UserManager";
import { SystemSettings } from "./components/SystemSettings";

type TabId = "buildings" | "users" | "navigation" | "settings" | "map";

export function AdminDashboard() {
  const navigate = useNavigate();
  const { logout, user } = useAuthStore();
  const [buildings, setBuildings] = useState<Building[]>([]);
  const [activeTab, setActiveTab] = useState<TabId>("buildings");
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    setIsLoading(true);
    getBuildings()
      .then(setBuildings)
      .finally(() => setIsLoading(false));
  }, []);

  const handleLogout = () => {
    logout();
    navigate(ROUTES.WELCOME);
  };

  const activeCount = buildings.filter((b) => b.is_active).length;

  return (
    <div className="admin-dashboard">
      {/* Sidebar */}
      <aside className="admin-dashboard__sidebar">
        <div className="admin-dashboard__header">
          <div className="admin-dashboard__brand">
            <div className="admin-dashboard__brand-icon">
              <ShieldIcon size={22} />
            </div>
            <div className="admin-dashboard__brand-text">
              <span className="admin-dashboard__brand-title">Mapa ITO</span>
              <span className="admin-dashboard__brand-role">Administrador</span>
            </div>
          </div>
        </div>

        <div className="admin-dashboard__user">
          <div className="admin-dashboard__user-avatar">
            <ShieldIcon size={18} />
          </div>
          <div className="admin-dashboard__user-info">
            <span className="admin-dashboard__user-name">{user?.name || "Admin"}</span>
            <span className="admin-dashboard__user-email">{user?.email}</span>
          </div>
        </div>

        <nav className="admin-dashboard__nav">
          <div className="admin-dashboard__nav-section">
            <span className="admin-dashboard__nav-label">Gestion</span>
            <button
              className={`admin-dashboard__nav-item ${activeTab === "buildings" ? "is-active" : ""}`}
              onClick={() => setActiveTab("buildings")}
            >
              <BuildingIcon size={18} />
              <span>Edificios</span>
              <span className="admin-dashboard__nav-badge">{buildings.length}</span>
            </button>
            <button
              className={`admin-dashboard__nav-item ${activeTab === "users" ? "is-active" : ""}`}
              onClick={() => setActiveTab("users")}
            >
              <UsersIcon size={18} />
              <span>Usuarios</span>
            </button>
            <button
              className={`admin-dashboard__nav-item ${activeTab === "navigation" ? "is-active" : ""}`}
              onClick={() => setActiveTab("navigation")}
            >
              <LayersIcon size={18} />
              <span>Navegacion</span>
            </button>
          </div>

          <div className="admin-dashboard__nav-section">
            <span className="admin-dashboard__nav-label">Sistema</span>
            <button
              className={`admin-dashboard__nav-item ${activeTab === "settings" ? "is-active" : ""}`}
              onClick={() => setActiveTab("settings")}
            >
              <SettingsIcon size={18} />
              <span>Configuracion</span>
            </button>
            <button
              className={`admin-dashboard__nav-item ${activeTab === "map" ? "is-active" : ""}`}
              onClick={() => setActiveTab("map")}
            >
              <MapIcon size={18} />
              <span>Vista del Mapa</span>
            </button>
          </div>
        </nav>

        <div className="admin-dashboard__stats">
          <div className="admin-dashboard__stat">
            <span className="admin-dashboard__stat-value">{activeCount}</span>
            <span className="admin-dashboard__stat-label">Edificios</span>
          </div>
          <div className="admin-dashboard__stat">
            <span className="admin-dashboard__stat-value">5</span>
            <span className="admin-dashboard__stat-label">Usuarios</span>
          </div>
        </div>

        <div className="admin-dashboard__footer">
          <button className="admin-dashboard__logout" onClick={handleLogout}>
            <LogOutIcon size={18} />
            <span>Cerrar Sesion</span>
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="admin-dashboard__main">
        {activeTab === "buildings" && (
          <BuildingManager
            buildings={buildings}
            isLoading={isLoading}
            onRefresh={() => getBuildings().then(setBuildings)}
          />
        )}

        {activeTab === "users" && <UserManager />}

        {activeTab === "navigation" && <NavigationEditor />}

        {activeTab === "settings" && <SystemSettings />}

        {activeTab === "map" && (
          <div className="admin-dashboard__map">
            <CampusViewer isMobile={false} mobilePanelOpen={false} />
          </div>
        )}
      </main>
    </div>
  );
}
