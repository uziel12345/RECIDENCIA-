import { useCallback, useEffect, useState } from "react";
import type { Department, Professor, TeacherCubicle } from "@ito-map/shared";
import {
  createTeacherCubicleApi,
  deleteTeacherCubicleApi,
  getDepartmentsApi,
  getProfessorsApi,
  getTeacherCubiclesApi,
  updateTeacherCubicleApi,
} from "@ito-map/shared";

// ─── Draft type ─────────────────────────────────────────────────────────────

type CubicleDraft = {
  code: string;
  professor_id: string;
  department_id: string;
  schedule_text: string;
  notes: string;
};

const EMPTY_DRAFT: CubicleDraft = {
  code: "",
  professor_id: "",
  department_id: "",
  schedule_text: "",
  notes: "",
};

function toNullable(value: string): string | null {
  const trimmed = value.trim();
  return trimmed === "" ? null : trimmed;
}

function CubicleFields({
  draft,
  onChange,
  disabled,
  professors,
  professorsAvailable,
  departments,
}: {
  draft: CubicleDraft;
  onChange: (next: CubicleDraft) => void;
  disabled: boolean;
  professors: Professor[];
  professorsAvailable: boolean;
  departments: Department[];
}) {
  const fieldCls = "min-h-11 rounded-lg border border-[#334155] bg-[#0f172a] px-3 text-[13px] text-[#e2e8f0] placeholder:text-[#475569] outline-none focus:border-[#a8442e]";

  return (
    <div className="grid grid-cols-2 gap-2.5 max-[640px]:grid-cols-1">
      <input
        value={draft.code}
        onChange={(e) => onChange({ ...draft, code: e.target.value })}
        placeholder="Clave (ej: CUB-101)"
        disabled={disabled}
        className={fieldCls}
      />
      {professorsAvailable ? (
        <select
          value={draft.professor_id}
          onChange={(e) => onChange({ ...draft, professor_id: e.target.value })}
          disabled={disabled}
          className={fieldCls}
        >
          <option value="">Sin asignar</option>
          {professors.map((professor) => (
            <option key={professor.id} value={professor.id}>{professor.full_name}</option>
          ))}
        </select>
      ) : (
        <input
          value=""
          disabled
          placeholder="No disponible"
          className={`${fieldCls} cursor-not-allowed opacity-50`}
        />
      )}
      <select
        value={draft.department_id}
        onChange={(e) => onChange({ ...draft, department_id: e.target.value })}
        disabled={disabled}
        className={fieldCls}
      >
        <option value="">Sin departamento</option>
        {departments.map((department) => (
          <option key={department.id} value={department.id}>{department.name}</option>
        ))}
      </select>
      <input
        value={draft.schedule_text}
        onChange={(e) => onChange({ ...draft, schedule_text: e.target.value })}
        placeholder="Horario (ej: Lun-Vie 9:00-15:00)"
        disabled={disabled}
        className={fieldCls}
      />
      <textarea
        value={draft.notes}
        onChange={(e) => onChange({ ...draft, notes: e.target.value })}
        placeholder="Notas (opcional)"
        disabled={disabled}
        className={`${fieldCls} col-span-2 min-h-[72px] resize-y py-2.5 max-[640px]:col-span-1`}
      />
    </div>
  );
}

