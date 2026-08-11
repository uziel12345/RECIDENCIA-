import { useCallback, useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { AnimatePresence } from "framer-motion";
import { CampusViewer } from "../../components/viewer/CampusViewer";
import { BuildingSidebar } from "../buildings/components/BuildingSidebar";
import { MapSearchOverlay } from "../buildings/components/MapSearchOverlay";
import { BuildingQuickCard } from "../buildings/components/BuildingQuickCard";
import { useBuildingStore } from "../../store/building-store";
import { useAuthStore } from "../../store/auth-store";
import { getBuildings } from "../../services/buildings.service";
import type { Building } from "../buildings/types/building";
import {
  MobileBottomSheet,
  type SheetState,
} from "../campus/components/MobileBottomSheet";
import { MobileActionModal } from "../campus/components/MobileActionModal";
import { MobileQuickActions } from "../campus/components/MobileQuickActions";
import { ROUTES } from "../../types/routes";
import {
  LogOutIcon,
  Icon,
  InfoIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
} from "../../components/ui/Icons";
import { ThemeToggle } from "../../components/ui/ThemeToggle";
import { StudentTopBar } from "./components/StudentTopBar";
import {
  CampusServicesPanel,
  type CampusService,
} from "../shared/components/CampusServicesPanel";
import { QuickDestinations } from "../shared/components/QuickDestinations";
import { useIsMobile } from "../../hooks/useIsMobile";
import "./student-experience.css";
import { formatBuildingDisplayName } from "../buildings/utils/building-display-name";

type ViewMode = "map" | "destinations" | "services";

export function StudentPage() {
  const isMobile = useIsMobile();
  const navigate = useNavigate();
  const { logout, user } = useAuthStore();

  const selectedBuilding = useBuildingStore((state) => state.selectedBuilding);
  const isBuildingPanelOpen = useBuildingStore((state) => state.isBuildingPanelOpen);
  const setSearchTerm = useBuildingStore((state) => state.setSearchTerm);

  const [sheetState, setSheetState] = useState<SheetState>("closed");
  const [totalBuildings, setTotalBuildings] = useState(0);
  const [viewMode, setViewMode] = useState<ViewMode>("map");
  const [showSearch, setShowSearch] = useState(false);
  const [showQuickDest, setShowQuickDest] = useState(false);
  const [showServices, setShowServices] = useState(false);

  useEffect(() => {
    getBuildings()
      .then((data) => {
        setTotalBuildings(
          data.filter((building: Building) => building.is_active).length
        );
      })
      .catch(() => setTotalBuildings(0));
  }, []);

  const handleLogout = () => {
    logout();
    navigate(ROUTES.WELCOME);
  };

  const closeMobilePanels = useCallback(() => {
    setShowSearch(false);
    setShowQuickDest(false);
    setShowServices(false);
    setSheetState("closed");
  }, []);

  const handleSelectService = useCallback((service: CampusService) => {
    setSearchTerm(service.searchTerm);
    closeMobilePanels();
    setViewMode("map");
    setSheetState("full");
  }, [closeMobilePanels, setSearchTerm]);

  const openQuickDestinations = useCallback(() => {
    if (showQuickDest) {
      closeMobilePanels();
      return;
    }
    closeMobilePanels();
    setShowQuickDest(true);
  }, [closeMobilePanels, showQuickDest]);

  const openServices = useCallback(() => {
    if (showServices) {
      closeMobilePanels();
      return;
    }
    closeMobilePanels();
    setShowServices(true);
  }, [closeMobilePanels, showServices]);

  const openBuildingSearch = useCallback(() => {
    if (showSearch) {
      closeMobilePanels();
      return;
    }
    closeMobilePanels();
    setViewMode("map");
    setShowSearch(true);
  }, [closeMobilePanels, showSearch]);

  const openBuildings = useCallback(() => {
    const buildingsAreOpen =
      sheetState !== "closed" && !showSearch && !showQuickDest && !showServices;
    if (buildingsAreOpen) {
      closeMobilePanels();
      return;
    }
    closeMobilePanels();
    setViewMode("map");
    setSheetState("full");
  }, [closeMobilePanels, sheetState, showQuickDest, showSearch, showServices]);

  const mobileActions = useMemo(() => {
    return [
      {
        id: "quick",
        label: "Destinos",
        icon: "compass" as const,
        onClick: openQuickDestinations,
        active: showQuickDest,
      },
      {
        id: "services",
        label: "Servicios",
        icon: "sparkles" as const,
        onClick: openServices,
        active: showServices,
      },
      {
        id: "list",
        label: "Edificios",
        icon: "list" as const,
        onClick: openBuildings,
        active:
          sheetState !== "closed" &&
          !showSearch &&
          !showQuickDest &&
          !showServices,
      },
    ];
  }, [
    openBuildings,
    openQuickDestinations,
    openServices,
    sheetState,
    showQuickDest,
    showSearch,
    showServices,
  ]);

  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  if (!isMobile) {
    return (
      <div
        className={`student-page student-page--fullmap${selectedBuilding ? " has-building-details" : ""}${sidebarCollapsed ? " is-sidebar-collapsed" : ""}`}
      >
        <aside className="student-page__sidebar" style={{ overflow: "hidden", minWidth: 0 }}>
          <div className="student-page__sidebar-header">
            <div className="student-page__user">
              <div className="student-page__user-avatar">
                <img src="/ICONO-TEC.jpeg" alt="" className="student-page__user-logo" />
              </div>

              <div className="student-page__user-info">
                <span className="student-page__user-name">
                  {user?.name || "Estudiante"}
                </span>
                <span className="student-page__user-role">Alumno</span>
              </div>
            </div>

            <ThemeToggle />

            <button
              type="button"
              className="student-page__logout"
              onClick={handleLogout}
              title="Cerrar sesión"
            >
              <LogOutIcon size={18} />
            </button>
          </div>

          <nav className="student-page__nav">
            <button
              type="button"
              className={`student-page__nav-item ${
                viewMode === "map" ? "is-active" : ""
              }`}
              onClick={() => setViewMode("map")}
            >
              <Icon name="home" size={18} />
              <span>Inicio</span>
            </button>

            <button
              type="button"
              className={`student-page__nav-item ${
                viewMode === "destinations" ? "is-active" : ""
              }`}
              onClick={() => setViewMode("destinations")}
            >
              <Icon name="compass" size={18} />
              <span>Destinos</span>
            </button>

            <button
              type="button"
              className={`student-page__nav-item ${
                viewMode === "services" ? "is-active" : ""
              }`}
              onClick={() => setViewMode("services")}
            >
              <InfoIcon size={18} />
              <span>Servicios</span>
            </button>

          </nav>

          {viewMode === "map" && (
            <div key="side-map" className="student-page__sidebar-content ito-tab-panel">
              <BuildingSidebar
                isMobile={false}
                showGreeting
                showSearchPanel={false}
                userName={user?.name || "Estudiante"}
              />
            </div>
          )}

          {viewMode === "destinations" && (
            <div key="side-dest" className="visitor-page__panel ito-tab-panel">
              <div className="visitor-page__panel-heading">
                <div className="visitor-page__panel-icon">
                  <Icon name="compass" size={20} />
                </div>
                <div>
                  <h2>¿Qué estás buscando?</h2>
                  <p>Elige una pregunta frecuente para ubicarla en el mapa.</p>
                </div>
              </div>

              <QuickDestinations onSelect={() => setViewMode("map")} />
            </div>
          )}

          {viewMode === "services" && (
            <div key="side-services" className="student-page__sidebar-content ito-tab-panel">
              <CampusServicesPanel
                compact
                onSelectService={handleSelectService}
              />
            </div>
          )}

        </aside>

        <main className="student-page__main">
          {/* El visor 3D se mantiene montado al cambiar de pestaña para no
              recargar el GLB ni resetear cámara/ubicación. */}
          <div className="student-page__viewer" style={{ position: "relative" }}>
            <button
              type="button"
              className="ito-sidebar-toggle"
              onClick={() => setSidebarCollapsed((c) => !c)}
              title={sidebarCollapsed ? "Mostrar panel" : "Ocultar panel"}
            >
              {sidebarCollapsed ? <ChevronRightIcon size={14} /> : <ChevronLeftIcon size={14} />}
            </button>
            <MapSearchOverlay />
            <CampusViewer isMobile={false} mobilePanelOpen={false} mapXOffset={sidebarCollapsed ? 0 : -75} />
          </div>
        </main>
      </div>
    );
  }

  const sheetTitle = selectedBuilding
    ? formatBuildingDisplayName(selectedBuilding.name, selectedBuilding.code)
    : "Catálogo de edificios";

  const sheetSubtitle = selectedBuilding
    ? "Detalles del edificio"
    : `${totalBuildings} edificios para explorar`;

  const showQuickCard =
    !!selectedBuilding &&
    isBuildingPanelOpen &&
    sheetState === "closed" &&
    !showSearch &&
    !showQuickDest &&
    !showServices;

  const hasOpenMobileWindow =
    sheetState === "full" || showSearch || showQuickDest || showServices;

  return (
    <div
      className={`ito-campus--mobile student-mobile${showSearch ? " is-search-open" : ""}`}
    >
      <CampusViewer isMobile mobilePanelOpen={hasOpenMobileWindow} />

      <StudentTopBar
        userName={user?.name || "Estudiante"}
        onSearchClick={openBuildingSearch}
        onLogout={handleLogout}
        searchOpen={showSearch}
        onCloseSearch={closeMobilePanels}
      />

      <AnimatePresence>
        {showQuickCard && (
          <BuildingQuickCard
            building={selectedBuilding}
            onOpenDetails={() => setSheetState("full")}
          />
        )}
      </AnimatePresence>

      <MobileActionModal
        open={showQuickDest}
        title="¿Qué estás buscando?"
        onClose={closeMobilePanels}
      >
        <QuickDestinations onSelect={closeMobilePanels} />
      </MobileActionModal>

      <MobileActionModal
        open={showServices}
        title="Servicios del campus"
        onClose={closeMobilePanels}
      >
        <CampusServicesPanel onSelectService={handleSelectService} />
      </MobileActionModal>

      <MobileQuickActions actions={mobileActions} />

      <MobileBottomSheet
        state={sheetState}
        onChangeState={setSheetState}
        title={sheetTitle}
        subtitle={sheetSubtitle}
      >
        <BuildingSidebar
          isMobile
          showSearchPanel={false}
          browseOnly
          useStudentDetailStyle
          onItemSelected={() => setSheetState("closed")}
          onPanelClosed={() => setSheetState("closed")}
        />
      </MobileBottomSheet>
    </div>
  );
}
