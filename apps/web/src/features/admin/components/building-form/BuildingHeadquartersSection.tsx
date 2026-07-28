import { useCallback, useEffect, useState } from "react";
import type { Department, Headquarters } from "@ito-map/shared";
import {
  createHeadquartersApi,
  deleteHeadquartersApi,
  getDepartmentsApi,
  getHeadquartersApi,
  updateHeadquartersApi,
} from "@ito-map/shared";

// ─── Draft type ─────────────────────────────────────────────────────────────

type HeadquartersDraft = {
  name: string;
  head_name: string;
  department_id: string;
  schedule_text: string;
  contact: string;
};

const EMPTY_DRAFT: HeadquartersDraft = {
  name: "",
  head_name: "",
  department_id: "",
  schedule_text: "",
  contact: "",
};

function toNullable(value: string): string | null {
  const trimmed = value.trim();
  return trimmed === "" ? null : trimmed;
}

function HeadquartersFields({
  draft,
  onChange,
  disabled,
  departments,
}: {
  draft: HeadquartersDraft;
  onChange: (next: HeadquartersDraft) => void;
  disabled: boolean;
  departments: Department[];
}) {
  const fieldCls = "min-h-11 rounded-lg border border-[#334155] bg-[#0f172a] px-3 text-[13px] text-[#e2e8f0] placeholder:text-[#475569] outline-none focus:border-[#a8442e]";

  return (
    <div className="grid grid-cols-2 gap-2.5 max-[640px]:grid-cols-1">
      <input
        value={draft.name}
        onChange={(e) => onChange({ ...draft, name: e.target.value })}
        placeholder="Nombre de la jefatura"
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
      <input
        value={draft.contact}
        onChange={(e) => onChange({ ...draft, contact: e.target.value })}
        placeholder="Contacto (correo o teléfono)"
        disabled={disabled}
        className={fieldCls}
      />
    </div>
  );
}

