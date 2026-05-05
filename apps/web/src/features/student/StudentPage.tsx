import { useEffect, useMemo, useState } from "react";
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
  GraduationCapIcon,
  CalendarIcon,
  LogOutIcon,
  MapIcon,
} from "../shared/Icons";
import { StudentTopBar } from "./components/StudentTopBar";
import { SchedulePanel } from "./components/SchedulePanel";

function useIsMobile(breakpoint = 768) {
  const [isMobile, setIsMobile] = useState(
    typeof window !== "undefined" ? window.innerWidth < breakpoint : false
  );

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < breakpoint);
    window.addEventListener("resize", handleResize);

    return () => window.removeEventListener("resize", handleResize);
  }, [breakpoint]);

  return isMobile;
}

type ViewMode = "map" | "schedule";

export function StudentPage() {
  const isMobile = useIsMobile();
  const navigate = useNavigate();
  const { logout, user } = useAuthStore();

  const selectedBuilding = useBuildingStore((state) => state.selectedBuilding);
  const routeDestination = useBuildingStore((state) => state.routeDestination);
  const setSelectedBuilding = useBuildingStore(
    (state) => state.setSelectedBuilding
  );

  const [sheetState, setSheetState] = useState<SheetState>("closed");
  const [totalBuildings, setTotalBuildings] = useState(0);
  const [viewMode, setViewMode] = useState<ViewMode>("map");
  const [showSchedule, setShowSchedule] = useState(false);

  useEffect(() => {
    getBuildings().then((data) => {
      setTotalBuildings(data.filter((building: Building) => building.is_active).length);
    });
  }, []);

  useEffect(() => {
    if (!isMobile) return;

    if (routeDestination) {
      setSheetState("closed");
    }
  }, [isMobile, routeDestination]);

  const handleLogout = () => {
    logout();
    navigate(ROUTES.WELCOME);
  };

  const handleNavigateFromSchedule = () => {
    setViewMode("map");
    setShowSchedule(false);
    setSheetState("closed");
  };

  const mobileActions = useMemo(() => {
    return [
      {
        id: "schedule",
        label: "Horario",
        icon: "map" as const,
        onClick: () => setShowSchedule(true),
      },
      {
        id: "search",
        label: "Buscar",
        icon: "search" as const,
        onClick: () => setSheetState("full"),
        active: sheetState === "full",
      },
      {
        id: "list",
        label: "Edificios",
        icon: "list" as const,
        onClick: () => setSheetState(sheetState === "peek" ? "full" : "peek"),
        active: sheetState === "peek",
        primary: true,
      },
    ];
  }, [sheetState]);

  if (!isMobile) {
    return (
      <div className="student-page">
        <aside className="student-page__sidebar">
          <div className="student-page__sidebar-header">
            <div className="student-page__user">
              <div className="student-page__user-avatar">
                <GraduationCapIcon size={20} />
              </div>

              <div className="student-page__user-info">
                <span className="student-page__user-name">
                  {user?.name || "Estudiante"}
                </span>
                <span className="student-page__user-role">Alumno</span>
              </div>
            </div>

            <button
              type="button"
              className="student-page__logout"
              onClick={handleLogout}
              title="Cerrar sesion"
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
              <span>Mapa del Campus</span>
            </button>

            <button
              type="button"
              className={`student-page__nav-item ${
                viewMode === "schedule" ? "is-active" : ""
              }`}
              onClick={() => setViewMode("schedule")}
            >
              <CalendarIcon size={18} />
              <span>Mi Horario</span>
            </button>
          </nav>

          {viewMode === "map" && (
            <div className="student-page__sidebar-content">
              <BuildingSidebar isMobile={false} />
            </div>
          )}

          {viewMode === "schedule" && (
            <div className="student-page__sidebar-content">
              <SchedulePanel onNavigateToClass={handleNavigateFromSchedule} />
            </div>
          )}
        </aside>

        <main className="student-page__main">
          {viewMode === "map" && (
            <div className="student-page__viewer">
              <CampusViewer isMobile={false} mobilePanelOpen={false} />
            </div>
          )}

          {viewMode === "schedule" && (
            <div className="student-page__schedule-full">
              <SchedulePanel expanded />
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
        onSearchClick={() => setSheetState("full")}
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
                <h2>Mi Horario</h2>

                <button type="button" onClick={() => setShowSchedule(false)}>
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

              <div className="student-mobile__schedule-body">
                <SchedulePanel onNavigateToClass={handleNavigateFromSchedule} />
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