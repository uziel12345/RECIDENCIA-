import { useCallback, useEffect, useState } from "react";
import type { Department } from "@ito-map/shared";
import {
  createDepartmentApi,
  deleteDepartmentApi,
  getDepartmentsApi,
  updateDepartmentApi,
} from "@ito-map/shared";

// ─── Draft type ─────────────────────────────────────────────────────────────

type DepartmentDraft = {
  name: string;
  description: string;
  schedule_text: string;
  head_name: string;
  contact: string;
};

const EMPTY_DRAFT: DepartmentDraft = {
  name: "",
  description: "",
  schedule_text: "",
  head_name: "",
  contact: "",
};

function toNullable(value: string): string | null {
  const trimmed = value.trim();
  return trimmed === "" ? null : trimmed;
}

function DepartmentFields({
  draft,
  onChange,
  disabled,
}: {
  draft: DepartmentDraft;
  onChange: (next: DepartmentDraft) => void;
  disabled: boolean;
}) {
  const fieldCls = "min-h-11 rounded-lg border border-[#334155] bg-[#0f172a] px-3 text-[13px] text-[#e2e8f0] placeholder:text-[#475569] outline-none focus:border-[#ea580c]";

  return (
    <div className="grid grid-cols-2 gap-2.5 max-[640px]:grid-cols-1">
      <input
        value={draft.name}
        onChange={(e) => onChange({ ...draft, name: e.target.value })}
        placeholder="Nombre del departamento"
        disabled={disabled}
        className={`${fieldCls} col-span-2 max-[640px]:col-span-1`}
      />
      <input
        value={draft.head_name}
        onChange={(e) => onChange({ ...draft, head_name: e.target.value })}
        placeholder="Responsable"
        disabled={disabled}
        className={fieldCls}
      />
      <input
        value={draft.contact}
        onChange={(e) => onChange({ ...draft, contact: e.target.value })}
        placeholder="Contacto (correo o teléfono)"
        disabled={disabled}
        className={fieldCls}
      />
      <input
        value={draft.schedule_text}
        onChange={(e) => onChange({ ...draft, schedule_text: e.target.value })}
        placeholder="Horario (ej: Lun-Vie 9:00-15:00)"
        disabled={disabled}
        className={`${fieldCls} col-span-2 max-[640px]:col-span-1`}
      />
      <textarea
        value={draft.description}
        onChange={(e) => onChange({ ...draft, description: e.target.value })}
        placeholder="Descripción (opcional)"
        disabled={disabled}
        className={`${fieldCls} col-span-2 min-h-[72px] resize-y py-2.5 max-[640px]:col-span-1`}
      />
    </div>
  );
}

