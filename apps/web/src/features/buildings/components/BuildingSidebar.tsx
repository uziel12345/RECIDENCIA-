import { useEffect, useMemo, useState } from "react";
import { useBuildingStore } from "../../../store/building-store";
import { useLocationStore } from "../../../store/location-store";
import { RoutePanel } from "./RoutePanel";
import { getBuildings } from "../../../services/buildings.service";
import { BuildingSearch } from "./BuildingSearch";
import { BuildingInfoCard } from "./BuildingInfoCard";
import { CategoryBadge, getCategoryAccent } from "../../../components/ui/CategoryBadge";
import { Icon } from "../../../components/ui/Icons";
import type { Building } from "../types/building";

function normalizeSearchText(value: string | null | undefined): string {
  return value
    ? value
        .toLowerCase()
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
    : "";
}

type BuildingSidebarProps = {
  isMobile?: boolean;
  /** Called after the user picks a building from the list. Allows the parent
   * (e.g. mobile sheet) to react, like collapsing to peek mode. */
  onItemSelected?: (building: Building) => void;
  /** Called when the user explicitly clears the current selection. */
  onClearSelection?: () => void;
};

export function BuildingSidebar({
  isMobile = false,
  onItemSelected,
}: BuildingSidebarProps) {
  const selectedBuilding = useBuildingStore((state) => state.selectedBuilding);
  const setSelectedBuilding = useBuildingStore((state) => state.setSelectedBuilding);
  const searchTerm = useBuildingStore((state) => state.searchTerm);
  const permission = useLocationStore((state) => state.permission);
  const mapPosition = useLocationStore((state) => state.mapPosition);

  const [buildings, setBuildings] = useState<Building[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeCategory, setActiveCategory] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;
    async function loadBuildings() {
      try {
        const data = await getBuildings();
        if (mounted) setBuildings(data);
      } catch (error) {
        console.error("Error cargando edificios:", error);
      } finally {
        if (mounted) setLoading(false);
      }
    }

    loadBuildings();
    return () => {
      mounted = false;
    };
  }, []);

  const categories = useMemo(() => {
    const map = new Map<string, number>();
    for (const b of buildings) {
      if (!b.is_active) continue;
      map.set(b.category_name, (map.get(b.category_name) ?? 0) + 1);
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
    () => buildings.filter((b) => b.is_active).length,
    [buildings],
  );

  const hasLocation = permission === "granted" && mapPosition !== null;

  function handleSelectBuilding(building: Building) {
    setSelectedBuilding(building);
    onItemSelected?.(building);
  }

  return (
    <aside className={isMobile ? "ito-sidebar ito-sidebar--mobile" : "ito-sidebar"}>
      {!isMobile && (
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
              <span
                className="ito-brand__stat-dot"
                aria-hidden="true"
              />
              {hasLocation ? "En vivo" : "Sin GPS"}
            </div>
          </div>
        </header>
      )}

      {!isMobile && (
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
        <BuildingSearch />
      </div>

      {categories.length > 0 && (
        <div className="ito-sidebar__section">
          <div className="ito-chip-row" role="tablist" aria-label="Categorías">
            <button
              type="button"
              role="tab"
              aria-selected={activeCategory === null}
              className={`ito-chip ${activeCategory === null ? "is-active" : ""}`}
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

      {/* Selected building card pinned at the top of the list */}
      {selectedBuilding && (
        <div className="ito-sidebar__section ito-sidebar__section--card">
          <BuildingInfoCard building={selectedBuilding} />
        </div>
      )}

      {selectedBuilding && (
        <div className="ito-sidebar__section">
          <RoutePanel compact={isMobile} />
        </div>
      )}

      <div className="ito-sidebar__section ito-sidebar__section--list">
        <div className="ito-section-header">
          <h2 className="ito-section-header__title">
            {activeCategory ? activeCategory : "Edificios"}
          </h2>
          <span className="ito-section-header__count">
            {loading ? "…" : `${filteredBuildings.length}`}
          </span>
        </div>

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
                  className={`ito-list-item ${isSelected ? "is-selected" : ""}`}
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
                      <span className="ito-list-item__code">{building.code}</span>
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

      {!isMobile && (
        <footer className="ito-sidebar__footer">
          <span>Instituto Tecnológico de Oaxaca</span>
        </footer>
      )}
    </aside>
  );
}
