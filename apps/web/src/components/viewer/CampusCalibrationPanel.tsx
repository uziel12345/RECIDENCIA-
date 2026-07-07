import { useEffect, useState } from "react";
import { useLocationStore } from "../../store/location-store";
import { useBuildingGlbStore } from "../../store/building-glb-store";
import type { Building } from "../../features/buildings/types/building";
import { Icon } from "../ui/Icons";
import {
  createCalibrationPointApi,
  createCalibrationProfileApi,
  generateDefaultGeofencesApi,
  getActiveCalibrationProfileApi,
  getCalibrationPointsApi,
  updateBuildingApi,
  type CalibrationProfile,
  type GenerateDefaultGeofencesResult,
} from "@ito-map/shared";
import {
  gpsToXZ,
  gpsToXZUncalibrated,
  xzToGps,
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
  onBuildingUpdated: () => void;
};

const MAX_CALIBRATION_ACCURACY_METERS = 25;
const MAX_PROFILE_AVG_RESIDUAL_METERS = 15;
const MAX_PROFILE_MAX_RESIDUAL_METERS = 25;

// Coordenadas reales tomadas de OpenStreetMap (Overpass API, consultado
// 2026-07-06) para edificios del campus mapeados individualmente ahí. Evita
// tener que caminar a estos 4 para recolectar el punto — solo aplica a
// edificios que OSM mapea con nombre propio dentro del predio del ITO;
// el resto del campus (más al fondo, ej. Centro de Cómputo o el gimnasio)
// no está mapeado en detalle en OSM y sigue requiriendo caminar 1-2 puntos
// ahí para que la fórmula no quede sesgada hacia esta esquina.
const OSM_REFERENCE_POINTS: { code: string; latitude: number; longitude: number }[] = [
  { code: "BIB", latitude: 17.0777, longitude: -96.7442 },
  { code: "B", latitude: 17.0782, longitude: -96.7448 },
  { code: "C", latitude: 17.078, longitude: -96.7449 },
  { code: "F", latitude: 17.0767, longitude: -96.7441 },
];

type AutoGpsStatus =
  | { state: "idle" }
  | { state: "running"; done: number; total: number; errors: number }
  | { state: "done"; done: number; total: number; errors: number };

function fmt(n: number): string {
  return n.toFixed(2);
}

function isGoodCalibrationPoint(point: { accuracy: number | null }): boolean {
  return point.accuracy === null || point.accuracy <= MAX_CALIBRATION_ACCURACY_METERS;
}

function isGoodProfile(profile: CalibrationProfile | null): boolean {
  if (!profile) return false;
  if (profile.avg_residual_meters != null && profile.avg_residual_meters > MAX_PROFILE_AVG_RESIDUAL_METERS) {
    return false;
  }
  if (profile.max_residual_meters != null && profile.max_residual_meters > MAX_PROFILE_MAX_RESIDUAL_METERS) {
    return false;
  }
  return true;
}

