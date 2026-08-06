import { useState, useEffect, useRef, useMemo } from "react";
import { useBuildingStore } from "../../../store/building-store";
import { Icon } from "../../../components/ui/Icons";
import { searchAll } from "../../../services/search.service";
import type { Building } from "../types/building";
import type { Gate, SearchResult, SearchResultKind } from "@ito-map/shared";

const DEBOUNCE_MS = 250;
const MIN_QUERY_LEN = 2;

const KIND_LABEL: Record<SearchResultKind, string> = {
  building:     "Edificios",
  classroom:    "Aulas",
  procedure:    "Trámites",
  service:      "Servicios",
  department:   "Departamentos",
  cubicle:      "Cubículos",
  headquarters: "Jefaturas",
  gate:         "Accesos",
  position:     "Cargos institucionales",
  street:       "Calles",
  person:       "Personas",
  office:       "Oficinas",
};

const KIND_ICON: Record<
  SearchResultKind,
  "building" | "list" | "book-open" | "info" | "users" | "user" | "shield" | "map-pin" | "map"
> = {
  building:     "building",
  classroom:    "list",
  procedure:    "book-open",
  service:      "info",
  department:   "users",
  cubicle:      "user",
  headquarters: "shield",
  gate:         "map-pin",
  position:     "user",
  street:       "map",
  person:       "user",
  office:       "building",
};

type GroupedResults = { kind: SearchResultKind; label: string; items: SearchResult[] }[];

function groupResults(results: SearchResult[]): GroupedResults {
  const groups: GroupedResults = [];
  for (const result of results) {
    const current = groups.at(-1);
    if (current?.kind === result.kind) {
      current.items.push(result);
    } else {
      groups.push({
        kind: result.kind,
        label: KIND_LABEL[result.kind],
        items: [result],
      });
    }
  }
  return groups;
}

type BuildingSearchProps = {
  buildings?: Building[];
  gates?: Gate[];
  onSelectResult?: (result: SearchResult) => void;
  autoFocus?: boolean;
  inputId?: string;
  placeholder?: string;
  ariaLabel?: string;
  enableSlashShortcut?: boolean;
};

const KIND_TYPE_LABEL: Record<SearchResultKind, string> = {
  building: "Edificio",
  classroom: "Aula",
  procedure: "Trámite",
  service: "Servicio",
  department: "Departamento",
  cubicle: "Cubículo",
  headquarters: "Jefatura",
  gate: "Acceso",
  position: "Cargo institucional",
  street: "Calle",
  person: "Persona",
  office: "Oficina",
};

