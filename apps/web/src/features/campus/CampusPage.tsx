import { useEffect, useState } from "react";
import { CampusViewer } from "../../components/viewer/CampusViewer";
import { BuildingSidebar } from "../buildings/components/BuildingSidebar";
import { useBuildingStore } from "../../store/building-store";

function useIsMobile(breakpoint = 768) {
  const [isMobile, setIsMobile] = useState(window.innerWidth < breakpoint);

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

  useEffect(() => {
    if (!isMobile) {
      setIsMobilePanelOpen(true);
    }
  }, [isMobile]);

  if (!isMobile) {
    return (
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "320px 1fr",
          width: "100vw",
          height: "100vh",
          overflow: "hidden",
          background: "#f3f4f6",
        }}
      >
        <BuildingSidebar isMobile={false} />

        <div
          style={{
            position: "relative",
            minWidth: 0,
            height: "100%",
          }}
        >
          <CampusViewer isMobile={false} mobilePanelOpen={false} />
        </div>
      </div>
    );
  }

  return (
    <div
      style={{
        position: "relative",
        width: "100vw",
        height: "100vh",
        overflow: "hidden",
        background: "#f3f4f6",
      }}
    >
      <CampusViewer
        isMobile
        mobilePanelOpen={isMobilePanelOpen}
      />

      <button
        type="button"
        onClick={() => setIsMobilePanelOpen(true)}
        style={{
          position: "absolute",
          top: 16,
          left: 16,
          zIndex: 30,
          border: "none",
          borderRadius: 14,
          padding: "12px 16px",
          background: "#ffffff",
          color: "#111827",
          fontSize: 14,
          fontWeight: 700,
          boxShadow: "0 12px 24px rgba(0,0,0,0.16)",
          cursor: "pointer",
        }}
      >
        {routeDestination
          ? "Ruta"
          : selectedBuilding
          ? "Detalle"
          : "Edificios"}
      </button>

      {isMobilePanelOpen && (
        <div
          style={{
            position: "absolute",
            left: 0,
            right: 0,
            bottom: 0,
            height: "52vh",
            zIndex: 25,
            background: "rgba(255,255,255,0.98)",
            borderTopLeftRadius: 24,
            borderTopRightRadius: 24,
            boxShadow: "0 -8px 30px rgba(0,0,0,0.18)",
            borderTop: "1px solid #e5e7eb",
            display: "flex",
            flexDirection: "column",
            overflow: "hidden",
          }}
        >
          <div
            style={{
              display: "flex",
              justifyContent: "center",
              paddingTop: 10,
              paddingBottom: 8,
            }}
          >
            <div
              style={{
                width: 52,
                height: 6,
                borderRadius: 999,
                background: "#d1d5db",
              }}
            />
          </div>

          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              padding: "0 16px 12px",
              borderBottom: "1px solid #e5e7eb",
            }}
          >
            <div>
              <div
                style={{
                  fontSize: 18,
                  fontWeight: 700,
                  color: "#111827",
                }}
              >
                {routeDestination
                  ? "Ruta"
                  : selectedBuilding
                  ? "Edificio"
                  : "Edificios"}
              </div>

              <div
                style={{
                  fontSize: 12,
                  color: "#6b7280",
                  marginTop: 2,
                }}
              >
                Busca, selecciona y genera una ruta.
              </div>
            </div>

            <button
              type="button"
              onClick={() => setIsMobilePanelOpen(false)}
              style={{
                border: "none",
                background: "#f3f4f6",
                borderRadius: 10,
                padding: "8px 10px",
                cursor: "pointer",
                fontSize: 13,
                fontWeight: 700,
                color: "#111827",
              }}
            >
              Cerrar
            </button>
          </div>

          <div
            style={{
              padding: 16,
              overflowY: "auto",
              flex: 1,
            }}
          >
            <BuildingSidebar isMobile />
          </div>
        </div>
      )}
    </div>
  );
}