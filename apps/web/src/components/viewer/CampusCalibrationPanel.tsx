import { useEffect, useState } from "react";
import { useLocationStore } from "../../store/location-store";
import { useBuildingGlbStore } from "../../store/building-glb-store";
import type { Building } from "../../features/buildings/types/building";
import { Icon } from "../ui/Icons";
import {
  createCalibrationPointApi,
  createCalibrationProfileApi,
  getCalibrationPointsApi,
} from "@ito-map/shared";
import {
  gpsToXZ,
  gpsToXZUncalibrated,
  getCalibOffset,
  getActiveGpsTransform,
  setActiveGpsTransform,
  saveCalibOffset,
  clearCalibOffset,
  getReferencePoints,
  saveReferencePoints,
  fitAffineFromPoints,
  affineResidualsMeters,
  type ReferencePoint,
  type FittedAffine,
} from "../../features/location/services/campus-transform";
import { setSimulatedPosition, clearSimulatedPosition } from "../../features/location/services/geolocation";

type Props = {
  buildings: Building[];
  onClose: () => void;
};

const MAX_CALIBRATION_ACCURACY_METERS = 25;
const MAX_PROFILE_AVG_RESIDUAL_METERS = 15;
const MAX_PROFILE_MAX_RESIDUAL_METERS = 25;

function fmt(n: number): string {
  return n.toFixed(2);
}

function isGoodCalibrationPoint(point: { accuracy: number | null }): boolean {
  return point.accuracy === null || point.accuracy <= MAX_CALIBRATION_ACCURACY_METERS;
}

