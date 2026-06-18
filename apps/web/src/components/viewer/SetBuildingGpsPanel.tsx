import { useState } from "react";
import { useLocationStore } from "../../store/location-store";
import { updateBuildingApi } from "@ito-map/shared";
import type { Building } from "../../features/buildings/types/building";
import { Icon } from "../ui/Icons";

// Inverse of the original affine GPS→3D transform used in the old coordinate-mapper.ts.
// Given a building's (x, z) 3D position, calculates the approximate campus GPS center.
const REF_LAT = 17.07761201319465;
const REF_LNG = -96.74416660753468;
const METERS_PER_LAT = 111320;
const METERS_PER_LNG = 106411.66838807071;
const A_X = 0.943977879, B_X = 0.007413161, C_X = 9.63565497;
const A_Z = 0.0204740651, B_Z = -0.942769452, C_Z = 27.2371311;
const DET = A_X * B_Z - B_X * A_Z;

function xzToGps(x: number, z: number): { latitude: number; longitude: number } {
  const px = x - C_X;
  const pz = z - C_Z;
  const e = (px * B_Z - B_X * pz) / DET;
  const n = (A_X * pz - px * A_Z) / DET;
  return {
    latitude: REF_LAT + n / METERS_PER_LAT,
    longitude: REF_LNG + e / METERS_PER_LNG,
  };
}

type AutoStatus =
  | { state: "idle" }
  | { state: "running"; done: number; total: number; errors: number }
  | { state: "done"; done: number; total: number; errors: number };

type Props = {
  buildings: Building[];
  onClose: () => void;
  onBuildingUpdated: () => void;
};

