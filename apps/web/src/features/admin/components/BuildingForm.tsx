import type { FormEvent } from "react";
import { useCallback, useEffect, useState } from "react";
import type {
  BuildingCategory,
  BuildingService,
  Classroom,
  ClassroomType,
  Procedure,
  ProcedureForBuilding,
  ProcedureKind,
} from "@ito-map/shared";
import {
  addBuildingServiceApi,
  createClassroomApi,
  createProcedureApi,
  deleteBuildingServiceApi,
  deleteClassroomApi,
  getClassroomsApi,
  getBuildingServicesApi,
  getProceduresApi,
  getProceduresByBuildingApi,
  linkProcedureToBuildingApi,
  unlinkProcedureFromBuildingApi,
} from "@ito-map/shared";
import type { BuildingFormState } from "../hooks/useBuildingForm";

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

const labelCls =
  "mb-1.5 block text-[12.5px] font-semibold uppercase tracking-wide text-[#94a3b8]";
const baseInput =
  "w-full min-h-11 rounded-[10px] border bg-[#0f172a] px-3.5 text-[13.5px] font-normal normal-case tracking-normal text-[#e2e8f0] placeholder:text-[#475569] outline-none transition-[border-color,box-shadow] duration-[180ms] focus:ring-2";
const okInput =
  "border-[#334155] focus:border-[#ea580c] focus:ring-[rgba(234,88,12,0.35)]";
const errInput =
  "border-[#ef4444] ring-2 ring-[rgba(239,68,68,0.18)] focus:border-[#ef4444] focus:ring-[rgba(239,68,68,0.25)]";

function inputClass(hasError: boolean) {
  return `${baseInput} ${hasError ? errInput : okInput}`;
}

