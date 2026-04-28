import { useBuildingStore } from "../../../store/building-store";

export function BuildingSearch() {
  const searchTerm = useBuildingStore((state) => state.searchTerm);
  const setSearchTerm = useBuildingStore((state) => state.setSearchTerm);

  return (
    <div style={{ display: "grid", gap: "8px" }}>
      <label
        htmlFor="building-search"
        style={{
          fontSize: "13px",
          fontWeight: 700,
          color: "#374151",
        }}
      >
        Buscar edificio
      </label>

      <div
        style={{
          display: "flex",
          gap: "8px",
          alignItems: "center",
        }}
      >
        <input
          id="building-search"
          type="search"
          placeholder="Buscar edificio..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          style={{
            width: "100%",
            padding: "12px 14px",
            borderRadius: "12px",
            border: "1px solid #d1d5db",
            outline: "none",
            fontSize: "14px",
            boxSizing: "border-box",
            background: "#ffffff",
          }}
        />

        {searchTerm.trim() && (
          <button
            type="button"
            onClick={() => setSearchTerm("")}
            style={{
              padding: "12px 14px",
              borderRadius: "12px",
              border: "1px solid #d1d5db",
              background: "#ffffff",
              cursor: "pointer",
              fontSize: "13px",
              fontWeight: 700,
              color: "#111827",
              whiteSpace: "nowrap",
            }}
          >
            Limpiar
          </button>
        )}
      </div>
    </div>
  );
}