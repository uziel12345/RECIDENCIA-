import { useBuildingStore } from "../../../store/building-store";
import {
  CategoryBadge,
  getCategoryAccent,
} from "../../../components/ui/CategoryBadge";
import { Icon } from "../../../components/ui/Icons";
import type { Building } from "../types/building";

type BuildingInfoCardProps = {
  building: Building;
};

function resolveImageUrl(url: string | null | undefined): string | null {
  if (!url) return null;

  if (url.startsWith("http://") || url.startsWith("https://")) {
    return url;
  }

  const apiBaseUrl =
    import.meta.env.VITE_API_URL || "http://localhost:3001/api";
  const apiOrigin = apiBaseUrl.replace(/\/api\/?$/, "");

  return `${apiOrigin}${url.startsWith("/") ? "" : "/"}${url}`;
}

function getBuildingDescription(building: Building): string {
  if (building.description && building.description.trim() !== "") {
    return building.description.trim();
  }

  return `Este edificio pertenece a la categoría ${building.category_name}. Puedes seleccionarlo como destino para generar una ruta dentro del campus.`;
}

export function BuildingInfoCard({ building }: BuildingInfoCardProps) {
  const setSelectedBuilding = useBuildingStore(
    (state) => state.setSelectedBuilding
  );
  const setRouteDestination = useBuildingStore(
    (state) => state.setRouteDestination
  );

  const accent = getCategoryAccent(building.category_name);
  const coverUrl = resolveImageUrl(building.cover_image_url);

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
            onClick={() => setSelectedBuilding(null)}
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
            onClick={() => setSelectedBuilding(null)}
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

        <div className="ito-info-card__row ito-info-card__row--block">
          <span className="ito-info-card__label">Descripción</span>
          <p className="ito-info-card__text">
            {getBuildingDescription(building)}
          </p>
        </div>

        <div className="ito-info-card__row ito-info-card__row--block">
          <span className="ito-info-card__label">Referencia</span>
          <p className="ito-info-card__text ito-info-card__text--muted">
            {building.model_node_name
              ? `Nodo 3D: ${building.model_node_name}`
              : "Sin referencia de modelo 3D disponible."}
          </p>
        </div>

        <div className="ito-info-card__actions ito-info-card__actions--stack">
          <button
            type="button"
            className="ito-btn ito-btn--primary ito-btn--block"
            onClick={() => setRouteDestination(building)}
          >
            <Icon name="route" size={16} />
            <span>Trazar ruta aquí</span>
          </button>

          <button
            type="button"
            className="ito-btn ito-btn--ghost ito-btn--block"
            onClick={() => setSelectedBuilding(null)}
          >
            <Icon name="search" size={16} />
            <span>Seguir buscando</span>
          </button>
        </div>
      </div>
    </article>
  );
}