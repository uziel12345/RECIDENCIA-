import type { Classroom } from "@ito-map/shared";
import { normalizeDisplayText } from "../../../../utils/text";
import { InfoSection } from "./InfoSection";
import { HIGHLIGHT_FLASH_CLASS, useHighlightFlash } from "./useHighlightFlash";

function floorLabel(floor: number): string {
  if (floor === 0) return "Planta baja";
  if (floor < 0) return "Sótano";
  return `Piso ${floor}`;
}

type BuildingClassroomsInfoProps = {
  classrooms: Classroom[];
  highlightId?: string;
};

export function BuildingClassroomsInfo({ classrooms, highlightId }: BuildingClassroomsInfoProps) {
  const flashId = useHighlightFlash(highlightId);
  if (classrooms.length === 0) return null;

  return (
    <InfoSection title="Aulas" icon="book-open" tone="orange" count={classrooms.length}>
      <ul className="m-0 flex flex-col gap-2 p-0">
        {classrooms.map((classroom) => (
          <li
            key={classroom.id}
            id={`search-target-${classroom.id}`}
            className={`list-none rounded-xl border p-2.5 transition-colors duration-500 border-[var(--tone-orange-border)] bg-[var(--tone-orange-bg)] ${flashId === classroom.id ? HIGHLIGHT_FLASH_CLASS : ""}`}
          >
            <div className="flex items-center justify-between gap-2">
              <span className="text-[13px] font-bold text-[var(--color-text)]">
                {normalizeDisplayText(classroom.name)}
              </span>
              <span className="inline-flex items-center rounded-md border border-[var(--color-border)] bg-[var(--color-surface)] px-1.5 py-px text-[11px] font-extrabold uppercase text-[var(--color-text-muted)]">
                {classroom.code}
              </span>
            </div>
            <div className="mt-1 flex flex-wrap gap-x-3 gap-y-0.5 text-[12px] text-[var(--color-text-muted)]">
              <span>{floorLabel(classroom.floor)}</span>
              {classroom.capacity != null && <span>Capacidad: {classroom.capacity}</span>}
              <span>{classroom.is_active ? "Disponible" : "No disponible"}</span>
            </div>
            {classroom.description && (
              <p className="m-0 mt-1 text-[12.5px] leading-relaxed text-[var(--color-text)]">
                {normalizeDisplayText(classroom.description)}
              </p>
            )}
          </li>
        ))}
      </ul>
    </InfoSection>
  );
}
