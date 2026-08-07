import type { Headquarters } from "@ito-map/shared";
import { normalizeDisplayText } from "../../../../utils/text";
import { InfoSection } from "./InfoSection";
import { getSectionToneClasses } from "./section-tone";
import { HIGHLIGHT_FLASH_CLASS, useHighlightFlash } from "./useHighlightFlash";

const { item: ITEM_TONE } = getSectionToneClasses("slate");

type BuildingHeadquartersInfoProps = {
  headquarters: Headquarters[];
  highlightId?: string;
};

export function BuildingHeadquartersInfo({ headquarters, highlightId }: BuildingHeadquartersInfoProps) {
  const flashId = useHighlightFlash(highlightId);
  if (headquarters.length === 0) return null;

  return (
    <InfoSection title="Jefaturas" icon="shield" tone="slate" count={headquarters.length}>
      <ul className="m-0 flex flex-col gap-2 p-0">
        {headquarters.map((hq) => (
          <li
            key={hq.id}
            id={`search-target-${hq.id}`}
            className={`list-none rounded-xl border p-2.5 transition-colors duration-500 ${ITEM_TONE} ${flashId === hq.id ? HIGHLIGHT_FLASH_CLASS : ""}`}
          >
            <span className="text-[13px] font-bold text-[var(--color-text)]">
              {normalizeDisplayText(hq.name)}
            </span>
            <div className="mt-1 flex flex-col gap-0.5 text-[12px] text-[var(--color-text-muted)]">
              {hq.head_name && <span>Responsable: {hq.head_name}</span>}
              {hq.department_name && <span>Departamento: {hq.department_name}</span>}
              {hq.schedule_text && <span>Horario: {hq.schedule_text}</span>}
              {hq.contact && <span>Contacto: {hq.contact}</span>}
            </div>
          </li>
        ))}
      </ul>
    </InfoSection>
  );
}
