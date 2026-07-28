import { useCallback, useEffect, useState } from "react";
import type { Gate, GateAccessType, GateStatus } from "@ito-map/shared";
import {
  createGateApi,
  deleteGateApi,
  getGatesForAdminApi,
  updateGateApi,
  updateGateStatusApi,
} from "@ito-map/shared";
import { AdminLayout } from "../components/AdminLayout";
import { GateLocationPickerModal } from "../../../components/viewer/GateLocationPickerModal";
import type { GatePlacementPosition } from "../../../components/viewer/GatePlacementLayer";

const ACCESS_TYPE_LABEL: Record<GateAccessType, string> = {
  peatonal: "Peatonal",
  vehicular: "Vehicular",
  mixto: "Mixto",
};

const STATUS_LABEL: Record<GateStatus, string> = {
  abierta: "Abierta",
  cerrada: "Cerrada",
  solo_entrada: "Solo entrada",
  solo_salida: "Solo salida",
};

const fieldCls =
  "min-h-11 rounded-lg border border-[#334155] bg-[#0f172a] px-3 text-[13px] text-[#e2e8f0] placeholder:text-[#475569] outline-none focus:border-[#a8442e]";

type GateDraft = {
  name: string;
  description: string;
  access_type: GateAccessType;
  status: GateStatus;
  x: string;
  y: string;
  z: string;
};

const EMPTY_DRAFT: GateDraft = {
  name: "",
  description: "",
  access_type: "peatonal",
  status: "abierta",
  x: "",
  y: "0",
  z: "",
};

function draftToInput(draft: GateDraft) {
  return {
    name: draft.name.trim(),
    description: draft.description.trim() || null,
    access_type: draft.access_type,
    status: draft.status,
    x: Number(draft.x),
    y: Number(draft.y || "0"),
    z: Number(draft.z),
  };
}

function gateToDraft(gate: Gate): GateDraft {
  return {
    name: gate.name,
    description: gate.description ?? "",
    access_type: gate.access_type,
    status: gate.status,
    x: String(gate.x),
    y: String(gate.y),
    z: String(gate.z),
  };
}

function isDraftValid(draft: GateDraft): boolean {
  return (
    draft.name.trim().length > 0 &&
    draft.x.trim() !== "" &&
    !Number.isNaN(Number(draft.x)) &&
    draft.z.trim() !== "" &&
    !Number.isNaN(Number(draft.z))
  );
}

