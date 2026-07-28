import type { FormEvent, ReactNode } from "react";
import { useCallback, useEffect, useState } from "react";
import type {
  BuildingCategory,
  Classroom,
  ClassroomType,
  Department,
  Procedure,
  ProcedureForBuilding,
  ProcedureKind,
} from "@ito-map/shared";
import {
  createClassroomApi,
  createProcedureApi,
  deleteClassroomApi,
  getClassroomsApi,
  getDepartmentsApi,
  getProceduresApi,
  getProceduresByBuildingApi,
  linkProcedureToBuildingApi,
  unlinkProcedureFromBuildingApi,
  updateClassroomApi,
} from "@ito-map/shared";
import type { BuildingFormState } from "../hooks/useBuildingForm";
import { BuildingDepartmentsSection } from "./building-form/BuildingDepartmentsSection";
import { BuildingCubiclesSection } from "./building-form/BuildingCubiclesSection";
import { BuildingHeadquartersSection } from "./building-form/BuildingHeadquartersSection";
import { BuildingSchedulesSection } from "./building-form/BuildingSchedulesSection";

// ─── Types ──────────────────────────────────────────────────────────────────

type Tab =
  | "datos"
  | "servicios"
  | "aulas"
  | "tramites"
  | "departamentos"
  | "cubiculos"
  | "jefaturas"
  | "horarios";

type BuildingFormProps = {
  form: BuildingFormState;
  categories: BuildingCategory[];
  isEditing: boolean;
  editingBuildingName: string;
  saving: boolean;
  buildingId?: string;
  onSubmit: (event: FormEvent<HTMLFormElement>) => void | Promise<void>;
  onCancelEdit: () => void;
  onNameChange: (value: string) => void;
  onUpdateFormField: <K extends keyof BuildingFormState>(
    key: K,
    value: BuildingFormState[K]
  ) => void;
};

type FieldErrorKey = "code" | "name" | "slug" | "category_code" | "model_node_name";

// ─── CSS helpers ─────────────────────────────────────────────────────────────

const labelCls =
  "mb-1.5 block text-[12.5px] font-semibold uppercase tracking-wide text-[#94a3b8]";
const hintCls = "mt-1 block text-[11.5px] text-[#475569]";
const baseInput =
  "w-full min-h-11 rounded-[10px] border bg-[#0f172a] px-3.5 text-[13.5px] font-normal normal-case tracking-normal text-[#e2e8f0] placeholder:text-[#475569] outline-none transition-[border-color,box-shadow] duration-[180ms] focus:ring-2";
const okInput =
  "border-[#334155] focus:border-[#a8442e] focus:ring-[rgba(168,68,46,0.35)]";
const errInput =
  "border-[#ef4444] ring-2 ring-[rgba(239,68,68,0.18)] focus:border-[#ef4444] focus:ring-[rgba(239,68,68,0.25)]";
const errText =
  "mt-1 block text-[11.5px] font-medium normal-case text-[#f87171]";

function inputClass(hasError: boolean) {
  return `${baseInput} ${hasError ? errInput : okInput}`;
}

