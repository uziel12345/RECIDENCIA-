import type { CSSProperties } from "react";
import { useState } from "react";
import type { Building } from "@ito-map/shared";
import { useAdminAuthStore } from "../../../store/admin-auth-store";
import { BuildingForm } from "../components/BuildingForm";
import { BuildingImagesModal } from "../components/BuildingImagesModal";
import { BuildingTable } from "../components/BuildingTable";
import { AdminLayout } from "../components/AdminLayout";
import { useAdminBuildings } from "../hooks/useAdminBuildings";
import { safeText } from "../hooks/useBuildingForm";

export function AdminBuildingsPage() {
  const { user } = useAdminAuthStore();
  const isSuperAdmin = user?.role === "superadmin";
  const isAdmin = user?.role === "admin" || isSuperAdmin;
  const canEditBuildings = isAdmin;
  const canEditPhotos = isAdmin;
  const canEditNavigation = isAdmin;

  const {
    buildings,
    categories,
    form,
    editingBuilding,
    searchTerm,
    statusFilter,
    loadingBuildings,
    saving,
    actionLoadingId,
    error,
    message,
    page,
    totalPages,
    totalRecords,
    imageModalBuilding,
    isEditing,
    filteredBuildings,
    setSearchTerm,
    setStatusFilter,
    setPage,
    setImageModalBuilding,
    loadBuildings,
    updateFormField,
    handleNameChange,
    handleStartEdit,
    handleCancelEdit,
    handleSubmitBuilding,
    handleToggleStatus,
    handleDelete,
  } = useAdminBuildings();

  const [confirmBuilding, setConfirmBuilding] = useState<Building | null>(null);
  const [deleting, setDeleting] = useState(false);

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
      <div style={s.page}>
        <header style={s.header}>
          <div>
            <p style={s.overline}>Gestión de campus</p>
            <h1 style={s.title}>Edificios</h1>
            <p style={s.subtitle}>
              Administra los edificios del mapa interactivo del ITO.
            </p>
          </div>

          {user ? (
            <div style={s.sessionBadge}>
              <span style={s.sessionDot} />
              <span style={s.sessionText}>
                {user.full_name || user.username}
              </span>
            </div>
          ) : null}
        </header>

        {error ? (
          <div role="alert" style={s.alertError}>
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ flexShrink: 0 }}>
              <circle cx="12" cy="12" r="10" /><line x1="12" y1="8" x2="12" y2="12" /><line x1="12" y1="16" x2="12.01" y2="16" />
            </svg>
            {error}
          </div>
        ) : null}

        {message ? (
          <div style={s.alertSuccess}>
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ flexShrink: 0 }}>
              <polyline points="20 6 9 17 4 12" />
            </svg>
            {message}
          </div>
        ) : null}

        <section style={canEditBuildings && isEditing ? s.layout : s.layoutFull}>
          {canEditBuildings && isEditing ? (
            <div style={s.formWrap}>
              <BuildingForm
                form={form}
                categories={categories}
                isEditing
                editingBuildingName={safeText(editingBuilding?.name)}
                saving={saving}
                onSubmit={handleSubmitBuilding}
                onCancelEdit={handleCancelEdit}
                onNameChange={handleNameChange}
                onUpdateFormField={updateFormField}
              />
            </div>
          ) : null}

          <BuildingTable
            buildings={buildings}
            filteredBuildings={filteredBuildings}
            editingBuilding={editingBuilding}
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
            onStartEdit={handleStartEdit}
            onOpenImages={setImageModalBuilding}
            onToggleStatus={handleToggleStatus}
            onDelete={handleDeleteRequest}
          />
        </section>
      </div>

      {canEditPhotos && imageModalBuilding ? (
        <BuildingImagesModal
          building={imageModalBuilding}
          onClose={() => setImageModalBuilding(null)}
        />
      ) : null}

      {confirmBuilding ? (
        <div role="dialog" aria-modal="true" aria-labelledby="confirm-delete-title" style={s.overlay}>
          <div style={s.dialog}>
            <div style={s.dialogIcon}>
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#ef4444" strokeWidth="2">
                <polyline points="3 6 5 6 21 6" />
                <path d="M19 6l-1 14a2 2 0 01-2 2H8a2 2 0 01-2-2L5 6" />
                <path d="M10 11v6M14 11v6" />
                <path d="M9 6V4a1 1 0 011-1h4a1 1 0 011 1v2" />
              </svg>
            </div>
            <h2 id="confirm-delete-title" style={s.dialogTitle}>
              ¿Eliminar edificio?
            </h2>
            <p style={s.dialogText}>
              Estás a punto de eliminar{" "}
              <strong style={{ color: "#f1f5f9" }}>{safeText(confirmBuilding.name)}</strong>.
              Esta acción no se puede deshacer.
            </p>
            <div style={s.dialogActions}>
              <button
                type="button"
                onClick={() => setConfirmBuilding(null)}
                disabled={deleting}
                style={s.btnCancel}
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={() => void handleConfirmDelete()}
                disabled={deleting}
                style={s.btnDanger}
              >
                {deleting ? "Eliminando..." : "Sí, eliminar"}
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </AdminLayout>
  );
}

