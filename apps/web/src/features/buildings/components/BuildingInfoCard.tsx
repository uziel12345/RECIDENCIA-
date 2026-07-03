import { useState, useEffect } from "react";
import { useBuildingStore } from "../../../store/building-store";
import { useBuildingGlbStore } from "../../../store/building-glb-store";
import { CategoryBadge } from "../../../components/ui/CategoryBadge";
import { getCategoryAccent } from "../../../components/ui/categoryAccent";
import { Icon } from "../../../components/ui/Icons";
import { resolveApiAssetUrl } from "../../../utils/resolve-api-asset-url";
import { getBuildingImagesApi } from "@ito-map/shared";
import type { BuildingImage } from "@ito-map/shared";
import type { Building } from "../types/building";
import { setSimulatedPosition } from "../../location/services/geolocation";

type BuildingInfoCardProps = {
  building: Building;
  onClose?: () => void;
};

function getBuildingDescription(building: Building): string | null {
  if (building.description && building.description.trim() !== "") {
    return building.description.trim();
  }
  return null;
}

const closeBtn =
  "grid h-10 w-10 place-items-center rounded-full bg-[var(--color-surface)] text-[var(--color-text)] shadow-[0_1px_4px_rgba(10,10,10,0.18)] backdrop-blur-sm transition hover:bg-[var(--color-surface-muted)] active:scale-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[color:var(--ring-brand)] focus-visible:ring-offset-2";

export function BuildingInfoCard({ building, onClose }: BuildingInfoCardProps) {
  const setRouteDestination = useBuildingStore(
    (state) => state.setRouteDestination
  );
  const routeError = useBuildingStore((state) => state.routeError);
  const routeDestination = useBuildingStore((state) => state.routeDestination);
  const glbPosition = useBuildingGlbStore((state) => state.positions[building.id]);

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

  const accent = getCategoryAccent(building.category_name);
  const coverUrl = resolveApiAssetUrl(building.cover_image_url);
  const showCover = !!coverUrl && coverFailedForId !== building.id;
  const description = getBuildingDescription(building);
  const locationPosition =
    glbPosition ??
    (building.x != null && building.z != null
      ? { x: Number(building.x), z: Number(building.z) }
      : null);

  return (
    <article
      className="ito-building-info-card flex flex-col overflow-hidden rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] shadow-[var(--shadow-maps)]"
      aria-label={`Información de ${building.name}`}
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
              Edificio {building.code || "Sin código"}
            </div>
            <h3 className="mt-0.5 text-balance text-[17px] font-bold leading-tight text-white">
              {building.name}
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
              Edificio {building.code || "Sin código"}
            </div>
            <h3 className="mt-0.5 text-balance text-[17px] font-bold leading-tight">
              {building.name}
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

      <div className="flex flex-col gap-3.5 p-4">
        <div className="flex items-center justify-between gap-2.5">
          <span className="text-[11px] font-bold uppercase tracking-wide text-[var(--color-text-muted)]">
            Categoría
          </span>
          <CategoryBadge name={building.category_name} />
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

        {routeError && routeDestination?.id === building.id && (
          <div
            className="flex items-start gap-2 rounded-lg border border-[#fecaca] bg-[#fef2f2] px-2.5 py-2 text-[12px] font-medium leading-snug text-[#dc2626]"
            role="alert"
          >
            <Icon name="alert" size={13} />
            <span>{routeError}</span>
          </div>
        )}

        {visibleImages.length > 0 && (
          <div className="flex flex-col gap-1.5">
            <span className="text-[11px] font-bold uppercase tracking-wide text-[var(--color-text-muted)]">
              Imágenes
            </span>
            <div
              className="flex gap-2 overflow-x-auto pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
              aria-label="Galería de imágenes del edificio"
            >
              {visibleImages.slice(0, 6).map((img) => (
                <img
                  key={img.id}
                  src={resolveApiAssetUrl(img.image_url) ?? undefined}
                  alt={img.title ?? building.name}
                  loading="lazy"
                  onError={() =>
                    setFailedImages((prev) => new Set([...prev, img.id]))
                  }
                  className="h-[60px] w-20 flex-shrink-0 rounded-lg object-cover ring-1 ring-inset ring-black/5"
                />
              ))}
            </div>
          </div>
        )}

        <div className="flex flex-col gap-2 pt-1">
          <button
            type="button"
            className="ito-btn-nav-primary inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-xl bg-[var(--color-brand-600)] px-4 text-[13px] font-bold text-white shadow-[0_2px_6px_rgba(234,88,12,0.25)] transition hover:-translate-y-px hover:bg-[var(--color-brand-700)] active:translate-y-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[color:var(--ring-brand)] focus-visible:ring-offset-2"
            onClick={() => setRouteDestination(building)}
          >
            <Icon name="route" size={16} />
            <span>Cómo llegar</span>
          </button>

          <button
            type="button"
            className="inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-xl border border-[var(--color-border)] bg-[var(--color-surface-muted)] px-4 text-[13px] font-bold text-[var(--color-text)] transition hover:border-[var(--color-border-strong)] hover:bg-[var(--color-surface-hover)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[color:var(--ring-brand)] focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
            onClick={() => {
              if (!locationPosition) return;
              setSimulatedPosition({
                buildingId: building.id,
                buildingName: building.name,
                x: locationPosition.x,
                z: locationPosition.z,
              });
            }}
            disabled={!locationPosition}
          >
            <Icon name="crosshair" size={16} />
            <span>Estoy aquí</span>
          </button>

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
    </article>
  );
}
