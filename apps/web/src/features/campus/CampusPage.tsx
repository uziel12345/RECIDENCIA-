import { useEffect, useState } from "react";
import { CampusViewer } from "../../components/viewer/CampusViewer";
import { BuildingSidebar } from "../buildings/components/BuildingSidebar";
import { useBuildingStore } from "../../store/building-store";
import { Icon } from "../../components/ui/Icons";

function useIsMobile(breakpoint = 768) {
  const [isMobile, setIsMobile] = useState(
    typeof window !== "undefined" ? window.innerWidth < breakpoint : false,
  );

  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth < breakpoint);
    };

    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, [breakpoint]);

  return isMobile;
}

export function CampusPage() {
  const isMobile = useIsMobile();
  const selectedBuilding = useBuildingStore((state) => state.selectedBuilding);
  const routeDestination = useBuildingStore((state) => state.routeDestination);

  const [isMobilePanelOpen, setIsMobilePanelOpen] = useState(false);

  // Open the drawer automatically when the user picks a building on the map.
  useEffect(() => {
    if (isMobile && (selectedBuilding || routeDestination)) {
      setIsMobilePanelOpen(true);
    }
  }, [isMobile, selectedBuilding, routeDestination]);

  if (!isMobile) {
    return (
      <div className="ito-campus">
        <BuildingSidebar isMobile={false} />

        <div className="ito-campus__viewer">
          <CampusViewer isMobile={false} mobilePanelOpen={false} />
        </div>
      </div>
    );
  }

  const fabLabel = routeDestination
    ? "Ver ruta"
    : selectedBuilding
      ? "Ver detalles"
      : "Buscar edificios";

  const fabIcon: "route" | "building" | "search" = routeDestination
    ? "route"
    : selectedBuilding
      ? "building"
      : "search";

  return (
    <div className="ito-campus--mobile">
      <CampusViewer isMobile mobilePanelOpen={isMobilePanelOpen} />

      {!isMobilePanelOpen && (
        <button
          type="button"
          onClick={() => setIsMobilePanelOpen(true)}
          className="ito-fab anim-fade-in"
          style={{ top: 16, left: 16 }}
        >
          <span className="ito-fab__icon" aria-hidden="true">
            <Icon name={fabIcon} size={14} />
          </span>
          <span>{fabLabel}</span>
        </button>
      )}

      {isMobilePanelOpen && (
        <>
          <div
            className="ito-backdrop anim-fade-in"
            onClick={() => setIsMobilePanelOpen(false)}
            role="presentation"
          />
          <div className="ito-mobile-drawer anim-slide-up" role="dialog" aria-label="Panel de edificios">
            <div className="ito-mobile-drawer__handle" aria-hidden="true">
              <div className="ito-mobile-drawer__handle-bar" />
            </div>

            <div className="ito-mobile-drawer__header">
              <div>
                <div className="ito-mobile-drawer__title">
                  {routeDestination
                    ? "Tu ruta"
                    : selectedBuilding
                      ? selectedBuilding.name
                      : "Campus ITO"}
                </div>
                <div className="ito-mobile-drawer__subtitle">
                  {routeDestination
                    ? "Sigue las indicaciones en el mapa"
                    : selectedBuilding
                      ? "Información del edificio"
                      : "Explora y busca edificios del campus"}
                </div>
              </div>

              <button
                type="button"
                onClick={() => setIsMobilePanelOpen(false)}
                className="ito-mobile-drawer__close"
                aria-label="Cerrar panel"
              >
                <Icon name="close" size={16} />
              </button>
            </div>

            <div className="ito-mobile-drawer__body">
              <BuildingSidebar isMobile />
            </div>
          </div>
        </>
      )}
    </div>
  );
}
