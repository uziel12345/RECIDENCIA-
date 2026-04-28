import { useEffect, useMemo, useState } from "react";
import { useBuildingStore } from "../../../store/building-store";
import { RoutePanel } from "./RoutePanel";
import { getBuildings } from "../../../services/buildings.service";
import { BuildingSearch } from "./BuildingSearch";
import type { Building } from "../types/building";

type BuildingSidebarProps = {
  isMobile?: boolean;
};

export function BuildingSidebar({
  isMobile = false,
}: BuildingSidebarProps) {
  const selectedBuilding = useBuildingStore((state) => state.selectedBuilding);
  const setSelectedBuilding = useBuildingStore(
    (state) => state.setSelectedBuilding
  );
  const searchTerm = useBuildingStore((state) => state.searchTerm);

  const [buildings, setBuildings] = useState<Building[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadBuildings() {
      try {
        const data = await getBuildings();
        setBuildings(data);
      } catch (error) {
        console.error("Error cargando edificios:", error);
      } finally {
        setLoading(false);
      }
    }

    loadBuildings();
  }, []);

 const filteredBuildings = useMemo(() => {
  const normalizedSearch = searchTerm.trim().toLowerCase();

  const result = buildings
    .filter((building) => building.is_active)
    .filter((building) => {
      if (!normalizedSearch) return true;

      return (
        building.name.toLowerCase().includes(normalizedSearch) ||
        building.code.toLowerCase().includes(normalizedSearch) ||
        building.category_name.toLowerCase().includes(normalizedSearch)
      );
    });

  if (!selectedBuilding) {
    return result;
  }

  return [...result].sort((a, b) => {
    if (a.id === selectedBuilding.id) return -1;
    if (b.id === selectedBuilding.id) return 1;
    return 0;
  });
}, [buildings, searchTerm, selectedBuilding]);

  return (
    <aside
      style={{
        width: "100%",
        height: isMobile ? "auto" : "100vh",
        background: "#ffffff",
        borderRight: isMobile ? "none" : "1px solid #e5e7eb",
        padding: isMobile ? 0 : "16px",
        overflowY: "auto",
        boxSizing: "border-box",
      }}
    >
      <BuildingSearch />

      <div style={{ marginTop: 16 }}>
        <h2
          style={{
            marginTop: 0,
            marginBottom: 12,
            fontSize: isMobile ? "18px" : "20px",
          }}
        >
          Edificios
        </h2>

        <div
          style={{
            display: "grid",
            gap: 8,
            maxHeight: isMobile ? 220 : "none",
            overflowY: isMobile ? "auto" : "visible",
            paddingRight: isMobile ? 4 : 0,
          }}
        >
          {filteredBuildings.length === 0 ? (
            <p style={{ color: "#6b7280", fontSize: "14px" }}>
              No se encontraron edificios.
            </p>
          ) : (
            filteredBuildings.map((building) => (
              <button
                key={building.id}
                onClick={() => setSelectedBuilding(building)}
                style={{
                  display: "block",
                  width: "100%",
                  textAlign: "left",
                  padding: isMobile ? "12px" : "10px 12px",
                  borderRadius: "12px",
                  border: "1px solid #e5e7eb",
                  background:
                    selectedBuilding?.id === building.id ? "#eef2ff" : "#ffffff",
                  cursor: "pointer",
                }}
              >
                <strong
                  style={{
                    display: "block",
                    fontSize: isMobile ? "15px" : "16px",
                  }}
                >
                  {building.name}
                </strong>

                <div
                  style={{
                    fontSize: "12px",
                    color: "#6b7280",
                    marginTop: 4,
                  }}
                >
                  {building.category_name}
                </div>
              </button>
            ))
          )}
        </div>
      </div>

      {selectedBuilding && (
        <>
          <hr style={{ margin: "16px 0" }} />

          <div>
            <h3 style={{ marginBottom: "8px" }}>Información</h3>

            <div
              style={{
                background: "#f9fafb",
                border: "1px solid #e5e7eb",
                borderRadius: 12,
                padding: 12,
              }}
            >
              <p style={{ margin: "0 0 8px" }}>
                <strong>Nombre:</strong> {selectedBuilding.name}
              </p>
              <p style={{ margin: "0 0 8px" }}>
                <strong>Código:</strong> {selectedBuilding.code}
              </p>
              <p style={{ margin: "0 0 8px" }}>
                <strong>Categoría:</strong> {selectedBuilding.category_name}
              </p>
              <p style={{ margin: 0 }}>
                <strong>Descripción:</strong>{" "}
                {selectedBuilding.description ?? "Sin descripción"}
              </p>
            </div>
          </div>

          <div style={{ marginTop: 16 }}>
            <RoutePanel compact={isMobile} />
          </div>
        </>
      )}
    </aside>
  );
}