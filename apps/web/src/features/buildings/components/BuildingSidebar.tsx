import { useMemo, useState } from "react";
import { useBuildingStore } from "../../../store/building-store";
import { useLocationStore } from "../../../store/location-store";
import { useAdminAuthStore } from "../../../store/admin-auth-store";
import { useBuildings } from "../../../hooks/useBuildings";
import { useGates } from "../../../hooks/useGates";
import { useBuildingCategories } from "../hooks/useBuildingCategories";
import { BuildingSearch } from "./BuildingSearch";
import { BuildingInfoCard } from "./BuildingInfoCard";
import { CategoryBadge } from "../../../components/ui/CategoryBadge";
import { getCategoryAccent } from "../../../components/ui/categoryAccent";
import { Icon } from "../../../components/ui/Icons";
import { SearchResultCard } from "../../search/SearchResultCard";
import { AppFooter } from "../../../components/ui/AppFooter";
import { normalizeDisplayText } from "../../../utils/text";
import { matchesSearchWords } from "../../../utils/search-match";
import type { Building } from "../types/building";

function normalizeSearchText(value: string | null | undefined): string {
  return value
    ? value
        .toLowerCase()
        .normalize("NFD")
        .replace(/[̀-ͯ]/g, "")
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
  onItemSelected?: () => void;
  onClearSelection?: () => void;
  showGreeting?: boolean;
  showSearchPanel?: boolean;
  browseOnly?: boolean;
  userName?: string;
};

const SECTION = "flex flex-col gap-2.5";

