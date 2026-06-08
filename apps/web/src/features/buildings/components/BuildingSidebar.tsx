import { useEffect, useMemo, useState } from "react";
import { useBuildingStore } from "../../../store/building-store";
import { useLocationStore } from "../../../store/location-store";
import { useAdminAuthStore } from "../../../store/admin-auth-store";
import { RoutePanel } from "./RoutePanel";
import { getBuildings } from "../../../services/buildings.service";
import { BuildingSearch } from "./BuildingSearch";
import { BuildingInfoCard } from "./BuildingInfoCard";
import { CategoryBadge } from "../../../components/ui/CategoryBadge";
import { getCategoryAccent } from "../../../components/ui/categoryAccent";
import { Icon } from "../../../components/ui/Icons";
import { SearchResultCard } from "../../search/SearchResultCard";
import type { Building } from "../types/building";
import type { SearchResult } from "@ito-map/shared";

function normalizeSearchText(value: string | null | undefined): string {
  return value
    ? value
        .toLowerCase()
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
    : "";
}

function getBuildingSearchAliases(building: Building): string {
  const category = normalizeSearchText(building.category_name);
  const code = normalizeSearchText(building.code);
  const name = normalizeSearchText(building.name);
  const aliases: string[] = [];

  if (category.includes("servicio") || code.includes("ase")) {
    aliases.push(
      "tramite tramites constancia constancias kardex documentos inscripcion reinscripcion control escolar servicios escolares becas pagos atencion estudiante"
    );
  }

  if (category.includes("aula") || /^([a-z]|x|x001)$/i.test(building.code)) {
    aliases.push("aula aulas salon salones clase clases maestro materia horario");
  }

  if (category.includes("laboratorio") || name.includes("laboratorio")) {
    aliases.push(
      "laboratorio laboratorios practica practicas computo investigacion equipo taller"
    );
  }

  if (category.includes("biblioteca") || code.includes("bib")) {
    aliases.push("biblioteca libro libros prestamo consulta estudio estudiar");
  }

  if (category.includes("administrativo")) {
    aliases.push(
      "direccion administracion oficina oficinas coordinacion finanzas pagos recursos humanos"
    );
  }

  if (name.includes("cafeteria") || code.includes("caf")) {
    aliases.push("cafeteria cafe comida alimentos bebidas");
  }

  return aliases.join(" ");
}

type BuildingSidebarProps = {
  isMobile?: boolean;
  onItemSelected?: (building: Building) => void;
  onClearSelection?: () => void;
  showGreeting?: boolean;
  userName?: string;
};