function slugify(value: string): string {
  return value
    .trim()
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function BuildingServicesSection({ buildingId }: { buildingId: string }) {
  const [services, setServices] = useState<BuildingService[]>([]);
  const [loading, setLoading] = useState(true);
  const [adding, setAdding] = useState(false);
  const [newName, setNewName] = useState("");
  const [newDesc, setNewDesc] = useState("");
  const [deletingId, setDeletingId] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    getBuildingServicesApi(buildingId)
      .then((data) => {
        if (!cancelled) setServices(data);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [buildingId]);

  async function handleAdd() {
    const name = newName.trim();
    if (!name) return;
    setAdding(true);
    try {
      const created = await addBuildingServiceApi(buildingId, {
        name,
        description: newDesc.trim() || null,
      });
      setServices((prev) => [...prev, created]);
      setNewName("");
      setNewDesc("");
    } finally {
      setAdding(false);
    }
  }

  async function handleDelete(serviceId: string) {
    setDeletingId(serviceId);
    try {
      await deleteBuildingServiceApi(buildingId, serviceId);
      setServices((prev) => prev.filter((s) => s.id !== serviceId));
    } finally {
      setDeletingId(null);
    }
  }

  return (
    <div className="mb-[18px] rounded-xl border border-[#334155] bg-[#0f172a] p-4">
      <h3 className="m-0 mb-1 text-[13px] font-bold uppercase tracking-wide text-[#f1f5f9]">
        Servicios / Departamentos
      </h3>
      <p className="m-0 mb-3 text-[12px] text-[#64748b]">
        Agrega los departamentos o servicios que ofrece este edificio.
      </p>

      {loading ? (
        <p className="m-0 mb-3 flex items-center gap-2 text-[12.5px] italic text-[#475569]">
          <span
            className="h-3 w-3 animate-spin rounded-full border-2 border-[#334155] border-t-[#ea580c]"
            aria-hidden="true"
          />
          Cargando servicios…
        </p>
      ) : services.length === 0 ? (
        <p className="m-0 mb-3 text-[12.5px] italic text-[#475569]">
          Sin servicios registrados.
        </p>
      ) : (
        <ul className="m-0 mb-3 flex list-none flex-col gap-1.5 p-0">
          {services.map((s) => (
            <li
              key={s.id}
              className="flex items-center justify-between gap-2.5 rounded-lg border border-[#334155] bg-[#1e293b] px-2.5 py-2"
            >
              <div className="flex min-w-0 flex-col gap-0.5">
                <span className="truncate text-[13px] font-semibold text-[#e2e8f0]">
                  {s.name}
                </span>
                {s.description ? (
                  <span className="truncate text-[11.5px] text-[#64748b]">
                    {s.description}
                  </span>
                ) : null}
              </div>
              <button
                type="button"
                disabled={deletingId === s.id}
                onClick={() => handleDelete(s.id)}
                aria-label={`Eliminar ${s.name}`}
                className="grid h-7 w-7 flex-shrink-0 place-items-center rounded-md border border-[rgba(239,68,68,0.25)] bg-transparent text-[16px] font-bold leading-none text-[#ef4444] transition-colors duration-[180ms] hover:bg-[rgba(239,68,68,0.12)] disabled:opacity-50"
              >
                {deletingId === s.id ? "…" : "×"}
              </button>
            </li>
          ))}
        </ul>
      )}

      <div className="flex items-center gap-2">
        <input
          value={newName}
          onChange={(e) => setNewName(e.target.value)}
          placeholder="Nombre del servicio"
          disabled={adding}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault();
              void handleAdd();
            }
          }}
          className="min-h-11 flex-1 rounded-lg border border-[#334155] bg-[#1e293b] px-2.5 text-[13px] text-[#e2e8f0] placeholder:text-[#475569] outline-none transition-[border-color] duration-[180ms] focus:border-[#ea580c]"
        />
        <input
          value={newDesc}
          onChange={(e) => setNewDesc(e.target.value)}
          placeholder="Descripción (opcional)"
          disabled={adding}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault();
              void handleAdd();
            }
          }}
          className="min-h-11 flex-[1.5] rounded-lg border border-[#334155] bg-[#1e293b] px-2.5 text-[13px] text-[#e2e8f0] placeholder:text-[#475569] outline-none transition-[border-color] duration-[180ms] focus:border-[#ea580c]"
        />
        <button
          type="button"
          disabled={adding || !newName.trim()}
          onClick={() => void handleAdd()}
          className="inline-flex min-h-11 flex-shrink-0 items-center justify-center rounded-lg border border-[rgba(234,88,12,0.4)] bg-[#ea580c] px-3.5 text-[13px] font-bold text-white transition-[background-color,transform] duration-[180ms] hover:-translate-y-px hover:bg-[#c2410c] active:translate-y-0 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {adding ? "…" : "Agregar"}
        </button>
      </div>
    </div>
  );
}

