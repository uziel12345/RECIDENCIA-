import type { CSSProperties } from "react";
import { useAdminAuthStore } from "../../../store/admin-auth-store";
import { BuildingForm } from "../components/BuildingForm";
import { BuildingImagesModal } from "../components/BuildingImagesModal";
import { BuildingTable } from "../components/BuildingTable";
import { useAdminBuildings } from "../hooks/useAdminBuildings";
import { safeText } from "../hooks/useBuildingForm";

export function AdminBuildingsPage() {
  const { logout, user } = useAdminAuthStore();

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

  function handleLogout() {
    logout();
    window.location.href = "/admin/login";
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

        <button
          type="button"
          onClick={handleLogout}
          style={styles.secondaryButton}
        >
          Cerrar sesión
        </button>
      </header>

      {error ? (
        <div role="alert" style={styles.errorBox}>
          {error}
        </div>
      ) : null}

      {message ? <div style={styles.successBox}>{message}</div> : null}

      <section style={styles.layout}>
        <BuildingForm
          form={form}
          categories={categories}
          isEditing={isEditing}
          editingBuildingName={safeText(editingBuilding?.name)}
          saving={saving}
          onSubmit={handleSubmitBuilding}
          onCancelEdit={handleCancelEdit}
          onNameChange={handleNameChange}
          onUpdateFormField={updateFormField}
        />

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
          onSearchTermChange={setSearchTerm}
          onStatusFilterChange={setStatusFilter}
          onPageChange={setPage}
          onRefresh={loadBuildings}
          onStartEdit={handleStartEdit}
          onOpenImages={setImageModalBuilding}
          onToggleStatus={handleToggleStatus}
          onDelete={handleDelete}
        />
      </section>

      {imageModalBuilding ? (
        <BuildingImagesModal
          building={imageModalBuilding}
          onClose={() => setImageModalBuilding(null)}
        />
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
  layout: {
    display: "grid",
    gridTemplateColumns: "minmax(320px, 440px) 1fr",
    gap: "22px",
    alignItems: "start",
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
};