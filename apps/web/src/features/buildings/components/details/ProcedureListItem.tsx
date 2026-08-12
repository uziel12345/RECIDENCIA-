import type { ProcedureForBuilding } from "@ito-map/shared";
import { Icon } from "../../../../components/ui/Icons";
import { normalizeDisplayText } from "../../../../utils/text";
import { safeHttpUrl } from "../../../../utils/safe-url";
import { getSectionToneClasses } from "./section-tone";
import { HIGHLIGHT_FLASH_CLASS } from "./useHighlightFlash";

const { item: ITEM_TONE } = getSectionToneClasses("amber");

type ProcedureListItemProps = {
  procedure: ProcedureForBuilding;
  isFlashed: boolean;
};

export function ProcedureListItem({ procedure, isFlashed }: ProcedureListItemProps) {
  const requisitos = procedure.requirements.filter((r) => r.type === "requisito");
  const documentos = procedure.requirements.filter((r) => r.type === "documento");
  const resourceUrl = safeHttpUrl(procedure.resource_url);

  return (
    <li
      id={`search-target-${procedure.id}`}
      className={`list-none rounded-xl border p-2.5 transition-colors duration-500 ${ITEM_TONE} ${isFlashed ? HIGHLIGHT_FLASH_CLASS : ""}`}
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

      {(procedure.schedule_text || procedure.internal_location) && (
        <div className="mt-1 flex flex-col gap-0.5 text-[12px] text-[var(--color-text-muted)]">
          {procedure.schedule_text && <span>Horario: {procedure.schedule_text}</span>}
          {procedure.internal_location && <span>Ubicación: {procedure.internal_location}</span>}
        </div>
      )}

      {requisitos.length > 0 && (
        <div className="mt-2 rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)] p-2">
          <span className="text-[10.5px] font-bold uppercase tracking-wide text-[var(--color-text-muted)]">
            Requisitos
          </span>
          <ul className="m-0 mt-1 flex list-disc flex-col gap-1 pl-4 text-[12.5px] text-[var(--color-text)]">
            {requisitos.map((r) => (
              <li key={r.id}>{normalizeDisplayText(r.description)}</li>
            ))}
          </ul>
        </div>
      )}

      {documentos.length > 0 && (
        <div className="mt-2 rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)] p-2">
          <span className="text-[10.5px] font-bold uppercase tracking-wide text-[var(--color-text-muted)]">
            Documentos necesarios
          </span>
          <ul className="m-0 mt-1 flex list-disc flex-col gap-1 pl-4 text-[12.5px] text-[var(--color-text)]">
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
}
