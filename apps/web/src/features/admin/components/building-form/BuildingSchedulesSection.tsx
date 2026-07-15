import { useCallback, useEffect, useState } from "react";
import type { BuildingSchedule } from "@ito-map/shared";
import {
  createBuildingScheduleApi,
  deleteBuildingScheduleApi,
  getBuildingSchedulesApi,
  updateBuildingScheduleApi,
} from "@ito-map/shared";

// ─── Day of week helpers ────────────────────────────────────────────────────

const DAY_OPTIONS = [
  { value: 1, label: "Lunes" },
  { value: 2, label: "Martes" },
  { value: 3, label: "Miércoles" },
  { value: 4, label: "Jueves" },
  { value: 5, label: "Viernes" },
  { value: 6, label: "Sábado" },
  { value: 7, label: "Domingo" },
];

function dayLabel(day: number): string {
  return DAY_OPTIONS.find((d) => d.value === day)?.label ?? `Día ${day}`;
}

// ─── Draft type ─────────────────────────────────────────────────────────────

type ScheduleDraft = {
  day_of_week: number;
  open_time: string;
  close_time: string;
};

const EMPTY_DRAFT: ScheduleDraft = { day_of_week: 1, open_time: "08:00", close_time: "15:00" };

function ScheduleFields({
  draft,
  onChange,
  disabled,
}: {
  draft: ScheduleDraft;
  onChange: (next: ScheduleDraft) => void;
  disabled: boolean;
}) {
  const fieldCls = "min-h-11 rounded-lg border border-[#334155] bg-[#0f172a] px-3 text-[13px] text-[#e2e8f0] placeholder:text-[#475569] outline-none focus:border-[#ea580c]";

  return (
    <div className="grid grid-cols-3 gap-2.5 max-[640px]:grid-cols-1">
      <select
        value={draft.day_of_week}
        onChange={(e) => onChange({ ...draft, day_of_week: Number(e.target.value) })}
        disabled={disabled}
        className={fieldCls}
      >
        {DAY_OPTIONS.map((d) => (
          <option key={d.value} value={d.value}>{d.label}</option>
        ))}
      </select>
      <input
        type="time"
        value={draft.open_time.slice(0, 5)}
        onChange={(e) => onChange({ ...draft, open_time: e.target.value })}
        disabled={disabled}
        className={fieldCls}
      />
      <input
        type="time"
        value={draft.close_time.slice(0, 5)}
        onChange={(e) => onChange({ ...draft, close_time: e.target.value })}
        disabled={disabled}
        className={fieldCls}
      />
    </div>
  );
}

