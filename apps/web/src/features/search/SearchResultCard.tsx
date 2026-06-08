import { useEffect, useState } from "react";
import { Icon } from "../../components/ui/Icons";
import { getProcedureDetail } from "../../services/search.service";
import type { SearchResult, ProcedureWithDetails } from "@ito-map/shared";

type SearchResultCardProps = {
  result: SearchResult;
  onClose: () => void;
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
      .then((data) => { if (mounted) setProcedure(data); })
      .catch(() => { if (mounted) setProcedure(null); })
      .finally(() => { if (mounted) setLoadingProc(false); });
    return () => { mounted = false; };
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
    <article className="ito-src-card" aria-label={`Detalle: ${result.title}`}>
      <div className="ito-src-card__header">
        <span className={`ito-kind-badge ito-kind-badge--${result.kind}`}>
          {kindLabel}
        </span>
        <span className="ito-src-card__title">{result.title}</span>
        <button
          type="button"
          onClick={onClose}
          aria-label="Cerrar detalle"
          className="ito-src-card__close"
        >
          <Icon name="close" size={14} aria-hidden="true" />
        </button>
      </div>

      <div className="ito-src-card__body">
        <p className="ito-src-card__subtitle">{result.subtitle}</p>

        {result.buildingName && (
          <div className="ito-building-badge">
            <Icon name="building" size={12} aria-hidden="true" />
            <span>{result.buildingName}</span>
          </div>
        )}

        {isProcedure && (
          <div>
            {loadingProc ? (
              <div className="ito-proc-loading" aria-live="polite">
                <span className="ito-proc-spinner" aria-hidden="true" />
                Cargando requisitos…
              </div>
            ) : procedure && procedure.requirements.length > 0 ? (
              <div>
                <p className="ito-req-section__title">Requisitos</p>
                <ul className="ito-req-list">
                  {procedure.requirements.map((req) => (
                    <li key={req.id} className="ito-req-item">
                      <span
                        className={`ito-req-item__dot ito-req-item__dot--${
                          req.is_mandatory ? "mandatory" : "optional"
                        }`}
                        aria-hidden="true"
                      />
                      <span>
                        {req.description}
                        {!req.is_mandatory && (
                          <span className="ito-req-item__optional">(opcional)</span>
                        )}
                      </span>
                    </li>
                  ))}
                </ul>
              </div>
            ) : procedure && procedure.requirements.length === 0 ? (
              <p className="ito-proc-empty">Sin requisitos registrados.</p>
            ) : null}
          </div>
        )}

        {result.kind === "classroom" && (
          <p className="ito-src-card__subtitle">
            Selecciona "Como llegar" en el edificio para navegar hasta este espacio.
          </p>
        )}
      </div>
    </article>
  );
}
