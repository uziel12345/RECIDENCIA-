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
import { getBuildingStatusLabel } from "./details/building-status-label";
import { BuildingClassroomsInfo } from "./details/BuildingClassroomsInfo";
import { BuildingDepartmentsInfo } from "./details/BuildingDepartmentsInfo";
import { BuildingCubiclesInfo } from "./details/BuildingCubiclesInfo";
import { BuildingHeadquartersInfo } from "./details/BuildingHeadquartersInfo";
import { BuildingProceduresInfo } from "./details/BuildingProceduresInfo";
import {
  formatBuildingDisplayCode,
  formatBuildingDisplayName,
} from "../utils/building-display-name";

type BuildingInfoCardProps = {
  building: Building;
  onClose?: () => void;
  isMobile?: boolean;
};

function getBuildingDescription(building: Building): string | null {
  if (building.description && building.description.trim() !== "") {
    return normalizeDisplayText(building.description.trim());
  }
  return null;
}

const closeBtn = "ito-building-info-card__close";

export function BuildingInfoCard({ building, onClose, isMobile = false }: BuildingInfoCardProps) {
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
  const [coverLoaded, setCoverLoaded] = useState(false);

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
  const galleryLoadFailed = galleryImages.length > 0 && visibleImages.length === 0;
  const { data: details, loading: detailsLoading, error: detailsError } =
    useBuildingFullDetails(building.id);

  const accent = getCategoryAccent(building.category_name);
  const buildingName = formatBuildingDisplayName(building.name, building.code);
  const buildingCode = formatBuildingDisplayCode(building.code, building.name);
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
      {isMobile ? (
        <div className="ito-bic-mobile-header flex items-start gap-3 border-b border-[var(--color-student-rule)] px-4 pb-4 pt-1">
          <span
            className="grid h-11 shrink-0 place-items-center rounded-xl px-2 text-[13px] font-bold uppercase text-white"
            style={{ backgroundColor: accent.fgDark, minWidth: "2.75rem" }}
            aria-hidden="true"
          >
            {buildingCode || "—"}
          </span>
          <div className="min-w-0 flex-1">
            <h2
              className="text-pretty text-[18px] font-bold leading-tight text-[var(--color-student-ink)]"
              style={{ fontFamily: "var(--font-display)" }}
            >
              {buildingName}
            </h2>
            <div className="mt-1.5 flex flex-wrap items-center gap-x-3 gap-y-1">
              <CategoryBadge name={categoryName} size="sm" />
              {details && (
                <span className="flex items-center gap-1 text-[12px] text-[var(--color-student-muted)]">
                  <Icon name="clock" size={12} />
                  {getBuildingStatusLabel(details.status)}
                </span>
              )}
            </div>
          </div>
          <button
            type="button"
            className={closeBtn}
            onClick={() => onClose?.()}
            aria-label="Cerrar información"
          >
            <Icon name="close" size={16} />
          </button>
        </div>
      ) : showCover ? (
        <div className="ito-bic-cover relative w-full overflow-hidden bg-[var(--color-surface-muted)]">
          {!coverLoaded && (
            <div
              className="absolute inset-0 animate-pulse bg-gradient-to-br from-[var(--color-surface-muted)] to-[var(--color-border)]"
              aria-hidden="true"
            />
          )}
          <img
            src={coverUrl}
            alt={`Fotografía real de ${buildingName}`}
            className={`h-full w-full object-cover transition-opacity duration-300 ${coverLoaded ? "opacity-100" : "opacity-0"}`}
            loading="eager"
            onLoad={() => setCoverLoaded(true)}
            onError={() => setCoverFailedForId(building.id)}
          />
          <div className="ito-building-info-card__cover-copy pointer-events-none absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/75 via-black/30 to-transparent p-4 pt-10">
            <div className="ito-building-info-card__eyebrow text-[11px] font-bold uppercase tracking-wider text-white/85">
              Edificio {buildingCode || "Sin código"}
            </div>
            <h3
              className="ito-building-info-card__title mt-0.5 text-balance text-[19px] font-semibold leading-tight text-white"
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
          className="ito-building-info-card__fallback relative flex items-center gap-3 p-4 text-white"
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
            <div className="ito-building-info-card__eyebrow text-[11px] font-bold uppercase tracking-wider opacity-90">
              Edificio {buildingCode || "Sin código"}
            </div>
            <h3
              className="ito-building-info-card__title mt-0.5 text-balance text-[19px] font-semibold leading-tight"
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
        {isMobile && showCover && (
          <img
            src={coverUrl}
            alt={`Fotografía real de ${buildingName}`}
            className="aspect-[16/9] w-full rounded-xl border border-[var(--color-student-rule)] object-cover"
            loading="eager"
          />
        )}

        {!isMobile && (
          <div className="ito-building-info-card__meta-row flex items-center justify-between gap-2.5">
            <span className="ito-building-info-card__label text-[11px] font-bold uppercase tracking-wide text-[var(--color-text-muted)]">
              Categoría
            </span>
            <CategoryBadge name={categoryName} />
          </div>
        )}

        {building.is_priority && (
          <div className="ito-building-info-card__priority flex w-fit items-center gap-1.5 rounded-lg bg-[var(--color-brand-50)] px-2.5 py-1.5 text-[12px] font-semibold text-[var(--color-brand-700)]">
            <Icon name="sparkles" size={14} />
            <span>Edificio prioritario</span>
          </div>
        )}

        {description && (
          <div className="ito-building-info-card__field flex flex-col gap-1.5">
            <span className="ito-building-info-card__label text-[11px] font-bold uppercase tracking-wide text-[var(--color-text-muted)]">
              Descripción
            </span>
            <p className="m-0 text-[13px] leading-relaxed text-[var(--color-text)]">
              {description}
            </p>
          </div>
        )}

        {visibleImages.length > 0 && (
          <div className="ito-building-info-card__field flex flex-col gap-1.5">
            <span className="ito-building-info-card__label text-[11px] font-bold uppercase tracking-wide text-[var(--color-text-muted)]">
              Fotos del edificio
            </span>
            <div
              className="ito-b-gallery grid grid-cols-2 gap-2"
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
                  className="ito-b-gallery__image aspect-[4/3] w-full rounded-xl border border-[var(--color-border)] object-cover shadow-[var(--shadow-xs)] transition-transform duration-200 hover:scale-[1.03]"
                />
              ))}
            </div>
          </div>
        )}

        {galleryLoadFailed && (
          <div className="ito-building-info-card__field flex items-center gap-2 rounded-xl border border-[var(--color-border)] bg-[var(--color-surface-muted)] px-3 py-2.5 text-[12px] text-[var(--color-text-subtle)]">
            <Icon name="alert" size={14} />
            <span>No se pudieron cargar las fotos de este edificio.</span>
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
          <div className="ito-building-info-card__error text-[12.5px] italic text-[var(--color-text-subtle)]">
            No se pudo cargar la información adicional de este edificio.
          </div>
        )}

        {details && (
          <div className="flex flex-col gap-2.5">
            <BuildingStatusBadge status={details.status} week={details.schedule.week} />
            <BuildingClassroomsInfo classrooms={details.classrooms} highlightId={highlightFor("aulas")} />
            <BuildingDepartmentsInfo
              departments={details.departments}
              procedures={details.procedures}
              highlightId={highlightFor("departamentos")}
              procedureHighlightId={highlightFor("tramites")}
            />
            <BuildingCubiclesInfo cubicles={details.teacherCubicles} highlightId={highlightFor("cubiculos")} />
            <BuildingHeadquartersInfo headquarters={details.headquarters} highlightId={highlightFor("jefaturas")} />
            <BuildingProceduresInfo procedures={details.procedures} highlightId={highlightFor("tramites")} />
          </div>
        )}

        <div
          className={`ito-building-info-card__actions flex flex-col gap-2 pt-1 ${
            isMobile ? "ito-building-info-card__actions--sticky sticky bottom-0 -mx-4 -mb-4 px-4 py-3" : ""
          }`}
        >
          {canUseNavTools && (
            <button
              type="button"
              className="ito-building-info-card__action inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-xl border border-[var(--color-border)] bg-[var(--color-surface-muted)] px-4 text-[13px] font-bold text-[var(--color-text)] disabled:cursor-not-allowed disabled:opacity-50"
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

          {isMobile ? (
            <button
              type="button"
              className="ito-building-info-card__cta inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-xl px-4 text-[13px] font-bold"
              onClick={() => onClose?.()}
            >
              <Icon name="navigation" size={16} />
              <span>Cómo llegar</span>
            </button>
          ) : (
            <button
              type="button"
              className="ito-building-info-card__action inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-xl border border-[var(--color-border)] bg-[var(--color-surface-muted)] px-4 text-[13px] font-bold text-[var(--color-text)]"
              onClick={() => onClose?.()}
            >
              <Icon name="search" size={16} />
              <span>Seguir buscando</span>
            </button>
          )}
        </div>
      </div>
    </motion.article>
  );
}
