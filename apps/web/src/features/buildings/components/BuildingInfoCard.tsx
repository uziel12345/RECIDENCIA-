import { useState, useEffect } from "react";
import { useBuildingStore } from "../../../store/building-store";
import { CategoryBadge } from "../../../components/ui/CategoryBadge";
import { getCategoryAccent } from "../../../components/ui/categoryAccent";
import { Icon } from "../../../components/ui/Icons";
import { resolveApiAssetUrl } from "../../../utils/resolve-api-asset-url";
import { getBuildingImagesApi } from "@ito-map/shared";
import type { BuildingImage } from "@ito-map/shared";
import type { Building } from "../types/building";

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

export function BuildingInfoCard({ building, onClose }: BuildingInfoCardProps) {
  const setRouteDestination = useBuildingStore(
    (state) => state.setRouteDestination
  );
  const routeError = useBuildingStore((state) => state.routeError);
  const routeDestination = useBuildingStore((state) => state.routeDestination);

  const [galleryImages, setGalleryImages] = useState<BuildingImage[]>([]);
  const [failedImages, setFailedImages] = useState<Set<string>>(new Set());

  useEffect(() => {
    let cancelled = false;
    setFailedImages(new Set());
    getBuildingImagesApi(building.id)
      .then((imgs) => {
        if (!cancelled) {
          setGalleryImages(imgs.filter((img) => img.is_active && !img.is_cover));
        }
      })
      .catch(() => {});
    return () => { cancelled = true; };
  }, [building.id]);

  const visibleImages = galleryImages.filter((img) => !failedImages.has(img.id));

  const accent = getCategoryAccent(building.category_name);
  const coverUrl = resolveApiAssetUrl(building.cover_image_url);
  const description = getBuildingDescription(building);

  return (
    <article
      className="ito-info-card"
      aria-label={`Información de ${building.name}`}
    >
      {coverUrl ? (
        <div className="ito-info-card__cover">
          <img
            src={coverUrl}
            alt=""
            className="ito-info-card__cover-img"
            loading="lazy"
          />

          <button
            type="button"
            className="ito-info-card__close"
            onClick={() => onClose?.()}
            aria-label="Cerrar información"
          >
            <Icon name="close" size={16} />
          </button>
        </div>
      ) : (
        <div
          className="ito-info-card__hero"
          style={{
            background: `linear-gradient(135deg, ${accent.fg} 0%, ${accent.fgDark} 100%)`,
          }}
        >
          <div className="ito-info-card__hero-icon" aria-hidden="true">
            <Icon name="building" size={26} />
          </div>

          <div className="ito-info-card__hero-text">
            <div className="ito-info-card__code">
              Edificio {building.code || "Sin código"}
            </div>
            <h3 className="ito-info-card__name">{building.name}</h3>
          </div>

          <button
            type="button"
            className="ito-info-card__close"
            onClick={() => onClose?.()}
            aria-label="Cerrar información"
          >
            <Icon name="close" size={16} />
          </button>
        </div>
      )}

      {coverUrl && (
        <div className="ito-info-card__cover-title">
          <div className="ito-info-card__code">
            Edificio {building.code || "Sin código"}
          </div>
          <h3 className="ito-info-card__name">{building.name}</h3>
        </div>
      )}

      <div className="ito-info-card__body">
        <div className="ito-info-card__row">
          <span className="ito-info-card__label">Categoría</span>
          <CategoryBadge name={building.category_name} />
        </div>

        {building.is_priority && (
          <div className="ito-info-card__priority">
            <Icon name="sparkles" size={14} />
            <span>Edificio prioritario</span>
          </div>
        )}

        {description && (
          <div className="ito-info-card__row ito-info-card__row--block">
            <span className="ito-info-card__label">Descripción</span>
            <p className="ito-info-card__text">{description}</p>
          </div>
        )}

        {routeError && routeDestination?.id === building.id && (
          <div
            style={{
              display: "flex",
              alignItems: "flex-start",
              gap: 8,
              padding: "8px 10px",
              borderRadius: 8,
              background: "#fef2f2",
              border: "1px solid #fecaca",
              color: "#dc2626",
              fontSize: 12,
              fontWeight: 500,
              lineHeight: 1.4,
            }}
            role="alert"
          >
            <Icon name="alert" size={13} />
            <span>{routeError}</span>
          </div>
        )}

        {visibleImages.length > 0 && (
          <div className="ito-info-card__row ito-info-card__row--block">
            <span className="ito-info-card__label">Imágenes</span>
            <div
              style={{
                display: "flex",
                gap: 8,
                overflowX: "auto",
                paddingBottom: 4,
                scrollbarWidth: "none",
              }}
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
                  style={{
                    width: 80,
                    height: 60,
                    objectFit: "cover",
                    borderRadius: 8,
                    flexShrink: 0,
                    border: "1px solid rgba(148,163,184,0.15)",
                  }}
                />
              ))}
            </div>
          </div>
        )}

        <div className="ito-info-card__actions ito-info-card__actions--stack">
          <button
            type="button"
            className="ito-btn ito-btn--primary ito-btn--block"
            onClick={() => setRouteDestination(building)}
          >
            <Icon name="route" size={16} />
            <span>Como llegar</span>
          </button>

          <button
            type="button"
            className="ito-btn ito-btn--ghost ito-btn--block"
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

