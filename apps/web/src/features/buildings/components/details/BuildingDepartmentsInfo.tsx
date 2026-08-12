import type { Department, ProcedureForBuilding } from "@ito-map/shared";
import { normalizeDisplayText } from "../../../../utils/text";
import { InfoSection } from "./InfoSection";
import { ProcedureListItem } from "./ProcedureListItem";
import { getSectionToneClasses } from "./section-tone";
import { HIGHLIGHT_FLASH_CLASS, useHighlightFlash } from "./useHighlightFlash";

const { item: ITEM_TONE } = getSectionToneClasses("violet");

type BuildingDepartmentsInfoProps = {
  departments: Department[];
  procedures: ProcedureForBuilding[];
  highlightId?: string;
  procedureHighlightId?: string;
};

export function BuildingDepartmentsInfo({
  departments,
  procedures,
  highlightId,
  procedureHighlightId,
}: BuildingDepartmentsInfoProps) {
  const flashId = useHighlightFlash(highlightId);
  const procedureFlashId = useHighlightFlash(procedureHighlightId);
  if (departments.length === 0) return null;

  return (
    <InfoSection title="Departamentos" icon="users" tone="violet" count={departments.length}>
      <ul className="m-0 flex flex-col gap-2 p-0">
        {departments.map((department) => {
          const departmentProcedures = procedures.filter(
            (procedure) => procedure.department_id === department.id,
          );

          return (
            <li
              key={department.id}
              id={`search-target-${department.id}`}
              className={`list-none rounded-xl border p-2.5 transition-colors duration-500 ${ITEM_TONE} ${flashId === department.id ? HIGHLIGHT_FLASH_CLASS : ""}`}
            >
              <span className="text-[13px] font-bold text-[var(--color-text)]">
                {normalizeDisplayText(department.name)}
              </span>
              {department.description && (
                <p className="m-0 mt-1 text-[12.5px] leading-relaxed text-[var(--color-text)]">
                  {normalizeDisplayText(department.description)}
                </p>
              )}
              <div className="mt-1 flex flex-col gap-0.5 text-[12px] text-[var(--color-text-muted)]">
                {department.head_name && <span>Responsable: {department.head_name}</span>}
                {department.schedule_text && <span>Horario: {department.schedule_text}</span>}
                {department.contact && <span>Contacto: {department.contact}</span>}
              </div>

              {departmentProcedures.length > 0 && (
                <ul className="m-0 mt-2.5 flex flex-col gap-2 border-t border-[var(--color-border)] pt-2.5 pl-0">
                  {departmentProcedures.map((procedure) => (
                    <ProcedureListItem
                      key={procedure.id}
                      procedure={procedure}
                      isFlashed={procedureFlashId === procedure.id}
                    />
                  ))}
                </ul>
              )}
            </li>
          );
        })}
      </ul>
    </InfoSection>
  );
}