export function SetBuildingGpsPanel({ buildings, onClose, onBuildingUpdated }: Props) {
  const geoPosition = useLocationStore((s) => s.geoPosition);
  const [selectedId, setSelectedId] = useState("");
  const [status, setStatus] = useState<"idle" | "saving" | "saved" | "error">("idle");
  const [errorMsg, setErrorMsg] = useState("");
  const [autoStatus, setAutoStatus] = useState<AutoStatus>({ state: "idle" });

  const withGpsCount = buildings.filter(
    (b) => b.latitude != null && b.longitude != null
  ).length;

  const canAutoCalc = buildings.some(
    (b) => b.x != null && b.z != null && (b.latitude == null || b.longitude == null)
  );

  const sorted = [...buildings].sort((a, b) => {
    const aHas = a.latitude != null && a.longitude != null;
    const bHas = b.latitude != null && b.longitude != null;
    if (aHas !== bHas) return aHas ? 1 : -1;
    return a.name.localeCompare(b.name);
  });

  const selected = buildings.find((b) => b.id === selectedId);
  const selectedHasGps = selected?.latitude != null && selected?.longitude != null;

  const handleSave = async () => {
    if (!selectedId || !geoPosition) return;
    setStatus("saving");
    setErrorMsg("");
    try {
      await updateBuildingApi(selectedId, {
        latitude: geoPosition.latitude,
        longitude: geoPosition.longitude,
      });
      setStatus("saved");
      onBuildingUpdated();
      setTimeout(() => {
        setStatus("idle");
        setSelectedId("");
      }, 2500);
    } catch {
      setStatus("error");
      setErrorMsg("No se pudo guardar. Verifica la conexión con la API.");
    }
  };

  const handleAutoCalculate = async () => {
    const toProcess = buildings.filter(
      (b) => b.x != null && b.z != null && (b.latitude == null || b.longitude == null)
    );
    if (toProcess.length === 0) return;

    setAutoStatus({ state: "running", done: 0, total: toProcess.length, errors: 0 });

    let done = 0;
    let errors = 0;

    // Process in batches of 5 to avoid overwhelming the API
    for (let i = 0; i < toProcess.length; i += 5) {
      const batch = toProcess.slice(i, i + 5);
      await Promise.allSettled(
        batch.map(async (building) => {
          try {
            const gps = xzToGps(Number(building.x), Number(building.z));
            await updateBuildingApi(building.id, gps);
            done++;
          } catch {
            errors++;
          }
        })
      );
      setAutoStatus({ state: "running", done: done + errors, total: toProcess.length, errors });
    }

    setAutoStatus({ state: "done", done, total: toProcess.length, errors });
    onBuildingUpdated();
  };

  return (
    <div className="ito-setgps-panel">
      <div className="ito-setgps-panel__header">
        <Icon name="map-pin" size={14} />
        <span>Registrar GPS de edificios</span>
        <button
          type="button"
          className="ito-setgps-panel__close"
          onClick={onClose}
          aria-label="Cerrar"
        >
          <Icon name="x" size={14} />
        </button>
      </div>

      <div className="ito-setgps-panel__body">
        {/* Coverage */}
        <div className="ito-setgps-panel__coverage">
          <span className="ito-setgps-panel__coverage-num">
            {withGpsCount}/{buildings.length}
          </span>
          <span>edificios con GPS registrado</span>
        </div>

        {/* Auto-calculate section */}
        {(canAutoCalc || autoStatus.state !== "idle") && (
          <div className="ito-setgps-panel__auto">
            {autoStatus.state === "idle" && (
              <>
                <p className="ito-setgps-panel__hint" style={{ marginBottom: 0 }}>
                  Calcula el GPS de todos los edificios automáticamente a partir de sus posiciones en el modelo 3D. Preciso para detección por edificio (~5–20 m).
                </p>
                <button
                  type="button"
                  className="ito-setgps-panel__auto-btn"
                  onClick={handleAutoCalculate}
                >
                  <Icon name="locate" size={13} />
                  <span>
                    Calcular GPS de{" "}
                    {buildings.filter(
                      (b) => b.x != null && b.z != null && (b.latitude == null || b.longitude == null)
                    ).length}{" "}
                    edificios automáticamente
                  </span>
                </button>
              </>
            )}

            {autoStatus.state === "running" && (
              <div className="ito-setgps-panel__auto-progress">
                <div className="ito-setgps-panel__auto-bar">
                  <div
                    className="ito-setgps-panel__auto-fill"
                    style={{
                      width: `${Math.round((autoStatus.done / autoStatus.total) * 100)}%`,
                    }}
                  />
                </div>
                <span>
                  Calculando… {autoStatus.done}/{autoStatus.total}
                  {autoStatus.errors > 0 && ` (${autoStatus.errors} errores)`}
                </span>
              </div>
            )}

            {autoStatus.state === "done" && (
              <div
                className={`ito-setgps-panel__auto-result ${autoStatus.errors > 0 ? "has-errors" : "is-ok"}`}
              >
                <Icon name="check" size={13} />
                <span>
                  {autoStatus.done} edificios actualizados
                  {autoStatus.errors > 0 && `, ${autoStatus.errors} fallaron`}
                </span>
              </div>
            )}
          </div>
        )}

        <div className="ito-setgps-panel__divider" />

        {/* Manual GPS signal */}
        <div className={`ito-setgps-panel__signal${geoPosition ? " is-active" : ""}`}>
          <span className="ito-setgps-panel__signal-dot" />
          {geoPosition ? (
            <span>
              {geoPosition.latitude.toFixed(6)}, {geoPosition.longitude.toFixed(6)}
              {geoPosition.accuracy != null && (
                <span className="ito-setgps-panel__acc">
                  {" "}±{geoPosition.accuracy.toFixed(0)} m
                </span>
              )}
            </span>
          ) : (
            <span>Sin señal GPS — activa la ubicación</span>
          )}
        </div>

        {/* Building selector */}
        <label className="ito-setgps-panel__label" htmlFor="setgps-building">
          Corregir manualmente (párate dentro del edificio)
        </label>
        <select
          id="setgps-building"
          className="ito-setgps-panel__select"
          value={selectedId}
          onChange={(e) => {
            setSelectedId(e.target.value);
            setStatus("idle");
            setErrorMsg("");
          }}
        >
          <option value="">Selecciona un edificio…</option>
          {sorted.map((b) => {
            const hasGps = b.latitude != null && b.longitude != null;
            return (
              <option key={b.id} value={b.id}>
                {hasGps ? "✓ " : "○ "}
                {b.code ? `${b.code} — ` : ""}
                {b.name}
              </option>
            );
          })}
        </select>

        {selectedHasGps && status === "idle" && (
          <div className="ito-setgps-panel__warn">
            Este edificio ya tiene GPS. Al guardar se sobreescribirá con tu posición actual.
          </div>
        )}

        <button
          type="button"
          className={`ito-setgps-panel__save${status === "saved" ? " is-saved" : ""}`}
          onClick={handleSave}
          disabled={!selectedId || !geoPosition || status === "saving" || status === "saved"}
        >
          {status === "saving" ? (
            "Guardando…"
          ) : status === "saved" ? (
            <><Icon name="check" size={14} /> GPS guardado</>
          ) : (
            <><Icon name="map-pin" size={14} /> Guardar mi GPS en este edificio</>
          )}
        </button>

        {status === "error" && (
          <div className="ito-setgps-panel__error">{errorMsg}</div>
        )}
      </div>
    </div>
  );
}
