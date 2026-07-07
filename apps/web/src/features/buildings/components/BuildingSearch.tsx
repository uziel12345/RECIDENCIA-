import { useState, useEffect, useRef, useMemo } from "react";
import { useBuildingStore } from "../../../store/building-store";
import { Icon } from "../../../components/ui/Icons";
import { searchAll } from "../../../services/search.service";
import type { Building } from "../types/building";
import type { SearchResult, SearchResultKind } from "@ito-map/shared";

const DEBOUNCE_MS = 350;
const MIN_QUERY_LEN = 2;

const KIND_LABEL: Record<SearchResultKind, string> = {
  building:  "Edificios",
  classroom: "Aulas",
  procedure: "Trámites",
  service:   "Servicios",
};

const KIND_ICON: Record<SearchResultKind, "building" | "list" | "book-open" | "info"> = {
  building:  "building",
  classroom: "list",
  procedure: "book-open",
  service:   "info",
};

type GroupedResults = { kind: SearchResultKind; label: string; items: SearchResult[] }[];

function groupResults(results: SearchResult[]): GroupedResults {
  const order: SearchResultKind[] = ["building", "classroom", "procedure", "service"];
  const map = new Map<SearchResultKind, SearchResult[]>();
  for (const r of results) {
    const arr = map.get(r.kind) ?? [];
    arr.push(r);
    map.set(r.kind, arr);
  }
  return order
    .filter((k) => map.has(k))
    .map((k) => ({ kind: k, label: KIND_LABEL[k], items: map.get(k)! }));
}

type BuildingSearchProps = {
  buildings?: Building[];
  onSelectResult?: (result: SearchResult) => void;
};

export function BuildingSearch({
  buildings = [],
  onSelectResult,
}: BuildingSearchProps) {
  const searchTerm = useBuildingStore((state) => state.searchTerm);
  const setSearchTerm = useBuildingStore((state) => state.setSearchTerm);
  const setSelectedBuilding = useBuildingStore((state) => state.setSelectedBuilding);
  const setRouteDestination = useBuildingStore((state) => state.setRouteDestination);

  const [inputValue, setInputValue] = useState(searchTerm);
  const [results, setResults] = useState<SearchResult[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (
        containerRef.current &&
        !containerRef.current.contains(e.target as Node)
      ) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Sincroniza el input SOLO cuando searchTerm cambia desde afuera de este
  // componente (ej. un chip de servicio hace setSearchTerm directo). Comparar
  // contra inputValue.trim() (no el valor crudo) evita que este efecto borre
  // el espacio final que el usuario acaba de escribir entre palabras — antes
  // "aud " se resincronizaba a "aud" en cada tecla, impidiendo escribir
  // búsquedas de varias palabras.
  useEffect(() => {
    if (searchTerm !== inputValue.trim()) {
      setInputValue(searchTerm);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchTerm]);

  useEffect(() => {
    const term = inputValue.trim();

    if (term.length < MIN_QUERY_LEN) {
      setResults([]);
      setIsOpen(false);
      return;
    }

    const timer = setTimeout(async () => {
      setIsLoading(true);
      try {
        const data = await searchAll(term);
        setResults(data);
        setIsOpen(data.length > 0);
      } catch {
        setResults([]);
        setIsOpen(false);
      } finally {
        setIsLoading(false);
      }
    }, DEBOUNCE_MS);

    return () => clearTimeout(timer);
  }, [inputValue]);

  function handleInputChange(value: string) {
    setInputValue(value);
    setSearchTerm(value.trim());
  }

  function handleClear() {
    setInputValue("");
    setSearchTerm("");
    setResults([]);
    setIsOpen(false);
  }

  function handleSelect(result: SearchResult) {
    setIsOpen(false);

    if (result.kind === "building") {
      const building = buildings.find((b) => b.id === result.id);
      if (building) setSelectedBuilding(building);
    } else if (result.buildingId) {
      const building = buildings.find((b) => b.id === result.buildingId);
      if (building) setRouteDestination(building);
    }

    onSelectResult?.(result);
  }

  const groups = useMemo(() => groupResults(results), [results]);
  const isSearchActive = inputValue.trim().length >= MIN_QUERY_LEN;

  return (
    <div className="ito-search" ref={containerRef}>
      <span className="ito-search__icon">
        {isLoading ? (
          <span className="ito-search-spinner" aria-hidden="true" />
        ) : (
          <Icon name="search" size={18} aria-hidden="true" />
        )}
      </span>

      <input
        id="building-search"
        type="search"
        className="ito-search__input"
        placeholder="Buscar aula, trámite o edificio..."
        value={inputValue}
        onChange={(e) => handleInputChange(e.target.value)}
        onFocus={() => {
          if (results.length > 0) setIsOpen(true);
        }}
        aria-label="Buscar edificio, aula, trámite o servicio"
        aria-expanded={isOpen}
        aria-autocomplete="list"
        autoComplete="off"
        role="combobox"
        aria-controls="search-listbox"
      />

      {inputValue.trim() && (
        <button
          type="button"
          className="ito-search__clear"
          onClick={handleClear}
          aria-label="Limpiar búsqueda"
        >
          <Icon name="close" size={14} aria-hidden="true" />
        </button>
      )}

      {isOpen && groups.length > 0 && (
        <div
          id="search-listbox"
          role="listbox"
          aria-label="Resultados de búsqueda"
          className="ito-search-dropdown"
        >
          {groups.map((group) => (
            <div key={group.kind} className="ito-search-group">
              <div
                className={`ito-search-group__header ito-search-group__header--${group.kind}`}
                aria-hidden="true"
              >
                <Icon name={KIND_ICON[group.kind]} size={11} aria-hidden="true" />
                {group.label}
              </div>

              {group.items.map((result) => (
                <button
                  key={result.id}
                  type="button"
                  role="option"
                  aria-selected="false"
                  onClick={() => handleSelect(result)}
                  className="ito-search-option"
                >
                  <span
                    className={`ito-search-option__icon ito-search-option__icon--${result.kind}`}
                    aria-hidden="true"
                  >
                    <Icon name={KIND_ICON[result.kind]} size={13} aria-hidden="true" />
                  </span>

                  <span className="ito-search-option__text">
                    <span className="ito-search-option__title">{result.title}</span>
                    <span className="ito-search-option__sub">
                      {result.subtitle}
                      {result.buildingName && result.kind !== "building" && (
                        <> · {result.buildingName}</>
                      )}
                    </span>
                  </span>

                  <Icon
                    name="chevron-right"
                    size={13}
                    className="ito-search-option__arrow"
                    aria-hidden="true"
                  />
                </button>
              ))}
            </div>
          ))}

          {isSearchActive && results.length === 0 && !isLoading && (
            <div className="ito-search-empty">
              Sin resultados para "{inputValue.trim()}"
            </div>
          )}
        </div>
      )}
    </div>
  );
}
