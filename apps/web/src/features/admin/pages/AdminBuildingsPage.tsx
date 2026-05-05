import { useEffect, useMemo, useState } from "react";
import type { FormEvent } from "react";
import {
  createBuildingApi,
  deleteBuildingApi,
  deleteBuildingImageApi,
  getAdminBuildingImagesApi,
  getAdminBuildingsApi,
  updateBuildingApi,
  updateBuildingImageStatusApi,
  updateBuildingStatusApi,
  uploadBuildingImageApi,
  type Building,
  type BuildingImage,
  type CreateBuildingInput,
  type UpdateBuildingInput,
} from "@ito-map/shared";
import { useAdminAuthStore } from "../../../store/admin-auth-store";

type BuildingFormState = {
  code: string;
  name: string;
  slug: string;
  description: string;
  model_node_name: string;
  x: string;
  y: string;
  z: string;
  latitude: string;
  longitude: string;
  category_code: string;
  is_priority: boolean;
};

type ImageFormState = {
  file: File | null;
  title: string;
  description: string;
  image_type: string;
  is_cover: boolean;
  sort_order: string;
};

const initialFormState: BuildingFormState = {
  code: "",
  name: "",
  slug: "",
  description: "",
  model_node_name: "",
  x: "",
  y: "",
  z: "",
  latitude: "",
  longitude: "",
  category_code: "",
  is_priority: false,
};

const initialImageFormState: ImageFormState = {
  file: null,
  title: "",
  description: "",
  image_type: "photo",
  is_cover: false,
  sort_order: "0",
};

function toNullableNumber(value: string): number | null {
  const trimmed = value.trim();

  if (!trimmed) return null;

  const parsed = Number(trimmed);

  return Number.isFinite(parsed) ? parsed : null;
}

