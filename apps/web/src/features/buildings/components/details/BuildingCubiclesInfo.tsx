import type { TeacherCubicle } from "@ito-map/shared";
import { normalizeDisplayText } from "../../../../utils/text";
import { InfoSection } from "./InfoSection";
import { getSectionToneClasses } from "./section-tone";
import { HIGHLIGHT_FLASH_CLASS, useHighlightFlash } from "./useHighlightFlash";

const { item: ITEM_TONE } = getSectionToneClasses("cyan");

type BuildingCubiclesInfoProps = {
  cubicles: TeacherCubicle[];
  highlightId?: string;
};

export function BuildingCubiclesInfo({ cubicles, highlightId }: BuildingCubiclesInfoProps) {
  const flashId = useHighlightFlash(highlightId);
  if (cubicles.length === 0) return null;

  return (
    <InfoSection title="Cubículos de maestros" icon="user" tone="cyan" count={cubicles.length}>
      <ul className="m-0 flex flex-col gap-2 p-0">
        {cubicles.map((cubicle) => (
          <li
            key={cubicle.id}
            id={`search-target-${cubicle.id}`}
            className={`list-none rounded-xl border p-2.5 transition-colors duration-500 ${ITEM_TONE} ${flashId === cubicle.id ? HIGHLIGHT_FLASH_CLASS : ""}`}
          >
            <div className="flex items-center justify-between gap-2">
              <span className="text-[13px] font-bold text-[var(--color-text)]">
                {cubicle.professor_name
                  ? normalizeDisplayText(cubicle.professor_name)
                  : "Sin asignar"}
              </span>
              <span className="inline-flex items-center rounded-md border border-[var(--color-border)] bg-[var(--color-surface)] px-1.5 py-px text-[11px] font-extrabold uppercase text-[var(--color-text-muted)]">
                {cubicle.code}
              </span>
            </div>
            <div className="mt-1 flex flex-col gap-0.5 text-[12px] text-[var(--color-text-muted)]">
              {cubicle.department_name && <span>Departamento: {cubicle.department_name}</span>}
              {cubicle.schedule_text && <span>Horario: {cubicle.schedule_text}</span>}
            </div>
            {cubicle.notes && (
              <p className="m-0 mt-1 text-[12.5px] leading-relaxed text-[var(--color-text)]">
                {normalizeDisplayText(cubicle.notes)}
              </p>
            )}
          </li>
        ))}
      </ul>
    </InfoSection>
  );
}