export function CampusCalibrationPanel({ buildings, onClose }: Props) {
  const geoPosition = useLocationStore((s) => s.geoPosition);
  const simulatedPosition = useLocationStore((s) => s.simulatedPosition);
  const glbPositions = useBuildingGlbStore((s) => s.positions);
  const [selectedId, setSelectedId] = useState("");
  const [offset, setOffset] = useState(getCalibOffset);
  const [saved, setSaved] = useState(false);
  const [refPoints, setRefPoints] = useState<ReferencePoint[]>(() =>
    getReferencePoints().filter(isGoodCalibrationPoint)
  );
  const [fitResult, setFitResult] = useState<{ fit: FittedAffine; residuals: number[] } | null>(null);
  const [copied, setCopied] = useState(false);
  const [pointStatus, setPointStatus] = useState<"idle" | "loading" | "saving" | "saved" | "error">("idle");
  const [publishStatus, setPublishStatus] = useState<"idle" | "saving" | "saved" | "error">("idle");
  const [syncMessage, setSyncMessage] = useState<string | null>(null);

  const hasActiveCalib = offset.dx !== 0 || offset.dz !== 0;
  const hasGoodGps =
    !!geoPosition &&
    (geoPosition.accuracy === null ||
      geoPosition.accuracy <= MAX_CALIBRATION_ACCURACY_METERS);

  useEffect(() => {
    let cancelled = false;
    setPointStatus("loading");
    getCalibrationPointsApi()
      .then((points) => {
        if (cancelled) return;
        if (points.length > 0) {
          const next: ReferencePoint[] = points
            .map((point) => ({
              buildingId: point.building_id ?? point.id,
              buildingName: point.building_name ?? point.label,
              buildingCode: point.building_code ?? "",
              modelX: point.model_x,
              modelZ: point.model_z,
              latitude: point.latitude,
              longitude: point.longitude,
              accuracy: point.accuracy_meters,
            }))
            .filter(isGoodCalibrationPoint);
          setRefPoints(next);
          saveReferencePoints(next);
        }
        setPointStatus("idle");
      })
      .catch(() => {
        if (!cancelled) setPointStatus("idle");
      });

    return () => {
      cancelled = true;
    };
  }, []);

  // Posición 3D calculada con la calibración activa
  const calPos = geoPosition
    ? gpsToXZ(geoPosition.latitude, geoPosition.longitude)
    : null;

  // Edificio seleccionado
  const selected = buildings.find((b) => b.id === selectedId);
  const selectedGlbPos = selected ? glbPositions[selected.id] : null;
  const buildingPos =
    selectedGlbPos
      ? { x: selectedGlbPos.x, z: selectedGlbPos.z, source: "glb" as const }
      : selected && selected.x != null && selected.z != null
      ? { x: Number(selected.x), z: Number(selected.z), source: "database" as const }
      : null;

  // Error entre posición calculada y posición real del edificio
  const errorM =
    calPos && buildingPos
      ? Math.sqrt(
          Math.pow(calPos.x - buildingPos.x, 2) +
            Math.pow(calPos.z - buildingPos.z, 2)
        )
      : null;

  const handleCalibrate = () => {
    if (!geoPosition || !buildingPos || !hasGoodGps) return;

    // Calcula cuánto se desvía la transformación base del edificio real
    const raw = gpsToXZUncalibrated(
      geoPosition.latitude,
      geoPosition.longitude
    );
    const dx = buildingPos.x - raw.x;
    const dz = buildingPos.z - raw.z;

    saveCalibOffset(dx, dz);
    setOffset({ dx, dz });

    // Reposiciona el marcador de inmediato: sin esto, el punto queda
    // "congelado" hasta la siguiente lectura GPS que supere MIN_MOVEMENT_METERS,
    // lo cual no ocurre si el usuario está quieto calibrando.
    const corrected = gpsToXZ(geoPosition.latitude, geoPosition.longitude);
    useLocationStore.getState().setMapPosition({ x: corrected.x, y: 2, z: corrected.z });

    setSaved(true);
    setTimeout(() => setSaved(false), 2500);
  };

  const handleReset = () => {
    clearCalibOffset();
    setOffset({ dx: 0, dz: 0 });
  };

  const handleAddRefPoint = async () => {
    if (!geoPosition || !buildingPos || !selected || !hasGoodGps) {
      setPointStatus("error");
      setSyncMessage(`Espera mejor GPS: maximo ${MAX_CALIBRATION_ACCURACY_METERS} m para calibrar`);
      return;
    }
    const point: ReferencePoint = {
      buildingId: selected.id,
      buildingName: selected.name,
      buildingCode: selected.code ?? "",
      modelX: buildingPos.x,
      modelZ: buildingPos.z,
      latitude: geoPosition.latitude,
      longitude: geoPosition.longitude,
      accuracy: geoPosition.accuracy,
    };
    const next = [...refPoints.filter((p) => p.buildingId !== point.buildingId), point];
    setRefPoints(next);
    saveReferencePoints(next);
    setFitResult(null);
    setPointStatus("saving");
    setSyncMessage(null);

    try {
      await createCalibrationPointApi({
        building_id: selected.id,
        label: selected.name,
        latitude: geoPosition.latitude,
        longitude: geoPosition.longitude,
        accuracy_meters: geoPosition.accuracy,
        model_x: buildingPos.x,
        model_z: buildingPos.z,
      });
      setPointStatus("saved");
      setSyncMessage("Punto guardado en la base de datos");
      setTimeout(() => {
        setPointStatus("idle");
        setSyncMessage(null);
      }, 2500);
    } catch {
      setPointStatus("error");
      setSyncMessage("Punto guardado localmente; no se pudo guardar en la API");
    }
  };

  const handleRemoveRefPoint = (buildingId: string) => {
    const next = refPoints.filter((p) => p.buildingId !== buildingId);
    setRefPoints(next);
    saveReferencePoints(next);
    setFitResult(null);
  };

  const handleClearRefPoints = () => {
    setRefPoints([]);
    saveReferencePoints([]);
    setFitResult(null);
  };

  const handleComputeFit = () => {
    const validPoints = refPoints.filter(isGoodCalibrationPoint);
    const fit = fitAffineFromPoints(validPoints);
    if (!fit) {
      setFitResult(null);
      setSyncMessage("No se pudo calcular una formula estable. Usa puntos mas separados y con mejor GPS.");
      return;
    }
    setFitResult({ fit, residuals: affineResidualsMeters(validPoints, fit) });
  };

  const handleCopyConstants = () => {
    if (!fitResult) return;
    const { A_X, B_X, C_X, A_Z, B_Z, C_Z } = fitResult.fit;
    const code =
      `const A_X = ${A_X.toFixed(9)};\n` +
      `const B_X = ${B_X.toFixed(9)};\n` +
      `const C_X = ${C_X.toFixed(9)};\n` +
      `const A_Z = ${A_Z.toFixed(9)};\n` +
      `const B_Z = ${B_Z.toFixed(9)};\n` +
      `const C_Z = ${C_Z.toFixed(9)};`;
    navigator.clipboard
      ?.writeText(code)
      .then(() => {
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      })
      .catch(() => {});
  };

  const handlePublishProfile = async () => {
    if (!fitResult) return;
    setPublishStatus("saving");
    setSyncMessage(null);

    const transform = getActiveGpsTransform();
    const residuals = fitResult.residuals;
    const maxResidual = Math.max(...residuals);
    const avgResidual =
      residuals.reduce((sum, value) => sum + value, 0) / residuals.length;

    if (
      maxResidual > MAX_PROFILE_MAX_RESIDUAL_METERS ||
      avgResidual > MAX_PROFILE_AVG_RESIDUAL_METERS
    ) {
      setPublishStatus("error");
      setSyncMessage(
        `No se publica: error max ${maxResidual.toFixed(1)} m, promedio ${avgResidual.toFixed(1)} m`
      );
      return;
    }

    try {
      const profile = await createCalibrationProfileApi({
        name: `Calibracion ${new Date().toLocaleDateString("es-MX")}`,
        ref_lat: transform.ref_lat,
        ref_lng: transform.ref_lng,
        meters_lat: transform.meters_lat,
        meters_lng: transform.meters_lng,
        a_x: fitResult.fit.A_X,
        b_x: fitResult.fit.B_X,
        c_x: fitResult.fit.C_X,
        a_z: fitResult.fit.A_Z,
        b_z: fitResult.fit.B_Z,
        c_z: fitResult.fit.C_Z,
        max_residual_meters: maxResidual,
        avg_residual_meters: avgResidual,
        activate: true,
      });

      setActiveGpsTransform({
        ref_lat: profile.ref_lat,
        ref_lng: profile.ref_lng,
        meters_lat: profile.meters_lat,
        meters_lng: profile.meters_lng,
        a_x: profile.a_x,
        b_x: profile.b_x,
        c_x: profile.c_x,
        a_z: profile.a_z,
        b_z: profile.b_z,
        c_z: profile.c_z,
      });
      clearCalibOffset();
      setOffset({ dx: 0, dz: 0 });
      if (geoPosition) {
        const corrected = gpsToXZ(geoPosition.latitude, geoPosition.longitude);
        useLocationStore.getState().setMapPosition({ x: corrected.x, y: 2, z: corrected.z });
      }
      setPublishStatus("saved");
      setSyncMessage("Perfil publicado y aplicado como calibracion activa");
    } catch {
      setPublishStatus("error");
      setSyncMessage("No se pudo publicar el perfil en la API");
    }
  };

  const handleGoToBuilding = () => {
    if (!selected || !buildingPos) return;
    setSimulatedPosition({
      buildingId: selected.id,
      buildingName: selected.name,
      x: buildingPos.x,
      z: buildingPos.z,
    });
  };

  const sortedBuildings = [...buildings]
    .filter((b) => b.is_active && b.x != null && b.z != null)
    .sort((a, b) => a.name.localeCompare(b.name));

  return (
    <div className="ito-setgps-panel ito-calibration-panel">
      <div className="ito-setgps-panel__header">
        <Icon name="compass" size={14} />
        <span>Calibración GPS</span>
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
        {/* GPS actual */}
        <div className={`ito-setgps-panel__signal${geoPosition ? " is-active" : ""}`}>
          <span className="ito-setgps-panel__signal-dot" />
          {geoPosition ? (
            <span>
              {geoPosition.latitude.toFixed(7)}, {geoPosition.longitude.toFixed(7)}
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

        {/* Posición en el mapa */}
        {calPos && (
          <div
            style={{
              fontSize: 12,
              color: "var(--color-text-2, #6b7280)",
              marginTop: 4,
              fontFamily: "monospace",
            }}
          >
            Mapa → X: {fmt(calPos.x)}&nbsp;&nbsp;Z: {fmt(calPos.z)}
          </div>
        )}

        <div className="ito-setgps-panel__divider" />

        {/* Paso 1: seleccionar edificio */}
        <label className="ito-setgps-panel__label" htmlFor="calib-building">
          ¿En qué edificio estás parado ahora?
        </label>
        <select
          id="calib-building"
          className="ito-setgps-panel__select"
          value={selectedId}
          onChange={(e) => {
            setSelectedId(e.target.value);
            setSaved(false);
          }}
        >
          <option value="">Selecciona el edificio…</option>
          {sortedBuildings.map((b) => (
            <option key={b.id} value={b.id}>
              {b.code ? `${b.code} — ` : ""}
              {b.name}
            </option>
          ))}
        </select>

        {/* Decir dónde estoy: mueve el punto azul directo al edificio, sin GPS */}
        <button
          type="button"
          className="ito-setgps-panel__save"
          style={{ marginTop: 8, background: "var(--color-surface-2, #f3f4f6)", color: "var(--color-text, #111)" }}
          onClick={handleGoToBuilding}
          disabled={!selectedId || !buildingPos}
        >
          <Icon name="crosshair" size={14} /> Decir que estoy en este edificio
        </button>

        {simulatedPosition && (
          <div
            className="ito-setgps-panel__signal is-active"
            style={{ marginTop: 6, cursor: "pointer" }}
            onClick={() => clearSimulatedPosition()}
            title="Toca para quitar la ubicación simulada"
          >
            <span className="ito-setgps-panel__signal-dot" />
            <span>Ubicación fijada en {simulatedPosition.buildingName} · Toca para quitar</span>
          </div>
        )}

        {/* Error actual */}
        {buildingPos && calPos && errorM !== null && (
          <div
            style={{
              fontSize: 12,
              marginTop: 6,
              padding: "6px 10px",
              borderRadius: 8,
              background: errorM < 15 ? "#dcfce7" : errorM < 40 ? "#fef9c3" : "#fee2e2",
              color: errorM < 15 ? "#166534" : errorM < 40 ? "#713f12" : "#991b1b",
              fontWeight: 600,
            }}
          >
            {errorM < 15
              ? `Buena precisión — error ~${errorM.toFixed(1)} m`
              : errorM < 40
                ? `Error moderado ~${errorM.toFixed(1)} m — calibrar mejorará la precisión`
                : `Error alto ~${errorM.toFixed(1)} m — calibración necesaria`}
          </div>
        )}

        {/* Botón calibrar */}
        <button
          type="button"
          className={`ito-setgps-panel__save${saved ? " is-saved" : ""}`}
          style={{ marginTop: 10 }}
          onClick={handleCalibrate}
          disabled={!selectedId || !geoPosition || !buildingPos || !hasGoodGps || saved}
        >
          {saved ? (
            <>
              <Icon name="check" size={14} /> Calibración guardada
            </>
          ) : (
            <>
              <Icon name="crosshair" size={14} /> Calibrar desde este punto
            </>
          )}
        </button>

        {/* Estado de calibración activa */}
        {hasActiveCalib && (
          <>
            <div className="ito-setgps-panel__divider" />
            <div
              style={{
                fontSize: 12,
                color: "var(--color-text-2, #6b7280)",
                fontFamily: "monospace",
              }}
            >
              Corrección activa: dx={offset.dx > 0 ? "+" : ""}{fmt(offset.dx)}&nbsp;&nbsp;
              dz={offset.dz > 0 ? "+" : ""}{fmt(offset.dz)}
            </div>
            <button
              type="button"
              className="ito-setgps-panel__save"
              style={{ marginTop: 6, background: "var(--color-surface-2, #f3f4f6)", color: "var(--color-text, #111)" }}
              onClick={handleReset}
            >
              Restablecer calibración
            </button>
          </>
        )}

        <div className="ito-setgps-panel__divider" />
        <p className="ito-setgps-panel__hint">
          Párate en el centro del edificio, espera buena señal GPS (±15 m o mejor)
          y presiona "Calibrar". Para mayor precisión repite en 2–3 edificios
          alejados entre sí.
        </p>

        <div className="ito-setgps-panel__divider" />

        {/* Recalibración completa: recalcula la fórmula desde cero con varios puntos */}
        <p className="ito-setgps-panel__label">
          Recalibración completa (multi-punto)
        </p>
        <p className="ito-setgps-panel__hint" style={{ marginTop: 0 }}>
          Camina a 5-8 edificios repartidos por todo el campus. En cada uno,
          selecciona el edificio arriba, espera buena señal y presiona
          "Agregar punto". Con 3 o más puntos podrás recalcular la fórmula
          completa (más precisa que la corrección de un solo punto).
        </p>

        <button
          type="button"
          className="ito-setgps-panel__save"
          style={{ background: "var(--color-surface-2, #f3f4f6)", color: "var(--color-text, #111)" }}
          onClick={handleAddRefPoint}
          disabled={!selectedId || !geoPosition || !buildingPos || !hasGoodGps || pointStatus === "saving"}
        >
          <Icon name="plus" size={14} />{" "}
          {pointStatus === "saving" ? "Guardando..." : `Agregar punto (${refPoints.length})`}
        </button>

        {syncMessage && (
          <div
            className={`ito-setgps-panel__signal${pointStatus === "error" || publishStatus === "error" ? "" : " is-active"}`}
            style={{ marginTop: 6 }}
          >
            <span className="ito-setgps-panel__signal-dot" />
            <span>{syncMessage}</span>
          </div>
        )}

        {refPoints.length > 0 && (
          <div style={{ display: "flex", flexDirection: "column", gap: 4, marginTop: 8 }}>
            {refPoints.map((p) => (
              <div
                key={p.buildingId}
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  fontSize: 12,
                  padding: "4px 8px",
                  borderRadius: 6,
                  background: "var(--color-surface-2, #f3f4f6)",
                }}
              >
                <span>
                  {p.buildingCode ? `${p.buildingCode} — ` : ""}
                  {p.buildingName}
                  {p.accuracy != null && (
                    <span style={{ opacity: 0.7 }}> (±{p.accuracy.toFixed(0)} m)</span>
                  )}
                </span>
                <button
                  type="button"
                  onClick={() => handleRemoveRefPoint(p.buildingId)}
                  aria-label={`Quitar punto ${p.buildingName}`}
                  style={{ background: "none", border: "none", cursor: "pointer", color: "#991b1b" }}
                >
                  <Icon name="x" size={12} />
                </button>
              </div>
            ))}
            <button
              type="button"
              onClick={handleClearRefPoints}
              style={{ fontSize: 11, background: "none", border: "none", color: "#6b7280", cursor: "pointer", alignSelf: "flex-start" }}
            >
              Borrar todos los puntos
            </button>
          </div>
        )}

        {refPoints.length >= 3 && (
          <button
            type="button"
            className="ito-setgps-panel__save"
            style={{ marginTop: 8 }}
            onClick={handleComputeFit}
          >
            <Icon name="compass" size={14} /> Calcular nueva fórmula
          </button>
        )}

        {fitResult && (
          <div style={{ marginTop: 8 }}>
            <div
              style={{
                fontSize: 12,
                padding: "6px 10px",
                borderRadius: 8,
                background: "#dcfce7",
                color: "#166534",
                fontWeight: 600,
              }}
            >
              Error residual — máx {Math.max(...fitResult.residuals).toFixed(1)} m, promedio{" "}
              {(fitResult.residuals.reduce((a, b) => a + b, 0) / fitResult.residuals.length).toFixed(1)} m
            </div>
            <pre
              style={{
                fontSize: 10.5,
                background: "#0f172a",
                color: "#e2e8f0",
                padding: "8px 10px",
                borderRadius: 8,
                marginTop: 6,
                overflowX: "auto",
              }}
            >
{`const A_X = ${fitResult.fit.A_X.toFixed(9)};
const B_X = ${fitResult.fit.B_X.toFixed(9)};
const C_X = ${fitResult.fit.C_X.toFixed(9)};
const A_Z = ${fitResult.fit.A_Z.toFixed(9)};
const B_Z = ${fitResult.fit.B_Z.toFixed(9)};
const C_Z = ${fitResult.fit.C_Z.toFixed(9)};`}
            </pre>
            <button
              type="button"
              className="ito-setgps-panel__save"
              style={{ marginTop: 6, background: "var(--color-surface-2, #f3f4f6)", color: "var(--color-text, #111)" }}
              onClick={handleCopyConstants}
            >
              {copied ? (
                <><Icon name="check" size={14} /> Copiado</>
              ) : (
                "Copiar constantes"
              )}
            </button>
            <button
              type="button"
              className={`ito-setgps-panel__save${publishStatus === "saved" ? " is-saved" : ""}`}
              style={{ marginTop: 6 }}
              onClick={handlePublishProfile}
              disabled={publishStatus === "saving"}
            >
              {publishStatus === "saving" ? (
                "Publicando..."
              ) : publishStatus === "saved" ? (
                <><Icon name="check" size={14} /> Perfil publicado</>
              ) : (
                <><Icon name="compass" size={14} /> Publicar perfil activo</>
              )}
            </button>
            <p className="ito-setgps-panel__hint" style={{ marginTop: 6 }}>
              Envía estas constantes para reemplazar las de{" "}
              <code>campus-transform.ts</code> — así la corrección queda fija
              en el código para todos los dispositivos, sin depender de la
              calibración por navegador.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
