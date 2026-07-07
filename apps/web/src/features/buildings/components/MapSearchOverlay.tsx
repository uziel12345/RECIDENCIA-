import { useBuildingStore } from "../../../store/building-store";
import { useBuildings } from "../../../hooks/useBuildings";
import { useBuildingCategories } from "../hooks/useBuildingCategories";
import { getCategoryAccent } from "../../../components/ui/categoryAccent";
import { BuildingSearch } from "./BuildingSearch";
import type { SearchResult } from "@ito-map/shared";

type MapSearchOverlayProps = {
  userName?: string;
};

export function MapSearchOverlay({ userName }: MapSearchOverlayProps) {
  const { buildings } = useBuildings();
  const { categories, totalActive } = useBuildingCategories(buildings);
  const activeCategory = useBuildingStore((state) => state.activeCategory);
  const setActiveCategory = useBuildingStore((state) => state.setActiveCategory);
  const setSelectedSearchResult = useBuildingStore(
    (state) => state.setSelectedSearchResult
  );

  function handleSelectResult(result: SearchResult) {
    setSelectedSearchResult(result.kind === "building" ? null : result);
  }

  return (
    <div className="ito-map-search-overlay flex flex-col gap-3 rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] p-3.5 shadow-[var(--shadow-lg)]">
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

      <BuildingSearch buildings={buildings} onSelectResult={handleSelectResult} />

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
  );
}
