import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { useBuildingStore } from "../../../store/building-store";
import { useBuildingGlbStore } from "../../../store/building-glb-store";
import { useAdminAuthStore } from "../../../store/admin-auth-store";
import { CategoryBadge } from "../../../components/ui/CategoryBadge";
import { getCategoryAccent } from "../../../components/ui/categoryAccent";
import { Icon } from "../../../components/ui/Icons";
import { resolveApiAssetUrl } from "../../../utils/resolve-api-asset-url";
import { normalizeDisplayText } from "../../../utils/text";
import { getBuildingImagesApi } from "@ito-map/shared";
import type { BuildingImage } from "@ito-map/shared";
import type { Building } from "../types/building";
import { setSimulatedPosition } from "../../location/services/geolocation";
import { useBuildingFullDetails } from "../hooks/useBuildingFullDetails";
import { BuildingStatusBadge } from "./details/BuildingStatusBadge";
import { BuildingClassroomsInfo } from "./details/BuildingClassroomsInfo";
import { BuildingDepartmentsInfo } from "./details/BuildingDepartmentsInfo";
import { BuildingCubiclesInfo } from "./details/BuildingCubiclesInfo";
import { BuildingHeadquartersInfo } from "./details/BuildingHeadquartersInfo";
import { BuildingProceduresInfo } from "./details/BuildingProceduresInfo";

type BuildingInfoCardProps = {
  building: Building;
  onClose?: () => void;
};

function getBuildingDescription(building: Building): string | null {
  if (building.description && building.description.trim() !== "") {
    return normalizeDisplayText(building.description.trim());
  }
  return null;
}

const closeBtn =
  "grid h-10 w-10 place-items-center rounded-full bg-[var(--color-surface)] text-[var(--color-text)] shadow-[0_1px_4px_rgba(10,10,10,0.18)] backdrop-blur-sm transition hover:bg-[var(--color-surface-muted)] active:scale-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[color:var(--ring-brand)] focus-visible:ring-offset-2";