export function BuildingCubiclesSection({ buildingId }: { buildingId: string }) {
  const [cubicles, setCubicles] = useState<TeacherCubicle[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [professors, setProfessors] = useState<Professor[]>([]);
  const [professorsAvailable, setProfessorsAvailable] = useState(true);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [deleteError, setDeleteError] = useState<string | null>(null);
  const [draft, setDraft] = useState<CubicleDraft>(EMPTY_DRAFT);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editDraft, setEditDraft] = useState<CubicleDraft>(EMPTY_DRAFT);

  const load = useCallback(async () => {
    setLoading(true);
    setLoadError(null);
    try {
      const [cubiclesData, departmentsData] = await Promise.all([
        getTeacherCubiclesApi(buildingId),
        getDepartmentsApi(buildingId),
      ]);
      setCubicles(cubiclesData);
      setDepartments(departmentsData);
    } catch (err) {
      setLoadError(err instanceof Error ? err.message : "Error al cargar los cubículos");
    } finally {
      setLoading(false);
    }
  }, [buildingId]);

  useEffect(() => { void load(); }, [load]);

  useEffect(() => {
    (async () => {
      try {
        setProfessors(await getProfessorsApi());
        setProfessorsAvailable(true);
      } catch {
        setProfessorsAvailable(false);
      }
    })();
  }, []);

  async function handleAdd() {
    const nextCode = draft.code.trim();
    if (!nextCode) return;
    setSaving(true);
    setSaveError(null);
    try {
      await createTeacherCubicleApi({
        building_id: buildingId,
        code: nextCode,
        professor_id: draft.professor_id || null,
        department_id: draft.department_id || null,
        schedule_text: toNullable(draft.schedule_text),
        notes: toNullable(draft.notes),
        is_active: true,
      });
      setDraft(EMPTY_DRAFT);
      await load();
    } catch (err) {
      setSaveError(err instanceof Error ? err.message : "Error al guardar el cubículo");
    } finally {
      setSaving(false);
    }
  }

  function startEdit(cubicle: TeacherCubicle) {
    setEditingId(cubicle.id);
    setEditDraft({
      code: cubicle.code,
      professor_id: cubicle.professor_id ?? "",
      department_id: cubicle.department_id ?? "",
      schedule_text: cubicle.schedule_text ?? "",
      notes: cubicle.notes ?? "",
    });
    setSaveError(null);
  }

  function cancelEdit() {
    setEditingId(null);
    setEditDraft(EMPTY_DRAFT);
  }

  async function handleSaveEdit() {
    if (!editingId) return;
    const nextCode = editDraft.code.trim();
    if (!nextCode) return;
    setSaving(true);
    setSaveError(null);
    try {
      await updateTeacherCubicleApi(editingId, {
        code: nextCode,
        professor_id: editDraft.professor_id || null,
        department_id: editDraft.department_id || null,
        schedule_text: toNullable(editDraft.schedule_text),
        notes: toNullable(editDraft.notes),
      });
      cancelEdit();
      await load();
    } catch (err) {
      setSaveError(err instanceof Error ? err.message : "Error al actualizar el cubículo");
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(id: string) {
    setDeletingId(id);
    setDeleteError(null);
    try {
      await deleteTeacherCubicleApi(id);
      await load();
    } catch (err) {
      setDeleteError(err instanceof Error ? err.message : "Error al eliminar el cubículo");
    } finally {
      setDeletingId(null);
    }
  }

  return (
    <div>
      <p className="m-0 mb-4 text-[13px] text-[#64748b]">
        Registra los cubículos de maestros dentro de este edificio y, si aplica, asigna un profesor y departamento.
      </p>

      {loadError ? (
        <p className="m-0 mb-4 rounded-lg border border-[rgba(239,68,68,0.25)] bg-[rgba(239,68,68,0.08)] px-3 py-2 text-[12px] text-[#f87171]">
          {loadError}
        </p>
      ) : loading ? (
        <p className="m-0 mb-4 text-[12.5px] italic text-[#475569]">Cargando cubículos...</p>
      ) : cubicles.length === 0 ? (
        <p className="m-0 mb-4 text-[12.5px] italic text-[#475569]">No hay cubículos registrados para este edificio.</p>
      ) : (
        <ul className="m-0 mb-4 grid list-none gap-1.5 p-0">
          {cubicles.map((cubicle) =>
            editingId === cubicle.id ? (
              <li
                key={cubicle.id}
                className="flex flex-col gap-2.5 rounded-lg border border-[rgba(168,68,46,0.4)] bg-[#1e293b] px-3 py-3"
              >
                <CubicleFields
                  draft={editDraft}
                  onChange={setEditDraft}
                  disabled={saving}
                  professors={professors}
                  professorsAvailable={professorsAvailable}
                  departments={departments}
                />
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    disabled={saving || !editDraft.code.trim()}
                    onClick={() => void handleSaveEdit()}
                    className="min-h-9 flex-1 rounded-lg border border-[rgba(168,68,46,0.4)] bg-[#a8442e] px-3 text-[12.5px] font-bold text-white hover:bg-[#833323] disabled:cursor-not-allowed disabled:opacity-50"
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
                key={cubicle.id}
                className="flex items-center justify-between gap-2 rounded-lg border border-[#334155] bg-[#1e293b] px-3 py-2.5"
              >
                <div className="min-w-0">
                  <div className="mb-0.5 flex flex-wrap items-center gap-1.5">
                    <span className="inline-flex shrink-0 rounded-md border border-[rgba(168,68,46,0.28)] bg-[rgba(168,68,46,0.12)] px-2 py-0.5 text-[11px] font-black uppercase tracking-wide text-[#c56b52]">
                      {cubicle.code}
                    </span>
                    <span className="truncate text-[13px] font-semibold text-[#e2e8f0]">
                      {cubicle.professor_name ?? "Sin asignar"}
                    </span>
                  </div>
                  {cubicle.department_name ? (
                    <span className="block truncate text-[11.5px] text-[#64748b]">{cubicle.department_name}</span>
                  ) : null}
                  {cubicle.schedule_text ? (
                    <span className="block truncate text-[11.5px] text-[#64748b]">{cubicle.schedule_text}</span>
                  ) : null}
                  {cubicle.notes ? (
                    <p className="m-0 mt-0.5 text-[11.5px] text-[#64748b]">{cubicle.notes}</p>
                  ) : null}
                </div>
                <div className="flex flex-shrink-0 items-center gap-1.5">
                  <button
                    type="button"
                    onClick={() => startEdit(cubicle)}
                    className="grid h-7 w-7 place-items-center rounded-md border border-[#334155] bg-transparent text-[13px] text-[#94a3b8] hover:bg-[#0f172a] hover:text-[#e2e8f0]"
                    aria-label={`Editar ${cubicle.code}`}
                    title="Editar"
                  >
                    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7" />
                      <path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z" />
                    </svg>
                  </button>
                  <button
                    type="button"
                    disabled={deletingId === cubicle.id}
                    onClick={() => void handleDelete(cubicle.id)}
                    className="grid h-7 w-7 place-items-center rounded-md border border-[rgba(239,68,68,0.25)] bg-transparent text-[16px] font-bold leading-none text-[#ef4444] hover:bg-[rgba(239,68,68,0.12)] disabled:opacity-50"
                    aria-label={`Eliminar ${cubicle.code}`}
                  >
                    {deletingId === cubicle.id ? "..." : "×"}
                  </button>
                </div>
              </li>
            )
          )}
        </ul>
      )}

      <div className="flex flex-col gap-2.5">
        <CubicleFields
          draft={draft}
          onChange={setDraft}
          disabled={saving}
          professors={professors}
          professorsAvailable={professorsAvailable}
          departments={departments}
        />
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
          disabled={saving || !draft.code.trim()}
          onClick={() => void handleAdd()}
          className="min-h-11 w-full rounded-lg border border-[rgba(168,68,46,0.4)] bg-[#a8442e] px-3.5 text-[13px] font-bold text-white hover:bg-[#833323] disabled:cursor-not-allowed disabled:opacity-50"
        >
          {saving ? "Guardando…" : "Agregar cubículo"}
        </button>
      </div>
    </div>
  );
}