function BuildingClassroomsSection({ buildingId }: { buildingId: string }) {
  const [classrooms, setClassrooms] = useState<Classroom[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [code, setCode] = useState("");
  const [name, setName] = useState("");
  const [type, setType] = useState<ClassroomType>("aula");
  const [floor, setFloor] = useState("0");

  const load = useCallback(async () => {
    setLoading(true);
    try {
      setClassrooms(await getClassroomsApi(buildingId));
    } finally {
      setLoading(false);
    }
  }, [buildingId]);

  useEffect(() => {
    void load();
  }, [load]);

  async function handleAdd() {
    const nextCode = code.trim();
    const nextName = name.trim();
    if (!nextCode || !nextName) return;
    setSaving(true);
    try {
      await createClassroomApi({
        building_id: buildingId,
        code: nextCode,
        name: nextName,
        type,
        floor: Number.isFinite(Number(floor)) ? Number(floor) : 0,
        is_active: true,
      });
      setCode("");
      setName("");
      setType("aula");
      setFloor("0");
      await load();
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(id: string) {
    setDeletingId(id);
    try {
      await deleteClassroomApi(id);
      await load();
    } finally {
      setDeletingId(null);
    }
  }

  return (
    <div className="mb-[18px] rounded-xl border border-[#334155] bg-[#0f172a] p-4">
      <h3 className="m-0 mb-1 text-[13px] font-bold uppercase tracking-wide text-[#f1f5f9]">
        Aulas / espacios
      </h3>
      <p className="m-0 mb-3 text-[12px] text-[#64748b]">
        Registra aulas, laboratorios, talleres u oficinas dentro de este edificio.
      </p>

      {loading ? (
        <p className="m-0 mb-3 text-[12.5px] italic text-[#475569]">
          Cargando aulas...
        </p>
      ) : classrooms.length === 0 ? (
        <p className="m-0 mb-3 text-[12.5px] italic text-[#475569]">
          Sin aulas registradas.
        </p>
      ) : (
        <ul className="m-0 mb-3 grid list-none gap-1.5 p-0">
          {classrooms.map((classroom) => (
            <li
              key={classroom.id}
              className="flex items-center justify-between gap-2 rounded-lg border border-[#334155] bg-[#1e293b] px-2.5 py-2"
            >
              <div className="min-w-0">
                <span className="block truncate text-[13px] font-semibold text-[#e2e8f0]">
                  {classroom.code} - {classroom.name}
                </span>
                <span className="text-[11.5px] capitalize text-[#64748b]">
                  {classroom.type} · piso {classroom.floor}
                </span>
              </div>
              <button
                type="button"
                disabled={deletingId === classroom.id}
                onClick={() => void handleDelete(classroom.id)}
                className="grid h-7 w-7 flex-shrink-0 place-items-center rounded-md border border-[rgba(239,68,68,0.25)] bg-transparent text-[16px] font-bold leading-none text-[#ef4444] hover:bg-[rgba(239,68,68,0.12)] disabled:opacity-50"
                aria-label={`Eliminar ${classroom.name}`}
              >
                {deletingId === classroom.id ? "..." : "x"}
              </button>
            </li>
          ))}
        </ul>
      )}

      <div className="grid grid-cols-1 gap-2">
        <input value={code} onChange={(e) => setCode(e.target.value)} placeholder="Clave" disabled={saving} className="min-h-11 rounded-lg border border-[#334155] bg-[#1e293b] px-2.5 text-[13px] text-[#e2e8f0] outline-none focus:border-[#ea580c]" />
        <input value={name} onChange={(e) => setName(e.target.value)} placeholder="Nombre del aula" disabled={saving} className="min-h-11 rounded-lg border border-[#334155] bg-[#1e293b] px-2.5 text-[13px] text-[#e2e8f0] outline-none focus:border-[#ea580c]" />
        <select value={type} onChange={(e) => setType(e.target.value as ClassroomType)} disabled={saving} className="min-h-11 rounded-lg border border-[#334155] bg-[#1e293b] px-2.5 text-[13px] text-[#e2e8f0] outline-none focus:border-[#ea580c]">
          <option value="aula">Aula</option>
          <option value="laboratorio">Laboratorio</option>
          <option value="taller">Taller</option>
          <option value="oficina">Oficina</option>
          <option value="otro">Otro</option>
        </select>
        <input value={floor} onChange={(e) => setFloor(e.target.value)} placeholder="Piso" disabled={saving} className="min-h-11 rounded-lg border border-[#334155] bg-[#1e293b] px-2.5 text-[13px] text-[#e2e8f0] outline-none focus:border-[#ea580c]" />
        <button type="button" disabled={saving || !code.trim() || !name.trim()} onClick={() => void handleAdd()} className="min-h-11 w-full rounded-lg border border-[rgba(234,88,12,0.4)] bg-[#ea580c] px-3.5 text-[13px] font-bold text-white hover:bg-[#c2410c] disabled:cursor-not-allowed disabled:opacity-50">
          {saving ? "..." : "Agregar"}
        </button>
      </div>
    </div>
  );
}

function BuildingProceduresSection({ buildingId }: { buildingId: string }) {
  const [linked, setLinked] = useState<ProcedureForBuilding[]>([]);
  const [allProcedures, setAllProcedures] = useState<Procedure[]>([]);
  const [selectedId, setSelectedId] = useState("");
  const [newName, setNewName] = useState("");
  const [newKind, setNewKind] = useState<ProcedureKind>("servicio");
  const [notes, setNotes] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [buildingProcedures, procedures] = await Promise.all([
        getProceduresByBuildingApi(buildingId),
        getProceduresApi(),
      ]);
      setLinked(buildingProcedures);
      setAllProcedures(procedures.filter((p) => p.is_active));
    } finally {
      setLoading(false);
    }
  }, [buildingId]);

  useEffect(() => {
    void load();
  }, [load]);

  async function handleLinkExisting() {
    if (!selectedId) return;
    setSaving(true);
    try {
      await linkProcedureToBuildingApi(buildingId, {
        procedure_id: selectedId,
        notes: notes.trim() || null,
      });
      setSelectedId("");
      setNotes("");
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
        kind: newKind,
        description: notes.trim() || null,
        is_active: true,
      });
      await linkProcedureToBuildingApi(buildingId, {
        procedure_id: created.id,
        notes: notes.trim() || null,
      });
      setNewName("");
      setNotes("");
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

  return (
    <div className="mb-[18px] rounded-xl border border-[#334155] bg-[#0f172a] p-4">
      <h3 className="m-0 mb-1 text-[13px] font-bold uppercase tracking-wide text-[#f1f5f9]">
        Trámites / servicios vinculados
      </h3>
      <p className="m-0 mb-3 text-[12px] text-[#64748b]">
        Vincula trámites o servicios para que aparezcan en búsqueda y detalle del edificio.
      </p>

      {loading ? (
        <p className="m-0 mb-3 text-[12.5px] italic text-[#475569]">Cargando vínculos...</p>
      ) : linked.length === 0 ? (
        <p className="m-0 mb-3 text-[12.5px] italic text-[#475569]">Sin trámites o servicios vinculados.</p>
      ) : (
        <ul className="m-0 mb-3 grid list-none gap-1.5 p-0">
          {linked.map((procedure) => (
            <li key={procedure.id} className="flex items-center justify-between gap-2 rounded-lg border border-[#334155] bg-[#1e293b] px-2.5 py-2">
              <div className="min-w-0">
                <span className="block truncate text-[13px] font-semibold text-[#e2e8f0]">{procedure.name}</span>
                <span className="text-[11.5px] text-[#64748b]">{procedure.kind === "tramite" ? "Trámite" : "Servicio"}{procedure.notes ? ` · ${procedure.notes}` : ""}</span>
              </div>
              <button type="button" disabled={saving} onClick={() => void handleUnlink(procedure.id)} className="grid h-7 w-7 flex-shrink-0 place-items-center rounded-md border border-[rgba(239,68,68,0.25)] bg-transparent text-[16px] font-bold leading-none text-[#ef4444] hover:bg-[rgba(239,68,68,0.12)] disabled:opacity-50" aria-label={`Desvincular ${procedure.name}`}>
                x
              </button>
            </li>
          ))}
        </ul>
      )}

      <div className="mb-2 grid grid-cols-1 gap-2">
        <select value={selectedId} onChange={(e) => setSelectedId(e.target.value)} disabled={saving} className="min-h-11 rounded-lg border border-[#334155] bg-[#1e293b] px-2.5 text-[13px] text-[#e2e8f0] outline-none focus:border-[#ea580c]">
          <option value="">Vincular existente...</option>
          {available.map((procedure) => (
            <option key={procedure.id} value={procedure.id}>
              {procedure.kind === "tramite" ? "Trámite" : "Servicio"} - {procedure.name}
            </option>
          ))}
        </select>
        <input value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Notas (opcional)" disabled={saving} className="min-h-11 rounded-lg border border-[#334155] bg-[#1e293b] px-2.5 text-[13px] text-[#e2e8f0] outline-none focus:border-[#ea580c]" />
        <button type="button" disabled={saving || !selectedId} onClick={() => void handleLinkExisting()} className="min-h-11 w-full rounded-lg border border-[rgba(234,88,12,0.4)] bg-[#ea580c] px-3.5 text-[13px] font-bold text-white hover:bg-[#c2410c] disabled:cursor-not-allowed disabled:opacity-50">
          Vincular
        </button>
      </div>

      <div className="grid grid-cols-1 gap-2">
        <input value={newName} onChange={(e) => setNewName(e.target.value)} placeholder="Crear nuevo trámite o servicio" disabled={saving} className="min-h-11 rounded-lg border border-[#334155] bg-[#1e293b] px-2.5 text-[13px] text-[#e2e8f0] outline-none focus:border-[#ea580c]" />
        <select value={newKind} onChange={(e) => setNewKind(e.target.value as ProcedureKind)} disabled={saving} className="min-h-11 rounded-lg border border-[#334155] bg-[#1e293b] px-2.5 text-[13px] text-[#e2e8f0] outline-none focus:border-[#ea580c]">
          <option value="servicio">Servicio</option>
          <option value="tramite">Trámite</option>
        </select>
        <button type="button" disabled={saving || !newName.trim()} onClick={() => void handleCreateAndLink()} className="min-h-11 w-full rounded-lg border border-[rgba(234,88,12,0.4)] bg-[#ea580c] px-3.5 text-[13px] font-bold text-white hover:bg-[#c2410c] disabled:cursor-not-allowed disabled:opacity-50">
          Crear y vincular
        </button>
      </div>
    </div>
  );
}

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
  const [touched, setTouched] = useState<Partial<Record<FieldErrorKey, boolean>>>(
    {}
  );

  function touch(field: FieldErrorKey) {
    setTouched((prev) => ({ ...prev, [field]: true }));
  }

  function fieldError(field: FieldErrorKey): string {
    if (!touched[field]) return "";
    return FIELD_RULES[field](form[field] as string);
  }

  const groupTitle =
    "mb-3 flex items-center gap-2 text-[11px] font-bold uppercase tracking-wider text-[#f97316]";
  const errText = "mt-1 block text-[11.5px] font-medium normal-case text-[#f87171]";

  return (
    <form
      onSubmit={onSubmit}
      className="rounded-[18px] border border-[#334155] bg-[#1e293b] p-[22px] shadow-[0_4px_24px_rgba(0,0,0,0.3)]"
    >
      <div className="mb-4 flex items-start justify-between gap-3.5">
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
        {isEditing ? (
          <button
            type="button"
            onClick={onCancelEdit}
            className="inline-flex min-h-11 items-center whitespace-nowrap rounded-[10px] border border-[#334155] bg-transparent px-3 text-[13px] font-semibold text-[#94a3b8] transition-colors duration-[180ms] hover:bg-[#0f172a] hover:text-[#e2e8f0]"
          >
            Cancelar
          </button>
        ) : null}
      </div>

      {/* Identificación */}
      <fieldset className="mb-5 border-0 p-0">
        <legend className={groupTitle}>Identificación</legend>
        <div className="grid grid-cols-2 gap-3.5">
          <label className="block">
            <span className={labelCls}>Código</span>
            <input
              value={form.code}
              onChange={(e) => {
                onUpdateFormField("code", e.target.value);
                touch("code");
              }}
              onBlur={() => touch("code")}
              required
              className={inputClass(!!fieldError("code"))}
              placeholder="EDIF-A"
              aria-describedby={fieldError("code") ? "err-code" : undefined}
            />
            {fieldError("code") ? (
              <span id="err-code" className={errText}>
                {fieldError("code")}
              </span>
            ) : null}
          </label>

          <label className="block">
            <span className={labelCls}>Nombre</span>
            <input
              value={form.name}
              onChange={(e) => {
                onNameChange(e.target.value);
                touch("name");
              }}
              onBlur={() => touch("name")}
              required
              className={inputClass(!!fieldError("name"))}
              placeholder="Edificio A"
              aria-describedby={fieldError("name") ? "err-name" : undefined}
            />
            {fieldError("name") ? (
              <span id="err-name" className={errText}>
                {fieldError("name")}
              </span>
            ) : null}
          </label>

          <label className="col-span-2 block">
            <span className={labelCls}>Slug</span>
            <input
              value={form.slug}
              onChange={(e) => {
                onUpdateFormField("slug", e.target.value);
                touch("slug");
              }}
              onBlur={() => touch("slug")}
              required
              className={inputClass(!!fieldError("slug"))}
              placeholder="edificio-a"
              aria-describedby={fieldError("slug") ? "err-slug" : undefined}
            />
            {fieldError("slug") ? (
              <span id="err-slug" className={errText}>
                {fieldError("slug")}
              </span>
            ) : null}
          </label>
        </div>
      </fieldset>

      {/* Categoría */}
      <fieldset className="mb-5 border-0 p-0">
        <legend className={groupTitle}>Categoría</legend>
        <label className="block">
          <span className={labelCls}>Categoría</span>
          <select
            value={form.category_code}
            onChange={(e) => {
              onUpdateFormField("category_code", e.target.value);
              touch("category_code");
            }}
            onBlur={() => touch("category_code")}
            required
            className={inputClass(!!fieldError("category_code"))}
            aria-describedby={fieldError("category_code") ? "err-cat" : undefined}
          >
            <option value="">Seleccionar…</option>
            {categories
              .filter((category) => Boolean(category.is_active))
              .map((category) => (
                <option key={category.id} value={category.code}>
                  {category.name} ({category.code})
                </option>
              ))}
          </select>
          {fieldError("category_code") ? (
            <span id="err-cat" className={errText}>
              {fieldError("category_code")}
            </span>
          ) : null}
        </label>
      </fieldset>

      {/* Geolocalización */}
      <fieldset className="mb-5 border-0 p-0">
        <legend className={groupTitle}>Geolocalización (modelo 3D)</legend>
        <label className="block">
          <span className={labelCls}>Nodo del modelo 3D</span>
          <input
            value={form.model_node_name}
            onChange={(e) => {
              onUpdateFormField("model_node_name", e.target.value);
              touch("model_node_name");
            }}
            onBlur={() => touch("model_node_name")}
            required
            className={inputClass(!!fieldError("model_node_name"))}
            placeholder="Building_A"
            aria-describedby={
              fieldError("model_node_name") ? "err-node" : undefined
            }
          />
          {fieldError("model_node_name") ? (
            <span id="err-node" className={errText}>
              {fieldError("model_node_name")}
            </span>
          ) : null}
        </label>
      </fieldset>

      {/* Descripción */}
      <fieldset className="mb-5 border-0 p-0">
        <legend className={groupTitle}>Descripción</legend>
        <label className="block">
          <span className={labelCls}>Descripción</span>
          <textarea
            value={form.description}
            onChange={(e) => onUpdateFormField("description", e.target.value)}
            className={`${baseInput} ${okInput} min-h-[90px] resize-y py-2.5`}
            placeholder="Descripción breve del edificio"
          />
        </label>

        <label className="mt-3 flex items-center gap-2.5 text-[13px] font-semibold text-[#94a3b8]">
          <input
            type="checkbox"
            checked={form.is_priority}
            onChange={(e) => onUpdateFormField("is_priority", e.target.checked)}
            className="h-4 w-4 accent-[#ea580c]"
          />
          Marcar como edificio prioritario
        </label>
      </fieldset>

      {buildingId ? (
        <>
          <BuildingServicesSection buildingId={buildingId} />
          <BuildingClassroomsSection buildingId={buildingId} />
          <BuildingProceduresSection buildingId={buildingId} />
        </>
      ) : (
        <div className="mb-[18px] rounded-xl border border-dashed border-[#334155] bg-[#0f172a] p-4 text-[12.5px] text-[#94a3b8]">
          Guarda el edificio para agregar departamentos, aulas, servicios y
          tramites.
        </div>
      )}

      <button
        type="submit"
        disabled={saving}
        className="inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-[10px] border border-[rgba(234,88,12,0.4)] bg-[#ea580c] px-4 text-[14px] font-bold text-white shadow-[0_6px_18px_rgba(234,88,12,0.25)] transition-[transform,background-color] duration-[180ms] hover:-translate-y-px hover:bg-[#c2410c] active:translate-y-0 disabled:cursor-not-allowed disabled:bg-[#475569] disabled:shadow-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[rgba(234,88,12,0.45)] focus-visible:ring-offset-2 focus-visible:ring-offset-[#1e293b]"
      >
        {saving ? (
          <>
            <span
              className="h-4 w-4 animate-spin rounded-full border-2 border-white/40 border-t-white"
              aria-hidden="true"
            />
            Guardando…
          </>
        ) : isEditing ? (
          "Guardar cambios"
        ) : (
          "Crear edificio"
        )}
      </button>
    </form>
  );
}