export function BuildingSidebar({
  isMobile = false,
  onItemSelected,
  onClearSelection,
  showGreeting = false,
  showSearchPanel = true,
  browseOnly = false,
  userName,
}: BuildingSidebarProps) {
  const selectedBuilding = useBuildingStore((state) => state.selectedBuilding);
  const setSelectedBuilding = useBuildingStore(
    (state) => state.setSelectedBuilding
  );
  const searchTerm = useBuildingStore((state) => state.searchTerm);
  const activeCategory = useBuildingStore((state) => state.activeCategory);
  const setActiveCategory = useBuildingStore((state) => state.setActiveCategory);
  const selectedSearchResult = useBuildingStore(
    (state) => state.selectedSearchResult
  );
  const setSelectedSearchResult = useBuildingStore(
    (state) => state.setSelectedSearchResult
  );
  const permission = useLocationStore((state) => state.permission);
  const mapPosition = useLocationStore((state) => state.mapPosition);
  const canUseRoutes = useAdminAuthStore(
    (state) => state.isAuthenticated && state.user?.role === "superadmin"
  );
  const isPublicDesktop = !isMobile && !canUseRoutes;

  const { buildings, loading, error: loadError } = useBuildings();
  const { gates } = useGates();
  const [showAllBuildings, setShowAllBuildings] = useState(false);
  const { categories, totalActive } = useBuildingCategories(buildings);

  const filteredBuildings = useMemo(() => {
    const result = buildings
      .filter((building) => building.is_active)
      .filter((building) => {
        if (browseOnly || !activeCategory) return true;
        return building.category_name === activeCategory;
      })
      .filter((building) => {
        if (browseOnly || !searchTerm.trim()) return true;
        const searchableText = [
          building.name,
          building.code,
          building.slug,
          building.description,
          building.model_node_name,
          building.category_code,
          building.category_name,
          getBuildingSearchAliases(building),
        ].join(" ");
        return matchesSearchWords(searchableText, searchTerm);
      });

    if (!selectedBuilding) return result;

    return [...result].sort((a, b) => {
      if (a.id === selectedBuilding.id) return -1;
      if (b.id === selectedBuilding.id) return 1;
      return 0;
    });
  }, [activeCategory, browseOnly, buildings, searchTerm, selectedBuilding]);

  const recommendedBuildings = (() => {
    const priority = buildings.filter((b) => b.is_active && b.is_priority);
    if (priority.length > 0) return priority.slice(0, 5);
    return buildings.filter((b) => b.is_active).slice(0, 4);
  })();

  const hasLocation = permission === "granted" && mapPosition !== null;
  const hasSearchTerm = !browseOnly && searchTerm.trim().length > 0;

  const showList =
    hasSearchTerm ||
    (!browseOnly && activeCategory !== null) ||
    !isPublicDesktop ||
    showAllBuildings;

  function handleSelectBuilding(building: Building) {
    setSelectedBuilding(building);
    onItemSelected?.();
  }
  function handleClearSelection() {
    setSelectedBuilding(null);
    onClearSelection?.();
  }
  function handleSelectSearchResult() {
    // La selección (edificio/puerta, ruta, sección a resaltar) ya la resolvió
    // selectSearchResult() en el store, dentro de BuildingSearch.handleSelect.
    // Aquí solo colapsamos el panel móvil para que el mapa, ya enfocado,
    // quede visible en vez de tapado por la búsqueda.
    onItemSelected?.();
  }

  return (
    <aside
      className={
        isMobile
          ? "flex h-auto w-full flex-col gap-4 px-1 pb-6 pt-1"
          : "flex h-full w-full flex-col gap-4 overflow-y-auto bg-[var(--color-surface)] p-[18px] pt-5"
      }
    >
      {canUseRoutes && !isMobile && (
        <header className="flex items-center gap-3 pb-2">
          <div
            className="grid h-11 w-11 flex-shrink-0 place-items-center overflow-hidden rounded-xl bg-[var(--color-surface-muted)] shadow-[var(--shadow-md)]"
            aria-hidden="true"
          >
            <img
              src="/ICONO-TEC.jpeg"
              alt="ITO"
              className="h-[38px] w-[38px] object-contain"
            />
          </div>
          <div className="min-w-0 flex-1">
            <div className="text-[16px] font-bold leading-tight tracking-tight text-[var(--color-text)]">
              Campus ITO
            </div>
            <div className="mt-0.5 text-[12px] text-[var(--color-text-muted)]">
              Mapa interactivo 3D
            </div>
          </div>
          <div aria-label="Estadísticas">
            <div
              className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[11px] font-semibold uppercase tracking-wide ${
                hasLocation
                  ? "border-[var(--color-success-border)] bg-[var(--color-success-bg)] text-[var(--color-success-text)]"
                  : "border-[var(--color-border)] bg-[var(--color-surface-muted)] text-[var(--color-text-muted)]"
              }`}
              title={
                hasLocation ? "Tu ubicación está activa" : "Esperando ubicación"
              }
            >
              <span
                className={`h-[7px] w-[7px] rounded-full ${
                  hasLocation
                    ? "bg-[#10b981] shadow-[0_0_0_4px_rgba(16,185,129,0.18)]"
                    : "bg-[var(--color-text-subtle)]"
                }`}
                aria-hidden="true"
              />
              {hasLocation ? "En vivo" : "Sin GPS"}
            </div>
          </div>
        </header>
      )}

      {canUseRoutes && !isMobile && (
        <div className="grid grid-cols-3 gap-2 px-2 pb-1" role="list">
          {[
            { value: totalActive, label: "Edificios" },
            { value: categories.length, label: "Categorías" },
          ].map((stat) => (
            <div
              key={stat.label}
              className="flex flex-col items-start rounded-xl border border-[var(--color-border)] bg-[var(--gradient-surface)] px-3 py-2.5"
              role="listitem"
            >
              <span className="text-[20px] font-extrabold leading-none text-[var(--color-text)]">
                {stat.value}
              </span>
              <span className="mt-1 text-[10px] font-semibold uppercase tracking-wider text-[var(--color-text-muted)]">
                {stat.label}
              </span>
            </div>
          ))}
          <div
            className="flex flex-col items-start rounded-xl border border-[var(--color-border)] bg-[var(--gradient-surface)] px-3 py-2.5"
            role="listitem"
          >
            <span
              className={`inline-flex items-center gap-1 text-[20px] font-extrabold leading-none ${
                hasLocation ? "text-[#059669]" : "text-[var(--color-text)]"
              }`}
            >
              <Icon name={hasLocation ? "check" : "alert"} size={14} />
            </span>
            <span className="mt-1 text-[10px] font-semibold uppercase tracking-wider text-[var(--color-text-muted)]">
              {hasLocation ? "GPS" : "GPS off"}
            </span>
          </div>
        </div>
      )}

      {showSearchPanel && (
      <div className="flex flex-col gap-3 rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] p-3.5 shadow-[var(--shadow-xs)]">
        {isPublicDesktop && showGreeting && (
          <div className="flex flex-col gap-1 px-0.5">
            <span className="text-balance text-[15px] font-bold leading-tight tracking-tight text-[var(--color-text)]">
              {userName
                ? `¿A dónde vas hoy, ${userName.split(" ")[0]}?`
                : "¿A dónde quieres ir hoy?"}
            </span>
            <span className="text-[12px] font-medium text-[var(--color-text-muted)]">
              Busca aulas, servicios, laboratorios y más
            </span>
          </div>
        )}

        {isPublicDesktop && !showGreeting && (
          <div className="flex items-center gap-1.5 px-0.5 text-[12px] font-semibold text-[var(--color-text-subtle)]">
            <Icon name="search" size={14} aria-hidden="true" />
            <span>Busca aulas, edificios o servicios</span>
          </div>
        )}

        <BuildingSearch
          buildings={buildings}
          gates={gates}
          onSelectResult={handleSelectSearchResult}
        />

        {categories.length > 0 && (
          <div
            className="flex flex-nowrap gap-1.5 overflow-x-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
            role="tablist"
            aria-label="Categorías"
          >
            <button
              type="button"
              role="tab"
              aria-selected={activeCategory === null}
              className={`inline-flex items-center gap-1.5 whitespace-nowrap rounded-full border px-3 py-1.5 text-[12px] font-semibold transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[color:var(--ring-brand)] ${
                activeCategory === null
                  ? "border-[var(--color-brand-100)] bg-[var(--color-brand-50)] text-[var(--color-brand-700)]"
                  : "border-[var(--color-border)] bg-[var(--color-surface-muted)] text-[var(--color-text-muted)] hover:border-[var(--color-border-strong)] hover:text-[var(--color-text)]"
              }`}
              onClick={() => setActiveCategory(null)}
            >
              <span>Todos</span>
              <span className="rounded-full bg-black/[0.06] px-1.5 py-px text-[11px] font-bold">
                {totalActive}
              </span>
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
                  className="inline-flex items-center gap-1.5 whitespace-nowrap rounded-full border border-[var(--color-border)] bg-[var(--color-surface-muted)] px-3 py-1.5 text-[12px] font-semibold text-[var(--color-text-muted)] transition hover:border-[var(--color-border-strong)] hover:text-[var(--color-text)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[color:var(--ring-brand)] aria-selected:font-bold"
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
                    className="inline-block h-2 w-2 rounded-full"
                    style={{ background: accent.fg }}
                  />
                  <span>{name}</span>
                  <span className="rounded-full bg-black/[0.06] px-1.5 py-px text-[11px] font-bold">
                    {count}
                  </span>
                </button>
              );
            })}
          </div>
        )}
      </div>
      )}

      {!browseOnly && selectedSearchResult && (
        <div className={SECTION}>
          <SearchResultCard
            result={selectedSearchResult}
            onClose={() => setSelectedSearchResult(null)}
          />
        </div>
      )}

      {selectedBuilding && (
        <div className={SECTION}>
          <BuildingInfoCard
            building={selectedBuilding}
            onClose={handleClearSelection}
          />
        </div>
      )}

      {isPublicDesktop &&
        !showList &&
        !loading &&
        recommendedBuildings.length > 0 && (
          <div className={SECTION}>
            <div className="flex flex-col gap-1.5">
              <div className="flex items-center justify-between px-0.5">
                <span className="text-[11px] font-bold uppercase tracking-wider text-[var(--color-text-muted)]">
                  Lugares destacados
                </span>
              </div>

              {recommendedBuildings.map((building) => {
                const accent = getCategoryAccent(building.category_name);
                const accentColor = building.category_color || accent.fg;
                return (
                  <button
                    key={building.id}
                    type="button"
                    className="group flex min-h-11 w-full items-center gap-2.5 rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] p-3 text-left transition hover:translate-x-0.5 hover:border-[var(--color-brand-200)] hover:bg-[var(--color-brand-50)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[color:var(--ring-brand)]"
                    onClick={() => handleSelectBuilding(building)}
                  >
                    <div
                      className="grid h-8 w-8 flex-shrink-0 place-items-center rounded-lg"
                      style={{ background: accent.bg }}
                      aria-hidden="true"
                    >
                      <Icon
                        name="building"
                        size={16}
                        style={{ color: accentColor }}
                      />
                    </div>
                    <div className="min-w-0 flex-1">
                      <span className="block truncate text-[13px] font-semibold leading-tight text-[var(--color-text)]">
                        {normalizeDisplayText(building.name)}
                      </span>
                      <span className="mt-0.5 block truncate text-[11px] font-medium text-[var(--color-text-muted)]">
                        {normalizeDisplayText(building.category_name)}
                      </span>
                    </div>
                    <div
                      className="grid h-7 w-7 flex-shrink-0 place-items-center rounded-full border border-[var(--color-brand-100)] bg-[var(--color-brand-50)] text-[var(--color-brand-700)] transition group-hover:border-[var(--color-brand-700)] group-hover:bg-[var(--color-brand-600)] group-hover:text-white"
                      aria-hidden="true"
                    >
                      <Icon name="chevron-right" size={14} />
                    </div>
                  </button>
                );
              })}

              <button
                type="button"
                className="mt-1 flex min-h-11 w-full items-center justify-center gap-1.5 rounded-xl border-[1.5px] border-dashed border-[var(--color-border-strong)] bg-transparent px-3.5 text-[13px] font-semibold text-[var(--color-text-muted)] transition hover:border-[var(--color-brand-200)] hover:bg-[var(--color-brand-50)] hover:text-[var(--color-brand-700)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[color:var(--ring-brand)]"
                onClick={() => setShowAllBuildings(true)}
              >
                <Icon name="list" size={14} />
                <span>Ver todos los edificios ({totalActive})</span>
              </button>
            </div>
          </div>
        )}

      {showList && (
        <div className="flex min-h-0 flex-1 flex-col gap-2.5 overflow-hidden">
          <div className="flex items-center justify-between px-0.5">
            <h2 className="m-0 text-[13px] font-bold uppercase tracking-wider text-[var(--color-text)]">
              {hasSearchTerm
                ? "Resultados"
                : activeCategory
                  ? activeCategory
                  : "Edificios"}
            </h2>
            <span className="min-w-7 rounded-full border border-[var(--color-border)] bg-[var(--color-surface-muted)] px-2.5 py-0.5 text-center text-[11px] font-bold text-[var(--color-text-muted)]">
              {loading ? "…" : `${filteredBuildings.length}`}
            </span>
          </div>

          {hasSearchTerm && (
            <div className="px-0.5 text-[12px] text-[var(--color-text-muted)]">
              Buscando:{" "}
              <strong className="font-bold text-[var(--color-text)]">
                {searchTerm}
              </strong>
            </div>
          )}

          <div
            className="flex flex-col gap-3 overflow-y-auto overflow-x-hidden scroll-smooth pb-3 pl-0.5 pr-2 pt-0.5"
            style={isMobile ? { maxHeight: "none" } : undefined}
          >
            {loading ? (
              <div className="flex flex-col items-center justify-center gap-2 px-4 py-8 text-center text-[var(--color-text-muted)]">
                <div
                  className="h-[22px] w-[22px] animate-spin rounded-full border-2 border-[var(--color-border)] border-t-[var(--color-brand-600)]"
                  aria-hidden="true"
                />
                <p className="m-0 text-[14px] font-semibold text-[var(--color-text)]">
                  Cargando edificios…
                </p>
              </div>
            ) : loadError ? (
              <div
                className="flex flex-col items-center justify-center gap-2 px-4 py-8 text-center text-[var(--color-text-muted)]"
                role="alert"
              >
                <Icon name="alert" size={28} />
                <p className="m-0 text-[14px] font-semibold text-[var(--color-text)]">
                  Sin conexión al servidor
                </p>
                <span className="text-[12px]">{loadError}</span>
              </div>
            ) : filteredBuildings.length === 0 ? (
              <div className="flex flex-col items-center justify-center gap-2 px-4 py-8 text-center text-[var(--color-text-muted)]">
                <Icon name="search" size={28} />
                <p className="m-0 text-[14px] font-semibold text-[var(--color-text)]">
                  No se encontraron edificios.
                </p>
                <span className="text-[12px]">
                  Intenta con otro término o categoría.
                </span>
              </div>
            ) : (
              filteredBuildings.map((building) => {
                const isSelected = selectedBuilding?.id === building.id;
                const accent = getCategoryAccent(building.category_name);
                return (
                  <button
                    key={building.id}
                    type="button"
                    className={`group grid w-full grid-cols-[5px_minmax(0,1fr)_24px] items-center gap-x-3 rounded-2xl border bg-[var(--color-surface)] p-3.5 text-left shadow-[var(--shadow-xs)] transition hover:-translate-y-px hover:bg-[var(--color-surface-muted)] hover:shadow-[var(--shadow-sm)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[color:var(--ring-brand)] ${
                      isSelected
                        ? "border-transparent"
                        : "border-[var(--color-border)] hover:border-[var(--color-border-strong)]"
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
                      className="h-full min-h-12 w-[5px] rounded-full opacity-90"
                      aria-hidden="true"
                      style={{ background: accent.fg }}
                    />
                    <div className="flex min-w-0 flex-col gap-2">
                      <div className="flex min-w-0 flex-wrap items-center gap-2">
                        <span className="inline-flex items-center rounded-md border border-[var(--color-border)] bg-[var(--color-surface-muted)] px-2 py-[3px] text-[11px] font-extrabold uppercase leading-none tracking-wide text-[var(--color-text-muted)]">
                          {building.code}
                        </span>
                        <CategoryBadge name={normalizeDisplayText(building.category_name)} size="sm" />
                      </div>
                      <div className="text-[15px] font-bold leading-snug tracking-tight text-[var(--color-text)] [overflow-wrap:anywhere]">
                        {normalizeDisplayText(building.name)}
                      </div>
                    </div>
                    <span
                      className="grid h-6 w-6 flex-shrink-0 place-items-center rounded-full text-[var(--color-text-subtle)] transition group-hover:translate-x-0.5 group-hover:text-[var(--color-text)]"
                      aria-hidden="true"
                    >
                      <Icon name="chevron-right" size={16} />
                    </span>
                  </button>
                );
              })
            )}
          </div>
        </div>
      )}

      <AppFooter variant="light" />
    </aside>
  );
}