export function BuildingHeadquartersSection({ buildingId }: { buildingId: string }) {
  const [headquarters, setHeadquarters] = useState<Headquarters[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [deleteError, setDeleteError] = useState<string | null>(null);
  const [draft, setDraft] = useState<HeadquartersDraft>(EMPTY_DRAFT);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editDraft, setEditDraft] = useState<HeadquartersDraft>(EMPTY_DRAFT);

  const load = useCallback(async () => {
    setLoading(true);
    setLoadError(null);
    try {
      const [headquartersData, departmentsData] = await Promise.all([
        getHeadquartersApi(buildingId),
        getDepartmentsApi(buildingId),
      ]);
      setHeadquarters(headquartersData);
      setDepartments(departmentsData);
    } catch (err) {
      setLoadError(err instanceof Error ? err.message : "Error al cargar las jefaturas");
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
      await createHeadquartersApi({
        building_id: buildingId,
        name: nextName,
        head_name: toNullable(draft.head_name),
        department_id: draft.department_id || null,
        schedule_text: toNullable(draft.schedule_text),
        contact: toNullable(draft.contact),
        is_active: true,
      });
      setDraft(EMPTY_DRAFT);
      await load();
    } catch (err) {
      setSaveError(err instanceof Error ? err.message : "Error al guardar la jefatura");
    } finally {
      setSaving(false);
    }
  }

  function startEdit(item: Headquarters) {
    setEditingId(item.id);
    setEditDraft({
      name: item.name,
      head_name: item.head_name ?? "",
      department_id: item.department_id ?? "",
      schedule_text: item.schedule_text ?? "",
      contact: item.contact ?? "",
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
      await updateHeadquartersApi(editingId, {
        name: nextName,
        head_name: toNullable(editDraft.head_name),
        department_id: editDraft.department_id || null,
        schedule_text: toNullable(editDraft.schedule_text),
        contact: toNullable(editDraft.contact),
      });
      cancelEdit();
      await load();
    } catch (err) {
      setSaveError(err instanceof Error ? err.message : "Error al actualizar la jefatura");
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(id: string) {
    setDeletingId(id);
    setDeleteError(null);
    try {
      await deleteHeadquartersApi(id);
      await load();
    } catch (err) {
      setDeleteError(err instanceof Error ? err.message : "Error al eliminar la jefatura");
    } finally {
      setDeletingId(null);
    }
  }

  return (
    <div>
      <p className="m-0 mb-4 text-[13px] text-[#64748b]">
        Registra las jefaturas de este edificio, su responsable y departamento relacionado.
      </p>

      {loadError ? (
        <p className="m-0 mb-4 rounded-lg border border-[rgba(239,68,68,0.25)] bg-[rgba(239,68,68,0.08)] px-3 py-2 text-[12px] text-[#f87171]">
          {loadError}
        </p>
      ) : loading ? (
        <p className="m-0 mb-4 text-[12.5px] italic text-[#475569]">Cargando jefaturas...</p>
      ) : headquarters.length === 0 ? (
        <p className="m-0 mb-4 text-[12.5px] italic text-[#475569]">Este edificio no tiene jefaturas registradas.</p>
      ) : (
        <ul className="m-0 mb-4 grid list-none gap-1.5 p-0">
          {headquarters.map((item) =>
            editingId === item.id ? (
              <li
                key={item.id}
                className="flex flex-col gap-2.5 rounded-lg border border-[rgba(168,68,46,0.4)] bg-[#1e293b] px-3 py-3"
              >
                <HeadquartersFields draft={editDraft} onChange={setEditDraft} disabled={saving} departments={departments} />
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    disabled={saving || !editDraft.name.trim()}
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
                key={item.id}
                className="flex items-center justify-between gap-2 rounded-lg border border-[#334155] bg-[#1e293b] px-3 py-2.5"
              >
                <div className="min-w-0">
                  <span className="block truncate text-[13px] font-semibold text-[#e2e8f0]">
                    {item.name}
                  </span>
                  {item.head_name ? (
                    <span className="block truncate text-[11.5px] text-[#64748b]">{item.head_name}</span>
                  ) : null}
                  {item.department_name ? (
                    <span className="block truncate text-[11.5px] text-[#64748b]">{item.department_name}</span>
                  ) : null}
                  {item.schedule_text ? (
                    <span className="block truncate text-[11.5px] text-[#64748b]">{item.schedule_text}</span>
                  ) : null}
                  {item.contact ? (
                    <span className="block truncate text-[11.5px] text-[#64748b]">{item.contact}</span>
                  ) : null}
                </div>
                <div className="flex flex-shrink-0 items-center gap-1.5">
                  <button
                    type="button"
                    onClick={() => startEdit(item)}
                    className="grid h-7 w-7 place-items-center rounded-md border border-[#334155] bg-transparent text-[13px] text-[#94a3b8] hover:bg-[#0f172a] hover:text-[#e2e8f0]"
                    aria-label={`Editar ${item.name}`}
                    title="Editar"
                  >
                    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7" />
                      <path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z" />
                    </svg>
                  </button>
                  <button
                    type="button"
                    disabled={deletingId === item.id}
                    onClick={() => void handleDelete(item.id)}
                    className="grid h-7 w-7 place-items-center rounded-md border border-[rgba(239,68,68,0.25)] bg-transparent text-[16px] font-bold leading-none text-[#ef4444] hover:bg-[rgba(239,68,68,0.12)] disabled:opacity-50"
                    aria-label={`Eliminar ${item.name}`}
                  >
                    {deletingId === item.id ? "..." : "×"}
                  </button>
                </div>
              </li>
            )
          )}
        </ul>
      )}

      <div className="flex flex-col gap-2.5">
        <HeadquartersFields draft={draft} onChange={setDraft} disabled={saving} departments={departments} />
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
          className="min-h-11 w-full rounded-lg border border-[rgba(168,68,46,0.4)] bg-[#a8442e] px-3.5 text-[13px] font-bold text-white hover:bg-[#833323] disabled:cursor-not-allowed disabled:opacity-50"
        >
          {saving ? "Guardando…" : "Agregar jefatura"}
        </button>
      </div>
    </div>
  );
}