function slugify(value: string): string {
  return value
    .trim()
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

// ─── Subsection: Aulas / Espacios ────────────────────────────────────────────

const FLOOR_OPTIONS = [
  { value: -1, label: "Sótano" },
  { value: 0, label: "Planta baja" },
  { value: 1, label: "Piso 1" },
  { value: 2, label: "Piso 2" },
  { value: 3, label: "Piso 3" },
  { value: 4, label: "Piso 4" },
];

function floorLabel(floor: number): string {
  return FLOOR_OPTIONS.find((f) => f.value === floor)?.label ?? `Piso ${floor}`;
}

type ClassroomDraft = {
  code: string;
  name: string;
  type: ClassroomType;
  floor: number;
};

const EMPTY_DRAFT: ClassroomDraft = { code: "", name: "", type: "aula", floor: 0 };

function ClassroomFields({
  draft,
  onChange,
  disabled,
}: {
  draft: ClassroomDraft;
  onChange: (next: ClassroomDraft) => void;
  disabled: boolean;
}) {
  const fieldCls = "min-h-11 rounded-lg border border-[#334155] bg-[#0f172a] px-3 text-[13px] text-[#e2e8f0] placeholder:text-[#475569] outline-none focus:border-[#a8442e]";

  return (
    <div className="grid grid-cols-2 gap-2.5 max-[640px]:grid-cols-1">
      <input
        value={draft.code}
        onChange={(e) => onChange({ ...draft, code: e.target.value })}
        placeholder="Clave (ej: A-101)"
        disabled={disabled}
        className={fieldCls}
      />
      <input
        value={draft.name}
        onChange={(e) => onChange({ ...draft, name: e.target.value })}
        placeholder="Nombre del aula"
        disabled={disabled}
        className={fieldCls}
      />
      <select
        value={draft.type}
        onChange={(e) => onChange({ ...draft, type: e.target.value as ClassroomType })}
        disabled={disabled}
        className={fieldCls}
      >
        <option value="aula">Aula</option>
        <option value="laboratorio">Laboratorio</option>
        <option value="taller">Taller</option>
        <option value="oficina">Oficina</option>
        <option value="otro">Otro</option>
      </select>
      <select
        value={draft.floor}
        onChange={(e) => onChange({ ...draft, floor: Number(e.target.value) })}
        disabled={disabled}
        className={fieldCls}
      >
        {FLOOR_OPTIONS.map((f) => (
          <option key={f.value} value={f.value}>{f.label}</option>
        ))}
      </select>
    </div>
  );
}

function BuildingClassroomsSection({ buildingId }: { buildingId: string }) {
  const [classrooms, setClassrooms] = useState<Classroom[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [deleteError, setDeleteError] = useState<string | null>(null);
  const [draft, setDraft] = useState<ClassroomDraft>(EMPTY_DRAFT);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editDraft, setEditDraft] = useState<ClassroomDraft>(EMPTY_DRAFT);

  const load = useCallback(async () => {
    setLoading(true);
    setLoadError(null);
    try {
      setClassrooms(await getClassroomsApi(buildingId));
    } catch (err) {
      setLoadError(err instanceof Error ? err.message : "Error al cargar las aulas");
    } finally {
      setLoading(false);
    }
  }, [buildingId]);

  useEffect(() => { void load(); }, [load]);

  async function handleAdd() {
    const nextCode = draft.code.trim();
    const nextName = draft.name.trim();
    if (!nextCode || !nextName) return;
    setSaving(true);
    setSaveError(null);
    try {
      await createClassroomApi({
        building_id: buildingId,
        code: nextCode,
        name: nextName,
        type: draft.type,
        floor: draft.floor,
        is_active: true,
      });
      setDraft(EMPTY_DRAFT);
      await load();
    } catch (err) {
      setSaveError(err instanceof Error ? err.message : "Error al guardar el aula");
    } finally {
      setSaving(false);
    }
  }

  function startEdit(classroom: Classroom) {
    setEditingId(classroom.id);
    setEditDraft({
      code: classroom.code,
      name: classroom.name,
      type: classroom.type,
      floor: classroom.floor,
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
    const nextName = editDraft.name.trim();
    if (!nextCode || !nextName) return;
    setSaving(true);
    setSaveError(null);
    try {
      await updateClassroomApi(editingId, {
        code: nextCode,
        name: nextName,
        type: editDraft.type,
        floor: editDraft.floor,
      });
      cancelEdit();
      await load();
    } catch (err) {
      setSaveError(err instanceof Error ? err.message : "Error al actualizar el aula");
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(id: string) {
    setDeletingId(id);
    setDeleteError(null);
    try {
      await deleteClassroomApi(id);
      await load();
    } catch (err) {
      setDeleteError(err instanceof Error ? err.message : "Error al eliminar el aula");
    } finally {
      setDeletingId(null);
    }
  }

  return (
    <div>
      <p className="m-0 mb-4 text-[13px] text-[#64748b]">
        Registra aulas, laboratorios, talleres u oficinas dentro de este edificio, indicando en qué piso se encuentran.
      </p>

      {loadError ? (
        <p className="m-0 mb-4 rounded-lg border border-[rgba(239,68,68,0.25)] bg-[rgba(239,68,68,0.08)] px-3 py-2 text-[12px] text-[#f87171]">
          {loadError}
        </p>
      ) : loading ? (
        <p className="m-0 mb-4 text-[12.5px] italic text-[#475569]">Cargando aulas...</p>
      ) : classrooms.length === 0 ? (
        <p className="m-0 mb-4 text-[12.5px] italic text-[#475569]">Sin aulas registradas.</p>
      ) : (
        <ul className="m-0 mb-4 grid list-none gap-1.5 p-0">
          {classrooms.map((classroom) =>
            editingId === classroom.id ? (
              <li
                key={classroom.id}
                className="flex flex-col gap-2.5 rounded-lg border border-[rgba(168,68,46,0.4)] bg-[#1e293b] px-3 py-3"
              >
                <ClassroomFields draft={editDraft} onChange={setEditDraft} disabled={saving} />
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    disabled={saving || !editDraft.code.trim() || !editDraft.name.trim()}
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
                key={classroom.id}
                className="flex items-center justify-between gap-2 rounded-lg border border-[#334155] bg-[#1e293b] px-3 py-2.5"
              >
                <div className="min-w-0">
                  <span className="block truncate text-[13px] font-semibold text-[#e2e8f0]">
                    {classroom.code} — {classroom.name}
                  </span>
                  <span className="text-[11.5px] capitalize text-[#64748b]">
                    {classroom.type} · {floorLabel(classroom.floor)}
                  </span>
                </div>
                <div className="flex flex-shrink-0 items-center gap-1.5">
                  <button
                    type="button"
                    onClick={() => startEdit(classroom)}
                    className="grid h-7 w-7 place-items-center rounded-md border border-[#334155] bg-transparent text-[13px] text-[#94a3b8] hover:bg-[#0f172a] hover:text-[#e2e8f0]"
                    aria-label={`Editar ${classroom.name}`}
                    title="Editar"
                  >
                    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7" />
                      <path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z" />
                    </svg>
                  </button>
                  <button
                    type="button"
                    disabled={deletingId === classroom.id}
                    onClick={() => void handleDelete(classroom.id)}
                    className="grid h-7 w-7 place-items-center rounded-md border border-[rgba(239,68,68,0.25)] bg-transparent text-[16px] font-bold leading-none text-[#ef4444] hover:bg-[rgba(239,68,68,0.12)] disabled:opacity-50"
                    aria-label={`Eliminar ${classroom.name}`}
                  >
                    {deletingId === classroom.id ? "..." : "×"}
                  </button>
                </div>
              </li>
            )
          )}
        </ul>
      )}

      <div className="flex flex-col gap-2.5">
        <ClassroomFields draft={draft} onChange={setDraft} disabled={saving} />
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
          disabled={saving || !draft.code.trim() || !draft.name.trim()}
          onClick={() => void handleAdd()}
          className="min-h-11 w-full rounded-lg border border-[rgba(168,68,46,0.4)] bg-[#a8442e] px-3.5 text-[13px] font-bold text-white hover:bg-[#833323] disabled:cursor-not-allowed disabled:opacity-50"
        >
          {saving ? "Guardando…" : "Agregar aula"}
        </button>
      </div>
    </div>
  );
}

// ─── Subsection: Trámites / Servicios vinculados ─────────────────────────────

const KIND_COPY: Record<ProcedureKind, { noun: string; plural: string; placeholder: string }> = {
  tramite: { noun: "trámite", plural: "trámites", placeholder: "Nombre del trámite" },
  servicio: { noun: "servicio", plural: "servicios", placeholder: "Nombre del servicio" },
};

function BuildingProceduresSection({
  buildingId,
  kind,
}: {
  buildingId: string;
  kind: ProcedureKind;
}) {
  const [linked, setLinked] = useState<ProcedureForBuilding[]>([]);
  const [allProcedures, setAllProcedures] = useState<Procedure[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [selectedId, setSelectedId] = useState("");
  const [newName, setNewName] = useState("");
  const [notes, setNotes] = useState("");
  const [newDepartmentId, setNewDepartmentId] = useState("");
  const [newInternalLocation, setNewInternalLocation] = useState("");
  const [newScheduleText, setNewScheduleText] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const copy = KIND_COPY[kind];

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [buildingProcedures, procedures, buildingDepartments] = await Promise.all([
        getProceduresByBuildingApi(buildingId),
        getProceduresApi({ kind }),
        getDepartmentsApi(buildingId),
      ]);
      setLinked(buildingProcedures.filter((p) => p.kind === kind));
      setAllProcedures(procedures.filter((p) => p.is_active));
      setDepartments(buildingDepartments);
    } finally {
      setLoading(false);
    }
  }, [buildingId, kind]);

  useEffect(() => { void load(); }, [load]);

  async function handleLinkExisting() {
    if (!selectedId) return;
    setSaving(true);
    try {
      await linkProcedureToBuildingApi(buildingId, {
        procedure_id: selectedId,
        notes: notes.trim() || null,
      });
      setSelectedId(""); setNotes("");
      await load();
    } finally {
      setSaving(false);
    }
  }

  async function handleCreateAndLink() {
    const name = newName.trim();
    if (!name) return;
    setSaving(true);
    try {
      const created = await createProcedureApi({
        name,
        slug: slugify(name),
        kind,
        description: notes.trim() || null,
        department_id: newDepartmentId || null,
        internal_location: newInternalLocation.trim() || null,
        schedule_text: newScheduleText.trim() || null,
        is_active: true,
      });
      await linkProcedureToBuildingApi(buildingId, {
        procedure_id: created.id,
        notes: notes.trim() || null,
      });
      setNewName(""); setNotes("");
      setNewDepartmentId(""); setNewInternalLocation(""); setNewScheduleText("");
      await load();
    } finally {
      setSaving(false);
    }
  }

  async function handleUnlink(procedureId: string) {
    setSaving(true);
    try {
      await unlinkProcedureFromBuildingApi(buildingId, procedureId);
      await load();
    } finally {
      setSaving(false);
    }
  }

  const linkedIds = new Set(linked.map((p) => p.id));
  const available = allProcedures.filter((p) => !linkedIds.has(p.id));
  const fieldCls = "min-h-11 rounded-lg border border-[#334155] bg-[#0f172a] px-3 text-[13px] text-[#e2e8f0] outline-none focus:border-[#a8442e]";

  return (
    <div>
      <p className="m-0 mb-4 text-[13px] text-[#64748b]">
        Vincula {copy.plural} del catálogo para que aparezcan en el buscador y en la ficha del edificio.
      </p>

      {loading ? (
        <p className="m-0 mb-4 text-[12.5px] italic text-[#475569]">Cargando vínculos...</p>
      ) : linked.length === 0 ? (
        <p className="m-0 mb-4 text-[12.5px] italic text-[#475569]">Sin {copy.plural} vinculados.</p>
      ) : (
        <ul className="m-0 mb-4 grid list-none gap-1.5 p-0">
          {linked.map((procedure) => (
            <li key={procedure.id} className="flex items-center justify-between gap-2 rounded-lg border border-[#334155] bg-[#1e293b] px-3 py-2.5">
              <div className="min-w-0">
                <span className="block truncate text-[13px] font-semibold text-[#e2e8f0]">{procedure.name}</span>
                {procedure.notes ? (
                  <span className="text-[11.5px] text-[#64748b]">{procedure.notes}</span>
                ) : null}
              </div>
              <button
                type="button"
                disabled={saving}
                onClick={() => void handleUnlink(procedure.id)}
                className="grid h-7 w-7 flex-shrink-0 place-items-center rounded-md border border-[rgba(239,68,68,0.25)] bg-transparent text-[16px] font-bold leading-none text-[#ef4444] hover:bg-[rgba(239,68,68,0.12)] disabled:opacity-50"
                aria-label={`Desvincular ${procedure.name}`}
              >
                ×
              </button>
            </li>
          ))}
        </ul>
      )}

      {/* Vincular existente */}
      <div className="mb-5 rounded-xl border border-[#1e3050] bg-[#131e2e] p-4">
        <p className="m-0 mb-3 text-[11px] font-bold uppercase tracking-wide text-[#475569]">Vincular existente del catálogo</p>
        <div className="grid grid-cols-1 gap-2">
          <select value={selectedId} onChange={(e) => setSelectedId(e.target.value)} disabled={saving} className={fieldCls}>
            <option value="">Seleccionar {copy.noun}...</option>
            {available.map((procedure) => (
              <option key={procedure.id} value={procedure.id}>
                {procedure.name}
              </option>
            ))}
          </select>
          <input value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Notas (opcional)" disabled={saving} className={fieldCls} />
          <button type="button" disabled={saving || !selectedId} onClick={() => void handleLinkExisting()} className="min-h-11 w-full rounded-lg border border-[rgba(168,68,46,0.4)] bg-[#a8442e] px-3.5 text-[13px] font-bold text-white hover:bg-[#833323] disabled:cursor-not-allowed disabled:opacity-50">
            Vincular
          </button>
        </div>
      </div>

      {/* Crear y vincular */}
      <div className="rounded-xl border border-[#1e3050] bg-[#131e2e] p-4">
        <p className="m-0 mb-3 text-[11px] font-bold uppercase tracking-wide text-[#475569]">Crear nuevo en el catálogo y vincular</p>
        <div className="grid grid-cols-1 gap-2">
          <input value={newName} onChange={(e) => setNewName(e.target.value)} placeholder={copy.placeholder} disabled={saving} className={fieldCls} />
          <select
            value={newDepartmentId}
            onChange={(e) => setNewDepartmentId(e.target.value)}
            disabled={saving}
            className={fieldCls}
          >
            <option value="">Departamento responsable (opcional)</option>
            {departments.map((department) => (
              <option key={department.id} value={department.id}>
                {department.name}
              </option>
            ))}
          </select>
          <input
            value={newScheduleText}
            onChange={(e) => setNewScheduleText(e.target.value)}
            placeholder="Horario de atención (opcional)"
            disabled={saving}
            className={fieldCls}
          />
          <input
            value={newInternalLocation}
            onChange={(e) => setNewInternalLocation(e.target.value)}
            placeholder="Ubicación interna (opcional, ej. Planta baja, oficina 3)"
            disabled={saving}
            className={fieldCls}
          />
          <button type="button" disabled={saving || !newName.trim()} onClick={() => void handleCreateAndLink()} className="min-h-11 w-full rounded-lg border border-[rgba(168,68,46,0.4)] bg-[#a8442e] px-3.5 text-[13px] font-bold text-white hover:bg-[#833323] disabled:cursor-not-allowed disabled:opacity-50">
            Crear y vincular
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Tab locked placeholder ───────────────────────────────────────────────────

function LockedSection({ label }: { label: string }) {
  return (
    <div className="flex flex-col items-center gap-4 py-14 text-center">
      <div className="grid h-12 w-12 place-items-center rounded-full border border-[#334155] bg-[#0f172a]">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#475569" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
          <path d="M7 11V7a5 5 0 0110 0v4" />
        </svg>
      </div>
      <div>
        <p className="m-0 text-[14px] font-semibold text-[#64748b]">Guarda el edificio primero</p>
        <p className="m-0 mt-1 text-[12.5px] text-[#475569]">
          Podrás gestionar {label} una vez que el edificio esté registrado.
        </p>
      </div>
    </div>
  );
}

// ─── Field validation rules ───────────────────────────────────────────────────

const FIELD_RULES: Record<FieldErrorKey, (v: string) => string> = {
  code: (v) =>
    !v.trim()
      ? "El código es obligatorio."
      : v.trim().length > 20
        ? "Máximo 20 caracteres."
        : "",
  name: (v) => (!v.trim() ? "El nombre es obligatorio." : ""),
  slug: (v) =>
    !v.trim()
      ? "El slug es obligatorio."
      : !/^[a-z0-9-]+$/.test(v.trim())
        ? "Solo letras minúsculas, números y guiones."
        : "",
  category_code: (v) => (!v ? "Selecciona una categoría." : ""),
  model_node_name: (v) => (!v.trim() ? "El nodo 3D es obligatorio." : ""),
};

// ─── Tab definitions ──────────────────────────────────────────────────────────

const TABS: { id: Tab; label: string; icon: ReactNode }[] = [
  {
    id: "datos",
    label: "Datos",
    icon: (
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z" />
        <polyline points="14 2 14 8 20 8" />
        <line x1="16" y1="13" x2="8" y2="13" />
        <line x1="16" y1="17" x2="8" y2="17" />
      </svg>
    ),
  },
  {
    id: "servicios",
    label: "Servicios",
    icon: (
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M3 9.5L12 3l9 6.5V20a1 1 0 01-1 1H4a1 1 0 01-1-1V9.5z" />
        <path d="M9 21V12h6v9" />
      </svg>
    ),
  },
  {
    id: "aulas",
    label: "Aulas",
    icon: (
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M2 3h6a4 4 0 014 4v14a3 3 0 00-3-3H2z" />
        <path d="M22 3h-6a4 4 0 00-4 4v14a3 3 0 013-3h7z" />
      </svg>
    ),
  },
  {
    id: "tramites",
    label: "Trámites",
    icon: (
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2" />
        <rect x="9" y="3" width="6" height="4" rx="2" />
        <line x1="9" y1="12" x2="15" y2="12" />
        <line x1="9" y1="16" x2="13" y2="16" />
      </svg>
    ),
  },
  {
    id: "departamentos",
    label: "Deptos",
    icon: (
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <rect x="4" y="3" width="16" height="18" rx="1" />
        <line x1="8" y1="7" x2="12" y2="7" />
        <line x1="8" y1="11" x2="16" y2="11" />
        <line x1="8" y1="15" x2="16" y2="15" />
      </svg>
    ),
  },
  {
    id: "cubiculos",
    label: "Cubículos",
    icon: (
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="8" r="4" />
        <path d="M4 21v-2a6 6 0 0116 0v2" />
      </svg>
    ),
  },
  {
    id: "jefaturas",
    label: "Jefaturas",
    icon: (
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M12 2l3 5 5 .7-3.6 3.5.9 5-4.3-2.3-4.3 2.3.9-5L3 7.7 8 7z" />
      </svg>
    ),
  },
  {
    id: "horarios",
    label: "Horarios",
    icon: (
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="12" r="9" />
        <polyline points="12 7 12 12 16 14" />
      </svg>
    ),
  },
];

// ─── Main component ───────────────────────────────────────────────────────────

export function BuildingForm({
  form,
  categories,
  isEditing,
  editingBuildingName,
  saving,
  buildingId,
  onSubmit,
  onCancelEdit,
  onNameChange,
  onUpdateFormField,
}: BuildingFormProps) {
  const [touched, setTouched] = useState<Partial<Record<FieldErrorKey, boolean>>>({});
  const [activeTab, setActiveTab] = useState<Tab>("datos");
  const hasBuilding = Boolean(buildingId);

  function touch(field: FieldErrorKey) {
    setTouched((prev) => ({ ...prev, [field]: true }));
  }

  function fieldError(field: FieldErrorKey): string {
    if (!touched[field]) return "";
    return FIELD_RULES[field](form[field] as string);
  }

  return (
    <div className="rounded-[18px] border border-[#334155] bg-[#1e293b] shadow-[0_4px_24px_rgba(0,0,0,0.3)]">

      {/* ── Header ── */}
      <div className="flex items-start justify-between gap-3.5 border-b border-[#334155] px-6 py-5 max-[640px]:flex-col max-[640px]:px-4 max-[640px]:py-4">
        <div>
          <h2 className="m-0 mb-1.5 text-[17px] font-bold text-[#f1f5f9]">
            {isEditing ? "Editar edificio" : "Crear edificio"}
          </h2>
          {isEditing ? (
            <p className="m-0 text-[13px] leading-relaxed text-[#64748b]">
              Editando: <strong className="text-[#cbd5e1]">{editingBuildingName}</strong>
            </p>
          ) : (
            <p className="m-0 text-[13px] leading-relaxed text-[#64748b]">
              Registra un nuevo edificio para el mapa interactivo.
            </p>
          )}
        </div>
        {isEditing && (
          <button
            type="button"
            onClick={onCancelEdit}
            className="inline-flex min-h-11 items-center justify-center whitespace-nowrap rounded-[10px] border border-[#334155] bg-transparent px-3 text-[13px] font-semibold text-[#94a3b8] transition-colors duration-[180ms] hover:bg-[#0f172a] hover:text-[#e2e8f0] max-[640px]:w-full"
          >
            Cancelar
          </button>
        )}
      </div>

      {/* ── Tab bar ── */}
      <div className="grid grid-cols-4 gap-1 border-b border-[#334155] px-2 py-2 max-[640px]:grid-cols-2 max-[640px]:px-3">
        {TABS.map((tab) => {
          const locked = !hasBuilding && tab.id !== "datos";
          const active = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveTab(tab.id)}
              title={locked ? "Guarda el edificio primero para acceder a esta sección" : undefined}
              className={[
                "flex min-h-12 items-center justify-center gap-1.5 rounded-[10px] border border-transparent px-3 py-2.5 text-[13px] font-semibold transition-colors duration-[180ms]",
                active
                  ? "border-[#a8442e] bg-[rgba(168,68,46,0.14)] text-[#f1f5f9]"
                  : "text-[#64748b] hover:bg-[#0f172a] hover:text-[#94a3b8]",
                locked ? "cursor-default opacity-40" : "cursor-pointer",
              ].join(" ")}
            >
              {tab.icon}
              <span>{tab.label}</span>
              {locked && (
                <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
                  <path d="M7 11V7a5 5 0 0110 0v4" />
                </svg>
              )}
            </button>
          );
        })}
      </div>

      {/* ── Tab panels ── */}
      <div className="p-6 max-[640px]:p-4">

        {/* ── Datos generales ── */}
        {activeTab === "datos" && (
          <form onSubmit={onSubmit}>
            <div className="grid grid-cols-2 gap-x-5 gap-y-5 max-[640px]:grid-cols-1 max-[640px]:gap-y-4">

              {/* Código */}
              <label className="block">
                <span className={labelCls}>Código</span>
                <input
                  value={form.code}
                  onChange={(e) => { onUpdateFormField("code", e.target.value); touch("code"); }}
                  onBlur={() => touch("code")}
                  required
                  className={inputClass(!!fieldError("code"))}
                  placeholder="EDIF-A"
                  aria-describedby={fieldError("code") ? "err-code" : undefined}
                />
                {fieldError("code") ? <span id="err-code" className={errText}>{fieldError("code")}</span> : null}
              </label>

              {/* Nombre */}
              <label className="block">
                <span className={labelCls}>Nombre</span>
                <input
                  value={form.name}
                  onChange={(e) => { onNameChange(e.target.value); touch("name"); }}
                  onBlur={() => touch("name")}
                  required
                  className={inputClass(!!fieldError("name"))}
                  placeholder="Edificio A"
                  aria-describedby={fieldError("name") ? "err-name" : undefined}
                />
                {fieldError("name") ? <span id="err-name" className={errText}>{fieldError("name")}</span> : null}
              </label>

              {/* Slug */}
              <label className="col-span-2 block max-[640px]:col-span-1">
                <span className={labelCls}>Slug</span>
                <input
                  value={form.slug}
                  onChange={(e) => { onUpdateFormField("slug", e.target.value); touch("slug"); }}
                  onBlur={() => touch("slug")}
                  required
                  className={inputClass(!!fieldError("slug"))}
                  placeholder="edificio-a"
                  aria-describedby={fieldError("slug") ? "err-slug" : undefined}
                />
                {fieldError("slug") ? <span id="err-slug" className={errText}>{fieldError("slug")}</span> : null}
                <span className={hintCls}>URL amigable · se genera automáticamente del nombre</span>
              </label>

              {/* Categoría */}
              <label className="block">
                <span className={labelCls}>Categoría</span>
                <select
                  value={form.category_code}
                  onChange={(e) => { onUpdateFormField("category_code", e.target.value); touch("category_code"); }}
                  onBlur={() => touch("category_code")}
                  required
                  className={inputClass(!!fieldError("category_code"))}
                  aria-describedby={fieldError("category_code") ? "err-cat" : undefined}
                >
                  <option value="">Seleccionar…</option>
                  {categories
                    .filter((c) => Boolean(c.is_active))
                    .map((c) => (
                      <option key={c.id} value={c.code}>
                        {c.name} ({c.code})
                      </option>
                    ))}
                </select>
                {fieldError("category_code") ? <span id="err-cat" className={errText}>{fieldError("category_code")}</span> : null}
              </label>

              {/* Nodo 3D */}
              <label className="block">
                <span className={labelCls}>Nodo del modelo 3D</span>
                <input
                  value={form.model_node_name}
                  onChange={(e) => { onUpdateFormField("model_node_name", e.target.value); touch("model_node_name"); }}
                  onBlur={() => touch("model_node_name")}
                  required
                  className={inputClass(!!fieldError("model_node_name"))}
                  placeholder="Building_A"
                  aria-describedby={fieldError("model_node_name") ? "err-node" : undefined}
                />
                {fieldError("model_node_name") ? <span id="err-node" className={errText}>{fieldError("model_node_name")}</span> : null}
                <span className={hintCls}>Nombre exacto del objeto en campus.glb</span>
              </label>

              {/* Descripción */}
              <label className="col-span-2 block max-[640px]:col-span-1">
                <span className={labelCls}>Descripción</span>
                <textarea
                  value={form.description}
                  onChange={(e) => onUpdateFormField("description", e.target.value)}
                  className={`${baseInput} ${okInput} min-h-[88px] resize-y py-2.5`}
                  placeholder="Descripción breve del edificio"
                />
              </label>

              {/* Prioritario */}
              <label className="col-span-2 flex cursor-pointer items-center gap-2.5 text-[13px] font-semibold text-[#94a3b8] max-[640px]:col-span-1 max-[640px]:items-start">
                <input
                  type="checkbox"
                  checked={form.is_priority}
                  onChange={(e) => onUpdateFormField("is_priority", e.target.checked)}
                  className="h-4 w-4 accent-[#a8442e]"
                />
                Marcar como edificio prioritario
                <span className="ml-1 text-[11.5px] font-normal text-[#475569] max-[640px]:block">
                  (aparece en "Lugares destacados" del mapa)
                </span>
              </label>
            </div>

            <button
              type="submit"
              disabled={saving}
              className="mt-7 inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-[10px] border border-[rgba(168,68,46,0.4)] bg-[#a8442e] px-4 text-[14px] font-bold text-white shadow-[0_6px_18px_rgba(168,68,46,0.25)] transition-[transform,background-color] duration-[180ms] hover:-translate-y-px hover:bg-[#833323] active:translate-y-0 disabled:cursor-not-allowed disabled:bg-[#475569] disabled:shadow-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[rgba(168,68,46,0.45)] focus-visible:ring-offset-2 focus-visible:ring-offset-[#1e293b] max-[640px]:sticky max-[640px]:bottom-3 max-[640px]:z-10 max-[640px]:min-h-12"
            >
              {saving ? (
                <>
                  <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/40 border-t-white" aria-hidden="true" />
                  Guardando…
                </>
              ) : isEditing ? (
                "Guardar cambios"
              ) : (
                "Crear edificio"
              )}
            </button>
          </form>
        )}

        {/* ── Servicios ── */}
        {activeTab === "servicios" && (
          hasBuilding
            ? <BuildingProceduresSection buildingId={buildingId!} kind="servicio" />
            : <LockedSection label="servicios vinculados" />
        )}

        {/* ── Aulas / Espacios ── */}
        {activeTab === "aulas" && (
          hasBuilding
            ? <BuildingClassroomsSection buildingId={buildingId!} />
            : <LockedSection label="aulas y espacios" />
        )}

        {/* ── Trámites ── */}
        {activeTab === "tramites" && (
          hasBuilding
            ? <BuildingProceduresSection buildingId={buildingId!} kind="tramite" />
            : <LockedSection label="trámites vinculados" />
        )}

        {/* ── Departamentos ── */}
        {activeTab === "departamentos" && (
          hasBuilding
            ? <BuildingDepartmentsSection buildingId={buildingId!} />
            : <LockedSection label="departamentos" />
        )}

        {/* ── Cubículos de maestros ── */}
        {activeTab === "cubiculos" && (
          hasBuilding
            ? <BuildingCubiclesSection buildingId={buildingId!} />
            : <LockedSection label="cubículos de maestros" />
        )}

        {/* ── Jefaturas ── */}
        {activeTab === "jefaturas" && (
          hasBuilding
            ? <BuildingHeadquartersSection buildingId={buildingId!} />
            : <LockedSection label="jefaturas" />
        )}

        {/* ── Horarios ── */}
        {activeTab === "horarios" && (
          hasBuilding
            ? <BuildingSchedulesSection buildingId={buildingId!} />
            : <LockedSection label="horarios de atención" />
        )}
      </div>
    </div>
  );
}
