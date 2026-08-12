import type { ProcedureForBuilding } from "@ito-map/shared";
import { InfoSection } from "./InfoSection";
import { ProcedureListItem } from "./ProcedureListItem";
import { useHighlightFlash } from "./useHighlightFlash";

type BuildingProceduresInfoProps = {
  procedures: ProcedureForBuilding[];
  highlightId?: string;
};

/**
 * Solo trámites sin departamento vinculado — los que sí tienen departamento
 * se muestran anidados dentro de su tarjeta en BuildingDepartmentsInfo.
 */
export function BuildingProceduresInfo({ procedures, highlightId }: BuildingProceduresInfoProps) {
  const flashId = useHighlightFlash(highlightId);
  const ungrouped = procedures.filter((procedure) => !procedure.department_id);
  if (ungrouped.length === 0) return null;

  return (
    <InfoSection title="Trámites y servicios" icon="list" tone="amber" count={ungrouped.length}>
      <ul className="m-0 flex flex-col gap-2.5 p-0">
        {ungrouped.map((procedure) => (
          <ProcedureListItem
            key={procedure.id}
            procedure={procedure}
            isFlashed={flashId === procedure.id}
          />
        ))}
      </ul>
    </InfoSection>
  );
}