export function BuildingInfoCard({ building, onClose }: BuildingInfoCardProps) {
  const highlightedSection = useBuildingStore((state) => state.highlightedSection);
  const glbPosition = useBuildingGlbStore((state) => state.positions[building.id]);
  // "Estoy aquí" depende de x/z calibrados por edificio; mientras el campus
  // no esté totalmente calibrado, solo el superadmin la ve para probarla.
  const canUseNavTools = useAdminAuthStore(
    (state) => state.isAuthenticated && state.user?.role === "superadmin"
  );

  function highlightFor(section: string): string | undefined {
    return highlightedSection?.section === section ? highlightedSection.targetId : undefined;
  }

  const [galleryImages, setGalleryImages] = useState<BuildingImage[]>([]);
  const [failedImages, setFailedImages] = useState<Set<string>>(new Set());
  const [coverFailedForId, setCoverFailedForId] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    getBuildingImagesApi(building.id)
      .then((imgs) => {
        if (!cancelled) {
          setFailedImages(new Set());
          setGalleryImages(imgs.filter((img) => img.is_active && !img.is_cover));
        }
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, [building.id]);

  const visibleImages = galleryImages.filter((img) => !failedImages.has(img.id));
  const { data: details, loading: detailsLoading, error: detailsError } =
    useBuildingFullDetails(building.id);

  const accent = getCategoryAccent(building.category_name);
  const buildingName = normalizeDisplayText(building.name);
  const buildingCode = normalizeDisplayText(building.code);
  const categoryName = normalizeDisplayText(building.category_name);
  const coverUrl = resolveApiAssetUrl(building.cover_image_url);
  const showCover = !!coverUrl && coverFailedForId !== building.id;
  const description = getBuildingDescription(building);
  const locationPosition =
    glbPosition ??
    (building.x != null && building.z != null
      ? { x: Number(building.x), z: Number(building.z) }
      : null);

  return (
    <motion.article
      key={building.id}
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.28, ease: [0.16, 1, 0.3, 1] }}
      className="ito-building-info-card flex flex-col overflow-hidden rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] shadow-[var(--shadow-maps)]"
      aria-label={`Información de ${buildingName}`}
    >
      {showCover ? (
        <div className="ito-bic-cover relative w-full overflow-hidden">
          <img
            src={coverUrl}
            alt=""
            className="h-full w-full object-cover"
            loading="lazy"
            onError={() => setCoverFailedForId(building.id)}
          />
          <div className="pointer-events-none absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/75 via-black/30 to-transparent p-4 pt-10">
            <div className="text-[11px] font-bold uppercase tracking-wider text-white/85">
              Edificio {buildingCode || "Sin código"}
            </div>
            <h3
              className="mt-0.5 text-balance text-[19px] font-semibold leading-tight text-white"
              style={{ fontFamily: "var(--font-display)" }}
            >
              {buildingName}
            </h3>
          </div>
          <button
            type="button"
            className={`absolute right-3 top-3 ${closeBtn}`}
            onClick={() => onClose?.()}
            aria-label="Cerrar información"
          >
            <Icon name="close" size={16} />
          </button>
        </div>
      ) : (
        <div
          className="relative flex items-center gap-3 p-4 text-white"
          style={{
            background: `linear-gradient(135deg, ${accent.fg} 0%, ${accent.fgDark} 100%)`,
          }}
        >
          <div
            className="grid h-11 w-11 flex-shrink-0 place-items-center rounded-xl bg-white/20 ring-1 ring-inset ring-white/30"
            aria-hidden="true"
          >
            <Icon name="building" size={26} />
          </div>
          <div className="min-w-0 flex-1">
            <div className="text-[11px] font-bold uppercase tracking-wider opacity-90">
              Edificio {buildingCode || "Sin código"}
            </div>
            <h3
              className="mt-0.5 text-balance text-[19px] font-semibold leading-tight"
              style={{ fontFamily: "var(--font-display)" }}
            >
              {buildingName}
            </h3>
          </div>
          <button
            type="button"
            className={`absolute right-3 top-3 ${closeBtn}`}
            onClick={() => onClose?.()}
            aria-label="Cerrar información"
          >
            <Icon name="close" size={16} />
          </button>
        </div>
      )}

      <div className="ito-building-info-card__body flex flex-col gap-3.5 p-4">
        <div className="flex items-center justify-between gap-2.5">
          <span className="text-[11px] font-bold uppercase tracking-wide text-[var(--color-text-muted)]">
            Categoría
          </span>
          <CategoryBadge name={categoryName} />
        </div>

        {building.is_priority && (
          <div className="flex w-fit items-center gap-1.5 rounded-lg bg-[var(--color-brand-50)] px-2.5 py-1.5 text-[12px] font-semibold text-[var(--color-brand-700)]">
            <Icon name="sparkles" size={14} />
            <span>Edificio prioritario</span>
          </div>
        )}

        {description && (
          <div className="flex flex-col gap-1.5">
            <span className="text-[11px] font-bold uppercase tracking-wide text-[var(--color-text-muted)]">
              Descripción
            </span>
            <p className="m-0 text-[13px] leading-relaxed text-[var(--color-text)]">
              {description}
            </p>
          </div>
        )}

        {detailsLoading && !details && (
          <div className="flex items-center justify-center gap-2 py-3 text-[12.5px] text-[var(--color-text-muted)]">
            <div
              className="h-4 w-4 animate-spin rounded-full border-2 border-[var(--color-border)] border-t-[var(--color-brand-600)]"
              aria-hidden="true"
            />
            Cargando información del edificio…
          </div>
        )}

        {detailsError && !details && (
          <div className="text-[12.5px] italic text-[var(--color-text-subtle)]">
            No se pudo cargar la información adicional de este edificio.
          </div>
        )}

        {details && (
          <>
            <BuildingStatusBadge status={details.status} week={details.schedule.week} />
            <BuildingClassroomsInfo classrooms={details.classrooms} highlightId={highlightFor("aulas")} />
            <BuildingDepartmentsInfo departments={details.departments} highlightId={highlightFor("departamentos")} />
            <BuildingCubiclesInfo cubicles={details.teacherCubicles} highlightId={highlightFor("cubiculos")} />
            <BuildingHeadquartersInfo headquarters={details.headquarters} highlightId={highlightFor("jefaturas")} />
            <BuildingProceduresInfo procedures={details.procedures} highlightId={highlightFor("tramites")} />
          </>
        )}

        {visibleImages.length > 0 && (
          <div className="flex flex-col gap-1.5">
            <span className="text-[11px] font-bold uppercase tracking-wide text-[var(--color-text-muted)]">
              Imágenes
            </span>
            <div
              className="ito-building-gallery flex gap-2 overflow-x-auto pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
              aria-label="Galería de imágenes del edificio"
            >
              {visibleImages.slice(0, 6).map((img) => (
                <img
                  key={img.id}
                  src={resolveApiAssetUrl(img.image_url) ?? undefined}
                  alt={normalizeDisplayText(img.title ?? buildingName)}
                  loading="lazy"
                  onError={() =>
                    setFailedImages((prev) => new Set([...prev, img.id]))
                  }
                  className="ito-building-gallery__image h-[60px] w-20 flex-shrink-0 rounded-lg object-cover ring-1 ring-inset ring-black/5"
                />
              ))}
            </div>
          </div>
        )}

        <div className="ito-building-info-card__actions flex flex-col gap-2 pt-1">
          {canUseNavTools && (
            <button
              type="button"
              className="inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-xl border border-[var(--color-border)] bg-[var(--color-surface-muted)] px-4 text-[13px] font-bold text-[var(--color-text)] transition hover:border-[var(--color-border-strong)] hover:bg-[var(--color-surface-hover)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[color:var(--ring-brand)] focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
              onClick={() => {
                if (!locationPosition) return;
                setSimulatedPosition({
                  buildingId: building.id,
                  buildingName,
                  x: locationPosition.x,
                  z: locationPosition.z,
                });
              }}
              disabled={!locationPosition}
            >
              <Icon name="crosshair" size={16} />
              <span>Estoy aquí</span>
            </button>
          )}

          <button
            type="button"
            className="inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-xl border border-[var(--color-border)] bg-[var(--color-surface-muted)] px-4 text-[13px] font-bold text-[var(--color-text)] transition hover:border-[var(--color-border-strong)] hover:bg-[var(--color-surface-hover)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[color:var(--ring-brand)] focus-visible:ring-offset-2"
            onClick={() => onClose?.()}
          >
            <Icon name="search" size={16} />
            <span>Seguir buscando</span>
          </button>
        </div>
      </div>
    </motion.article>
  );
}
