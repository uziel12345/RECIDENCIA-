import { useEffect, useMemo, useState, useCallback } from "react";
import { AnimatePresence } from "framer-motion";
import { CampusViewer } from "../../components/viewer/CampusViewer";
import { BuildingSidebar } from "../buildings/components/BuildingSidebar";
import { BuildingQuickCard } from "../buildings/components/BuildingQuickCard";
import { useBuildingStore } from "../../store/building-store";
import { useLocationStore } from "../../store/location-store";
import { getBuildings } from "../../services/buildings.service";
import type { Building } from "../buildings/types/building";
import { MobileBottomSheet, type SheetState } from "./components/MobileBottomSheet";
import { MobileQuickActions } from "./components/MobileQuickActions";
import { MobileTopBar } from "./components/MobileTopBar";
import { useIsMobile } from "../../hooks/useIsMobile";
import { ChevronLeftIcon, ChevronRightIcon } from "../shared/Icons";

export function CampusPage() {
  const isMobile = useIsMobile();
  const selectedBuilding = useBuildingStore((state) => state.selectedBuilding);
  const routeDestination = useBuildingStore((state) => state.routeDestination);
  const setSelectedBuilding = useBuildingStore((s) => s.setSelectedBuilding);
  const mapPosition = useLocationStore((s) => s.mapPosition);
  const hasLocation = mapPosition !== null;

  // User-controlled bottom sheet state. When a route is active on mobile the
  // sheet is always forced closed so the map stays as the hero view.
  const [requestedSheetState, setSheetState] = useState<SheetState>("closed");
  const sheetState: SheetState =
    isMobile && !!routeDestination ? "closed" : requestedSheetState;

  // Cache building total to show in the top bar even before the sheet opens.
  const [totalBuildings, setTotalBuildings] = useState(0);

  useEffect(() => {
    getBuildings().then((data) => {
      setTotalBuildings(data.filter((b: Building) => b.is_active).length);
    });
  }, []);

  // Build the mobile action bar items. Hook must be called unconditionally
  // before any early returns to satisfy the Rules of Hooks.
  const mobileActions = useMobileActions({
    sheetState,
    setSheetState,
    hasSelected: !!selectedBuilding,
    hasRoute: !!routeDestination,
  });

  // ----------------------------------------------------------------------
  // Desktop layout
  // ----------------------------------------------------------------------
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const toggleSidebar = useCallback(() => setSidebarCollapsed((c) => !c), []);

  if (!isMobile) {
    return (
      <div
        className="ito-campus"
        style={{ gridTemplateColumns: sidebarCollapsed ? "0px 1fr" : "385px 1fr" }}
      >
        <div className="ito-sidebar-wrapper">
          <BuildingSidebar isMobile={false} />
        </div>

        <div className="ito-campus__viewer">
          <button
            type="button"
            className="ito-sidebar-toggle"
            onClick={toggleSidebar}
            title={sidebarCollapsed ? "Mostrar panel" : "Ocultar panel"}
          >
            {sidebarCollapsed ? <ChevronRightIcon size={14} /> : <ChevronLeftIcon size={14} />}
          </button>
          <CampusViewer isMobile={false} mobilePanelOpen={false} />
        </div>
      </div>
    );
  }

  // ----------------------------------------------------------------------
  // Mobile layout
  // ----------------------------------------------------------------------
  const sheetTitle = routeDestination
    ? "Tu ruta"
    : selectedBuilding
      ? selectedBuilding.name
      : "Explorar campus";

  const sheetSubtitle = routeDestination
    ? "Sigue las indicaciones en el mapa"
    : selectedBuilding
      ? "Detalles del edificio"
      : `${totalBuildings} edificios en ${
          hasLocation ? "vivo" : "el campus"
        }`;

  // Show the floating quick card when a building is selected and the sheet is
  // closed — gives one-tap access to "Detalles" / "Trazar ruta" without
  // overlapping with the sheet header.
  const showQuickCard =
    !!selectedBuilding && !routeDestination && sheetState === "closed";

  return (
    <div className="ito-campus--mobile">
      <CampusViewer isMobile mobilePanelOpen={sheetState === "full"} />

      <MobileTopBar
        totalBuildings={totalBuildings}
        hasLocation={hasLocation}
        onSearchClick={() => setSheetState("full")}
      />

      <AnimatePresence>
        {showQuickCard && (
          <BuildingQuickCard
            building={selectedBuilding}
            onOpenDetails={() => setSheetState("full")}
          />
        )}
      </AnimatePresence>

      <MobileQuickActions actions={mobileActions} />

      <MobileBottomSheet
        state={sheetState}
        onChangeState={(next) => {
          // Closing the sheet should not erase the active selection — the
          // floating quick card keeps it accessible.
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
          onItemSelected={() => {
            // When user selects from list, collapse to peek so they see the
            // map but the sheet remains accessible.
            setSheetState("peek");
          }}
          onClearSelection={() => {
            setSelectedBuilding(null);
          }}
        />
      </MobileBottomSheet>
    </div>
  );
}

// ----------------------------------------------------------------------
// Builds the action bar buttons. Memoizes nothing intentionally to keep the
// component simple — the array is small.
// ----------------------------------------------------------------------
function useMobileActions(args: {
  sheetState: SheetState;
  setSheetState: (state: SheetState) => void;
  hasSelected: boolean;
  hasRoute: boolean;
}) {
  const { sheetState, setSheetState, hasSelected, hasRoute } = args;

  return useMemo(() => {
    return [
      {
        id: "search",
        label: "Buscar",
        icon: "search" as const,
        onClick: () => setSheetState("full"),
        active: sheetState === "full",
      },
      {
        id: "list",
        label: "Lista",
        icon: "list" as const,
        onClick: () =>
          setSheetState(sheetState === "peek" ? "full" : "peek"),
        active: sheetState === "peek",
        primary: true,
      },
      {
        id: "info",
        label: hasRoute ? "Ruta" : hasSelected ? "Info" : "Sobre",
        icon: hasRoute
          ? ("route" as const)
          : hasSelected
            ? ("info" as const)
            : ("sparkles" as const),
        onClick: () => setSheetState("full"),
        badge: hasSelected ? "•" : undefined,
      },
    ];
  }, [sheetState, hasSelected, hasRoute, setSheetState]);
}
