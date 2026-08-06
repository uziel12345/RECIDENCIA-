import { useEffect, useMemo, useState } from "react";
import { getQuickQueriesApi, type QuickQuery } from "@ito-map/shared";
import { Icon, type IconName } from "../../../components/ui/Icons";
import { useBuildings } from "../../../hooks/useBuildings";
import { useGates } from "../../../hooks/useGates";
import { searchAll } from "../../../services/search.service";
import { useBuildingStore } from "../../../store/building-store";
import { QUICK_QUERY_FALLBACK } from "../../search/quick-queries.config";

const ICON_BY_CATEGORY: Record<QuickQuery["category"], IconName> = {
  building: "building",
  department: "users",
  service: "info",
  procedure: "book-open",
  person: "user",
  position: "user",
  classroom: "graduation",
};

interface QuickDestinationsProps {
  compact?: boolean;
  onSelect?: () => void;
}

export function QuickDestinations({ compact = false, onSelect }: QuickDestinationsProps) {
  const { buildings } = useBuildings();
  const { gates } = useGates();
  const selectSearchResult = useBuildingStore((state) => state.selectSearchResult);
  const setSearchTerm = useBuildingStore((state) => state.setSearchTerm);
  const [queries, setQueries] = useState<QuickQuery[]>(QUICK_QUERY_FALLBACK);
  const [loadingId, setLoadingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    getQuickQueriesApi()
      .then((data) => {
        if (active && data.length > 0) setQueries(data);
      })
      .catch(() => undefined);
    return () => { active = false; };
  }, []);

  const visibleQueries = useMemo(
    () => [...queries].sort((a, b) => b.priority - a.priority),
    [queries]
  );

  async function handleQuery(query: QuickQuery) {
    setLoadingId(query.id);
    setError(null);
    setSearchTerm(query.query);
    try {
      const response = await searchAll(query.query);
      const preferredKinds: Record<QuickQuery["category"], string[]> = {
        building: ["building"],
        department: ["department", "building"],
        service: ["service", "procedure"],
        procedure: ["procedure", "service"],
        person: ["position", "cubicle"],
        position: ["position", "headquarters"],
        classroom: ["classroom"],
      };
      const result = response.results.find((item) =>
        preferredKinds[query.category].includes(item.kind)
      ) ?? response.results[0];
      if (!result) {
        setError(`Aún no encontramos información para “${query.label}”.`);
        return;
      }
      selectSearchResult(result, buildings, gates);
      onSelect?.();
    } catch {
      setError("No pudimos realizar la consulta. Inténtalo de nuevo.");
    } finally {
      setLoadingId(null);
    }
  }

  return (
    <div className={`quick-destinations ${compact ? "quick-destinations--compact" : ""}`}>
      <p className="quick-destinations__intro">Elige una pregunta frecuente:</p>
      {visibleQueries.map((query) => (
        <button
          key={query.id}
          type="button"
          className="quick-destination"
          onClick={() => void handleQuery(query)}
          disabled={loadingId !== null}
          aria-busy={loadingId === query.id}
        >
          <div className="quick-destination__icon" aria-hidden="true">
            {loadingId === query.id ? (
              <span className="ito-search-spinner" />
            ) : (
              <Icon name={ICON_BY_CATEGORY[query.category]} size={20} />
            )}
          </div>
          <div className="quick-destination__content">
            <span className="quick-destination__name">{query.label}</span>
            {!compact && (
              <span className="quick-destination__desc">Buscar en todo el campus</span>
            )}
          </div>
          <div className="quick-destination__arrow" aria-hidden="true">
            <Icon name="chevron-right" size={16} />
          </div>
        </button>
      ))}
      {error && <p className="quick-destinations__error" role="alert">{error}</p>}
    </div>
  );
}
