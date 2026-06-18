import { useEffect, useState } from "react";
import { Icon } from "../../components/ui/Icons";
import { getProcedureDetail } from "../../services/search.service";
import type { SearchResult, ProcedureWithDetails } from "@ito-map/shared";

type SearchResultCardProps = {
  result: SearchResult;
  onClose: () => void;
};

const KIND_BADGE: Record<SearchResult["kind"], string> = {
  building: "bg-[#ea580c1a] text-[#ea580c]",
  classroom: "bg-[#7c3aed1a] text-[#7c3aed]",
  procedure: "bg-[#0891b21a] text-[#0891b2]",
  service: "bg-[#16a34a1a] text-[#16a34a]",
};

export function SearchResultCard({ result, onClose }: SearchResultCardProps) {
  const [procedure, setProcedure] = useState<ProcedureWithDetails | null>(null);
  const [loadingProc, setLoadingProc] = useState(false);

  const isProcedure = result.kind === "procedure" || result.kind === "service";

  useEffect(() => {
    if (!isProcedure) return;
    let mounted = true;
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setLoadingProc(true);
    getProcedureDetail(result.id)
      .then((data) => {
        if (mounted) setProcedure(data);
      })
      .catch(() => {
        if (mounted) setProcedure(null);
      })
      .finally(() => {
        if (mounted) setLoadingProc(false);
      });
    return () => {
      mounted = false;
    };
  }, [result.id, isProcedure]);

  const kindLabel =
    result.kind === "building"
      ? "Edificio"
      : result.kind === "classroom"
        ? "Aula"
        : result.kind === "procedure"
          ? "Trámite"
          : "Servicio";

  return (
    <article
      className="overflow-hidden rounded-2xl border border-[var(--color-border)] bg-white shadow-[var(--shadow-maps)]"
      aria-label={`Detalle: ${result.title}`}
    >
      <div className="flex items-center gap-2.5 border-b border-[var(--color-bg)] px-3.5 pb-2.5 pt-3">
        <span
          className={`flex-shrink-0 rounded-full px-2 py-[3px] text-[10px] font-black uppercase tracking-wider ${KIND_BADGE[result.kind]}`}
        >
          {kindLabel}
        </span>
        <span className="flex-1 truncate text-[14px] font-extrabold text-[var(--color-text)]">
          {result.title}
        </span>
        <button
          type="button"
          onClick={onClose}
          aria-label="Cerrar detalle"
          className="grid h-9 w-9 flex-shrink-0 place-items-center rounded-lg text-[var(--color-text-subtle)] transition hover:bg-[var(--color-surface-muted)] hover:text-[var(--color-text-muted)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[color:var(--ring-brand)] focus-visible:ring-offset-2"
        >
          <Icon name="close" size={14} aria-hidden="true" />
        </button>
      </div>

      <div className="px-3.5 pb-3.5 pt-2.5">
        <p className="mb-2 text-[12px] leading-relaxed text-[var(--color-text-muted)]">
          {result.subtitle}
        </p>

        {result.buildingName && (
          <div className="mb-2.5 flex w-fit items-center gap-1.5 rounded-lg bg-[var(--color-brand-50)] px-2.5 py-1.5 text-[12px] font-semibold text-[var(--color-brand-700)]">
            <Icon name="building" size={12} aria-hidden="true" />
            <span>{result.buildingName}</span>
          </div>
        )}

        {isProcedure && (
          <div>
            {loadingProc ? (
              <div
                className="flex items-center gap-1.5 text-[12px] text-[var(--color-text-subtle)]"
                aria-live="polite"
              >
                <span
                  className="inline-block h-3 w-3 flex-shrink-0 animate-spin rounded-full border-2 border-[var(--color-border)] border-t-[var(--color-brand-600)]"
                  aria-hidden="true"
                />
                Cargando requisitos…
              </div>
            ) : procedure && procedure.requirements.length > 0 ? (
              <div>
                <p className="mb-1.5 text-[11px] font-black uppercase tracking-wider text-[var(--color-text-muted)]">
                  Requisitos
                </p>
                <ul className="m-0 grid list-none gap-1 p-0">
                  {procedure.requirements.map((req) => (
                    <li
                      key={req.id}
                      className="flex items-start gap-1.5 text-[12px] leading-snug text-[var(--color-text)]"
                    >
                      <span
                        className={`mt-[5px] h-1.5 w-1.5 flex-shrink-0 rounded-full ${
                          req.is_mandatory
                            ? "bg-[#0891b2]"
                            : "bg-[var(--color-text-subtle)]"
                        }`}
                        aria-hidden="true"
                      />
                      <span>
                        {req.description}
                        {!req.is_mandatory && (
                          <span className="ml-1 text-[var(--color-text-subtle)]">
                            (opcional)
                          </span>
                        )}
                      </span>
                    </li>
                  ))}
                </ul>
              </div>
            ) : procedure && procedure.requirements.length === 0 ? (
              <p className="m-0 text-[12px] italic text-[var(--color-text-subtle)]">
                Sin requisitos registrados.
              </p>
            ) : null}
          </div>
        )}

        {result.kind === "classroom" && (
          <p className="m-0 text-[12px] leading-relaxed text-[var(--color-text-muted)]">
            Selecciona "Como llegar" en el edificio para navegar hasta este
            espacio.
          </p>
        )}
      </div>
    </article>
  );
}
