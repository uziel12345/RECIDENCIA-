import { useBuildingStore } from "../../../store/building-store";

export function BuildingSearch() {
  const searchTerm = useBuildingStore((state) => state.searchTerm);
  const setSearchTerm = useBuildingStore((state) => state.setSearchTerm);

  return (
    <div style={{ marginBottom: "16px" }}>
      <input
        type="text"
        placeholder="Buscar edificio..."
        value={searchTerm}
        onChange={(e) => setSearchTerm(e.target.value)}
        style={{
          width: "100%",
          padding: "10px 12px",
          borderRadius: "8px",
          border: "1px solid #d1d5db",
          outline: "none",
          fontSize: "14px",
        }}
      />
    </div>
  );
}