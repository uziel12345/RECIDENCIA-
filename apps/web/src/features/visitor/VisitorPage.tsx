import { useCallback, useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { AnimatePresence, motion } from "framer-motion";
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
import { QuickDestinations } from "./components/QuickDestinations";
import {
  CampusServicesPanel,
  type CampusService,
} from "../shared/components/CampusServicesPanel";
import { useIsMobile } from "../../hooks/useIsMobile";

type VisitorViewMode = "map" | "destinations" | "services";

export function VisitorPage() {
  const isMobile = useIsMobile();
  const navigate = useNavigate();
  const { logout } = useAuthStore();

  const selectedBuilding = useBuildingStore((state) => state.selectedBuilding);
  const routeDestination = useBuildingStore((state) => state.routeDestination);
  const setSelectedBuilding = useBuildingStore(
    (state) => state.setSelectedBuilding
  );
  const setSearchTerm = useBuildingStore((state) => state.setSearchTerm);

  const [requestedSheetState, setSheetState] = useState<SheetState>("closed");
  const sheetState: SheetState =
    isMobile && routeDestination && requestedSheetState === "closed"
      ? "peek"
      : requestedSheetState;
  const [totalBuildings, setTotalBuildings] = useState(0);
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

  const openBuildingSearch = useCallback(() => {
    closeMobilePanels();
    setSheetState("full");
    window.setTimeout(() => {
      document.getElementById("building-search")?.focus();
    }, 360);
  }, [closeMobilePanels]);

  const openQuickDestinations = useCallback(() => {
    closeMobilePanels();
    setShowQuickDest(true);
  }, [closeMobilePanels]);

  const openServices = useCallback(() => {
    closeMobilePanels();
    setShowServices(true);
  }, [closeMobilePanels]);

  const openBuildings = useCallback(() => {
    closeMobilePanels();
    setSheetState("full");
  }, [closeMobilePanels]);

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
        icon: "info" as const,
        onClick: openServices,
        active: showServices,
      },
      {
        id: "list",
        label: "Edificios",
        icon: "list" as const,
        onClick: openBuildings,
        active: sheetState !== "closed" && !showQuickDest && !showServices,
        primary: true,
      },
    ];
  }, [
    openBuildings,
    openQuickDestinations,
    openServices,
    sheetState,
    showQuickDest,
    showServices,
  ]);

  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  if (!isMobile) {
    return (
      <div
        className={`visitor-page visitor-page--fullmap${sidebarCollapsed ? " is-sidebar-collapsed" : ""}`}
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
            <CampusViewer isMobile={false} mobilePanelOpen={false} />
          </div>
        </main>
      </div>
    );
  }

  const sheetTitle = routeDestination
    ? "Tu ruta"
    : selectedBuilding
      ? selectedBuilding.name
      : "Explorar campus";

  const sheetSubtitle = routeDestination
    ? "Sigue las indicaciones en el mapa"
    : selectedBuilding
      ? "Detalles del edificio"
      : `${totalBuildings} edificios`;

  const showQuickCard =
    !!selectedBuilding && !routeDestination && sheetState === "closed";

  return (
    <div className="ito-campus--mobile visitor-mobile">
      <CampusViewer isMobile mobilePanelOpen={sheetState === "full"} />

      <VisitorTopBar
        onSearchClick={openBuildingSearch}
        onLogout={handleLogout}
      />

      <AnimatePresence>
        {showQuickCard && (
          <BuildingQuickCard
            building={selectedBuilding}
            onOpenDetails={() => setSheetState("full")}
          />
        )}
      </AnimatePresence>

      <AnimatePresence>
        {showQuickDest && (
          <motion.div
            className="visitor-mobile__dest-overlay"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <motion.div
              className="visitor-mobile__dest-modal"
              initial={{ y: "100%" }}
              animate={{ y: 0 }}
              exit={{ y: "100%" }}
              transition={{ type: "spring", damping: 25, stiffness: 300 }}
            >
              <div className="visitor-mobile__dest-header">
                <h2>Destinos populares</h2>

                <button type="button" onClick={() => setShowQuickDest(false)}>
                  <svg
                    width="24"
                    height="24"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                  >
                    <line x1="18" y1="6" x2="6" y2="18" />
                    <line x1="6" y1="6" x2="18" y2="18" />
                  </svg>
                </button>
              </div>

              <div className="visitor-mobile__dest-body">
                <QuickDestinations onSelect={() => setShowQuickDest(false)} />
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {showServices && (
          <motion.div
            className="visitor-mobile__dest-overlay"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <motion.div
              className="visitor-mobile__dest-modal"
              initial={{ y: "100%" }}
              animate={{ y: 0 }}
              exit={{ y: "100%" }}
              transition={{ type: "spring", damping: 25, stiffness: 300 }}
            >
              <div className="visitor-mobile__dest-header">
                <h2>Servicios del campus</h2>

                <button type="button" onClick={() => setShowServices(false)}>
                  <svg
                    width="24"
                    height="24"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                  >
                    <line x1="18" y1="6" x2="6" y2="18" />
                    <line x1="6" y1="6" x2="18" y2="18" />
                  </svg>
                </button>
              </div>

              <div className="visitor-mobile__dest-body">
                <CampusServicesPanel onSelectService={handleSelectService} />
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <MobileQuickActions actions={mobileActions} />

      <MobileBottomSheet
        state={sheetState}
        onChangeState={(next) => {
          if (next === "closed" && selectedBuilding && !routeDestination) {
            setSheetState("closed");
            return;
          }

          setSheetState(next);
        }}
        title={sheetTitle}
        subtitle={sheetSubtitle}
      >
        <BuildingSidebar
          isMobile
          onItemSelected={() => setSheetState("peek")}
          onClearSelection={() => setSelectedBuilding(null)}
        />
      </MobileBottomSheet>
    </div>
  );
}