export function AdminGatesPage() {
  const [gates, setGates] = useState<Gate[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [creating, setCreating] = useState(false);
  const [newDraft, setNewDraft] = useState<GateDraft>(EMPTY_DRAFT);
  const [createSaving, setCreateSaving] = useState(false);
  const [createError, setCreateError] = useState<string | null>(null);

  const [editingId, setEditingId] = useState<string | null>(null);
  const [editDraft, setEditDraft] = useState<GateDraft>(EMPTY_DRAFT);
  const [editSaving, setEditSaving] = useState(false);
  const [editError, setEditError] = useState<string | null>(null);

  const [statusLoadingId, setStatusLoadingId] = useState<string | null>(null);
  const [confirmDelete, setConfirmDelete] = useState<Gate | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [locationPickerTarget, setLocationPickerTarget] = useState<"create" | "edit" | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      setGates(await getGatesForAdminApi());
    } catch (err) {
      setError(err instanceof Error ? err.message : "No se pudieron cargar las puertas.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  async function handleCreate() {
    if (!isDraftValid(newDraft)) return;
    setCreateSaving(true);
    setCreateError(null);
    try {
      await createGateApi({ ...draftToInput(newDraft), is_active: true });
      setNewDraft(EMPTY_DRAFT);
      setCreating(false);
      await load();
    } catch (err) {
      setCreateError(err instanceof Error ? err.message : "Error al crear la puerta");
    } finally {
      setCreateSaving(false);
    }
  }

  function startEdit(gate: Gate) {
    setEditingId(gate.id);
    setEditDraft(gateToDraft(gate));
    setEditError(null);
  }

  function cancelEdit() {
    setEditingId(null);
    setEditError(null);
  }

  async function handleSaveEdit() {
    if (!editingId || !isDraftValid(editDraft)) return;
    setEditSaving(true);
    setEditError(null);
    try {
      await updateGateApi(editingId, draftToInput(editDraft));
      cancelEdit();
      await load();
    } catch (err) {
      setEditError(err instanceof Error ? err.message : "Error al guardar los cambios");
    } finally {
      setEditSaving(false);
    }
  }

  async function handleToggleStatus(gate: Gate) {
    setStatusLoadingId(gate.id);
    try {
      await updateGateStatusApi(gate.id, !gate.is_active);
      await load();
    } finally {
      setStatusLoadingId(null);
    }
  }

  async function handleConfirmDelete() {
    if (!confirmDelete) return;
    setDeleting(true);
    try {
      await deleteGateApi(confirmDelete.id);
      setConfirmDelete(null);
      await load();
    } finally {
      setDeleting(false);
    }
  }

  function getPickerInitialPosition(): GatePlacementPosition | null {
    const draft = locationPickerTarget === "edit" ? editDraft : newDraft;
    if (draft.x.trim() === "" || draft.z.trim() === "") return null;
    const x = Number(draft.x);
    const z = Number(draft.z);
    return Number.isFinite(x) && Number.isFinite(z) ? { x, z } : null;
  }

  function handleLocationConfirm(position: GatePlacementPosition) {
    const coordinates = { x: String(position.x), z: String(position.z) };
    if (locationPickerTarget === "edit") {
      setEditDraft((current) => ({ ...current, ...coordinates }));
    } else {
      setNewDraft((current) => ({ ...current, ...coordinates }));
    }
    setLocationPickerTarget(null);
  }

  const activeCount = gates.filter((g) => g.is_active).length;

  return (
    <AdminLayout>
      <div className="admin-page-shell min-h-full px-8 py-7 max-[640px]:px-3.5 max-[640px]:py-4">
        <header className="mb-7 flex items-start justify-between gap-4 max-[640px]:mb-4 max-[640px]:flex-col">
          <div>
            <p className="m-0 mb-1.5 text-[11px] font-bold uppercase tracking-wider text-[#c15a3e]">
              Gestión de campus
            </p>
            <h1 className="m-0 mb-1.5 text-[28px] font-bold leading-tight text-[#f1f5f9] max-[640px]:text-[23px]">
              Puertas y accesos
            </h1>
            <p className="m-0 text-[14px] text-[#64748b] max-[640px]:text-[13px]">
              Accesos peatonales y vehiculares del campus, visibles como puntos de interés en el mapa 3D.
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
            Nueva puerta
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
              <span className="text-[24px] font-bold leading-none text-[#f1f5f9]">{gates.length}</span>
              <span className="text-[11px] font-semibold uppercase tracking-wide text-[#64748b]">Total</span>
            </div>
            <div className="flex min-w-[90px] flex-col gap-0.5 rounded-xl border border-[#334155] bg-[#1e293b] px-5 py-3.5">
              <span className="text-[24px] font-bold leading-none text-[#22c55e]">{activeCount}</span>
              <span className="text-[11px] font-semibold uppercase tracking-wide text-[#64748b]">Activas</span>
            </div>
            <div className="flex min-w-[90px] flex-col gap-0.5 rounded-xl border border-[#334155] bg-[#1e293b] px-5 py-3.5">
              <span className="text-[24px] font-bold leading-none text-[#f59e0b]">{gates.length - activeCount}</span>
              <span className="text-[11px] font-semibold uppercase tracking-wide text-[#64748b]">Inactivas</span>
            </div>
          </div>
        )}

        {creating ? (
          <div className="mb-6 rounded-xl border border-[#1e3050] bg-[#131e2e] p-4">
            <p className="m-0 mb-3 text-[11px] font-bold uppercase tracking-wide text-[#475569]">Nueva puerta</p>
            <div className="grid grid-cols-2 gap-2 max-[640px]:grid-cols-1">
              <input
                value={newDraft.name}
                onChange={(e) => setNewDraft({ ...newDraft, name: e.target.value })}
                placeholder="Nombre (ej. Puerta Norte)"
                disabled={createSaving}
                className={fieldCls}
              />
              <input
                value={newDraft.description}
                onChange={(e) => setNewDraft({ ...newDraft, description: e.target.value })}
                placeholder="Descripción (opcional)"
                disabled={createSaving}
                className={fieldCls}
              />
              <select
                value={newDraft.access_type}
                onChange={(e) =>
                  setNewDraft({ ...newDraft, access_type: e.target.value as GateAccessType })
                }
                disabled={createSaving}
                className={fieldCls}
              >
                {Object.entries(ACCESS_TYPE_LABEL).map(([value, label]) => (
                  <option key={value} value={value}>{label}</option>
                ))}
              </select>
              <select
                value={newDraft.status}
                onChange={(e) => setNewDraft({ ...newDraft, status: e.target.value as GateStatus })}
                disabled={createSaving}
                className={fieldCls}
              >
                {Object.entries(STATUS_LABEL).map(([value, label]) => (
                  <option key={value} value={value}>{label}</option>
                ))}
              </select>
              <input
                type="number"
                value={newDraft.x}
                onChange={(e) => setNewDraft({ ...newDraft, x: e.target.value })}
                placeholder="Coordenada X"
                disabled={createSaving}
                className={fieldCls}
              />
              <input
                type="number"
                value={newDraft.z}
                onChange={(e) => setNewDraft({ ...newDraft, z: e.target.value })}
                placeholder="Coordenada Z"
                disabled={createSaving}
                className={fieldCls}
              />
              <button
                type="button"
                disabled={createSaving}
                onClick={() => setLocationPickerTarget("create")}
                className="col-span-2 inline-flex min-h-11 items-center justify-center gap-2 rounded-lg border border-[#c15a3e]/35 bg-[#c15a3e]/10 px-3.5 text-[13px] font-bold text-[#c56b52] hover:bg-[#c15a3e]/20 max-[640px]:col-span-1"
              >
                <span aria-hidden="true">⌖</span>
                Ubicar en el mapa 3D
              </button>
              {createError ? (
                <p className="col-span-2 m-0 rounded-lg border border-[rgba(239,68,68,0.25)] bg-[rgba(239,68,68,0.08)] px-3 py-2 text-[12px] text-[#f87171]">
                  {createError}
                </p>
              ) : null}
              <button
                type="button"
                disabled={createSaving || !isDraftValid(newDraft)}
                onClick={() => void handleCreate()}
                className="min-h-11 rounded-lg border border-[rgba(168,68,46,0.4)] bg-[#a8442e] px-3.5 text-[13px] font-bold text-white hover:bg-[#833323] disabled:cursor-not-allowed disabled:opacity-50"
              >
                {createSaving ? "Creando…" : "Crear puerta"}
              </button>
              <button
                type="button"
                disabled={createSaving}
                onClick={() => { setCreating(false); setCreateError(null); setNewDraft(EMPTY_DRAFT); }}
                className="min-h-11 rounded-lg border border-[#334155] bg-transparent text-[13px] font-semibold text-[#94a3b8] hover:bg-[#0f172a]"
              >
                Cancelar
              </button>
            </div>
            <p className="m-0 mt-3 text-[11.5px] text-[#475569]">
              Las coordenadas X/Z ubican la puerta dentro del mapa 3D (mismo sistema que los edificios).
            </p>
          </div>
        ) : null}

        <div className="rounded-[14px] border border-[#334155] bg-[#1e293b] overflow-hidden">
          {loading ? (
            <div className="flex flex-col items-center gap-2.5 py-12">
              <span className="h-8 w-8 animate-spin rounded-full border-[3px] border-[rgba(255,255,255,0.08)] border-t-[#c15a3e]" />
              <p className="m-0 text-[14px] text-[#64748b]">Cargando puertas…</p>
            </div>
          ) : !error && gates.length === 0 ? (
            <div className="flex flex-col items-center gap-2.5 py-12">
              <p className="m-0 text-[14px] text-[#64748b]">Aún no hay puertas registradas.</p>
            </div>
          ) : !error ? (
            <ul className="m-0 grid list-none gap-0 p-0">
              {gates.map((gate) => (
                <li key={gate.id} className="border-b border-[#334155] last:border-b-0">
                  {editingId === gate.id ? (
                    <div className="flex flex-col gap-2.5 p-4">
                      <div className="grid grid-cols-2 gap-2.5 max-[640px]:grid-cols-1">
                        <input
                          value={editDraft.name}
                          onChange={(e) => setEditDraft({ ...editDraft, name: e.target.value })}
                          disabled={editSaving}
                          className={fieldCls}
                        />
                        <input
                          value={editDraft.description}
                          onChange={(e) => setEditDraft({ ...editDraft, description: e.target.value })}
                          placeholder="Descripción (opcional)"
                          disabled={editSaving}
                          className={fieldCls}
                        />
                        <select
                          value={editDraft.access_type}
                          onChange={(e) =>
                            setEditDraft({ ...editDraft, access_type: e.target.value as GateAccessType })
                          }
                          disabled={editSaving}
                          className={fieldCls}
                        >
                          {Object.entries(ACCESS_TYPE_LABEL).map(([value, label]) => (
                            <option key={value} value={value}>{label}</option>
                          ))}
                        </select>
                        <select
                          value={editDraft.status}
                          onChange={(e) =>
                            setEditDraft({ ...editDraft, status: e.target.value as GateStatus })
                          }
                          disabled={editSaving}
                          className={fieldCls}
                        >
                          {Object.entries(STATUS_LABEL).map(([value, label]) => (
                            <option key={value} value={value}>{label}</option>
                          ))}
                        </select>
                        <input
                          type="number"
                          value={editDraft.x}
                          onChange={(e) => setEditDraft({ ...editDraft, x: e.target.value })}
                          placeholder="Coordenada X"
                          disabled={editSaving}
                          className={fieldCls}
                        />
                        <input
                          type="number"
                          value={editDraft.z}
                          onChange={(e) => setEditDraft({ ...editDraft, z: e.target.value })}
                          placeholder="Coordenada Z"
                          disabled={editSaving}
                          className={fieldCls}
                        />
                        <button
                          type="button"
                          disabled={editSaving}
                          onClick={() => setLocationPickerTarget("edit")}
                          className="col-span-2 inline-flex min-h-11 items-center justify-center gap-2 rounded-lg border border-[#c15a3e]/35 bg-[#c15a3e]/10 px-3.5 text-[13px] font-bold text-[#c56b52] hover:bg-[#c15a3e]/20 max-[640px]:col-span-1"
                        >
                          <span aria-hidden="true">⌖</span>
                          Cambiar ubicación en el mapa 3D
                        </button>
                      </div>
                      {editError ? (
                        <p className="m-0 rounded-lg border border-[rgba(239,68,68,0.25)] bg-[rgba(239,68,68,0.08)] px-3 py-2 text-[12px] text-[#f87171]">
                          {editError}
                        </p>
                      ) : null}
                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          disabled={editSaving || !isDraftValid(editDraft)}
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
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="truncate text-[14px] font-semibold text-[#e2e8f0]">{gate.name}</span>
                          <span className="inline-block rounded-full border border-[#334155] bg-[#0f172a] px-2.5 py-[2px] text-[11px] font-semibold text-[#94a3b8]">
                            {ACCESS_TYPE_LABEL[gate.access_type]}
                          </span>
                          <span className="inline-block rounded-full border border-[rgba(13,148,136,0.25)] bg-[rgba(13,148,136,0.12)] px-2.5 py-[2px] text-[11px] font-semibold text-[#2dd4bf]">
                            {STATUS_LABEL[gate.status]}
                          </span>
                          <span
                            className={
                              gate.is_active
                                ? "inline-block rounded-full border border-[rgba(34,197,94,0.25)] bg-[rgba(34,197,94,0.12)] px-2.5 py-[2px] text-[11px] font-semibold text-[#86efac]"
                                : "inline-block rounded-full border border-[rgba(100,116,139,0.25)] bg-[rgba(100,116,139,0.12)] px-2.5 py-[2px] text-[11px] font-semibold text-[#94a3b8]"
                            }
                          >
                            {gate.is_active ? "Activa" : "Inactiva"}
                          </span>
                        </div>
                        {gate.description ? (
                          <p className="m-0 mt-0.5 truncate text-[12.5px] text-[#64748b]">{gate.description}</p>
                        ) : null}
                        <p className="m-0 mt-1 text-[11.5px] text-[#475569]">
                          X: {gate.x} · Z: {gate.z}
                        </p>
                      </div>

                      <div className="flex flex-shrink-0 items-center gap-1.5">
                        <button
                          type="button"
                          onClick={() => startEdit(gate)}
                          className="grid h-8 w-8 place-items-center rounded-md border border-[#334155] bg-transparent text-[#94a3b8] hover:bg-[#0f172a] hover:text-[#e2e8f0]"
                          aria-label={`Editar ${gate.name}`}
                          title="Editar"
                        >
                          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7" />
                            <path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z" />
                          </svg>
                        </button>
                        <button
                          type="button"
                          disabled={statusLoadingId === gate.id}
                          onClick={() => void handleToggleStatus(gate)}
                          className="inline-flex h-8 items-center rounded-md border border-[#334155] bg-transparent px-2.5 text-[11.5px] font-semibold text-[#94a3b8] hover:bg-[#0f172a] hover:text-[#e2e8f0] disabled:opacity-50"
                          title={gate.is_active ? "Desactivar" : "Activar"}
                        >
                          {statusLoadingId === gate.id ? "…" : gate.is_active ? "Desactivar" : "Activar"}
                        </button>
                        <button
                          type="button"
                          onClick={() => setConfirmDelete(gate)}
                          className="grid h-8 w-8 place-items-center rounded-md border border-[rgba(239,68,68,0.25)] bg-transparent text-[#ef4444] hover:bg-[rgba(239,68,68,0.12)]"
                          aria-label={`Eliminar ${gate.name}`}
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
          aria-labelledby="confirm-delete-gate-title"
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
            <h2 id="confirm-delete-gate-title" className="m-0 mb-2.5 text-[18px] font-bold text-[#f1f5f9]">
              ¿Eliminar puerta?
            </h2>
            <p className="m-0 mb-[22px] text-[14px] leading-relaxed text-[#94a3b8]">
              Estás a punto de eliminar <strong className="text-[#f1f5f9]">{confirmDelete.name}</strong> del mapa.
              Esta acción no se puede deshacer.
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

      {locationPickerTarget ? (
        <GateLocationPickerModal
          initialPosition={getPickerInitialPosition()}
          onConfirm={handleLocationConfirm}
          onClose={() => setLocationPickerTarget(null)}
        />
      ) : null}
    </AdminLayout>
  );
}