export function BuildingDepartmentsSection({ buildingId }: { buildingId: string }) {
  const [departments, setDepartments] = useState<Department[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [deleteError, setDeleteError] = useState<string | null>(null);
  const [draft, setDraft] = useState<DepartmentDraft>(EMPTY_DRAFT);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editDraft, setEditDraft] = useState<DepartmentDraft>(EMPTY_DRAFT);

  const load = useCallback(async () => {
    setLoading(true);
    setLoadError(null);
    try {
      setDepartments(await getDepartmentsApi(buildingId));
    } catch (err) {
      setLoadError(err instanceof Error ? err.message : "Error al cargar los departamentos");
    } finally {
      setLoading(false);
    }
  }, [buildingId]);

  useEffect(() => { void load(); }, [load]);

  async function handleAdd() {
    const nextName = draft.name.trim();
    if (!nextName) return;
    setSaving(true);
    setSaveError(null);
    try {
      await createDepartmentApi({
        building_id: buildingId,
        name: nextName,
        description: toNullable(draft.description),
        schedule_text: toNullable(draft.schedule_text),
        head_name: toNullable(draft.head_name),
        contact: toNullable(draft.contact),
        is_active: true,
      });
      setDraft(EMPTY_DRAFT);
      await load();
    } catch (err) {
      setSaveError(err instanceof Error ? err.message : "Error al guardar el departamento");
    } finally {
      setSaving(false);
    }
  }

  function startEdit(department: Department) {
    setEditingId(department.id);
    setEditDraft({
      name: department.name,
      description: department.description ?? "",
      schedule_text: department.schedule_text ?? "",
      head_name: department.head_name ?? "",
      contact: department.contact ?? "",
    });
    setSaveError(null);
  }

  function cancelEdit() {
    setEditingId(null);
    setEditDraft(EMPTY_DRAFT);
  }

  async function handleSaveEdit() {
    if (!editingId) return;
    const nextName = editDraft.name.trim();
    if (!nextName) return;
    setSaving(true);
    setSaveError(null);
    try {
      await updateDepartmentApi(editingId, {
        name: nextName,
        description: toNullable(editDraft.description),
        schedule_text: toNullable(editDraft.schedule_text),
        head_name: toNullable(editDraft.head_name),
        contact: toNullable(editDraft.contact),
      });
      cancelEdit();
      await load();
    } catch (err) {
      setSaveError(err instanceof Error ? err.message : "Error al actualizar el departamento");
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(id: string) {
    setDeletingId(id);
    setDeleteError(null);
    try {
      await deleteDepartmentApi(id);
      await load();
    } catch (err) {
      setDeleteError(err instanceof Error ? err.message : "Error al eliminar el departamento");
    } finally {
      setDeletingId(null);
    }
  }

  return (
    <div>
      <p className="m-0 mb-4 text-[13px] text-[#64748b]">
        Registra los departamentos que existen dentro de este edificio, con su responsable, horario y contacto.
      </p>

      {loadError ? (
        <p className="m-0 mb-4 rounded-lg border border-[rgba(239,68,68,0.25)] bg-[rgba(239,68,68,0.08)] px-3 py-2 text-[12px] text-[#f87171]">
          {loadError}
        </p>
      ) : loading ? (
        <p className="m-0 mb-4 text-[12.5px] italic text-[#475569]">Cargando departamentos...</p>
      ) : departments.length === 0 ? (
        <p className="m-0 mb-4 text-[12.5px] italic text-[#475569]">Sin departamentos registrados.</p>
      ) : (
        <ul className="m-0 mb-4 grid list-none gap-1.5 p-0">
          {departments.map((department) =>
            editingId === department.id ? (
              <li
                key={department.id}
                className="flex flex-col gap-2.5 rounded-lg border border-[rgba(234,88,12,0.4)] bg-[#1e293b] px-3 py-3"
              >
                <DepartmentFields draft={editDraft} onChange={setEditDraft} disabled={saving} />
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    disabled={saving || !editDraft.name.trim()}
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
                key={department.id}
                className="flex items-center justify-between gap-2 rounded-lg border border-[#334155] bg-[#1e293b] px-3 py-2.5"
              >
                <div className="min-w-0">
                  <span className="block truncate text-[13px] font-semibold text-[#e2e8f0]">
                    {department.name}
                  </span>
                  {department.description ? (
                    <span className="block truncate text-[11.5px] text-[#64748b]">{department.description}</span>
                  ) : null}
                  {department.head_name ? (
                    <span className="block truncate text-[11.5px] text-[#64748b]">{department.head_name}</span>
                  ) : null}
                  {department.schedule_text ? (
                    <span className="block truncate text-[11.5px] text-[#64748b]">{department.schedule_text}</span>
                  ) : null}
                  {department.contact ? (
                    <span className="block truncate text-[11.5px] text-[#64748b]">{department.contact}</span>
                  ) : null}
                </div>
                <div className="flex flex-shrink-0 items-center gap-1.5">
                  <button
                    type="button"
                    onClick={() => startEdit(department)}
                    className="grid h-7 w-7 place-items-center rounded-md border border-[#334155] bg-transparent text-[13px] text-[#94a3b8] hover:bg-[#0f172a] hover:text-[#e2e8f0]"
                    aria-label={`Editar ${department.name}`}
                    title="Editar"
                  >
                    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7" />
                      <path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z" />
                    </svg>
                  </button>
                  <button
                    type="button"
                    disabled={deletingId === department.id}
                    onClick={() => void handleDelete(department.id)}
                    className="grid h-7 w-7 place-items-center rounded-md border border-[rgba(239,68,68,0.25)] bg-transparent text-[16px] font-bold leading-none text-[#ef4444] hover:bg-[rgba(239,68,68,0.12)] disabled:opacity-50"
                    aria-label={`Eliminar ${department.name}`}
                  >
                    {deletingId === department.id ? "..." : "×"}
                  </button>
                </div>
              </li>
            )
          )}
        </ul>
      )}

      <div className="flex flex-col gap-2.5">
        <DepartmentFields draft={draft} onChange={setDraft} disabled={saving} />
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
          disabled={saving || !draft.name.trim()}
          onClick={() => void handleAdd()}
          className="min-h-11 w-full rounded-lg border border-[rgba(234,88,12,0.4)] bg-[#ea580c] px-3.5 text-[13px] font-bold text-white hover:bg-[#c2410c] disabled:cursor-not-allowed disabled:opacity-50"
        >
          {saving ? "Guardando…" : "Agregar departamento"}
        </button>
      </div>
    </div>
  );
}
