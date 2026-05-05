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
import { UsersIcon, LogOutIcon, CompassIcon } from "../shared/Icons";
import { VisitorTopBar } from "./components/VisitorTopBar";
import { QuickDestinations } from "./components/QuickDestinations";

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

export function VisitorPage() {
  const isMobile = useIsMobile();
  const navigate = useNavigate();
  const { logout } = useAuthStore();

  const selectedBuilding = useBuildingStore((state) => state.selectedBuilding);
  const routeDestination = useBuildingStore((state) => state.routeDestination);
  const setSelectedBuilding = useBuildingStore((state) => state.setSelectedBuilding);

  const [sheetState, setSheetState] = useState<SheetState>("closed");
  const [totalBuildings, setTotalBuildings] = useState(0);
  const [showQuickDest, setShowQuickDest] = useState(false);

  useEffect(() => {
    getBuildings().then((data) => {
      setTotalBuildings(
        data.filter((building: Building) => building.is_active).length
      );
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

  const mobileActions = useMemo(() => {
    return [
      {
        id: "quick",
        label: "Destinos",
        icon: "compass" as const,
        onClick: () => setShowQuickDest(true),
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
      <div className="visitor-page">
        <aside className="visitor-page__sidebar">
          <div className="visitor-page__sidebar-header">
            <div className="visitor-page__user">
              <div className="visitor-page__user-avatar">
                <UsersIcon size={20} />
              </div>

              <div className="visitor-page__user-info">
                <span className="visitor-page__user-name">Visitante</span>
                <span className="visitor-page__user-role">
                  Explorando el campus
                </span>
              </div>
            </div>

            <button
              type="button"
              className="visitor-page__logout"
              onClick={handleLogout}
              title="Salir"
            >
              <LogOutIcon size={18} />
            </button>
          </div>

          <div className="visitor-page__quick-section">
            <h3 className="visitor-page__section-title">
              <CompassIcon size={16} />
              <span>Destinos Populares</span>
            </h3>

            <QuickDestinations compact />
          </div>

          <div className="visitor-page__sidebar-content">
            <BuildingSidebar isMobile={false} />
          </div>
        </aside>

        <main className="visitor-page__main">
          <div className="visitor-page__viewer">
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
                <h2>Destinos Populares</h2>

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