import { useCallback, useEffect, useMemo, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
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
  ClockIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
} from "../../components/ui/Icons";
import { ThemeToggle } from "../../components/ui/ThemeToggle";
import { StudentTopBar } from "./components/StudentTopBar";
import { StudentFirstVisitTip } from "./components/StudentFirstVisitTip";
import { SchedulePanel } from "./components/SchedulePanel";
import {
  CampusServicesPanel,
  type CampusService,
} from "../shared/components/CampusServicesPanel";
import { useIsMobile } from "../../hooks/useIsMobile";

type ViewMode = "map" | "services" | "schedule";

export function StudentPage() {
  const isMobile = useIsMobile();
  const navigate = useNavigate();
  const location = useLocation();
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
  const [showServices, setShowServices] = useState(false);
  const [showSchedule, setShowSchedule] = useState(false);
  const [showFirstVisitTip, setShowFirstVisitTip] = useState(
    () => Boolean((location.state as { firstVisit?: boolean } | null)?.firstVisit)
  );

  useEffect(() => {
    getBuildings()
      .then((data) => {
        setTotalBuildings(
          data.filter((building: Building) => building.is_active).length
        );
      })
      .catch(() => setTotalBuildings(0));
  }, []);

  // Evita que un back/forward del navegador reactive la guía: la marca de
  // "primera visita" solo debe consumirse una vez, no vivir en el historial.
  useEffect(() => {
    if (location.state && (location.state as { firstVisit?: boolean }).firstVisit) {
      navigate(location.pathname, { replace: true, state: {} });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Si el estudiante ya selecciona un edificio, ya está explorando por su
  // cuenta: no hace falta seguir mostrando la guía de bienvenida encima.
  useEffect(() => {
    if (selectedBuilding) setShowFirstVisitTip(false);
  }, [selectedBuilding]);

  const handleLogout = () => {
    logout();
    navigate(ROUTES.WELCOME);
  };

  const closeMobilePanels = useCallback(() => {
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

  const mobileActions = useMemo(() => {
    return [
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
        active: sheetState !== "closed" && !showServices && !showSchedule,
        primary: true,
      },
    ];
  }, [openBuildings, openServices, openSchedule, sheetState, showServices, showSchedule]);

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

          {showFirstVisitTip && (
            <StudentFirstVisitTip
              isMobile={false}
              onDismiss={() => setShowFirstVisitTip(false)}
            />
          )}

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
                showSearchPanel={false}
                userName={user?.name || "Estudiante"}
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
          {/* El visor 3D se mantiene siempre montado (solo oculto con CSS) al
              cambiar de pestaña, para no recargar el GLB ni resetear la
              cámara/ubicación cada vez que se vuelve a "Mapa". El mapa se
              muestra en las 3 pestañas (Inicio/Servicios/Horario) para que
              el layout (ancho de sidebar, panel principal) sea el mismo
              siempre — antes "Horario" duplicaba SchedulePanel (compacto en
              el sidebar + expandido en main), lo mismo que le pasaba a
              Servicios. */}
          <div className="student-page__viewer" style={{ position: "relative" }}>
            <button
              type="button"
              className="ito-sidebar-toggle"
              onClick={() => setSidebarCollapsed((c) => !c)}
              title={sidebarCollapsed ? "Mostrar panel" : "Ocultar panel"}
            >
              {sidebarCollapsed ? <ChevronRightIcon size={14} /> : <ChevronLeftIcon size={14} />}
            </button>
            <MapSearchOverlay userName={user?.name || "Estudiante"} />
            <CampusViewer isMobile={false} mobilePanelOpen={false} mapXOffset={sidebarCollapsed ? 0 : -75} />
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
    <div className="ito-campus--mobile student-mobile">
      <CampusViewer isMobile mobilePanelOpen={sheetState === "full"} />

      <StudentTopBar
        userName={user?.name || "Estudiante"}
        onSearchClick={openBuildingSearch}
        onLogout={handleLogout}
      />

      {showFirstVisitTip && (
        <StudentFirstVisitTip
          isMobile
          onDismiss={() => setShowFirstVisitTip(false)}
        />
      )}

      <AnimatePresence>
        {showQuickCard && (
          <BuildingQuickCard
            building={selectedBuilding}
            onOpenDetails={() => setSheetState("full")}
          />
        )}
      </AnimatePresence>

      <MobileActionModal
        open={showServices}
        title="Servicios del campus"
        onClose={() => setShowServices(false)}
      >
        <CampusServicesPanel onSelectService={handleSelectService} />
      </MobileActionModal>

      <MobileActionModal
        open={showSchedule}
        title="Tu horario"
        onClose={() => setShowSchedule(false)}
      >
        <SchedulePanel expanded onNavigateToClass={handleNavigateToClass} />
      </MobileActionModal>

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
