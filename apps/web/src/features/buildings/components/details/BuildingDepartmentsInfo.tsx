import type { Department } from "@ito-map/shared";
import { normalizeDisplayText } from "../../../../utils/text";
import { InfoSection } from "./InfoSection";
import { HIGHLIGHT_FLASH_CLASS, useHighlightFlash } from "./useHighlightFlash";

type BuildingDepartmentsInfoProps = {
  departments: Department[];
  highlightId?: string;
};

export function BuildingDepartmentsInfo({ departments, highlightId }: BuildingDepartmentsInfoProps) {
  const flashId = useHighlightFlash(highlightId);
  if (departments.length === 0) return null;

  return (
    <InfoSection title="Departamentos" icon="users" tone="violet" count={departments.length}>
      <ul className="m-0 flex flex-col gap-2 p-0">
        {departments.map((department) => (
          <li
            key={department.id}
            id={`search-target-${department.id}`}
            className={`list-none rounded-xl border p-2.5 transition-colors duration-500 border-[var(--tone-violet-border)] bg-[var(--tone-violet-bg)] ${flashId === department.id ? HIGHLIGHT_FLASH_CLASS : ""}`}
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
          </li>
        ))}
      </ul>
    </InfoSection>
  );
}