export function BuildingSchedulesSection({ buildingId }: { buildingId: string }) {
  const [schedules, setSchedules] = useState<BuildingSchedule[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [deleteError, setDeleteError] = useState<string | null>(null);
  const [draft, setDraft] = useState<ScheduleDraft>(EMPTY_DRAFT);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editDraft, setEditDraft] = useState<ScheduleDraft>(EMPTY_DRAFT);

  const load = useCallback(async () => {
    setLoading(true);
    setLoadError(null);
    try {
      setSchedules(await getBuildingSchedulesApi(buildingId));
    } catch (err) {
      setLoadError(err instanceof Error ? err.message : "Error al cargar los horarios");
    } finally {
      setLoading(false);
    }
  }, [buildingId]);

  useEffect(() => { void load(); }, [load]);

  async function handleAdd() {
    const nextOpen = draft.open_time.trim();
    const nextClose = draft.close_time.trim();
    if (!nextOpen || !nextClose) return;
    setSaving(true);
    setSaveError(null);
    try {
      await createBuildingScheduleApi({
        building_id: buildingId,
        day_of_week: draft.day_of_week,
        open_time: nextOpen,
        close_time: nextClose,
        is_active: true,
      });
      setDraft(EMPTY_DRAFT);
      await load();
    } catch (err) {
      setSaveError(err instanceof Error ? err.message : "Error al guardar el horario");
    } finally {
      setSaving(false);
    }
  }

  function startEdit(schedule: BuildingSchedule) {
    setEditingId(schedule.id);
    setEditDraft({
      day_of_week: schedule.day_of_week,
      open_time: schedule.open_time,
      close_time: schedule.close_time,
    });
    setSaveError(null);
  }

  function cancelEdit() {
    setEditingId(null);
    setEditDraft(EMPTY_DRAFT);
  }

  async function handleSaveEdit() {
    if (!editingId) return;
    const nextOpen = editDraft.open_time.trim();
    const nextClose = editDraft.close_time.trim();
    if (!nextOpen || !nextClose) return;
    setSaving(true);
    setSaveError(null);
    try {
      await updateBuildingScheduleApi(editingId, {
        day_of_week: editDraft.day_of_week,
        open_time: nextOpen,
        close_time: nextClose,
      });
      cancelEdit();
      await load();
    } catch (err) {
      setSaveError(err instanceof Error ? err.message : "Error al actualizar el horario");
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(id: string) {
    setDeletingId(id);
    setDeleteError(null);
    try {
      await deleteBuildingScheduleApi(id);
      await load();
    } catch (err) {
      setDeleteError(err instanceof Error ? err.message : "Error al eliminar el horario");
    } finally {
      setDeletingId(null);
    }
  }

  return (
    <div>
      <p className="m-0 mb-4 text-[13px] text-[#64748b]">
        Define los horarios de atención del edificio — se usan para mostrar si está abierto o cerrado en la ficha pública.
      </p>

      {loadError ? (
        <p className="m-0 mb-4 rounded-lg border border-[rgba(239,68,68,0.25)] bg-[rgba(239,68,68,0.08)] px-3 py-2 text-[12px] text-[#f87171]">
          {loadError}
        </p>
      ) : loading ? (
        <p className="m-0 mb-4 text-[12.5px] italic text-[#475569]">Cargando horarios...</p>
      ) : schedules.length === 0 ? (
        <p className="m-0 mb-4 text-[12.5px] italic text-[#475569]">Este edificio no tiene horarios registrados.</p>
      ) : (
        <ul className="m-0 mb-4 grid list-none gap-1.5 p-0">
          {schedules.map((schedule) =>
            editingId === schedule.id ? (
              <li
                key={schedule.id}
                className="flex flex-col gap-2.5 rounded-lg border border-[rgba(234,88,12,0.4)] bg-[#1e293b] px-3 py-3"
              >
                <ScheduleFields draft={editDraft} onChange={setEditDraft} disabled={saving} />
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    disabled={saving || !editDraft.open_time.trim() || !editDraft.close_time.trim()}
                    onClick={() => void handleSaveEdit()}
                    className="min-h-9 flex-1 rounded-lg border border-[rgba(234,88,12,0.4)] bg-[#ea580c] px-3 text-[12.5px] font-bold text-white hover:bg-[#c2410c] disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    {saving ? "Guardando…" : "Guardar cambios"}
                  </button>
                  <button
                    type="button"
                    disabled={saving}
                    onClick={cancelEdit}
                    className="min-h-9 flex-1 rounded-lg border border-[#334155] bg-transparent px-3 text-[12.5px] font-semibold text-[#94a3b8] hover:bg-[#0f172a]"
                  >
                    Cancelar
                  </button>
                </div>
              </li>
            ) : (
              <li
                key={schedule.id}
                className="flex items-center justify-between gap-2 rounded-lg border border-[#334155] bg-[#1e293b] px-3 py-2.5"
              >
                <div className="min-w-0">
                  <span className="block truncate text-[13px] font-semibold text-[#e2e8f0]">
                    {dayLabel(schedule.day_of_week)} {schedule.open_time.slice(0, 5)}–{schedule.close_time.slice(0, 5)}
                  </span>
                </div>
                <div className="flex flex-shrink-0 items-center gap-1.5">
                  <button
                    type="button"
                    onClick={() => startEdit(schedule)}
                    className="grid h-7 w-7 place-items-center rounded-md border border-[#334155] bg-transparent text-[13px] text-[#94a3b8] hover:bg-[#0f172a] hover:text-[#e2e8f0]"
                    aria-label={`Editar horario de ${dayLabel(schedule.day_of_week)}`}
                    title="Editar"
                  >
                    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7" />
                      <path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z" />
                    </svg>
                  </button>
                  <button
                    type="button"
                    disabled={deletingId === schedule.id}
                    onClick={() => void handleDelete(schedule.id)}
                    className="grid h-7 w-7 place-items-center rounded-md border border-[rgba(239,68,68,0.25)] bg-transparent text-[16px] font-bold leading-none text-[#ef4444] hover:bg-[rgba(239,68,68,0.12)] disabled:opacity-50"
                    aria-label={`Eliminar horario de ${dayLabel(schedule.day_of_week)}`}
                  >
                    {deletingId === schedule.id ? "..." : "×"}
                  </button>
                </div>
              </li>
            )
          )}
        </ul>
      )}

      <div className="flex flex-col gap-2.5">
        <ScheduleFields draft={draft} onChange={setDraft} disabled={saving} />
        {saveError ? (
          <p className="m-0 rounded-lg border border-[rgba(239,68,68,0.25)] bg-[rgba(239,68,68,0.08)] px-3 py-2 text-[12px] text-[#f87171]">
            {saveError}
          </p>
        ) : null}
        {deleteError ? (
          <p className="m-0 rounded-lg border border-[rgba(239,68,68,0.25)] bg-[rgba(239,68,68,0.08)] px-3 py-2 text-[12px] text-[#f87171]">
            {deleteError}
          </p>
        ) : null}
        <button
          type="button"
          disabled={saving || !draft.open_time.trim() || !draft.close_time.trim()}
          onClick={() => void handleAdd()}
          className="min-h-11 w-full rounded-lg border border-[rgba(234,88,12,0.4)] bg-[#ea580c] px-3.5 text-[13px] font-bold text-white hover:bg-[#c2410c] disabled:cursor-not-allowed disabled:opacity-50"
        >
          {saving ? "Guardando…" : "Agregar horario"}
        </button>
      </div>
    </div>
  );
}