const s: Record<string, CSSProperties> = {
  page: {
    padding: "28px 32px",
    minHeight: "100%",
  },
  header: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 28,
    gap: 20,
  },
  overline: {
    margin: "0 0 6px",
    fontSize: 11,
    fontWeight: 700,
    color: "#3b82f6",
    textTransform: "uppercase",
    letterSpacing: "0.08em",
  },
  title: {
    margin: "0 0 6px",
    fontSize: 28,
    fontWeight: 700,
    color: "#f1f5f9",
    lineHeight: 1.1,
  },
  subtitle: {
    margin: 0,
    fontSize: 14,
    color: "#64748b",
  },
  sessionBadge: {
    display: "flex",
    alignItems: "center",
    gap: 7,
    padding: "8px 14px",
    background: "#1e293b",
    border: "1px solid #334155",
    borderRadius: 99,
    flexShrink: 0,
  },
  sessionDot: {
    width: 7,
    height: 7,
    borderRadius: "50%",
    background: "#22c55e",
  },
  sessionText: {
    fontSize: 12.5,
    fontWeight: 600,
    color: "#cbd5e1",
  },
  alertError: {
    display: "flex",
    alignItems: "center",
    gap: 9,
    marginBottom: 18,
    padding: "12px 15px",
    borderRadius: 10,
    background: "rgba(239,68,68,0.1)",
    border: "1px solid rgba(239,68,68,0.25)",
    color: "#fca5a5",
    fontSize: 13.5,
    fontWeight: 500,
  },
  alertSuccess: {
    display: "flex",
    alignItems: "center",
    gap: 9,
    marginBottom: 18,
    padding: "12px 15px",
    borderRadius: 10,
    background: "rgba(34,197,94,0.1)",
    border: "1px solid rgba(34,197,94,0.2)",
    color: "#86efac",
    fontSize: 13.5,
    fontWeight: 500,
  },
  layout: {
    display: "grid",
    gridTemplateColumns: "minmax(320px, 420px) 1fr",
    gap: 22,
    alignItems: "start",
  },
  layoutFull: {
    display: "block",
  },
  formWrap: {
    position: "sticky",
    top: 0,
  },
  overlay: {
    position: "fixed",
    inset: 0,
    background: "rgba(0,0,0,0.65)",
    backdropFilter: "blur(4px)",
    display: "grid",
    placeItems: "center",
    zIndex: 50,
    padding: 24,
  },
  dialog: {
    width: "100%",
    maxWidth: 400,
    background: "#1e293b",
    border: "1px solid #334155",
    borderRadius: 18,
    padding: 28,
    boxShadow: "0 24px 60px rgba(0,0,0,0.5)",
  },
  dialogIcon: {
    width: 44,
    height: 44,
    borderRadius: 12,
    background: "rgba(239,68,68,0.1)",
    border: "1px solid rgba(239,68,68,0.2)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 16,
  },
  dialogTitle: {
    margin: "0 0 10px",
    fontSize: 18,
    fontWeight: 700,
    color: "#f1f5f9",
  },
  dialogText: {
    margin: "0 0 22px",
    color: "#94a3b8",
    lineHeight: 1.6,
    fontSize: 14,
  },
  dialogActions: {
    display: "flex",
    gap: 10,
    justifyContent: "flex-end",
  },
  btnCancel: {
    border: "1px solid #334155",
    borderRadius: 10,
    padding: "9px 18px",
    background: "transparent",
    color: "#94a3b8",
    fontWeight: 600,
    cursor: "pointer",
    fontSize: 13.5,
  },
  btnDanger: {
    border: "1px solid rgba(239,68,68,0.4)",
    borderRadius: 10,
    padding: "9px 18px",
    background: "#dc2626",
    color: "#fff",
    fontWeight: 700,
    cursor: "pointer",
    fontSize: 13.5,
  },
};
