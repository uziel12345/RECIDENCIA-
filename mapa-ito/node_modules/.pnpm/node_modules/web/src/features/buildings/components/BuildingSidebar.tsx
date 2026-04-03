import { buildings } from "../data/buildings";
import { useBuildingStore } from "../../../store/building-store";

export function BuildingSidebar() {
  const selectedBuilding = useBuildingStore((state) => state.selectedBuilding);
  const setSelectedBuilding = useBuildingStore((state) => state.setSelectedBuilding);
  const searchTerm = useBuildingStore((state) => state.searchTerm);

  const filteredBuildings = buildings.filter((building) =>
    building.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

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
        {filteredBuildings.map((building) => (
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
              {building.category}
            </div>
          </button>
        ))}
      </div>

      <hr />

      <div style={{ marginTop: "16px" }}>
        <h3 style={{ marginBottom: "8px" }}>Información</h3>

        {selectedBuilding ? (
          <div>
            <p><strong>Nombre:</strong> {selectedBuilding.name}</p>
            <p><strong>Código:</strong> {selectedBuilding.code}</p>
            <p><strong>Categoría:</strong> {selectedBuilding.category}</p>
            <p><strong>Descripción:</strong> {selectedBuilding.description}</p>
            <p><strong>Nodo 3D:</strong> {selectedBuilding.modelNodeName}</p>
          </div>
        ) : (
          <p>Selecciona un edificio para ver su información.</p>
        )}
      </div>
    </aside>
  );
}