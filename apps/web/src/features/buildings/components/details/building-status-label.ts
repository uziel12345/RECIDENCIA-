import type { BuildingScheduleStatus } from "@ito-map/shared";

const STATUS_COPY: Record<BuildingScheduleStatus["status"], string> = {
  abierto: "Abierto",
  cerrado: "Cerrado",
  sin_horario: "Sin horario registrado",
};

function formatTime(time: string): string {
  return time.slice(0, 5);
}

export function getBuildingStatusLabel(status: BuildingScheduleStatus): string {
  const base = STATUS_COPY[status.status];
  if (status.status === "abierto" && status.until) {
    return `${base} · Cierra ${formatTime(status.until)}`;
  }
  return base;
}
