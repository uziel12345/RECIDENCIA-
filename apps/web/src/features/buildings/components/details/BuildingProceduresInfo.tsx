import type { ProcedureForBuilding } from "@ito-map/shared";
import { Icon } from "../../../../components/ui/Icons";
import { normalizeDisplayText } from "../../../../utils/text";
import { InfoSection } from "./InfoSection";
import { HIGHLIGHT_FLASH_CLASS, useHighlightFlash } from "./useHighlightFlash";
import { safeHttpUrl } from "../../../../utils/safe-url";

type BuildingProceduresInfoProps = {
  procedures: ProcedureForBuilding[];
  highlightId?: string;
};

export function BuildingProceduresInfo({ procedures, highlightId }: BuildingProceduresInfoProps) {
  const flashId = useHighlightFlash(highlightId);
  if (procedures.length === 0) return null;

  return (
    <InfoSection title="Trámites y servicios" icon="list">
      <ul className="m-0 flex flex-col gap-2 p-0">
        {procedures.map((procedure) => {
          const requisitos = procedure.requirements.filter((r) => r.type === "requisito");
          const documentos = procedure.requirements.filter((r) => r.type === "documento");
          const resourceUrl = safeHttpUrl(procedure.resource_url);

          return (
            <li
              key={procedure.id}
              id={`search-target-${procedure.id}`}
              className={`list-none rounded-lg border border-[var(--color-border)] bg-[var(--color-surface-muted)] p-2.5 transition-colors duration-500 ${flashId === procedure.id ? HIGHLIGHT_FLASH_CLASS : ""}`}
            >
              <div className="flex items-center justify-between gap-2">
                <span className="text-[13px] font-bold text-[var(--color-text)]">
                  {normalizeDisplayText(procedure.name)}
                </span>
                <span className="inline-flex items-center rounded-md border border-[var(--color-border)] bg-[var(--color-surface)] px-1.5 py-px text-[11px] font-bold uppercase text-[var(--color-text-muted)]">
                  {procedure.kind === "tramite" ? "Trámite" : "Servicio"}
                </span>
              </div>

              {procedure.description && (
                <p className="m-0 mt-1 text-[12.5px] leading-relaxed text-[var(--color-text)]">
                  {normalizeDisplayText(procedure.description)}
                </p>
              )}

              {(procedure.department_name || procedure.schedule_text || procedure.internal_location) && (
                <div className="mt-1 flex flex-col gap-0.5 text-[12px] text-[var(--color-text-muted)]">
                  {procedure.department_name && (
                    <span>Departamento responsable: {procedure.department_name}</span>
                  )}
                  {procedure.schedule_text && <span>Horario: {procedure.schedule_text}</span>}
                  {procedure.internal_location && (
                    <span>Ubicación: {procedure.internal_location}</span>
                  )}
                </div>
              )}

              {requisitos.length > 0 && (
                <div className="mt-1.5">
                  <span className="text-[11px] font-bold uppercase tracking-wide text-[var(--color-text-muted)]">
                    Requisitos
                  </span>
                  <ul className="m-0 mt-0.5 flex list-disc flex-col gap-0.5 pl-4 text-[12.5px] text-[var(--color-text)]">
                    {requisitos.map((r) => (
                      <li key={r.id}>{normalizeDisplayText(r.description)}</li>
                    ))}
                  </ul>
                </div>
              )}

              {documentos.length > 0 && (
                <div className="mt-1.5">
                  <span className="text-[11px] font-bold uppercase tracking-wide text-[var(--color-text-muted)]">
                    Documentos necesarios
                  </span>
                  <ul className="m-0 mt-0.5 flex list-disc flex-col gap-0.5 pl-4 text-[12.5px] text-[var(--color-text)]">
                    {documentos.map((r) => (
                      <li key={r.id}>{normalizeDisplayText(r.description)}</li>
                    ))}
                  </ul>
                </div>
              )}

              {procedure.notes && (
                <p className="m-0 mt-1.5 text-[12px] text-[var(--color-text-muted)]">
                  Nota: {normalizeDisplayText(procedure.notes)}
                </p>
              )}

              {resourceUrl && (
                <a
                  href={resourceUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="mt-1.5 inline-flex items-center gap-1 text-[12.5px] font-semibold text-[var(--color-brand-700)] hover:underline"
                >
                  Ver más
                  <Icon name="arrow-right" size={12} />
                </a>
              )}
            </li>
          );
        })}
      </ul>
    </InfoSection>
  );
}
