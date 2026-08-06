import { useCallback, useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { AnimatePresence } from "framer-motion";
import { CampusViewer } from "../../components/viewer/CampusViewer";
import { BuildingSidebar } from "../buildings/components/BuildingSidebar";
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
  BuildingIcon,
  LogOutIcon,
  CompassIcon,
  InfoIcon,
  MapIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
} from "../../components/ui/Icons";
import { ThemeToggle } from "../../components/ui/ThemeToggle";
import { VisitorTopBar } from "./components/VisitorTopBar";
import {
  CampusServicesPanel,
  type CampusService,
} from "../shared/components/CampusServicesPanel";
import { QuickDestinations } from "../shared/components/QuickDestinations";
import { useIsMobile } from "../../hooks/useIsMobile";
import { SearchResultCard } from "../search/SearchResultCard";
import { formatBuildingDisplayName } from "../buildings/utils/building-display-name";

type VisitorViewMode = "map" | "destinations" | "services";

export function VisitorPage() {
  const isMobile = useIsMobile();
  const navigate = useNavigate();
  const { logout } = useAuthStore();

  const selectedBuilding = useBuildingStore((state) => state.selectedBuilding);
  const setSelectedBuilding = useBuildingStore(
    (state) => state.setSelectedBuilding
  );
  const setSearchTerm = useBuildingStore((state) => state.setSearchTerm);
  const selectedSearchResult = useBuildingStore((state) => state.selectedSearchResult);
  const setSelectedSearchResult = useBuildingStore((state) => state.setSelectedSearchResult);

  const [sheetState, setSheetState] = useState<SheetState>("closed");
  const [totalBuildings, setTotalBuildings] = useState(0);
  const [showSearch, setShowSearch] = useState(false);
  const [showQuickDest, setShowQuickDest] = useState(false);
  const [showServices, setShowServices] = useState(false);
  const [viewMode, setViewMode] = useState<VisitorViewMode>("map");

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
    setViewMode("map");
    closeMobilePanels();
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
        className={`visitor-page visitor-page--fullmap${selectedBuilding ? " has-building-details" : ""}${sidebarCollapsed ? " is-sidebar-collapsed" : ""}`}
      >
        <aside className="visitor-page__sidebar" style={{ overflow: "hidden", minWidth: 0 }}>
          <div className="visitor-page__sidebar-header">
            <div className="visitor-page__user">
              <div className="visitor-page__user-avatar">
                <img src="/ICONO-TEC.jpeg" alt="" className="visitor-page__user-logo" />
              </div>

              <div className="visitor-page__user-info">
                <span className="visitor-page__user-name">Visitante</span>
                <span className="visitor-page__user-role">
                  Explorando el campus
                </span>
              </div>
            </div>

            <ThemeToggle />

            <button
              type="button"
              className="visitor-page__logout"
              onClick={handleLogout}
              title="Salir"
            >
              <LogOutIcon size={18} />
            </button>
          </div>

          <nav className="visitor-page__nav" aria-label="Opciones de visitante">
            <button
              type="button"
              className={`visitor-page__nav-item ${
                viewMode === "map" ? "is-active" : ""
              }`}
              onClick={() => setViewMode("map")}
            >
              <MapIcon size={18} />
              <span>Mapa</span>
            </button>

            <button
              type="button"
              className={`visitor-page__nav-item ${
                viewMode === "destinations" ? "is-active" : ""
              }`}
              onClick={() => setViewMode("destinations")}
            >
              <CompassIcon size={18} />
              <span>Destinos</span>
            </button>

            <button
              type="button"
              className={`visitor-page__nav-item ${
                viewMode === "services" ? "is-active" : ""
              }`}
              onClick={() => setViewMode("services")}
            >
              <InfoIcon size={18} />
              <span>Servicios</span>
            </button>
          </nav>

          {viewMode === "map" && (
            <div key="side-map" className="visitor-page__sidebar-content ito-tab-panel">
              <BuildingSidebar
                isMobile={false}
                showGreeting
              />
            </div>
          )}

          {viewMode === "destinations" && (
            <div key="side-dest" className="visitor-page__panel ito-tab-panel">
              <div className="visitor-page__panel-heading">
                <div className="visitor-page__panel-icon">
                  <BuildingIcon size={20} />
                </div>
                <div>
                  <h2>Destinos populares</h2>
                  <p>Elige un punto comun para ubicarlo rapidamente.</p>
                </div>
              </div>

              <QuickDestinations onSelect={() => setViewMode("map")} />
            </div>
          )}

          {viewMode === "services" && (
            <div key="side-svc" className="visitor-page__panel visitor-page__panel--flush ito-tab-panel">
              <CampusServicesPanel
                compact
                onSelectService={handleSelectService}
              />
            </div>
          )}
        </aside>

        <main className="visitor-page__main">
          <div className="visitor-page__viewer" style={{ position: "relative" }}>
            <button
              type="button"
              className="ito-sidebar-toggle"
              onClick={() => setSidebarCollapsed((c) => !c)}
              title={sidebarCollapsed ? "Mostrar panel" : "Ocultar panel"}
            >
              {sidebarCollapsed ? <ChevronRightIcon size={14} /> : <ChevronLeftIcon size={14} />}
            </button>
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
    !selectedSearchResult &&
    sheetState === "closed" &&
    !showSearch &&
    !showQuickDest &&
    !showServices;

  const hasOpenMobileWindow =
    sheetState === "full" || showSearch || showQuickDest || showServices;

  return (
    <div className="ito-campus--mobile visitor-mobile">
      <CampusViewer isMobile mobilePanelOpen={hasOpenMobileWindow} />

      <VisitorTopBar
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

      {selectedSearchResult && !hasOpenMobileWindow && (
        <div className="visitor-mobile__search-result">
          <SearchResultCard
            result={selectedSearchResult}
            onClose={() => setSelectedSearchResult(null)}
          />
        </div>
      )}

      <MobileActionModal
        open={showQuickDest}
        title="Destinos populares"
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
          onItemSelected={() => setSheetState("closed")}
          onClearSelection={() => setSelectedBuilding(null)}
        />
      </MobileBottomSheet>
    </div>
  );
}