export function BuildingSearch({
  buildings = [],
  gates = [],
  onSelectResult,
  autoFocus = false,
  inputId = "building-search",
  placeholder = "¿Qué estás buscando?",
  ariaLabel = "Buscar edificio, aula, departamento, cargo, servicio o trámite",
  enableSlashShortcut = false,
}: BuildingSearchProps) {
  const searchTerm = useBuildingStore((state) => state.searchTerm);
  const setSearchTerm = useBuildingStore((state) => state.setSearchTerm);
  const selectSearchResult = useBuildingStore((state) => state.selectSearchResult);

  const [inputValue, setInputValue] = useState(searchTerm);
  const [results, setResults] = useState<SearchResult[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [activeIndex, setActiveIndex] = useState(-1);
  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const requestIdRef = useRef(0);

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

  useEffect(() => {
    if (!enableSlashShortcut) return;

    function focusSearch(event: KeyboardEvent) {
      if (event.key !== "/" || event.metaKey || event.ctrlKey || event.altKey) {
        return;
      }

      const target = event.target;
      if (
        target instanceof HTMLInputElement ||
        target instanceof HTMLTextAreaElement ||
        target instanceof HTMLSelectElement ||
        (target instanceof HTMLElement && target.isContentEditable)
      ) {
        return;
      }

      event.preventDefault();
      inputRef.current?.focus();
    }

    window.addEventListener("keydown", focusSearch);
    return () => window.removeEventListener("keydown", focusSearch);
  }, [enableSlashShortcut]);

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
      setSuggestions([]);
      setError(null);
      setActiveIndex(-1);
      setIsOpen(false);
      return;
    }

    const controller = new AbortController();
    const timer = setTimeout(async () => {
      const requestId = ++requestIdRef.current;
      setIsLoading(true);
      setError(null);
      try {
        const data = await searchAll(term, controller.signal);
        // Una búsqueda más nueva ya se disparó mientras esta esperaba
        // respuesta del servidor: descartarla evita que una respuesta
        // lenta y desactualizada sobreescriba los resultados correctos
        // de la búsqueda más reciente (el buscador se sentía "trabado").
        if (requestIdRef.current !== requestId) return;
        setResults(data.results);
        setSuggestions(data.suggestions);
        setActiveIndex(-1);
        // Mantiene abierto el panel también cuando no hay coincidencias para
        // que el usuario reciba una respuesta clara en vez de una ventana vacía.
        setIsOpen(true);
      } catch (caught) {
        if (caught instanceof DOMException && caught.name === "AbortError") return;
        if (requestIdRef.current !== requestId) return;
        setResults([]);
        setSuggestions([]);
        setError("No pudimos consultar el campus. Revisa tu conexión e inténtalo de nuevo.");
        setIsOpen(true);
      } finally {
        if (requestIdRef.current === requestId) setIsLoading(false);
      }
    }, DEBOUNCE_MS);

    return () => {
      clearTimeout(timer);
      controller.abort();
    };
  }, [inputValue]);

  function handleInputChange(value: string) {
    setInputValue(value);
    setSearchTerm(value.trim());
  }

  function handleClear() {
    setInputValue("");
    setSearchTerm("");
    setResults([]);
    setSuggestions([]);
    setError(null);
    setActiveIndex(-1);
    setIsOpen(false);
  }

  function handleSelect(result: SearchResult) {
    setIsOpen(false);
    // Decide edificio vs. puerta, ruta y sección a resaltar en un solo lugar
    // (el store), para no repetir esta lógica aquí / en BuildingSidebar / en
    // MapSearchOverlay.
    selectSearchResult(result, buildings, gates);
    onSelectResult?.(result);
  }

  const groups = useMemo(() => groupResults(results), [results]);
  const orderedResults = useMemo(
    () => groups.flatMap((group) => group.items),
    [groups]
  );
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
        ref={inputRef}
        id={inputId}
        type="search"
        className="ito-search__input"
        placeholder={placeholder}
        value={inputValue}
        onChange={(e) => handleInputChange(e.target.value)}
        onFocus={() => {
          if (isSearchActive) setIsOpen(true);
        }}
        onKeyDown={(event) => {
          if (event.key === "Escape") {
            setIsOpen(false);
            setActiveIndex(-1);
            return;
          }
          if (orderedResults.length === 0) return;
          if (event.key === "ArrowDown") {
            event.preventDefault();
            setIsOpen(true);
            setActiveIndex((current) => (current + 1) % orderedResults.length);
          } else if (event.key === "ArrowUp") {
            event.preventDefault();
            setIsOpen(true);
            setActiveIndex((current) =>
              current <= 0 ? orderedResults.length - 1 : current - 1
            );
          } else if (event.key === "Enter" && activeIndex >= 0) {
            event.preventDefault();
            const result = orderedResults[activeIndex];
            if (result) handleSelect(result);
          }
        }}
        aria-label={ariaLabel}
        aria-expanded={isOpen}
        aria-autocomplete="list"
        autoComplete="off"
        role="combobox"
        aria-controls="search-listbox"
        aria-activedescendant={
          activeIndex >= 0 ? `search-result-${activeIndex}` : undefined
        }
        autoFocus={autoFocus}
      />

      <span className="sr-only" role="status" aria-live="polite" aria-atomic="true">
        {isLoading
          ? "Buscando en el campus"
          : isOpen && !error
            ? `${results.length} ${results.length === 1 ? "resultado" : "resultados"}`
            : ""}
      </span>

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

      {isOpen && (groups.length > 0 || error || (isSearchActive && !isLoading)) && (
        <div
          id="search-listbox"
          role="listbox"
          aria-label="Resultados de búsqueda"
          className="ito-search-dropdown"
        >
          {groups.map((group, groupIndex) => (
            <div key={`${group.kind}-${groupIndex}`} className="ito-search-group">
              <div
                className={`ito-search-group__header ito-search-group__header--${group.kind}`}
                aria-hidden="true"
              >
                <Icon name={KIND_ICON[group.kind]} size={11} aria-hidden="true" />
                {group.label}
              </div>

              {group.items.map((result) => {
                const resultIndex = orderedResults.findIndex(
                  (item) => item.kind === result.kind && item.id === result.id
                );
                return (
                <button
                  key={result.id}
                  id={`search-result-${resultIndex}`}
                  type="button"
                  role="option"
                  aria-selected={activeIndex === resultIndex}
                  onClick={() => handleSelect(result)}
                  onMouseEnter={() => setActiveIndex(resultIndex)}
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
                    <span className="ito-search-option__type">
                      Tipo: {KIND_TYPE_LABEL[result.kind]}
                    </span>
                  </span>

                  <Icon
                    name="chevron-right"
                    size={13}
                    className="ito-search-option__arrow"
                    aria-hidden="true"
                  />
                </button>
                );
              })}
            </div>
          ))}

          {error && (
            <div className="ito-search-empty" role="alert">{error}</div>
          )}

          {isSearchActive && results.length === 0 && !isLoading && !error && (
            <div className="ito-search-empty">
              <strong>No encontramos exactamente lo que buscas.</strong>
              <span>
                Prueba con un edificio, aula, departamento, cargo, servicio o trámite.
              </span>
              {suggestions.length > 0 && (
                <div className="ito-search-suggestions" aria-label="Sugerencias relacionadas">
                  <span>¿Buscabas alguno de estos?</span>
                  {suggestions.map((suggestion) => (
                    <button
                      key={suggestion}
                      type="button"
                      onClick={() => handleInputChange(suggestion)}
                    >
                      {suggestion}
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
