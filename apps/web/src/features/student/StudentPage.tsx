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
  LogOutIcon,
  MapIcon,
  InfoIcon,
  BookOpenIcon,
  ClockIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
} from "../../components/ui/Icons";
import { ThemeToggle } from "../../components/ui/ThemeToggle";
import { StudentTopBar } from "./components/StudentTopBar";
import { NewStudentGuide } from "./components/NewStudentGuide";
import { SchedulePanel } from "./components/SchedulePanel";
import {
  CampusServicesPanel,
  type CampusService,
} from "../shared/components/CampusServicesPanel";
import { useIsMobile } from "../../hooks/useIsMobile";

type ViewMode = "map" | "guide" | "services" | "schedule";

export function StudentPage() {
  const isMobile = useIsMobile();
  const navigate = useNavigate();
  const { logout, user } = useAuthStore();

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
  const [viewMode, setViewMode] = useState<ViewMode>("map");
  const [showGuide, setShowGuide] = useState(false);
  const [showServices, setShowServices] = useState(false);
  const [showSchedule, setShowSchedule] = useState(false);

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
    setShowGuide(false);
    setShowServices(false);
    setShowSchedule(false);
    setSheetState("closed");
  }, []);

  const handleSelectService = useCallback((service: CampusService) => {
    setSearchTerm(service.searchTerm);
    closeMobilePanels();
    setViewMode("map");
    setSheetState("full");
  }, [closeMobilePanels, setSearchTerm]);

  const handleNavigateToClass = useCallback((buildingCode: string) => {
    setSearchTerm(buildingCode);
    closeMobilePanels();
    setViewMode("map");
    setSheetState("full");
  }, [closeMobilePanels, setSearchTerm]);

  const openBuildingSearch = useCallback(() => {
    closeMobilePanels();
    setViewMode("map");
    setSheetState("full");
    window.setTimeout(() => {
      document.getElementById("building-search")?.focus();
    }, 360);
  }, [closeMobilePanels]);

  const openGuide = useCallback(() => {
    closeMobilePanels();
    setShowGuide(true);
  }, [closeMobilePanels]);

  const openServices = useCallback(() => {
    closeMobilePanels();
    setShowServices(true);
  }, [closeMobilePanels]);

  const openSchedule = useCallback(() => {
    closeMobilePanels();
    setShowSchedule(true);
  }, [closeMobilePanels]);

  const openBuildings = useCallback(() => {
    closeMobilePanels();
    setViewMode("map");
    setSheetState("full");
  }, [closeMobilePanels]);

  const handleGuideSearch = useCallback(() => {
    closeMobilePanels();
    setViewMode("map");
    setSheetState("full");
  }, [closeMobilePanels]);

  const mobileActions = useMemo(() => {
    return [
      {
        id: "guide",
        label: "Guía",
        icon: "book-open" as const,
        onClick: openGuide,
        active: showGuide,
      },
      {
        id: "services",
        label: "Servicios",
        icon: "info" as const,
        onClick: openServices,
        active: showServices,
      },
      {
        id: "schedule",
        label: "Horario",
        icon: "clock" as const,
        onClick: openSchedule,
        active: showSchedule,
      },
      {
        id: "list",
        label: "Edificios",
        icon: "list" as const,
        onClick: openBuildings,
        active: sheetState !== "closed" && !showGuide && !showServices && !showSchedule,
        primary: true,
      },
    ];
  }, [openBuildings, openGuide, openServices, openSchedule, sheetState, showGuide, showServices, showSchedule]);

  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  if (!isMobile) {
    return (
      <div
        className={`student-page${viewMode === "map" ? " student-page--fullmap" : ""}${sidebarCollapsed ? " is-sidebar-collapsed" : ""}`}
        style={
          viewMode !== "map"
            ? {
                gridTemplateColumns: sidebarCollapsed
                  ? "0px minmax(0, 1fr)"
                  : "var(--desktop-sidebar-width) minmax(0, 1fr)",
              }
            : undefined
        }
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
              <MapIcon size={18} />
              <span>Mapa</span>
            </button>

            <button
              type="button"
              className={`student-page__nav-item ${
                viewMode === "guide" ? "is-active" : ""
              }`}
              onClick={() => setViewMode("guide")}
            >
              <BookOpenIcon size={18} />
              <span>Guía</span>
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

            <button
              type="button"
              className={`student-page__nav-item ${
                viewMode === "schedule" ? "is-active" : ""
              }`}
              onClick={() => setViewMode("schedule")}
            >
              <ClockIcon size={18} />
              <span>Horario</span>
            </button>
          </nav>

          {viewMode === "map" && (
            <div key="side-map" className="student-page__sidebar-content ito-tab-panel">
              <BuildingSidebar
                isMobile={false}
                showGreeting
                userName={user?.name || "Estudiante"}
              />
            </div>
          )}

          {viewMode === "guide" && (
            <div key="side-guide" className="student-page__sidebar-content ito-tab-panel">
              <NewStudentGuide
                onSearchActivated={() => setViewMode("map")}
              />
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

          {viewMode === "schedule" && (
            <div key="side-schedule" className="student-page__sidebar-content ito-tab-panel">
              <SchedulePanel onNavigateToClass={handleNavigateToClass} />
            </div>
          )}
        </aside>

        <main className="student-page__main">
          {viewMode === "map" && (
            <div className="student-page__viewer" style={{ position: "relative" }}>
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
          )}

          {viewMode === "guide" && (
            <div key="main-guide" className="student-page__schedule-full ito-tab-main">
              <NewStudentGuide onSearchActivated={() => setViewMode("map")} />
            </div>
          )}

          {viewMode === "services" && (
            <div key="main-services" className="student-page__schedule-full ito-tab-main">
              <CampusServicesPanel onSelectService={handleSelectService} />
            </div>
          )}

          {viewMode === "schedule" && (
            <div key="main-schedule" className="student-page__schedule-full ito-tab-main">
              <SchedulePanel expanded onNavigateToClass={handleNavigateToClass} />
            </div>
          )}
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
    <div className="ito-campus--mobile student-mobile">
      <CampusViewer isMobile mobilePanelOpen={sheetState === "full"} />

      <StudentTopBar
        userName={user?.name || "Estudiante"}
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
        {showGuide && (
          <motion.div
            className="student-mobile__schedule-overlay"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <motion.div
              className="student-mobile__schedule-modal"
              initial={{ y: "100%" }}
              animate={{ y: 0 }}
              exit={{ y: "100%" }}
              transition={{ type: "spring", damping: 25, stiffness: 300 }}
            >
              <div className="student-mobile__schedule-header">
                <h2>Guía de nuevo ingreso</h2>

                <button type="button" onClick={() => setShowGuide(false)}>
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <line x1="18" y1="6" x2="6" y2="18" />
                    <line x1="6" y1="6" x2="18" y2="18" />
                  </svg>
                </button>
              </div>

              <div className="student-mobile__schedule-body">
                <NewStudentGuide onSearchActivated={handleGuideSearch} />
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {showServices && (
          <motion.div
            className="student-mobile__schedule-overlay"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <motion.div
              className="student-mobile__schedule-modal"
              initial={{ y: "100%" }}
              animate={{ y: 0 }}
              exit={{ y: "100%" }}
              transition={{ type: "spring", damping: 25, stiffness: 300 }}
            >
              <div className="student-mobile__schedule-header">
                <h2>Servicios del campus</h2>

                <button type="button" onClick={() => setShowServices(false)}>
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <line x1="18" y1="6" x2="6" y2="18" />
                    <line x1="6" y1="6" x2="18" y2="18" />
                  </svg>
                </button>
              </div>

              <div className="student-mobile__schedule-body">
                <CampusServicesPanel onSelectService={handleSelectService} />
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {showSchedule && (
          <motion.div
            className="student-mobile__schedule-overlay"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <motion.div
              className="student-mobile__schedule-modal"
              initial={{ y: "100%" }}
              animate={{ y: 0 }}
              exit={{ y: "100%" }}
              transition={{ type: "spring", damping: 25, stiffness: 300 }}
            >
              <div className="student-mobile__schedule-header">
                <h2>Tu horario</h2>

                <button type="button" onClick={() => setShowSchedule(false)}>
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <line x1="18" y1="6" x2="6" y2="18" />
                    <line x1="6" y1="6" x2="18" y2="18" />
                  </svg>
                </button>
              </div>

              <div className="student-mobile__schedule-body">
                <SchedulePanel expanded onNavigateToClass={handleNavigateToClass} />
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