function createSlug(value: string): string {
  return value
    .trim()
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function safeText(value: unknown): string {
  if (typeof value === "string") return value;
  if (value === null || value === undefined) return "";
  return String(value);
}

function numberToFormValue(value: number | null | undefined): string {
  if (value === null || value === undefined) return "";
  return String(value);
}

function mapBuildingToForm(building: Building): BuildingFormState {
  return {
    code: safeText(building.code),
    name: safeText(building.name),
    slug: safeText(building.slug),
    description: safeText(building.description),
    model_node_name: safeText(building.model_node_name),
    x: numberToFormValue(building.x),
    y: numberToFormValue(building.y),
    z: numberToFormValue(building.z),
    latitude: numberToFormValue(building.latitude),
    longitude: numberToFormValue(building.longitude),
    category_code: safeText(building.category_code),
    is_priority: Boolean(building.is_priority),
  };
}

function buildCreateInput(form: BuildingFormState): CreateBuildingInput {
  return {
    code: form.code.trim(),
    name: form.name.trim(),
    slug: form.slug.trim() || createSlug(form.name),
    description: form.description.trim() || null,
    model_node_name: form.model_node_name.trim(),
    x: toNullableNumber(form.x),
    y: toNullableNumber(form.y),
    z: toNullableNumber(form.z),
    latitude: toNullableNumber(form.latitude),
    longitude: toNullableNumber(form.longitude),
    category_code: form.category_code.trim(),
    is_active: true,
    is_priority: form.is_priority,
  };
}

function buildUpdateInput(
  form: BuildingFormState,
  currentBuilding: Building
): UpdateBuildingInput {
  return {
    code: form.code.trim(),
    name: form.name.trim(),
    slug: form.slug.trim() || createSlug(form.name),
    description: form.description.trim() || null,
    model_node_name: form.model_node_name.trim(),
    x: toNullableNumber(form.x),
    y: toNullableNumber(form.y),
    z: toNullableNumber(form.z),
    latitude: toNullableNumber(form.latitude),
    longitude: toNullableNumber(form.longitude),
    category_code: form.category_code.trim(),
    is_active: Boolean(currentBuilding.is_active),
    is_priority: form.is_priority,
  };
}

function getImageSrc(imageUrl: string): string {
  if (!imageUrl) return "";

  if (imageUrl.startsWith("http://") || imageUrl.startsWith("https://")) {
    return imageUrl;
  }

  const apiBaseUrl =
    import.meta.env.VITE_API_URL || "http://localhost:3001/api";

  const apiOrigin = apiBaseUrl.replace(/\/api\/?$/, "");

  if (imageUrl.startsWith("/")) {
    return `${apiOrigin}${imageUrl}`;
  }

  return `${apiOrigin}/${imageUrl}`;
}

function parseNumber(value: string): number {
  const parsed = Number(value);

  if (Number.isFinite(parsed)) {
    return parsed;
  }

  return 0;
}

export function AdminBuildingsPage() {
  const { loadSession, logout, user } = useAdminAuthStore();

  const [buildings, setBuildings] = useState<Building[]>([]);
  const [form, setForm] = useState<BuildingFormState>(initialFormState);
  const [editingBuilding, setEditingBuilding] = useState<Building | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<
    "all" | "active" | "inactive"
  >("all");
  const [loadingSession, setLoadingSession] = useState(true);
  const [loadingBuildings, setLoadingBuildings] = useState(false);
  const [saving, setSaving] = useState(false);
  const [actionLoadingId, setActionLoadingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  const [imageModalBuilding, setImageModalBuilding] =
    useState<Building | null>(null);
  const [buildingImages, setBuildingImages] = useState<BuildingImage[]>([]);
  const [imageForm, setImageForm] =
    useState<ImageFormState>(initialImageFormState);
  const [imageLoading, setImageLoading] = useState(false);
  const [imageUploading, setImageUploading] = useState(false);
  const [imageActionLoadingId, setImageActionLoadingId] = useState<
    string | null
  >(null);
  const [imageError, setImageError] = useState<string | null>(null);
  const [imageMessage, setImageMessage] = useState<string | null>(null);

  const isEditing = editingBuilding !== null;

  const activeCount = useMemo(() => {
    return buildings.filter((building) => Boolean(building.is_active)).length;
  }, [buildings]);

  const inactiveCount = useMemo(() => {
    return buildings.filter((building) => !Boolean(building.is_active)).length;
  }, [buildings]);

  const filteredBuildings = useMemo(() => {
    const term = searchTerm.trim().toLowerCase();

    return buildings.filter((building) => {
      const buildingName = safeText(building.name).toLowerCase();
      const buildingCode = safeText(building.code).toLowerCase();
      const categoryName = safeText(building.category_name).toLowerCase();
      const categoryCode = safeText(building.category_code).toLowerCase();

      const matchesSearch =
        !term ||
        buildingName.includes(term) ||
        buildingCode.includes(term) ||
        categoryName.includes(term) ||
        categoryCode.includes(term);

      const isActive = Boolean(building.is_active);

      const matchesStatus =
        statusFilter === "all" ||
        (statusFilter === "active" && isActive) ||
        (statusFilter === "inactive" && !isActive);

      return matchesSearch && matchesStatus;
    });
  }, [buildings, searchTerm, statusFilter]);

  useEffect(() => {
    void initializePage();
  }, []);

  async function initializePage() {
    setLoadingSession(true);
    setError(null);

    const validSession = await loadSession();

    if (!validSession) {
      window.location.href = "/admin/login";
      return;
    }

    setLoadingSession(false);
    await loadBuildings();
  }

  async function loadBuildings() {
    setLoadingBuildings(true);
    setError(null);

    try {
      const data = await getAdminBuildingsApi();
      setBuildings(Array.isArray(data) ? data : []);
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : "No se pudieron cargar los edificios";

      setError(message);
      setBuildings([]);
    } finally {
      setLoadingBuildings(false);
    }
  }

  async function loadImages(buildingId: string) {
    setImageLoading(true);
    setImageError(null);

    try {
      const data = await getAdminBuildingImagesApi(buildingId);
      setBuildingImages(Array.isArray(data) ? data : []);
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : "No se pudieron cargar las imágenes";

      setImageError(message);
      setBuildingImages([]);
    } finally {
      setImageLoading(false);
    }
  }

  function updateFormField<K extends keyof BuildingFormState>(
    key: K,
    value: BuildingFormState[K]
  ) {
    setForm((currentForm) => ({
      ...currentForm,
      [key]: value,
    }));
  }

  function updateImageFormField<K extends keyof ImageFormState>(
    key: K,
    value: ImageFormState[K]
  ) {
    setImageForm((currentForm) => ({
      ...currentForm,
      [key]: value,
    }));
  }

  function handleNameChange(value: string) {
    setForm((currentForm) => ({
      ...currentForm,
      name: value,
      slug: currentForm.slug ? currentForm.slug : createSlug(value),
    }));
  }

  function handleStartEdit(building: Building) {
    setEditingBuilding(building);
    setForm(mapBuildingToForm(building));
    setError(null);
    setMessage(null);

    window.scrollTo({
      top: 0,
      behavior: "smooth",
    });
  }

  function handleCancelEdit() {
    setEditingBuilding(null);
    setForm(initialFormState);
    setError(null);
    setMessage(null);
  }

  async function handleOpenImages(building: Building) {
    setImageModalBuilding(building);
    setImageForm(initialImageFormState);
    setImageError(null);
    setImageMessage(null);
    await loadImages(building.id);
  }

  function handleCloseImages() {
    setImageModalBuilding(null);
    setBuildingImages([]);
    setImageForm(initialImageFormState);
    setImageError(null);
    setImageMessage(null);
    setImageActionLoadingId(null);
  }

  async function handleSubmitBuilding(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    setSaving(true);
    setError(null);
    setMessage(null);

    try {
      if (editingBuilding) {
        const input = buildUpdateInput(form, editingBuilding);
        await updateBuildingApi(editingBuilding.id, input);

        setMessage("Edificio actualizado correctamente.");
        setEditingBuilding(null);
      } else {
        const input = buildCreateInput(form);
        await createBuildingApi(input);

        setMessage("Edificio creado correctamente.");
      }

      setForm(initialFormState);
      await loadBuildings();
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : isEditing
            ? "No se pudo actualizar el edificio"
            : "No se pudo crear el edificio";

      setError(message);
    } finally {
      setSaving(false);
    }
  }

  async function handleUploadImage(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!imageModalBuilding) return;

    if (!imageForm.file) {
      setImageError("Selecciona una imagen.");
      return;
    }

    setImageUploading(true);
    setImageError(null);
    setImageMessage(null);

    try {
      await uploadBuildingImageApi({
        buildingId: imageModalBuilding.id,
        image: imageForm.file,
        title: imageForm.title,
        description: imageForm.description,
        image_type: imageForm.image_type,
        is_cover: imageForm.is_cover,
        sort_order: parseNumber(imageForm.sort_order),
      });

      setImageForm(initialImageFormState);
      setImageMessage("Imagen subida correctamente.");
      await loadImages(imageModalBuilding.id);
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "No se pudo subir la imagen";

      setImageError(message);
    } finally {
      setImageUploading(false);
    }
  }

  async function handleToggleStatus(building: Building) {
    setActionLoadingId(building.id);
    setError(null);
    setMessage(null);

    const nextStatus = !Boolean(building.is_active);

    try {
      await updateBuildingStatusApi(building.id, {
        is_active: nextStatus,
      });

      setMessage(
        nextStatus
          ? "Edificio activado correctamente."
          : "Edificio desactivado correctamente."
      );

      if (editingBuilding?.id === building.id) {
        setEditingBuilding(null);
        setForm(initialFormState);
      }

      await loadBuildings();
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "No se pudo cambiar el estado";

      setError(message);
    } finally {
      setActionLoadingId(null);
    }
  }

  async function handleToggleImageStatus(image: BuildingImage) {
    if (!imageModalBuilding) return;

    setImageActionLoadingId(image.id);
    setImageError(null);
    setImageMessage(null);

    const nextStatus = !Boolean(image.is_active);

    try {
      await updateBuildingImageStatusApi(image.id, {
        is_active: nextStatus,
      });

      setImageMessage(
        nextStatus
          ? "Imagen activada correctamente."
          : "Imagen desactivada correctamente."
      );

      await loadImages(imageModalBuilding.id);
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : "No se pudo cambiar el estado de la imagen";

      setImageError(message);
    } finally {
      setImageActionLoadingId(null);
    }
  }

  async function handleDelete(building: Building) {
    const confirmed = window.confirm(
      `¿Seguro que deseas eliminar "${safeText(
        building.name
      )}"? Se hará soft delete.`
    );

    if (!confirmed) return;

    setActionLoadingId(building.id);
    setError(null);
    setMessage(null);

    try {
      await deleteBuildingApi(building.id);
      setMessage("Edificio eliminado correctamente.");

      if (editingBuilding?.id === building.id) {
        setEditingBuilding(null);
        setForm(initialFormState);
      }

      await loadBuildings();
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "No se pudo eliminar el edificio";

      setError(message);
    } finally {
      setActionLoadingId(null);
    }
  }

  async function handleDeleteImage(image: BuildingImage) {
    if (!imageModalBuilding) return;

    const confirmed = window.confirm(
      `¿Seguro que deseas eliminar la imagen "${safeText(
        image.title || image.image_url
      )}"?`
    );

    if (!confirmed) return;

    setImageActionLoadingId(image.id);
    setImageError(null);
    setImageMessage(null);

    try {
      await deleteBuildingImageApi(image.id);
      setImageMessage("Imagen eliminada correctamente.");
      await loadImages(imageModalBuilding.id);
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "No se pudo eliminar la imagen";

      setImageError(message);
    } finally {
      setImageActionLoadingId(null);
    }
  }

  function handleLogout() {
    logout();
    window.location.href = "/admin/login";
  }

  if (loadingSession) {
    return (
      <main style={styles.centerPage}>
        <section style={styles.card}>
          <h1 style={styles.title}>Validando sesión...</h1>
          <p style={styles.text}>
            Estamos verificando tu acceso administrativo.
          </p>
        </section>
      </main>
    );
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
        <form onSubmit={handleSubmitBuilding} style={styles.formCard}>
          <div style={styles.formHeader}>
            <div>
              <h2 style={styles.sectionTitle}>
                {isEditing ? "Editar edificio" : "Crear edificio"}
              </h2>

              {isEditing ? (
                <p style={styles.text}>
                  Editando: <strong>{safeText(editingBuilding?.name)}</strong>
                </p>
              ) : (
                <p style={styles.text}>
                  Registra un nuevo edificio para el mapa interactivo.
                </p>
              )}
            </div>

            {isEditing ? (
              <button
                type="button"
                onClick={handleCancelEdit}
                style={styles.cancelButton}
              >
                Cancelar
              </button>
            ) : null}
          </div>

          <div style={styles.grid}>
            <label style={styles.label}>
              Código
              <input
                value={form.code}
                onChange={(event) => updateFormField("code", event.target.value)}
                required
                style={styles.input}
                placeholder="EDIF-A"
              />
            </label>

            <label style={styles.label}>
              Nombre
              <input
                value={form.name}
                onChange={(event) => handleNameChange(event.target.value)}
                required
                style={styles.input}
                placeholder="Edificio A"
              />
            </label>

            <label style={styles.label}>
              Slug
              <input
                value={form.slug}
                onChange={(event) => updateFormField("slug", event.target.value)}
                required
                style={styles.input}
                placeholder="edificio-a"
              />
            </label>

            <label style={styles.label}>
              Categoría
              <input
                value={form.category_code}
                onChange={(event) =>
                  updateFormField("category_code", event.target.value)
                }
                required
                style={styles.input}
                placeholder="aulas"
              />
            </label>

            <label style={styles.label}>
              Nodo del modelo 3D
              <input
                value={form.model_node_name}
                onChange={(event) =>
                  updateFormField("model_node_name", event.target.value)
                }
                required
                style={styles.input}
                placeholder="Building_A"
              />
            </label>

            <label style={styles.label}>
              X
              <input
                value={form.x}
                onChange={(event) => updateFormField("x", event.target.value)}
                style={styles.input}
                placeholder="0"
              />
            </label>

            <label style={styles.label}>
              Y
              <input
                value={form.y}
                onChange={(event) => updateFormField("y", event.target.value)}
                style={styles.input}
                placeholder="0"
              />
            </label>

            <label style={styles.label}>
              Z
              <input
                value={form.z}
                onChange={(event) => updateFormField("z", event.target.value)}
                style={styles.input}
                placeholder="0"
              />
            </label>

            <label style={styles.label}>
              Latitud
              <input
                value={form.latitude}
                onChange={(event) =>
                  updateFormField("latitude", event.target.value)
                }
                style={styles.input}
                placeholder="17.073"
              />
            </label>

            <label style={styles.label}>
              Longitud
              <input
                value={form.longitude}
                onChange={(event) =>
                  updateFormField("longitude", event.target.value)
                }
                style={styles.input}
                placeholder="-96.726"
              />
            </label>
          </div>

          <label style={styles.label}>
            Descripción
            <textarea
              value={form.description}
              onChange={(event) =>
                updateFormField("description", event.target.value)
              }
              style={{
                ...styles.input,
                minHeight: "90px",
                resize: "vertical",
              }}
              placeholder="Descripción breve del edificio"
            />
          </label>

          <label style={styles.checkboxLabel}>
            <input
              type="checkbox"
              checked={form.is_priority}
              onChange={(event) =>
                updateFormField("is_priority", event.target.checked)
              }
            />
            Marcar como edificio prioritario
          </label>

          <button type="submit" disabled={saving} style={styles.primaryButton}>
            {saving
              ? "Guardando..."
              : isEditing
                ? "Guardar cambios"
                : "Crear edificio"}
          </button>
        </form>

        <section style={styles.tableCard}>
          <div style={styles.tableHeader}>
            <div>
              <h2 style={styles.sectionTitle}>Listado</h2>
              <p style={styles.text}>
                Total: {buildings.length} edificios. Activos: {activeCount}.
                Inactivos: {inactiveCount}.
              </p>
            </div>

            <button
              type="button"
              onClick={loadBuildings}
              disabled={loadingBuildings}
              style={styles.secondaryButton}
            >
              {loadingBuildings ? "Cargando..." : "Recargar"}
            </button>
          </div>

          <div style={styles.filters}>
            <input
              value={searchTerm}
              onChange={(event) => setSearchTerm(event.target.value)}
              style={styles.searchInput}
              placeholder="Buscar por nombre, código o categoría"
            />

            <select
              value={statusFilter}
              onChange={(event) =>
                setStatusFilter(
                  event.target.value as "all" | "active" | "inactive"
                )
              }
              style={styles.select}
            >
              <option value="all">Todos</option>
              <option value="active">Solo activos</option>
              <option value="inactive">Solo inactivos</option>
            </select>
          </div>

          <div style={styles.tableWrapper}>
            <table style={styles.table}>
              <thead>
                <tr>
                  <th style={styles.th}>Código</th>
                  <th style={styles.th}>Nombre</th>
                  <th style={styles.th}>Categoría</th>
                  <th style={styles.th}>Modelo 3D</th>
                  <th style={styles.th}>Estado</th>
                  <th style={styles.th}>Acciones</th>
                </tr>
              </thead>

              <tbody>
                {filteredBuildings.map((building) => {
                  const isActive = Boolean(building.is_active);
                  const isCurrentEdit = editingBuilding?.id === building.id;

                  return (
                    <tr
                      key={building.id}
                      style={
                        isCurrentEdit
                          ? styles.editingRow
                          : !isActive
                            ? styles.inactiveRow
                            : undefined
                      }
                    >
                      <td style={styles.td}>{safeText(building.code)}</td>
                      <td style={styles.td}>{safeText(building.name)}</td>
                      <td style={styles.td}>
                        {safeText(building.category_name) || "Sin categoría"}
                      </td>
                      <td style={styles.td}>
                        {safeText(building.model_node_name) || "Sin nodo"}
                      </td>
                      <td style={styles.td}>
                        <span
                          style={
                            isActive ? styles.activeBadge : styles.inactiveBadge
                          }
                        >
                          {isActive ? "Activo" : "Inactivo"}
                        </span>
                      </td>
                      <td style={styles.td}>
                        <div style={styles.actions}>
                          <button
                            type="button"
                            onClick={() => handleStartEdit(building)}
                            disabled={actionLoadingId === building.id}
                            style={styles.editButton}
                          >
                            Editar
                          </button>

                          <button
                            type="button"
                            onClick={() => handleOpenImages(building)}
                            disabled={actionLoadingId === building.id}
                            style={styles.photoButton}
                          >
                            Fotos
                          </button>

                          <button
                            type="button"
                            onClick={() => handleToggleStatus(building)}
                            disabled={actionLoadingId === building.id}
                            style={styles.smallButton}
                          >
                            {isActive ? "Desactivar" : "Activar"}
                          </button>

                          <button
                            type="button"
                            onClick={() => handleDelete(building)}
                            disabled={actionLoadingId === building.id}
                            style={styles.dangerButton}
                          >
                            Eliminar
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}

                {filteredBuildings.length === 0 ? (
                  <tr>
                    <td style={styles.emptyTd} colSpan={6}>
                      No hay edificios para mostrar.
                    </td>
                  </tr>
                ) : null}
              </tbody>
            </table>
          </div>
        </section>
      </section>

      {imageModalBuilding ? (
        <div style={styles.modalOverlay}>
          <section style={styles.modalCard}>
            <header style={styles.modalHeader}>
              <div>
                <p style={styles.overline}>Galería de edificio</p>
                <h2 style={styles.modalTitle}>
                  Fotos de {safeText(imageModalBuilding.name)}
                </h2>
                <p style={styles.text}>
                  Sube, desactiva o elimina imágenes asociadas al edificio.
                </p>
              </div>

              <button
                type="button"
                onClick={handleCloseImages}
                style={styles.cancelButton}
              >
                Cerrar
              </button>
            </header>

            {imageError ? (
              <div role="alert" style={styles.errorBox}>
                {imageError}
              </div>
            ) : null}

            {imageMessage ? (
              <div style={styles.successBox}>{imageMessage}</div>
            ) : null}

            <form onSubmit={handleUploadImage} style={styles.imageForm}>
              <label style={styles.label}>
                Imagen
                <input
                  type="file"
                  accept="image/jpeg,image/png,image/webp"
                  onChange={(event) =>
                    updateImageFormField(
                      "file",
                      event.target.files?.[0] ?? null
                    )
                  }
                  required
                  style={styles.input}
                />
              </label>

              <div style={styles.grid}>
                <label style={styles.label}>
                  Título
                  <input
                    value={imageForm.title}
                    onChange={(event) =>
                      updateImageFormField("title", event.target.value)
                    }
                    style={styles.input}
                    placeholder="Fachada principal"
                  />
                </label>

                <label style={styles.label}>
                  Tipo
                  <input
                    value={imageForm.image_type}
                    onChange={(event) =>
                      updateImageFormField("image_type", event.target.value)
                    }
                    style={styles.input}
                    placeholder="photo"
                  />
                </label>

                <label style={styles.label}>
                  Orden
                  <input
                    value={imageForm.sort_order}
                    onChange={(event) =>
                      updateImageFormField("sort_order", event.target.value)
                    }
                    style={styles.input}
                    placeholder="0"
                  />
                </label>

                <label style={styles.checkboxLabel}>
                  <input
                    type="checkbox"
                    checked={imageForm.is_cover}
                    onChange={(event) =>
                      updateImageFormField("is_cover", event.target.checked)
                    }
                  />
                  Marcar como portada
                </label>
              </div>

              <label style={styles.label}>
                Descripción
                <textarea
                  value={imageForm.description}
                  onChange={(event) =>
                    updateImageFormField("description", event.target.value)
                  }
                  style={{
                    ...styles.input,
                    minHeight: "70px",
                    resize: "vertical",
                  }}
                  placeholder="Descripción breve de la imagen"
                />
              </label>

              <button
                type="submit"
                disabled={imageUploading}
                style={styles.primaryButton}
              >
                {imageUploading ? "Subiendo..." : "Subir imagen"}
              </button>
            </form>

            <div style={styles.imageListHeader}>
              <h3 style={styles.sectionTitle}>Imágenes registradas</h3>
              <button
                type="button"
                onClick={() => loadImages(imageModalBuilding.id)}
                disabled={imageLoading}
                style={styles.secondaryButton}
              >
                {imageLoading ? "Cargando..." : "Recargar fotos"}
              </button>
            </div>

            {imageLoading ? (
              <p style={styles.text}>Cargando imágenes...</p>
            ) : buildingImages.length === 0 ? (
              <div style={styles.emptyImages}>
                No hay imágenes registradas para este edificio.
              </div>
            ) : (
              <div style={styles.imageGrid}>
                {buildingImages.map((image) => {
                  const isImageActive = Boolean(image.is_active);
                  const imageSrc = getImageSrc(safeText(image.image_url));

                  return (
                    <article
                      key={image.id}
                      style={
                        isImageActive
                          ? styles.imageCard
                          : {
                              ...styles.imageCard,
                              ...styles.inactiveImageCard,
                            }
                      }
                    >
                      <div style={styles.imagePreviewWrapper}>
                        <img
                          src={imageSrc}
                          alt={safeText(image.title) || "Imagen del edificio"}
                          style={styles.imagePreview}
                        />
                      </div>

                      <div style={styles.imageInfo}>
                        <h4 style={styles.imageTitle}>
                          {safeText(image.title) || "Sin título"}
                        </h4>

                        <p style={styles.imageDescription}>
                          {safeText(image.description) || "Sin descripción"}
                        </p>

                        <div style={styles.imageBadges}>
                          <span
                            style={
                              isImageActive
                                ? styles.activeBadge
                                : styles.inactiveBadge
                            }
                          >
                            {isImageActive ? "Activa" : "Inactiva"}
                          </span>

                          {Boolean(image.is_cover) ? (
                            <span style={styles.coverBadge}>Portada</span>
                          ) : null}
                        </div>

                        <div style={styles.actions}>
                          <button
                            type="button"
                            onClick={() => handleToggleImageStatus(image)}
                            disabled={imageActionLoadingId === image.id}
                            style={styles.smallButton}
                          >
                            {isImageActive ? "Desactivar" : "Activar"}
                          </button>

                          <button
                            type="button"
                            onClick={() => handleDeleteImage(image)}
                            disabled={imageActionLoadingId === image.id}
                            style={styles.dangerButton}
                          >
                            Eliminar
                          </button>
                        </div>
                      </div>
                    </article>
                  );
                })}
              </div>
            )}
          </section>
        </div>
      ) : null}
    </main>
  );
}

const styles: Record<string, React.CSSProperties> = {
  page: {
    minHeight: "100vh",
    background: "#f8fafc",
    padding: "28px",
    color: "#0f172a",
  },
  centerPage: {
    minHeight: "100vh",
    display: "grid",
    placeItems: "center",
    background: "#f8fafc",
    padding: "24px",
  },
  header: {
    display: "flex",
    justifyContent: "space-between",
    gap: "20px",
    alignItems: "flex-start",
    marginBottom: "22px",
  },
  card: {
    width: "100%",
    maxWidth: "460px",
    background: "#ffffff",
    border: "1px solid #e2e8f0",
    borderRadius: "22px",
    padding: "28px",
    boxShadow: "0 18px 45px rgba(15, 23, 42, 0.12)",
  },
  layout: {
    display: "grid",
    gridTemplateColumns: "minmax(320px, 440px) 1fr",
    gap: "22px",
    alignItems: "start",
  },
  formCard: {
    background: "#ffffff",
    border: "1px solid #e2e8f0",
    borderRadius: "22px",
    padding: "22px",
    boxShadow: "0 14px 35px rgba(15, 23, 42, 0.08)",
  },
  tableCard: {
    background: "#ffffff",
    border: "1px solid #e2e8f0",
    borderRadius: "22px",
    padding: "22px",
    boxShadow: "0 14px 35px rgba(15, 23, 42, 0.08)",
    overflow: "hidden",
  },
  formHeader: {
    display: "flex",
    justifyContent: "space-between",
    gap: "14px",
    alignItems: "flex-start",
    marginBottom: "14px",
  },
  pageTitle: {
    margin: 0,
    fontSize: "32px",
    lineHeight: 1.15,
  },
  title: {
    margin: 0,
    fontSize: "24px",
  },
  sectionTitle: {
    margin: "0 0 10px",
    fontSize: "20px",
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
  grid: {
    display: "grid",
    gridTemplateColumns: "1fr 1fr",
    gap: "14px",
  },
  label: {
    display: "flex",
    flexDirection: "column",
    gap: "7px",
    marginBottom: "14px",
    color: "#334155",
    fontWeight: 700,
    fontSize: "14px",
  },
  checkboxLabel: {
    display: "flex",
    alignItems: "center",
    gap: "10px",
    marginBottom: "18px",
    color: "#334155",
    fontWeight: 700,
    fontSize: "14px",
  },
  input: {
    width: "100%",
    boxSizing: "border-box",
    border: "1px solid #cbd5e1",
    borderRadius: "14px",
    padding: "11px 13px",
    fontSize: "14px",
    outline: "none",
    background: "#ffffff",
  },
  filters: {
    display: "grid",
    gridTemplateColumns: "1fr 180px",
    gap: "12px",
    marginBottom: "16px",
  },
  searchInput: {
    width: "100%",
    boxSizing: "border-box",
    border: "1px solid #cbd5e1",
    borderRadius: "14px",
    padding: "11px 13px",
    fontSize: "14px",
    outline: "none",
    background: "#ffffff",
  },
  select: {
    width: "100%",
    boxSizing: "border-box",
    border: "1px solid #cbd5e1",
    borderRadius: "14px",
    padding: "11px 13px",
    fontSize: "14px",
    outline: "none",
    background: "#ffffff",
    color: "#0f172a",
    fontWeight: 700,
  },
  primaryButton: {
    width: "100%",
    border: "none",
    borderRadius: "14px",
    padding: "12px 16px",
    background: "#2563eb",
    color: "#ffffff",
    fontWeight: 800,
    cursor: "pointer",
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
  cancelButton: {
    border: "1px solid #cbd5e1",
    borderRadius: "14px",
    padding: "9px 12px",
    background: "#f8fafc",
    color: "#334155",
    fontWeight: 800,
    cursor: "pointer",
    whiteSpace: "nowrap",
  },
  editButton: {
    border: "1px solid #bfdbfe",
    borderRadius: "12px",
    padding: "8px 10px",
    background: "#dbeafe",
    color: "#1d4ed8",
    fontWeight: 700,
    cursor: "pointer",
  },
  photoButton: {
    border: "1px solid #c7d2fe",
    borderRadius: "12px",
    padding: "8px 10px",
    background: "#e0e7ff",
    color: "#3730a3",
    fontWeight: 700,
    cursor: "pointer",
  },
  smallButton: {
    border: "1px solid #cbd5e1",
    borderRadius: "12px",
    padding: "8px 10px",
    background: "#ffffff",
    color: "#0f172a",
    fontWeight: 700,
    cursor: "pointer",
  },
  dangerButton: {
    border: "1px solid #fecaca",
    borderRadius: "12px",
    padding: "8px 10px",
    background: "#fee2e2",
    color: "#991b1b",
    fontWeight: 700,
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
  tableHeader: {
    display: "flex",
    justifyContent: "space-between",
    gap: "16px",
    alignItems: "flex-start",
    marginBottom: "16px",
  },
  tableWrapper: {
    overflowX: "auto",
  },
  table: {
    width: "100%",
    borderCollapse: "collapse",
    minWidth: "820px",
  },
  th: {
    textAlign: "left",
    padding: "12px",
    borderBottom: "1px solid #e2e8f0",
    color: "#475569",
    fontSize: "13px",
    background: "#f8fafc",
  },
  td: {
    padding: "12px",
    borderBottom: "1px solid #e2e8f0",
    color: "#0f172a",
    fontSize: "14px",
    verticalAlign: "top",
  },
  emptyTd: {
    padding: "20px",
    textAlign: "center",
    color: "#64748b",
    borderBottom: "1px solid #e2e8f0",
  },
  actions: {
    display: "flex",
    gap: "8px",
    flexWrap: "wrap",
  },
  inactiveRow: {
    background: "#f8fafc",
    opacity: 0.82,
  },
  editingRow: {
    background: "#eff6ff",
  },
  activeBadge: {
    display: "inline-flex",
    padding: "5px 9px",
    borderRadius: "999px",
    background: "#dcfce7",
    color: "#166534",
    fontWeight: 800,
    fontSize: "12px",
  },
  inactiveBadge: {
    display: "inline-flex",
    padding: "5px 9px",
    borderRadius: "999px",
    background: "#fee2e2",
    color: "#991b1b",
    fontWeight: 800,
    fontSize: "12px",
  },
  coverBadge: {
    display: "inline-flex",
    padding: "5px 9px",
    borderRadius: "999px",
    background: "#dbeafe",
    color: "#1d4ed8",
    fontWeight: 800,
    fontSize: "12px",
  },
  modalOverlay: {
    position: "fixed",
    inset: 0,
    background: "rgba(15, 23, 42, 0.55)",
    display: "grid",
    placeItems: "center",
    padding: "24px",
    zIndex: 1000,
  },
  modalCard: {
    width: "min(1080px, 100%)",
    maxHeight: "90vh",
    overflowY: "auto",
    background: "#ffffff",
    borderRadius: "24px",
    border: "1px solid #e2e8f0",
    padding: "24px",
    boxShadow: "0 24px 80px rgba(15, 23, 42, 0.35)",
  },
  modalHeader: {
    display: "flex",
    justifyContent: "space-between",
    gap: "18px",
    alignItems: "flex-start",
    marginBottom: "18px",
  },
  modalTitle: {
    margin: 0,
    fontSize: "26px",
    lineHeight: 1.2,
  },
  imageForm: {
    border: "1px solid #e2e8f0",
    borderRadius: "18px",
    padding: "18px",
    marginBottom: "22px",
    background: "#f8fafc",
  },
  imageListHeader: {
    display: "flex",
    justifyContent: "space-between",
    gap: "14px",
    alignItems: "center",
    marginBottom: "14px",
  },
  emptyImages: {
    border: "1px dashed #cbd5e1",
    borderRadius: "18px",
    padding: "24px",
    textAlign: "center",
    color: "#64748b",
    background: "#f8fafc",
  },
  imageGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fill, minmax(230px, 1fr))",
    gap: "16px",
  },
  imageCard: {
    border: "1px solid #e2e8f0",
    borderRadius: "18px",
    overflow: "hidden",
    background: "#ffffff",
    boxShadow: "0 12px 28px rgba(15, 23, 42, 0.08)",
  },
  inactiveImageCard: {
    opacity: 0.75,
    background: "#f8fafc",
  },
  imagePreviewWrapper: {
    width: "100%",
    height: "150px",
    background: "#e2e8f0",
    overflow: "hidden",
  },
  imagePreview: {
    width: "100%",
    height: "100%",
    objectFit: "cover",
    display: "block",
  },
  imageInfo: {
    padding: "14px",
  },
  imageTitle: {
    margin: "0 0 6px",
    fontSize: "15px",
    color: "#0f172a",
  },
  imageDescription: {
    margin: "0 0 10px",
    fontSize: "13px",
    color: "#64748b",
    lineHeight: 1.45,
  },
  imageBadges: {
    display: "flex",
    gap: "8px",
    flexWrap: "wrap",
    marginBottom: "12px",
  },
};