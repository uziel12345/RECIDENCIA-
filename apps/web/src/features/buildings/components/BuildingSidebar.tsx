import { useEffect, useMemo, useState } from "react";
import { useBuildingStore } from "../../../store/building-store";
import { RoutePanel } from "./RoutePanel";
import { getBuildings } from "../../../services/buildings.service";
import type { Building } from "../types/building";

export function BuildingSidebar() {
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

    return buildings
      .filter((building) => building.is_active)
      .filter((building) => {
        if (!normalizedSearch) {
          return true;
        }

        return (
          building.name.toLowerCase().includes(normalizedSearch) ||
          building.code.toLowerCase().includes(normalizedSearch) ||
          building.category_name.toLowerCase().includes(normalizedSearch)
        );
      });
  }, [buildings, searchTerm]);

  if (loading) {
    return <div style={{ padding: "16px" }}>Cargando edificios...</div>;
  }

  return (
    <aside
      style={{
        width: "320px",
        height: "100vh",
        background: "#ffffff",
        borderRight: "1px solid #e5e7eb",
        padding: "16px",
        overflowY: "auto",
      }}
    >
      <h2 style={{ marginTop: 0, fontSize: "20px" }}>Edificios</h2>

      <div style={{ marginBottom: "16px" }}>
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
                marginBottom: "8px",
                padding: "10px 12px",
                borderRadius: "8px",
                border: "1px solid #e5e7eb",
                background:
                  selectedBuilding?.id === building.id ? "#eef2ff" : "#ffffff",
                cursor: "pointer",
              }}
            >
              <strong>{building.name}</strong>
              <div style={{ fontSize: "12px", color: "#6b7280" }}>
                {building.category_name}
              </div>
            </button>
          ))
        )}
      </div>

      <hr />

      <div style={{ marginTop: "16px" }}>
        <h3 style={{ marginBottom: "8px" }}>Información</h3>

        {selectedBuilding ? (
          <div>
            <p>
              <strong>Nombre:</strong> {selectedBuilding.name}
            </p>
            <p>
              <strong>Código:</strong> {selectedBuilding.code}
            </p>
            <p>
              <strong>Categoría:</strong> {selectedBuilding.category_name}
            </p>
            <p>
              <strong>Descripción:</strong>{" "}
              {selectedBuilding.description ?? "Sin descripción"}
            </p>
          </div>
        ) : (
          <p>Selecciona un edificio para ver su información.</p>
        )}
      </div>

      <RoutePanel />
    </aside>
  );
}