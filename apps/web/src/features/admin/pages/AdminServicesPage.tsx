import { useCallback, useEffect, useState } from "react";
import type { ProcedureForAdmin, ProcedureBuilding } from "@ito-map/shared";
import {
  createProcedureApi,
  deleteProcedureApi,
  getProcedureByIdApi,
  getProceduresForAdminApi,
  updateProcedureApi,
  updateProcedureStatusApi,
} from "@ito-map/shared";
import { AdminLayout } from "../components/AdminLayout";

function slugify(value: string): string {
  return value
    .trim()
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

const fieldCls =
  "min-h-11 rounded-lg border border-[#334155] bg-[#0f172a] px-3 text-[13px] text-[#e2e8f0] placeholder:text-[#475569] outline-none focus:border-[#a8442e]";

export function AdminServicesPage() {
  const [services, setServices] = useState<ProcedureForAdmin[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [creating, setCreating] = useState(false);
  const [newName, setNewName] = useState("");
  const [newDescription, setNewDescription] = useState("");
  const [createSaving, setCreateSaving] = useState(false);
  const [createError, setCreateError] = useState<string | null>(null);

  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState("");
  const [editDescription, setEditDescription] = useState("");
  const [editSaving, setEditSaving] = useState(false);
  const [editError, setEditError] = useState<string | null>(null);

  const [statusLoadingId, setStatusLoadingId] = useState<string | null>(null);
  const [confirmDelete, setConfirmDelete] = useState<ProcedureForAdmin | null>(null);
  const [deleting, setDeleting] = useState(false);

  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [buildingsByProcedure, setBuildingsByProcedure] = useState<
    Record<string, ProcedureBuilding[]>
  >({});
  const [expandLoadingId, setExpandLoadingId] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      setServices(await getProceduresForAdminApi({ kind: "servicio" }));
    } catch (err) {
      setError(err instanceof Error ? err.message : "No se pudieron cargar los servicios.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { void load(); }, [load]);

  async function handleCreate() {
    const name = newName.trim();
    if (!name) return;
    setCreateSaving(true);
    setCreateError(null);
    try {
      await createProcedureApi({
        name,
        slug: slugify(name),
        kind: "servicio",
        description: newDescription.trim() || null,
        is_active: true,
      });
      setNewName("");
      setNewDescription("");
      setCreating(false);
      await load();
    } catch (err) {
      setCreateError(err instanceof Error ? err.message : "Error al crear el servicio");
    } finally {
      setCreateSaving(false);
    }
  }

  function startEdit(service: ProcedureForAdmin) {
    setEditingId(service.id);
    setEditName(service.name);
    setEditDescription(service.description ?? "");
    setEditError(null);
  }

  function cancelEdit() {
    setEditingId(null);
    setEditError(null);
  }

  async function handleSaveEdit() {
    if (!editingId) return;
    const name = editName.trim();
    if (!name) return;
    setEditSaving(true);
    setEditError(null);
    try {
      await updateProcedureApi(editingId, {
        name,
        description: editDescription.trim() || null,
      });
      cancelEdit();
      await load();
    } catch (err) {
      setEditError(err instanceof Error ? err.message : "Error al guardar los cambios");
    } finally {
      setEditSaving(false);
    }
  }

  async function handleToggleStatus(service: ProcedureForAdmin) {
    setStatusLoadingId(service.id);
    try {
      await updateProcedureStatusApi(service.id, !service.is_active);
      await load();
    } finally {
      setStatusLoadingId(null);
    }
  }

  async function handleConfirmDelete() {
    if (!confirmDelete) return;
    setDeleting(true);
    try {
      await deleteProcedureApi(confirmDelete.id);
      setConfirmDelete(null);
      await load();
    } finally {
      setDeleting(false);
    }
  }

  async function toggleExpand(service: ProcedureForAdmin) {
    if (expandedId === service.id) {
      setExpandedId(null);
      return;
    }
    setExpandedId(service.id);
    if (!buildingsByProcedure[service.id]) {
      setExpandLoadingId(service.id);
      try {
        const detail = await getProcedureByIdApi(service.id);
        setBuildingsByProcedure((prev) => ({ ...prev, [service.id]: detail.buildings }));
      } finally {
        setExpandLoadingId(null);
      }
    }
  }

  const activeCount = services.filter((s) => s.is_active).length;

  return (
    <AdminLayout>
      <div className="admin-page-shell min-h-full px-8 py-7 max-[640px]:px-3.5 max-[640px]:py-4">
        <header className="mb-7 flex items-start justify-between gap-4 max-[640px]:mb-4 max-[640px]:flex-col">
          <div>
            <p className="m-0 mb-1.5 text-[11px] font-bold uppercase tracking-wider text-[#c15a3e]">
              Gestión de campus
            </p>
            <h1 className="m-0 mb-1.5 text-[28px] font-bold leading-tight text-[#f1f5f9] max-[640px]:text-[23px]">
              Catálogo de servicios
            </h1>
            <p className="m-0 text-[14px] text-[#64748b] max-[640px]:text-[13px]">
              Servicios reutilizables que puedes asignar a uno o varios edificios o departamentos.
            </p>
          </div>
          <button
            type="button"
            onClick={() => setCreating((v) => !v)}
            className="inline-flex min-h-11 flex-shrink-0 items-center gap-2 rounded-[10px] border border-[rgba(168,68,46,0.4)] bg-[#a8442e] px-4 text-[13.5px] font-bold text-white transition-[transform,background-color] hover:-translate-y-px hover:bg-[#833323] active:translate-y-0"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" aria-hidden="true">
              <line x1="12" y1="5" x2="12" y2="19" />
              <line x1="5" y1="12" x2="19" y2="12" />
            </svg>
            Nuevo servicio
          </button>
        </header>

        {error ? (
          <div role="alert" className="mb-[18px] flex items-center gap-2.5 rounded-[10px] border border-[rgba(239,68,68,0.25)] bg-[rgba(239,68,68,0.1)] px-3.5 py-3 text-[13.5px] font-medium text-[#fca5a5]">
            {error}
          </div>
        ) : null}

        {!loading && !error && (
          <div className="mb-6 flex gap-4">
            <div className="flex min-w-[90px] flex-col gap-0.5 rounded-xl border border-[#334155] bg-[#1e293b] px-5 py-3.5">
              <span className="text-[24px] font-bold leading-none text-[#f1f5f9]">{services.length}</span>
              <span className="text-[11px] font-semibold uppercase tracking-wide text-[#64748b]">Total</span>
            </div>
            <div className="flex min-w-[90px] flex-col gap-0.5 rounded-xl border border-[#334155] bg-[#1e293b] px-5 py-3.5">
              <span className="text-[24px] font-bold leading-none text-[#22c55e]">{activeCount}</span>
              <span className="text-[11px] font-semibold uppercase tracking-wide text-[#64748b]">Activos</span>
            </div>
            <div className="flex min-w-[90px] flex-col gap-0.5 rounded-xl border border-[#334155] bg-[#1e293b] px-5 py-3.5">
              <span className="text-[24px] font-bold leading-none text-[#f59e0b]">{services.length - activeCount}</span>
              <span className="text-[11px] font-semibold uppercase tracking-wide text-[#64748b]">Inactivos</span>
            </div>
          </div>
        )}

        {creating ? (
          <div className="mb-6 rounded-xl border border-[#1e3050] bg-[#131e2e] p-4">
            <p className="m-0 mb-3 text-[11px] font-bold uppercase tracking-wide text-[#475569]">Nuevo servicio en el catálogo</p>
            <div className="grid grid-cols-2 gap-2 max-[640px]:grid-cols-1">
              <input
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                placeholder="Nombre del servicio"
                disabled={createSaving}
                className={fieldCls}
              />
              <input
                value={newDescription}
                onChange={(e) => setNewDescription(e.target.value)}
                placeholder="Descripción (opcional)"
                disabled={createSaving}
                className={fieldCls}
              />
              {createError ? (
                <p className="col-span-2 m-0 rounded-lg border border-[rgba(239,68,68,0.25)] bg-[rgba(239,68,68,0.08)] px-3 py-2 text-[12px] text-[#f87171]">
                  {createError}
                </p>
              ) : null}
              <button
                type="button"
                disabled={createSaving || !newName.trim()}
                onClick={() => void handleCreate()}
                className="min-h-11 rounded-lg border border-[rgba(168,68,46,0.4)] bg-[#a8442e] px-3.5 text-[13px] font-bold text-white hover:bg-[#833323] disabled:cursor-not-allowed disabled:opacity-50"
              >
                {createSaving ? "Creando…" : "Crear servicio"}
              </button>
              <button
                type="button"
                disabled={createSaving}
                onClick={() => { setCreating(false); setCreateError(null); }}
                className="min-h-11 rounded-lg border border-[#334155] bg-transparent text-[13px] font-semibold text-[#94a3b8] hover:bg-[#0f172a]"
              >
                Cancelar
              </button>
            </div>
            <p className="m-0 mt-3 text-[11.5px] text-[#475569]">
              Después de crearlo, asígnalo a edificios desde la pestaña "Servicios" del editor de cada edificio.
            </p>
          </div>
        ) : null}

        <div className="rounded-[14px] border border-[#334155] bg-[#1e293b] overflow-hidden">
          {loading ? (
            <div className="flex flex-col items-center gap-2.5 py-12">
              <span className="h-8 w-8 animate-spin rounded-full border-[3px] border-[rgba(255,255,255,0.08)] border-t-[#c15a3e]" />
              <p className="m-0 text-[14px] text-[#64748b]">Cargando catálogo…</p>
            </div>
          ) : !error && services.length === 0 ? (
            <div className="flex flex-col items-center gap-2.5 py-12">
              <p className="m-0 text-[14px] text-[#64748b]">Aún no hay servicios registrados.</p>
            </div>
          ) : !error ? (
            <ul className="m-0 grid list-none gap-0 p-0">
              {services.map((service) => (
                <li key={service.id} className="border-b border-[#334155] last:border-b-0">
                  {editingId === service.id ? (
                    <div className="flex flex-col gap-2.5 p-4">
                      <div className="grid grid-cols-2 gap-2.5 max-[640px]:grid-cols-1">
                        <input
                          value={editName}
                          onChange={(e) => setEditName(e.target.value)}
                          disabled={editSaving}
                          className={fieldCls}
                        />
                        <input
                          value={editDescription}
                          onChange={(e) => setEditDescription(e.target.value)}
                          placeholder="Descripción (opcional)"
                          disabled={editSaving}
                          className={fieldCls}
                        />
                      </div>
                      {editError ? (
                        <p className="m-0 rounded-lg border border-[rgba(239,68,68,0.25)] bg-[rgba(239,68,68,0.08)] px-3 py-2 text-[12px] text-[#f87171]">
                          {editError}
                        </p>
                      ) : null}
                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          disabled={editSaving || !editName.trim()}
                          onClick={() => void handleSaveEdit()}
                          className="min-h-9 flex-1 rounded-lg border border-[rgba(168,68,46,0.4)] bg-[#a8442e] px-3 text-[12.5px] font-bold text-white hover:bg-[#833323] disabled:cursor-not-allowed disabled:opacity-50"
                        >
                          {editSaving ? "Guardando…" : "Guardar cambios"}
                        </button>
                        <button
                          type="button"
                          disabled={editSaving}
                          onClick={cancelEdit}
                          className="min-h-9 flex-1 rounded-lg border border-[#334155] bg-transparent px-3 text-[12.5px] font-semibold text-[#94a3b8] hover:bg-[#0f172a]"
                        >
                          Cancelar
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="flex items-center justify-between gap-3 px-4 py-3.5 max-[640px]:flex-col max-[640px]:items-start">
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2">
                          <span className="truncate text-[14px] font-semibold text-[#e2e8f0]">{service.name}</span>
                          <span
                            className={
                              service.is_active
                                ? "inline-block rounded-full border border-[rgba(34,197,94,0.25)] bg-[rgba(34,197,94,0.12)] px-2.5 py-[2px] text-[11px] font-semibold text-[#86efac]"
                                : "inline-block rounded-full border border-[rgba(100,116,139,0.25)] bg-[rgba(100,116,139,0.12)] px-2.5 py-[2px] text-[11px] font-semibold text-[#94a3b8]"
                            }
                          >
                            {service.is_active ? "Activo" : "Inactivo"}
                          </span>
                        </div>
                        {service.description ? (
                          <p className="m-0 mt-0.5 truncate text-[12.5px] text-[#64748b]">{service.description}</p>
                        ) : null}
                        <button
                          type="button"
                          onClick={() => void toggleExpand(service)}
                          className="mt-1.5 inline-flex items-center gap-1 text-[12px] font-semibold text-[#94a3b8] hover:text-[#e2e8f0]"
                        >
                          <svg
                            width="10"
                            height="10"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="3"
                            style={{ transform: expandedId === service.id ? "rotate(90deg)" : "none", transition: "transform 0.15s ease" }}
                          >
                            <polyline points="9 18 15 12 9 6" />
                          </svg>
                          {service.building_count === 0
                            ? "Sin edificios asignados"
                            : service.building_count === 1
                              ? "1 edificio asignado"
                              : `${service.building_count} edificios asignados`}
                        </button>
                        {expandedId === service.id ? (
                          <div className="mt-2 flex flex-wrap gap-1.5">
                            {expandLoadingId === service.id ? (
                              <span className="text-[12px] italic text-[#475569]">Cargando…</span>
                            ) : (buildingsByProcedure[service.id]?.length ?? 0) === 0 ? (
                              <span className="text-[12px] italic text-[#475569]">Ningún edificio lo tiene asignado todavía.</span>
                            ) : (
                              buildingsByProcedure[service.id]?.map((b) => (
                                <span
                                  key={b.id}
                                  className="rounded-md border border-[#334155] bg-[#0f172a] px-2 py-1 text-[11.5px] font-medium text-[#cbd5e1]"
                                >
                                  {b.name}
                                </span>
                              ))
                            )}
                          </div>
                        ) : null}
                      </div>

                      <div className="flex flex-shrink-0 items-center gap-1.5">
                        <button
                          type="button"
                          onClick={() => startEdit(service)}
                          className="grid h-8 w-8 place-items-center rounded-md border border-[#334155] bg-transparent text-[#94a3b8] hover:bg-[#0f172a] hover:text-[#e2e8f0]"
                          aria-label={`Editar ${service.name}`}
                          title="Editar"
                        >
                          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7" />
                            <path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z" />
                          </svg>
                        </button>
                        <button
                          type="button"
                          disabled={statusLoadingId === service.id}
                          onClick={() => void handleToggleStatus(service)}
                          className="inline-flex h-8 items-center rounded-md border border-[#334155] bg-transparent px-2.5 text-[11.5px] font-semibold text-[#94a3b8] hover:bg-[#0f172a] hover:text-[#e2e8f0] disabled:opacity-50"
                          title={service.is_active ? "Desactivar" : "Activar"}
                        >
                          {statusLoadingId === service.id ? "…" : service.is_active ? "Desactivar" : "Activar"}
                        </button>
                        <button
                          type="button"
                          onClick={() => setConfirmDelete(service)}
                          className="grid h-8 w-8 place-items-center rounded-md border border-[rgba(239,68,68,0.25)] bg-transparent text-[#ef4444] hover:bg-[rgba(239,68,68,0.12)]"
                          aria-label={`Eliminar ${service.name}`}
                          title="Eliminar"
                        >
                          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <polyline points="3 6 5 6 21 6" />
                            <path d="M19 6l-1 14a2 2 0 01-2 2H8a2 2 0 01-2-2L5 6" />
                          </svg>
                        </button>
                      </div>
                    </div>
                  )}
                </li>
              ))}
            </ul>
          ) : null}
        </div>
      </div>

      {confirmDelete ? (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="confirm-delete-service-title"
          className="fixed inset-0 z-50 grid place-items-center bg-black/65 p-6 backdrop-blur-sm"
        >
          <div className="w-full max-w-[400px] rounded-[18px] border border-[#334155] bg-[#1e293b] p-7 shadow-[0_24px_60px_rgba(0,0,0,0.5)]">
            <div className="mb-4 grid h-11 w-11 place-items-center rounded-xl border border-[rgba(239,68,68,0.2)] bg-[rgba(239,68,68,0.1)]">
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#ef4444" strokeWidth="2">
                <polyline points="3 6 5 6 21 6" />
                <path d="M19 6l-1 14a2 2 0 01-2 2H8a2 2 0 01-2-2L5 6" />
                <path d="M10 11v6M14 11v6" />
                <path d="M9 6V4a1 1 0 011-1h4a1 1 0 011 1v2" />
              </svg>
            </div>
            <h2 id="confirm-delete-service-title" className="m-0 mb-2.5 text-[18px] font-bold text-[#f1f5f9]">
              ¿Eliminar servicio?
            </h2>
            <p className="m-0 mb-[22px] text-[14px] leading-relaxed text-[#94a3b8]">
              Estás a punto de eliminar <strong className="text-[#f1f5f9]">{confirmDelete.name}</strong> del catálogo.
              {confirmDelete.building_count > 0
                ? ` Se quitará también de los ${confirmDelete.building_count} edificio(s) que lo tienen asignado.`
                : ""}
              {" "}Esta acción no se puede deshacer.
            </p>
            <div className="flex justify-end gap-2.5">
              <button
                type="button"
                onClick={() => setConfirmDelete(null)}
                disabled={deleting}
                className="inline-flex min-h-11 items-center rounded-[10px] border border-[#334155] bg-transparent px-[18px] text-[13.5px] font-semibold text-[#94a3b8] hover:bg-[#0f172a] hover:text-[#e2e8f0] disabled:opacity-50"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={() => void handleConfirmDelete()}
                disabled={deleting}
                className="inline-flex min-h-11 items-center rounded-[10px] border border-[rgba(239,68,68,0.4)] bg-[#dc2626] px-[18px] text-[13.5px] font-bold text-white hover:bg-[#b91c1c] disabled:opacity-50"
              >
                {deleting ? "Eliminando…" : "Sí, eliminar"}
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </AdminLayout>
  );
}
