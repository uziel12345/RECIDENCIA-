import { useState } from "react";
import { useNavigate } from "react-router-dom";
import type { Building } from "@ito-map/shared";
import { useAdminAuthStore } from "../../../store/admin-auth-store";
import { BuildingImagesModal } from "../components/BuildingImagesModal";
import { BuildingTable } from "../components/BuildingTable";
import { AdminLayout } from "../components/AdminLayout";
import { useAdminBuildings } from "../hooks/useAdminBuildings";
import { safeText } from "../hooks/useBuildingForm";

export function AdminBuildingsPage() {
  const navigate = useNavigate();
  const { user } = useAdminAuthStore();
  const isSuperAdmin = user?.role === "superadmin";
  const isAdmin = user?.role === "admin" || isSuperAdmin;
  const canEditBuildings = isAdmin;
  const canEditPhotos = isAdmin;
  const canEditNavigation = isAdmin;

  const {
    buildings,
    searchTerm,
    statusFilter,
    loadingBuildings,
    actionLoadingId,
    error,
    message,
    page,
    totalPages,
    totalRecords,
    imageModalBuilding,
    filteredBuildings,
    setSearchTerm,
    setStatusFilter,
    setPage,
    setImageModalBuilding,
    loadBuildings,
    handleToggleStatus,
    handleDelete,
  } = useAdminBuildings();

  const [confirmBuilding, setConfirmBuilding] = useState<Building | null>(null);
  const [deleting, setDeleting] = useState(false);

  function handleOpenCreate() {
    navigate("/admin/buildings/new");
  }

  function handleStartEditRow(building: Building) {
    navigate(`/admin/buildings/${building.id}/edit`);
  }

  function handleDeleteRequest(building: Building) {
    setConfirmBuilding(building);
  }

  async function handleConfirmDelete() {
    if (!confirmBuilding) return;
    setDeleting(true);
    try {
      await handleDelete(confirmBuilding);
      setConfirmBuilding(null);
    } finally {
      setDeleting(false);
    }
  }

  return (
    <AdminLayout>
      <div className="min-h-full px-8 py-7">
        <header className="mb-7">
          <div>
            <p className="m-0 mb-1.5 text-[11px] font-bold uppercase tracking-wider text-[#f97316]">
              Gestión de campus
            </p>
            <h1 className="m-0 mb-1.5 text-[28px] font-bold leading-tight text-[#f1f5f9]">
              Edificios
            </h1>
            <p className="m-0 text-[14px] text-[#64748b]">
              Administra los edificios del mapa interactivo del ITO.
            </p>
          </div>
        </header>

        {error ? (
          <div
            role="alert"
            className="mb-[18px] flex items-center gap-2.5 rounded-[10px] border border-[rgba(239,68,68,0.25)] bg-[rgba(239,68,68,0.1)] px-3.5 py-3 text-[13.5px] font-medium text-[#fca5a5]"
          >
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="flex-shrink-0">
              <circle cx="12" cy="12" r="10" />
              <line x1="12" y1="8" x2="12" y2="12" />
              <line x1="12" y1="16" x2="12.01" y2="16" />
            </svg>
            {error}
          </div>
        ) : null}

        {message ? (
          <div className="mb-[18px] flex items-center gap-2.5 rounded-[10px] border border-[rgba(34,197,94,0.2)] bg-[rgba(34,197,94,0.1)] px-3.5 py-3 text-[13.5px] font-medium text-[#86efac]">
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="flex-shrink-0">
              <polyline points="20 6 9 17 4 12" />
            </svg>
            {message}
          </div>
        ) : null}

        <section>
          <BuildingTable
            buildings={buildings}
            filteredBuildings={filteredBuildings}
            editingBuilding={null}
            searchTerm={searchTerm}
            statusFilter={statusFilter}
            loadingBuildings={loadingBuildings}
            actionLoadingId={actionLoadingId}
            page={page}
            totalPages={totalPages}
            totalRecords={totalRecords}
            canEditBuildings={canEditBuildings}
            canEditPhotos={canEditPhotos}
            canEditNavigation={canEditNavigation}
            onSearchTermChange={setSearchTerm}
            onStatusFilterChange={setStatusFilter}
            onPageChange={setPage}
            onRefresh={loadBuildings}
            onStartEdit={handleStartEditRow}
            onOpenImages={setImageModalBuilding}
            onToggleStatus={handleToggleStatus}
            onDelete={handleDeleteRequest}
          />
        </section>
      </div>

      {canEditBuildings ? (
        <button
          type="button"
          onClick={handleOpenCreate}
          className="fixed bottom-7 right-7 z-40 inline-flex min-h-11 items-center gap-2 rounded-full bg-[#ea580c] px-5 py-3.5 text-[14px] font-bold text-white shadow-[0_10px_28px_rgba(234,88,12,0.4)] transition-[transform,background-color] duration-[240ms] hover:-translate-y-0.5 hover:bg-[#c2410c] active:translate-y-0 active:scale-[0.97] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[rgba(234,88,12,0.45)] focus-visible:ring-offset-2 focus-visible:ring-offset-[#0f172a]"
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" aria-hidden="true">
            <line x1="12" y1="5" x2="12" y2="19" />
            <line x1="5" y1="12" x2="19" y2="12" />
          </svg>
          Agregar edificio
        </button>
      ) : null}

      {canEditPhotos && imageModalBuilding ? (
        <BuildingImagesModal
          building={imageModalBuilding}
          onClose={() => setImageModalBuilding(null)}
        />
      ) : null}

      {confirmBuilding ? (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="confirm-delete-title"
          className="fixed inset-0 z-50 grid place-items-center bg-black/65 p-6 backdrop-blur-sm [animation:ito-fade-in_180ms_ease]"
        >
          <div className="w-full max-w-[400px] rounded-[18px] border border-[#334155] bg-[#1e293b] p-7 shadow-[0_24px_60px_rgba(0,0,0,0.5)] [animation:ito-slide-in-up_240ms_ease]">
            <div className="mb-4 grid h-11 w-11 place-items-center rounded-xl border border-[rgba(239,68,68,0.2)] bg-[rgba(239,68,68,0.1)]">
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#ef4444" strokeWidth="2">
                <polyline points="3 6 5 6 21 6" />
                <path d="M19 6l-1 14a2 2 0 01-2 2H8a2 2 0 01-2-2L5 6" />
                <path d="M10 11v6M14 11v6" />
                <path d="M9 6V4a1 1 0 011-1h4a1 1 0 011 1v2" />
              </svg>
            </div>
            <h2 id="confirm-delete-title" className="m-0 mb-2.5 text-[18px] font-bold text-[#f1f5f9]">
              ¿Eliminar edificio?
            </h2>
            <p className="m-0 mb-[22px] text-[14px] leading-relaxed text-[#94a3b8]">
              Estás a punto de eliminar{" "}
              <strong className="text-[#f1f5f9]">{safeText(confirmBuilding.name)}</strong>.
              Esta acción no se puede deshacer.
            </p>
            <div className="flex justify-end gap-2.5">
              <button
                type="button"
                onClick={() => setConfirmBuilding(null)}
                disabled={deleting}
                className="inline-flex min-h-11 items-center rounded-[10px] border border-[#334155] bg-transparent px-[18px] text-[13.5px] font-semibold text-[#94a3b8] transition-colors duration-[180ms] hover:bg-[#0f172a] hover:text-[#e2e8f0] disabled:opacity-50"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={() => void handleConfirmDelete()}
                disabled={deleting}
                className="inline-flex min-h-11 items-center rounded-[10px] border border-[rgba(239,68,68,0.4)] bg-[#dc2626] px-[18px] text-[13.5px] font-bold text-white transition-[background-color,transform] duration-[180ms] hover:-translate-y-px hover:bg-[#b91c1c] active:translate-y-0 disabled:opacity-50"
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
