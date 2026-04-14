import { buildings } from "../data/buildings";
import { useBuildingStore } from "../../../store/building-store";

export function RoutePanel() {
  const routeOrigin = useBuildingStore((state) => state.routeOrigin);
  const routeDestination = useBuildingStore((state) => state.routeDestination);
  const setRouteOrigin = useBuildingStore((state) => state.setRouteOrigin);
  const setRouteDestination = useBuildingStore(
    (state) => state.setRouteDestination
  );
  const clearRoute = useBuildingStore((state) => state.clearRoute);

  return (
    <div
      style={{
        marginTop: "16px",
        padding: "12px",
        border: "1px solid #e5e7eb",
        borderRadius: "10px",
        background: "#f9fafb",
      }}
    >
      <h3 style={{ marginTop: 0, marginBottom: "12px" }}>Ruta</h3>

      <div style={{ marginBottom: "10px" }}>
        <label
          style={{
            display: "block",
            fontSize: "12px",
            fontWeight: 700,
            marginBottom: "6px",
            color: "#374151",
          }}
        >
          Origen
        </label>
        <select
          value={routeOrigin?.id ?? ""}
          onChange={(e) => {
            const building =
              buildings.find((item) => item.id === e.target.value) ?? null;
            setRouteOrigin(building);
          }}
          style={{
            width: "100%",
            padding: "10px 12px",
            borderRadius: "8px",
            border: "1px solid #d1d5db",
            background: "#ffffff",
          }}
        >
          <option value="">Selecciona origen</option>
          {buildings.map((building) => (
            <option key={building.id} value={building.id}>
              {building.name}
            </option>
          ))}
        </select>
      </div>

      <div style={{ marginBottom: "12px" }}>
        <label
          style={{
            display: "block",
            fontSize: "12px",
            fontWeight: 700,
            marginBottom: "6px",
            color: "#374151",
          }}
        >
          Destino
        </label>
        <select
          value={routeDestination?.id ?? ""}
          onChange={(e) => {
            const building =
              buildings.find((item) => item.id === e.target.value) ?? null;
            setRouteDestination(building);
          }}
          style={{
            width: "100%",
            padding: "10px 12px",
            borderRadius: "8px",
            border: "1px solid #d1d5db",
            background: "#ffffff",
          }}
        >
          <option value="">Selecciona destino</option>
          {buildings.map((building) => (
            <option key={building.id} value={building.id}>
              {building.name}
            </option>
          ))}
        </select>
      </div>

      <button
        type="button"
        onClick={clearRoute}
        style={{
          width: "100%",
          padding: "10px 12px",
          borderRadius: "8px",
          border: "none",
          background: "#111827",
          color: "#ffffff",
          fontWeight: 700,
          cursor: "pointer",
        }}
      >
        Limpiar ruta
      </button>
    </div>
  );
}