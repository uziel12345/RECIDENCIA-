import { Icon } from "../../../../components/ui/Icons";
import type { BuildingSchedule, BuildingScheduleStatus } from "@ito-map/shared";

const DAY_LABELS: Record<number, string> = {
  1: "Lun",
  2: "Mar",
  3: "Mié",
  4: "Jue",
  5: "Vie",
  6: "Sáb",
  7: "Dom",
};

function formatTime(time: string): string {
  return time.slice(0, 5);
}

const STATUS_COPY: Record<BuildingScheduleStatus["status"], string> = {
  abierto: "Abierto",
  cerrado: "Cerrado",
  sin_horario: "Sin horario registrado",
};

const STATUS_CLASSES: Record<BuildingScheduleStatus["status"], string> = {
  abierto:
    "border-[var(--color-success-border)] bg-[var(--color-success-bg)] text-[var(--color-success-text)]",
  cerrado: "border-[var(--color-border)] bg-[var(--color-surface-muted)] text-[var(--color-text)]",
  sin_horario:
    "border-[var(--color-border)] bg-[var(--color-surface-muted)] text-[var(--color-text-subtle)]",
};

type BuildingStatusBadgeProps = {
  status: BuildingScheduleStatus;
  week: BuildingSchedule[];
};

export function BuildingStatusBadge({ status, week }: BuildingStatusBadgeProps) {
  const groupedByDay = new Map<number, BuildingSchedule[]>();
  for (const item of week) {
    const list = groupedByDay.get(item.day_of_week) ?? [];
    list.push(item);
    groupedByDay.set(item.day_of_week, list);
  }

  return (
    <div className="flex flex-col gap-1.5">
      <span className="flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wide text-[var(--color-text-muted)]">
        <Icon name="clock" size={13} />
        Estado
      </span>

      <div
        className={`inline-flex w-fit items-center gap-1.5 rounded-full border px-2.5 py-1 text-[12.5px] font-bold ${STATUS_CLASSES[status.status]}`}
      >
        {status.status !== "sin_horario" && (
          <span
            className="h-[7px] w-[7px] rounded-full"
            style={{ background: status.status === "abierto" ? "#10b981" : "#94a3b8" }}
            aria-hidden="true"
          />
        )}
        <span>
          {STATUS_COPY[status.status]}
          {status.status === "abierto" && status.until ? ` · Cierra ${formatTime(status.until)}` : ""}
        </span>
      </div>

      {groupedByDay.size > 0 && (
        <ul className="m-0 flex flex-col gap-0.5 p-0">
          {[1, 2, 3, 4, 5, 6, 7]
            .filter((day) => groupedByDay.has(day))
            .map((day) => (
              <li
                key={day}
                className="flex list-none items-center justify-between gap-2 text-[12.5px]"
              >
                <span className="font-semibold text-[var(--color-text)]">{DAY_LABELS[day]}</span>
                <span className="text-[var(--color-text-muted)]">
                  {groupedByDay
                    .get(day)!
                    .map((s) => `${formatTime(s.open_time)}–${formatTime(s.close_time)}`)
                    .join(", ")}
                </span>
              </li>
            ))}
        </ul>
      )}
    </div>
  );
}
