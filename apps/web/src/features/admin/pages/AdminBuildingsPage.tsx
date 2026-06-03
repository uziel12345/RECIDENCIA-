import type { CSSProperties } from "react";
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import type { Building } from "@ito-map/shared";
import { useAdminAuthStore } from "../../../store/admin-auth-store";
import { ROUTES } from "../../../types/routes";
import { BuildingForm } from "../components/BuildingForm";
import { BuildingImagesModal } from "../components/BuildingImagesModal";
import { BuildingTable } from "../components/BuildingTable";
import { useAdminBuildings } from "../hooks/useAdminBuildings";
import { safeText } from "../hooks/useBuildingForm";

export function AdminBuildingsPage() {
  const { logout, user } = useAdminAuthStore();
  const navigate = useNavigate();
  const isSuperAdmin = user?.role === "superadmin";
  const isAdmin = user?.role === "admin" || isSuperAdmin;
  const canEditBuildings = isAdmin;
  const canEditPhotos = isAdmin;
  const canEditNavigation = isAdmin;
  const canManageUsers = isSuperAdmin;

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

  function handleLogout() {
    void logout().then(() => navigate(ROUTES.ADMIN_LOGIN, { replace: true }));
  }

  function handleOpenNavigation() {
    void navigate(ROUTES.ADMIN_NAVIGATION);
  }

  return (
    <main style={styles.page}>
      <header style={styles.header}>
        <div>
          <p style={styles.overline}>Panel administrativo</p>
          <h1 style={styles.pageTitle}>Edificios</h1>
          <p style={styles.text}>
            Administra los edificios visibles y ocultos del mapa interactivo del
            ITO.
          </p>

          {user ? (
            <p style={styles.userText}>
              Sesión activa:{" "}
              <strong>
                {user.full_name || user.username || "Administrador"}
              </strong>
            </p>
          ) : null}

        </div>

        <div style={styles.headerActions}>
          {canManageUsers ? (
            <button
              type="button"
              onClick={() => navigate(ROUTES.ADMIN_USERS)}
              style={styles.secondaryButton}
            >
              Usuarios
            </button>
          ) : null}

          {canEditNavigation ? (
            <button
              type="button"
              onClick={handleOpenNavigation}
              style={styles.primaryButton}
            >
              Navegacion
            </button>
          ) : null}

          <button
            type="button"
            onClick={handleLogout}
            style={styles.secondaryButton}
          >
            Cerrar sesión
          </button>
        </div>
      </header>

      {error ? (
        <div role="alert" style={styles.errorBox}>
          {error}
        </div>
      ) : null}

      {message ? <div style={styles.successBox}>{message}</div> : null}

      <section
        style={
          canEditBuildings && isEditing ? styles.layout : styles.readOnlyLayout
        }
      >
        {canEditBuildings && isEditing ? (
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

      {canEditPhotos && imageModalBuilding ? (
        <BuildingImagesModal
          building={imageModalBuilding}
          onClose={() => setImageModalBuilding(null)}
        />
      ) : null}

      {confirmBuilding ? (
        <div role="dialog" aria-modal="true" aria-labelledby="confirm-delete-title" style={styles.overlay}>
          <div style={styles.dialog}>
            <h2 id="confirm-delete-title" style={styles.dialogTitle}>
              ¿Eliminar edificio?
            </h2>
            <p style={styles.dialogText}>
              Estás a punto de eliminar{" "}
              <strong>{safeText(confirmBuilding.name)}</strong>. Esta acción no
              se puede deshacer.
            </p>
            <div style={styles.dialogActions}>
              <button
                type="button"
                onClick={() => setConfirmBuilding(null)}
                disabled={deleting}
                style={styles.cancelButton}
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={() => void handleConfirmDelete()}
                disabled={deleting}
                style={styles.confirmDangerButton}
              >
                {deleting ? "Eliminando..." : "Sí, eliminar"}
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </main>
  );
}

const styles: Record<string, CSSProperties> = {
  page: {
    minHeight: "100vh",
    background: "#f8fafc",
    padding: "28px",
    color: "#0f172a",
  },
  header: {
    display: "flex",
    justifyContent: "space-between",
    gap: "20px",
    alignItems: "flex-start",
    marginBottom: "22px",
  },
  headerActions: {
    display: "flex",
    gap: "10px",
    alignItems: "center",
  },
  layout: {
    display: "grid",
    gridTemplateColumns: "minmax(320px, 440px) 1fr",
    gap: "22px",
    alignItems: "start",
  },
  readOnlyLayout: {
    display: "block",
  },
  pageTitle: {
    margin: 0,
    fontSize: "32px",
    lineHeight: 1.15,
  },
  overline: {
    margin: "0 0 8px",
    color: "#2563eb",
    fontWeight: 800,
    fontSize: "14px",
  },
  text: {
    margin: "0 0 8px",
    color: "#64748b",
    lineHeight: 1.5,
  },
  userText: {
    margin: "8px 0 0",
    color: "#334155",
  },
  secondaryButton: {
    border: "1px solid #cbd5e1",
    borderRadius: "14px",
    padding: "10px 14px",
    background: "#ffffff",
    color: "#0f172a",
    fontWeight: 800,
    cursor: "pointer",
  },
  primaryButton: {
    border: "1px solid #1d4ed8",
    borderRadius: "14px",
    padding: "10px 14px",
    background: "#2563eb",
    color: "#ffffff",
    fontWeight: 800,
    cursor: "pointer",
  },
  errorBox: {
    marginBottom: "16px",
    padding: "13px 15px",
    borderRadius: "14px",
    background: "#fee2e2",
    border: "1px solid #fecaca",
    color: "#991b1b",
    fontWeight: 700,
  },
  successBox: {
    marginBottom: "16px",
    padding: "13px 15px",
    borderRadius: "14px",
    background: "#dcfce7",
    border: "1px solid #bbf7d0",
    color: "#166534",
    fontWeight: 700,
  },
  overlay: {
    position: "fixed",
    inset: 0,
    background: "rgba(15, 23, 42, 0.55)",
    display: "grid",
    placeItems: "center",
    zIndex: 50,
    padding: "24px",
  },
  dialog: {
    width: "100%",
    maxWidth: "420px",
    background: "#ffffff",
    borderRadius: "20px",
    padding: "28px",
    boxShadow: "0 24px 60px rgba(15, 23, 42, 0.25)",
  },
  dialogTitle: {
    margin: "0 0 12px",
    fontSize: "20px",
    color: "#0f172a",
  },
  dialogText: {
    margin: "0 0 24px",
    color: "#475569",
    lineHeight: 1.6,
  },
  dialogActions: {
    display: "flex",
    gap: "10px",
    justifyContent: "flex-end",
  },
  cancelButton: {
    border: "1px solid #cbd5e1",
    borderRadius: "12px",
    padding: "10px 18px",
    background: "#ffffff",
    color: "#0f172a",
    fontWeight: 700,
    cursor: "pointer",
  },
  confirmDangerButton: {
    border: "1px solid #fca5a5",
    borderRadius: "12px",
    padding: "10px 18px",
    background: "#dc2626",
    color: "#ffffff",
    fontWeight: 800,
    cursor: "pointer",
  },
};