export function BuildingSidebar({
  isMobile = false,
  onItemSelected,
  onClearSelection,
  showGreeting = false,
  userName,
}: BuildingSidebarProps) {
  const selectedBuilding = useBuildingStore((state) => state.selectedBuilding);
  const routeDestination = useBuildingStore((state) => state.routeDestination);
  const setSelectedBuilding = useBuildingStore(
    (state) => state.setSelectedBuilding
  );
  const searchTerm = useBuildingStore((state) => state.searchTerm);
  const permission = useLocationStore((state) => state.permission);
  const mapPosition = useLocationStore((state) => state.mapPosition);
  const canUseRoutes = useAdminAuthStore(
    (state) => state.isAuthenticated && state.user?.role === "superadmin"
  );
  const canUseDemo = canUseRoutes && import.meta.env.DEV;
  const isPublicDesktop = !isMobile && !canUseRoutes;

  const [buildings, setBuildings] = useState<Building[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeCategory, setActiveCategory] = useState<string | null>(null);
  const [showAllBuildings, setShowAllBuildings] = useState(false);
  const [selectedSearchResult, setSelectedSearchResult] =
    useState<SearchResult | null>(null);

  useEffect(() => {
    let mounted = true;

    async function loadBuildings() {
      try {
        const data = await getBuildings();

        if (mounted) {
          setBuildings(data);
        }
      } catch (error) {
        console.error("Error cargando edificios:", error);
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    }

    loadBuildings();

    return () => {
      mounted = false;
    };
  }, []);

  const categories = useMemo(() => {
    const map = new Map<string, number>();

    for (const building of buildings) {
      if (!building.is_active) continue;

      map.set(
        building.category_name,
        (map.get(building.category_name) ?? 0) + 1
      );
    }

    return Array.from(map.entries()).sort((a, b) => b[1] - a[1]);
  }, [buildings]);

  const filteredBuildings = useMemo(() => {
    const normalizedSearch = normalizeSearchText(searchTerm.trim());

    const result = buildings
      .filter((building) => building.is_active)
      .filter((building) => {
        if (!activeCategory) return true;

        return building.category_name === activeCategory;
      })
      .filter((building) => {
        if (!normalizedSearch) return true;

        const searchableText = [
          building.name,
          building.code,
          building.slug,
          building.description,
          building.model_node_name,
          building.category_code,
          building.category_name,
          getBuildingSearchAliases(building),
        ]
          .map(normalizeSearchText)
          .join(" ");

        return searchableText.includes(normalizedSearch);
      });

    if (!selectedBuilding) return result;

    return [...result].sort((a, b) => {
      if (a.id === selectedBuilding.id) return -1;
      if (b.id === selectedBuilding.id) return 1;

      return 0;
    });
  }, [buildings, searchTerm, selectedBuilding, activeCategory]);

  const totalActive = useMemo(
    () => buildings.filter((building) => building.is_active).length,
    [buildings]
  );

  const recommendedBuildings = useMemo(() => {
    const priority = buildings.filter((b) => b.is_active && b.is_priority);
    if (priority.length > 0) return priority.slice(0, 5);
    return buildings.filter((b) => b.is_active).slice(0, 4);
  }, [buildings]);

  const hasLocation = permission === "granted" && mapPosition !== null;
  const hasSearchTerm = searchTerm.trim().length > 0;

  const showList =
    hasSearchTerm ||
    activeCategory !== null ||
    !isPublicDesktop ||
    showAllBuildings;

  function handleSelectBuilding(building: Building) {
    setSelectedBuilding(building);
    onItemSelected?.(building);
  }

  function handleClearSelection() {
    setSelectedBuilding(null);
    onClearSelection?.();
  }

  function handleSelectSearchResult(result: SearchResult) {
    if (result.kind === "building") {
      setSelectedSearchResult(null);
    } else {
      setSelectedSearchResult(result);
    }
  }

  return (
    <aside
      className={
        isMobile
          ? "ito-sidebar ito-sidebar--mobile"
          : `ito-sidebar${isPublicDesktop ? " ito-sidebar--public" : ""}`
      }
    >
      {!isMobile && canUseRoutes && (
        <header className="ito-brand">
          <div className="ito-brand__mark" aria-hidden="true">
            <Icon name="map" size={22} />
          </div>

          <div className="ito-brand__text">
            <div className="ito-brand__title">Campus ITO</div>
            <div className="ito-brand__subtitle">Mapa interactivo 3D</div>
          </div>

          <div className="ito-brand__stats" aria-label="Estadísticas">
            <div
              className={`ito-brand__stat${hasLocation ? " is-live" : ""}`}
              title={
                hasLocation
                  ? "Tu ubicación está activa"
                  : "Esperando ubicación"
              }
            >
              <span className="ito-brand__stat-dot" aria-hidden="true" />
              {hasLocation ? "En vivo" : "Sin GPS"}
            </div>
          </div>
        </header>
      )}

      {isPublicDesktop && showGreeting && (
        <div className="ito-sidebar__greeting">
          <span className="ito-sidebar__greeting-question">
            {userName
              ? `¿A dónde vas hoy, ${userName.split(" ")[0]}?`
              : "¿A dónde quieres ir hoy?"}
          </span>
          <span className="ito-sidebar__greeting-sub">
            Busca aulas, servicios, laboratorios y más
          </span>
        </div>
      )}

      {isPublicDesktop && !showGreeting && (
        <div className="ito-sidebar__hint">
          <Icon name="search" size={14} aria-hidden="true" />
          <span>Busca aulas, edificios o servicios</span>
        </div>
      )}

      {!isMobile && canUseRoutes && (
        <div className="ito-quick-stats" role="list">
          <div className="ito-quick-stat" role="listitem">
            <span className="ito-quick-stat__value">{totalActive}</span>
            <span className="ito-quick-stat__label">Edificios</span>
          </div>

          <div className="ito-quick-stat" role="listitem">
            <span className="ito-quick-stat__value">{categories.length}</span>
            <span className="ito-quick-stat__label">Categorías</span>
          </div>

          <div className="ito-quick-stat" role="listitem">
            <span
              className={`ito-quick-stat__value${
                hasLocation ? " ito-quick-stat__value--ok" : ""
              }`}
            >
              <Icon name={hasLocation ? "check" : "alert"} size={14} />
            </span>
            <span className="ito-quick-stat__label">
              {hasLocation ? "GPS" : "GPS off"}
            </span>
          </div>
        </div>
      )}

      <div className="ito-sidebar__section">
        <BuildingSearch
          buildings={buildings}
          onSelectResult={handleSelectSearchResult}
        />
      </div>

      {selectedSearchResult && (
        <div className="ito-sidebar__section ito-sidebar__section--card">
          <SearchResultCard
            result={selectedSearchResult}
            onClose={() => setSelectedSearchResult(null)}
          />
        </div>
      )}

      {!isMobile && categories.length > 0 && (
        <div className="ito-sidebar__section">
          <div
            className="ito-chip-row"
            role="tablist"
            aria-label="Categorías"
          >
            <button
              type="button"
              role="tab"
              aria-selected={activeCategory === null}
              className={`ito-chip ${
                activeCategory === null ? "is-active" : ""
              }`}
              onClick={() => setActiveCategory(null)}
            >
              <span>Todos</span>
              <span className="ito-chip__count">{totalActive}</span>
            </button>

            {categories.map(([name, count]) => {
              const accent = getCategoryAccent(name);
              const isActive = activeCategory === name;

              return (
                <button
                  key={name}
                  type="button"
                  role="tab"
                  aria-selected={isActive}
                  className={`ito-chip ${isActive ? "is-active" : ""}`}
                  onClick={() => setActiveCategory(isActive ? null : name)}
                  style={
                    isActive
                      ? {
                          background: accent.bg,
                          color: accent.fg,
                          borderColor: accent.border,
                        }
                      : undefined
                  }
                >
                  <span
                    aria-hidden="true"
                    style={{
                      width: 8,
                      height: 8,
                      borderRadius: 999,
                      background: accent.fg,
                      display: "inline-block",
                    }}
                  />
                  <span>{name}</span>
                  <span className="ito-chip__count">{count}</span>
                </button>
              );
            })}
          </div>
        </div>
      )}

      {selectedBuilding && (
        <div className="ito-sidebar__section ito-sidebar__section--card">
          <BuildingInfoCard building={selectedBuilding} onClose={handleClearSelection} />
        </div>
      )}

      {(selectedBuilding || routeDestination) && (
        <div className="ito-sidebar__section">
          <RoutePanel compact={isMobile} canUseDemo={canUseDemo} />
        </div>
      )}

      {isPublicDesktop && !showList && !loading && recommendedBuildings.length > 0 && (
        <div className="ito-sidebar__section">
          <div className="ito-recommended">
            <div className="ito-recommended__header">
              <span className="ito-recommended__title">Lugares destacados</span>
            </div>

            {recommendedBuildings.map((building) => {
              const accent = getCategoryAccent(building.category_name);
              const accentColor = building.category_color || accent.fg;

              return (
                <button
                  key={building.id}
                  type="button"
                  className="ito-recommended-item"
                  onClick={() => handleSelectBuilding(building)}
                >
                  <div
                    className="ito-recommended-item__icon"
                    style={{ background: accent.bg }}
                    aria-hidden="true"
                  >
                    <Icon name="building" size={16} style={{ color: accentColor }} />
                  </div>

                  <div className="ito-recommended-item__text">
                    <span className="ito-recommended-item__name">
                      {building.name}
                    </span>
                    <span className="ito-recommended-item__category">
                      {building.category_name}
                    </span>
                  </div>

                  <div className="ito-recommended-item__go" aria-hidden="true">
                    <Icon name="chevron-right" size={14} />
                  </div>
                </button>
              );
            })}

            <button
              type="button"
              className="ito-list-expand-btn"
              onClick={() => setShowAllBuildings(true)}
            >
              <Icon name="list" size={14} />
              <span>Ver todos los edificios ({totalActive})</span>
            </button>
          </div>
        </div>
      )}

      {showList && (
        <div className="ito-sidebar__section ito-sidebar__section--list">
          <div className="ito-section-header">
            <h2 className="ito-section-header__title">
              {hasSearchTerm
                ? "Resultados"
                : activeCategory
                  ? activeCategory
                  : "Edificios"}
            </h2>

            <span className="ito-section-header__count">
              {loading ? "…" : `${filteredBuildings.length}`}
            </span>
          </div>

          {hasSearchTerm && (
            <div className="ito-search-summary">
              Buscando: <strong>{searchTerm}</strong>
            </div>
          )}

          <div
            className="ito-list"
            style={isMobile ? { maxHeight: "none" } : undefined}
          >
            {loading ? (
              <div className="ito-empty">
                <div className="ito-empty__spinner" aria-hidden="true" />
                <p>Cargando edificios…</p>
              </div>
            ) : filteredBuildings.length === 0 ? (
              <div className="ito-empty">
                <Icon name="search" size={28} />
                <p>No se encontraron edificios.</p>
                <span>Intenta con otro término o categoría.</span>
              </div>
            ) : (
              filteredBuildings.map((building) => {
                const isSelected = selectedBuilding?.id === building.id;
                const accent = getCategoryAccent(building.category_name);

                return (
                  <button
                    key={building.id}
                    type="button"
                    className={`ito-list-item ito-list-item--enhanced ${
                      isSelected ? "is-selected" : ""
                    }`}
                    onClick={() => handleSelectBuilding(building)}
                    aria-pressed={isSelected}
                    style={
                      isSelected
                        ? {
                            borderColor: accent.fg,
                            boxShadow: `0 0 0 3px ${accent.bg}`,
                          }
                        : undefined
                    }
                  >
                    <span
                      className="ito-list-item__rail"
                      aria-hidden="true"
                      style={{ background: accent.fg }}
                    />

                    <div className="ito-list-item__main">
                      <div className="ito-list-item__title-row">
                        <span className="ito-list-item__code">
                          {building.code}
                        </span>
                        <CategoryBadge name={building.category_name} size="sm" />
                      </div>

                      <div className="ito-list-item__name">{building.name}</div>
                    </div>

                    <span className="ito-list-item__chevron" aria-hidden="true">
                      <Icon name="chevron-right" size={16} />
                    </span>
                  </button>
                );
              })
            )}
          </div>
        </div>
      )}

      {!isMobile && (
        <footer className="ito-sidebar__footer">
          <span>Instituto Tecnológico de Oaxaca</span>
        </footer>
      )}
    </aside>
  );
}
