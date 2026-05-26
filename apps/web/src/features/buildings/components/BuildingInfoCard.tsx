import { useBuildingStore } from "../../../store/building-store";
import { CategoryBadge } from "../../../components/ui/CategoryBadge";
import { getCategoryAccent } from "../../../components/ui/categoryAccent";
import { Icon } from "../../../components/ui/Icons";
import { resolveApiAssetUrl } from "../../../utils/resolve-api-asset-url";
import type { Building } from "../types/building";

type BuildingInfoCardProps = {
  building: Building;
};

function getBuildingDescription(building: Building): string {
  if (building.description && building.description.trim() !== "") {
    return building.description.trim();
  }

  return `Este edificio pertenece a la categorÃ­a ${building.category_name}. Puedes seleccionarlo como destino para generar una ruta dentro del campus.`;
}

export function BuildingInfoCard({ building }: BuildingInfoCardProps) {
  const setSelectedBuilding = useBuildingStore(
    (state) => state.setSelectedBuilding
  );
  const setRouteDestination = useBuildingStore(
    (state) => state.setRouteDestination
  );
  const routeError = useBuildingStore((state) => state.routeError);
  const routeDestination = useBuildingStore((state) => state.routeDestination);

  const accent = getCategoryAccent(building.category_name);
  const coverUrl = resolveApiAssetUrl(building.cover_image_url);

  return (
    <article
      className="ito-info-card"
      aria-label={`InformaciÃ³n de ${building.name}`}
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
            aria-label="Cerrar informaciÃ³n"
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
              Edificio {building.code || "Sin cÃ³digo"}
            </div>
            <h3 className="ito-info-card__name">{building.name}</h3>
          </div>

          <button
            type="button"
            className="ito-info-card__close"
            onClick={() => setSelectedBuilding(null)}
            aria-label="Cerrar informaciÃ³n"
          >
            <Icon name="close" size={16} />
          </button>
        </div>
      )}

      {coverUrl && (
        <div className="ito-info-card__cover-title">
          <div className="ito-info-card__code">
            Edificio {building.code || "Sin cÃ³digo"}
          </div>
          <h3 className="ito-info-card__name">{building.name}</h3>
        </div>
      )}

      <div className="ito-info-card__body">
        <div className="ito-info-card__row">
          <span className="ito-info-card__label">CategorÃ­a</span>
          <CategoryBadge name={building.category_name} />
        </div>

        {building.is_priority && (
          <div className="ito-info-card__priority">
            <Icon name="sparkles" size={14} />
            <span>Edificio prioritario</span>
          </div>
        )}

        <div className="ito-info-card__row ito-info-card__row--block">
          <span className="ito-info-card__label">DescripciÃ³n</span>
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