export function CampusCalibrationPanel({ buildings, onClose, onBuildingUpdated }: Props) {
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

  // Paso 2: perfil activo publicado — habilita/bloquea poblar GPS de edificios
  const [activeProfile, setActiveProfile] = useState<CalibrationProfile | null>(null);
  const [profileLoaded, setProfileLoaded] = useState(false);
  const [buildingGpsStatus, setBuildingGpsStatus] = useState<"idle" | "saving" | "saved" | "error">("idle");
  const [autoGpsStatus, setAutoGpsStatus] = useState<AutoGpsStatus>({ state: "idle" });

  // Paso 3: geocercas
  const [geoStatus, setGeoStatus] = useState<"idle" | "saving" | "saved" | "error">("idle");
  const [geoResult, setGeoResult] = useState<GenerateDefaultGeofencesResult | null>(null);

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

  const refreshActiveProfile = () => {
    setProfileLoaded(false);
    getActiveCalibrationProfileApi()
      .then((profile) => {
        setActiveProfile(profile);
        setProfileLoaded(true);
      })
      .catch(() => setProfileLoaded(true));
  };

  useEffect(refreshActiveProfile, []);

  // Posición 3D calculada con la calibración activa
  const calPos = geoPosition
    ? gpsToXZ(geoPosition.latitude, geoPosition.longitude)
    : null;

  // Edificio seleccionado
  const selected = buildings.find((b) => b.id === selectedId);
  const resolveModelPos = (building: Building) => {
    const glbPos = glbPositions[building.id];
    if (glbPos) return { x: glbPos.x, z: glbPos.z, source: "glb" as const };
    if (building.x != null && building.z != null) {
      return { x: Number(building.x), z: Number(building.z), source: "database" as const };
    }
    return null;
  };
  const buildingPos = selected ? resolveModelPos(selected) : null;

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

  const handleImportOsmPoints = async () => {
    const matched = OSM_REFERENCE_POINTS.flatMap(({ code, latitude, longitude }) => {
      const building = buildings.find((b) => b.code === code);
      const pos = building ? resolveModelPos(building) : null;
      if (!building || !pos) return [];
      const point: ReferencePoint = {
        buildingId: building.id,
        buildingName: building.name,
        buildingCode: building.code ?? "",
        modelX: pos.x,
        modelZ: pos.z,
        latitude,
        longitude,
        accuracy: 5,
      };
      return [point];
    });

    if (matched.length === 0) {
      setPointStatus("error");
      setSyncMessage("No se encontraron en la BD los edificios de OpenStreetMap (BIB/B/C/F)");
      return;
    }

    const matchedIds = new Set(matched.map((p) => p.buildingId));
    const next = [...refPoints.filter((p) => !matchedIds.has(p.buildingId)), ...matched];
    setRefPoints(next);
    saveReferencePoints(next);
    setFitResult(null);
    setSyncMessage(`${matched.length} puntos de OpenStreetMap importados. Camina 1-2 puntos más lejos de esta zona para repartir la cobertura.`);

    await Promise.allSettled(
      matched.map((point) =>
        createCalibrationPointApi({
          building_id: point.buildingId,
          label: `${point.buildingName} (OSM)`,
          latitude: point.latitude,
          longitude: point.longitude,
          accuracy_meters: point.accuracy,
          model_x: point.modelX,
          model_z: point.modelZ,
        })
      )
    );
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
      refreshActiveProfile();
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

  // ── Paso 2: poblar GPS de edificios ─────────────────────────────────────

  const withGpsCount = buildings.filter(
    (b) => b.latitude != null && b.longitude != null
  ).length;

  const canAutoCalc = buildings.some(
    (b) => b.x != null && b.z != null && (b.latitude == null || b.longitude == null)
  );

  const handleSaveBuildingGps = async () => {
    if (!selectedId || !geoPosition) return;
    setBuildingGpsStatus("saving");
    try {
      await updateBuildingApi(selectedId, {
        latitude: geoPosition.latitude,
        longitude: geoPosition.longitude,
      });
      setBuildingGpsStatus("saved");
      onBuildingUpdated();
      setTimeout(() => setBuildingGpsStatus("idle"), 2500);
    } catch {
      setBuildingGpsStatus("error");
    }
  };

  const handleAutoCalculateGps = async () => {
    const toProcess = buildings.filter(
      (b) => b.x != null && b.z != null && (b.latitude == null || b.longitude == null)
    );
    if (toProcess.length === 0) return;

    setAutoGpsStatus({ state: "running", done: 0, total: toProcess.length, errors: 0 });

    let done = 0;
    let errors = 0;

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
      setAutoGpsStatus({ state: "running", done: done + errors, total: toProcess.length, errors });
    }

    setAutoGpsStatus({ state: "done", done, total: toProcess.length, errors });
    onBuildingUpdated();
  };

  // ── Paso 3: geocercas ────────────────────────────────────────────────────

  const handleGenerateGeofences = async () => {
    setGeoStatus("saving");
    try {
      const result = await generateDefaultGeofencesApi();
      setGeoResult(result);
      setGeoStatus("saved");
    } catch {
      setGeoStatus("error");
    }
  };

  const sortedBuildings = [...buildings]
    .filter((b) => b.is_active && b.x != null && b.z != null)
    .sort((a, b) => a.name.localeCompare(b.name));

  const goodActiveProfile = isGoodProfile(activeProfile);

  return (
    <div className="ito-setgps-panel ito-calibration-panel">
      <div className="ito-setgps-panel__header">
        <Icon name="compass" size={14} />
        <span>Calibración y GPS del campus</span>
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

        {/* Selector de edificio, compartido por los 3 pasos */}
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
            setBuildingGpsStatus("idle");
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

        <div className="ito-setgps-panel__divider" />

        {/* ══════════════════ PASO 1: CALIBRAR LA FÓRMULA ══════════════════ */}
        <p className="ito-setgps-panel__label" style={{ fontWeight: 800 }}>
          Paso 1 — Calibrar la fórmula GPS↔modelo
        </p>

        <button
          type="button"
          className={`ito-setgps-panel__save${saved ? " is-saved" : ""}`}
          style={{ marginTop: 8 }}
          onClick={handleCalibrate}
          disabled={!selectedId || !geoPosition || !buildingPos || !hasGoodGps || saved}
        >
          {saved ? (
            <>
              <Icon name="check" size={14} /> Calibración guardada
            </>
          ) : (
            <>
              <Icon name="crosshair" size={14} /> Corrección rápida (1 punto)
            </>
          )}
        </button>

        {hasActiveCalib && (
          <>
            <div
              style={{
                fontSize: 12,
                color: "var(--color-text-2, #6b7280)",
                fontFamily: "monospace",
                marginTop: 6,
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
              Restablecer corrección
            </button>
          </>
        )}

        <p className="ito-setgps-panel__hint" style={{ marginTop: 8 }}>
          Recalibración completa (recomendada): importa los puntos gratis de
          OpenStreetMap y camina solo 1-2 edificios alejados de esa zona
          (ej. Centro de Cómputo, gimnasio) para repartir la cobertura por
          todo el campus. Con 3 o más puntos podrás calcular y publicar la
          fórmula completa.
        </p>

        <button
          type="button"
          className="ito-setgps-panel__save"
          style={{ marginTop: 0, marginBottom: 8, background: "var(--color-surface-2, #f3f4f6)", color: "var(--color-text, #111)" }}
          onClick={handleImportOsmPoints}
        >
          <Icon name="map-pin" size={14} />{" "}
          Importar 4 puntos de OpenStreetMap (sin caminar)
        </button>

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
          </div>
        )}

        <div className="ito-setgps-panel__divider" />

        {/* ══════════════════ PASO 2: POBLAR GPS DE EDIFICIOS ══════════════════ */}
        <p className="ito-setgps-panel__label" style={{ fontWeight: 800 }}>
          Paso 2 — Poblar GPS de edificios
        </p>

        {!profileLoaded ? (
          <p className="ito-setgps-panel__hint" style={{ marginTop: 0 }}>
            Verificando calibración activa…
          </p>
        ) : !goodActiveProfile ? (
          <p className="ito-setgps-panel__hint" style={{ marginTop: 0 }}>
            🔒 Bloqueado: publica un perfil de calibración con buen residual en
            el Paso 1 antes de poblar el GPS de los edificios — si lo haces con
            una fórmula mala, grabas la posición equivocada en los 65 edificios
            de un solo golpe.
          </p>
        ) : (
          <>
            <div className="ito-setgps-panel__coverage">
              <span className="ito-setgps-panel__coverage-num">
                {withGpsCount}/{buildings.length}
              </span>
              <span>edificios con GPS registrado</span>
            </div>

            {(canAutoCalc || autoGpsStatus.state !== "idle") && (
              <div className="ito-setgps-panel__auto">
                {autoGpsStatus.state === "idle" && (
                  <>
                    <p className="ito-setgps-panel__hint" style={{ marginBottom: 0 }}>
                      Calcula el GPS de todos los edificios automáticamente a
                      partir de la fórmula ya calibrada. Preciso para
                      detección por edificio (~5–20 m).
                    </p>
                    <button
                      type="button"
                      className="ito-setgps-panel__auto-btn"
                      onClick={handleAutoCalculateGps}
                    >
                      <Icon name="locate" size={13} />
                      <span>
                        Calcular GPS de{" "}
                        {
                          buildings.filter(
                            (b) => b.x != null && b.z != null && (b.latitude == null || b.longitude == null)
                          ).length
                        }{" "}
                        edificios automáticamente
                      </span>
                    </button>
                  </>
                )}

                {autoGpsStatus.state === "running" && (
                  <div className="ito-setgps-panel__auto-progress">
                    <div className="ito-setgps-panel__auto-bar">
                      <div
                        className="ito-setgps-panel__auto-fill"
                        style={{
                          width: `${Math.round((autoGpsStatus.done / autoGpsStatus.total) * 100)}%`,
                        }}
                      />
                    </div>
                    <span>
                      Calculando… {autoGpsStatus.done}/{autoGpsStatus.total}
                      {autoGpsStatus.errors > 0 && ` (${autoGpsStatus.errors} errores)`}
                    </span>
                  </div>
                )}

                {autoGpsStatus.state === "done" && (
                  <div
                    className={`ito-setgps-panel__auto-result ${autoGpsStatus.errors > 0 ? "has-errors" : "is-ok"}`}
                  >
                    <Icon name="check" size={13} />
                    <span>
                      {autoGpsStatus.done} edificios actualizados
                      {autoGpsStatus.errors > 0 && `, ${autoGpsStatus.errors} fallaron`}
                    </span>
                  </div>
                )}
              </div>
            )}

            <p className="ito-setgps-panel__hint" style={{ marginTop: 8 }}>
              O corrige un edificio a mano: selecciónalo arriba, párate dentro
              y guarda tu posición actual.
            </p>
            <button
              type="button"
              className={`ito-setgps-panel__save${buildingGpsStatus === "saved" ? " is-saved" : ""}`}
              onClick={handleSaveBuildingGps}
              disabled={!selectedId || !geoPosition || buildingGpsStatus === "saving"}
            >
              {buildingGpsStatus === "saving" ? (
                "Guardando…"
              ) : buildingGpsStatus === "saved" ? (
                <><Icon name="check" size={14} /> GPS guardado</>
              ) : (
                <><Icon name="map-pin" size={14} /> Guardar mi GPS en este edificio</>
              )}
            </button>
            {buildingGpsStatus === "error" && (
              <div className="ito-setgps-panel__error">
                No se pudo guardar. Verifica la conexión con la API.
              </div>
            )}
          </>
        )}

        <div className="ito-setgps-panel__divider" />

        {/* ══════════════════ PASO 3: GEOCERCAS ══════════════════ */}
        <p className="ito-setgps-panel__label" style={{ fontWeight: 800 }}>
          Paso 3 — Generar geocercas automáticas
        </p>
        <p className="ito-setgps-panel__hint" style={{ marginTop: 0 }}>
          Crea un cuadro de ~20 m alrededor del GPS de cada edificio que
          todavía no tenga geocerca (requiere que el edificio ya tenga GPS del
          Paso 2). Sirve como primera capa de detección "estoy dentro de".
        </p>
        <button
          type="button"
          className={`ito-setgps-panel__save${geoStatus === "saved" ? " is-saved" : ""}`}
          onClick={handleGenerateGeofences}
          disabled={withGpsCount === 0 || geoStatus === "saving"}
        >
          {geoStatus === "saving" ? (
            "Generando…"
          ) : (
            <><Icon name="layers" size={14} /> Generar geocercas para edificios sin una</>
          )}
        </button>
        {geoStatus === "error" && (
          <div className="ito-setgps-panel__error">No se pudieron generar las geocercas.</div>
        )}
        {geoResult && geoStatus === "saved" && (
          <div className="ito-setgps-panel__auto-result is-ok" style={{ marginTop: 6 }}>
            <Icon name="check" size={13} />
            <span>
              {geoResult.created} geocercas creadas
              {geoResult.skippedExisting > 0 && `, ${geoResult.skippedExisting} ya existían`}
              {geoResult.skippedNoGps > 0 && `, ${geoResult.skippedNoGps} sin GPS aún`}
            </span>
          </div>
        )}
      </div>
    </div>
  );
}
