import { useCallback, useEffect, useState } from "react";
import type { FormEvent } from "react";
import {
  deleteBuildingImageApi,
  getAdminBuildingImagesApi,
  updateBuildingImageStatusApi,
  uploadBuildingImageApi,
  type Building,
  type BuildingImage,
} from "@ito-map/shared";

type ImageFormState = {
  file: File | null;
  title: string;
  description: string;
  image_type: string;
  is_cover: boolean;
  sort_order: string;
};

const initialImageFormState: ImageFormState = {
  file: null,
  title: "",
  description: "",
  image_type: "photo",
  is_cover: false,
  sort_order: "0",
};

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

function safeText(value: unknown): string {
  if (typeof value === "string") return value;
  if (value === null || value === undefined) return "";
  return String(value);
}

type BuildingImagesModalProps = {
  building: Building;
  onClose: () => void;
};

export function BuildingImagesModal({
  building,
  onClose,
}: BuildingImagesModalProps) {
  const [images, setImages] = useState<BuildingImage[]>([]);
  const [form, setForm] = useState<ImageFormState>(initialImageFormState);
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [actionLoadingId, setActionLoadingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  const loadImages = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const data = await getAdminBuildingImagesApi(building.id);
      setImages(Array.isArray(data) ? data : []);
    } catch (err) {
      const msg =
        err instanceof Error
          ? err.message
          : "No se pudieron cargar las imágenes";
      setError(msg);
      setImages([]);
    } finally {
      setLoading(false);
    }
  }, [building.id]);

  useEffect(() => {
    void loadImages();
  }, [loadImages]);

  function updateFormField<K extends keyof ImageFormState>(
    key: K,
    value: ImageFormState[K]
  ) {
    setForm((current) => ({ ...current, [key]: value }));
  }

  async function handleUpload(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!form.file) {
      setError("Selecciona una imagen.");
      return;
    }

    setUploading(true);
    setError(null);
    setMessage(null);

    try {
      await uploadBuildingImageApi({
        buildingId: building.id,
        image: form.file,
        title: form.title,
        description: form.description,
        image_type: form.image_type,
        is_cover: form.is_cover,
        sort_order: parseNumber(form.sort_order),
      });

      setForm(initialImageFormState);
      setMessage("Imagen subida correctamente.");
      await loadImages();
    } catch (err) {
      const msg =
        err instanceof Error ? err.message : "No se pudo subir la imagen";
      setError(msg);
    } finally {
      setUploading(false);
    }
  }

  async function handleToggleStatus(image: BuildingImage) {
    setActionLoadingId(image.id);
    setError(null);
    setMessage(null);

    const nextStatus = !image.is_active;

    try {
      await updateBuildingImageStatusApi(image.id, {
        is_active: nextStatus,
      });

      setMessage(
        nextStatus
          ? "Imagen activada correctamente."
          : "Imagen desactivada correctamente."
      );

      await loadImages();
    } catch (err) {
      const msg =
        err instanceof Error
          ? err.message
          : "No se pudo cambiar el estado de la imagen";
      setError(msg);
    } finally {
      setActionLoadingId(null);
    }
  }

  async function handleDelete(image: BuildingImage) {
    const confirmed = window.confirm(
      `¿Seguro que deseas eliminar la imagen "${safeText(
        image.title || image.image_url
      )}"?`
    );

    if (!confirmed) return;

    setActionLoadingId(image.id);
    setError(null);
    setMessage(null);

    try {
      await deleteBuildingImageApi(image.id);
      setMessage("Imagen eliminada correctamente.");
      await loadImages();
    } catch (err) {
      const msg =
        err instanceof Error ? err.message : "No se pudo eliminar la imagen";
      setError(msg);
    } finally {
      setActionLoadingId(null);
    }
  }

  return (
    <div style={styles.modalOverlay}>
      <section style={styles.modalCard}>
        <header style={styles.modalHeader}>
          <div>
            <p style={styles.overline}>Galería de edificio</p>
            <h2 style={styles.modalTitle}>
              Fotos de {safeText(building.name)}
            </h2>
            <p style={styles.text}>
              Sube, desactiva o elimina imágenes asociadas al edificio.
            </p>
          </div>

          <button
            type="button"
            onClick={onClose}
            style={styles.cancelButton}
          >
            Cerrar
          </button>
        </header>

        {error ? (
          <div role="alert" style={styles.errorBox}>
            {error}
          </div>
        ) : null}

        {message ? <div style={styles.successBox}>{message}</div> : null}

        <form onSubmit={handleUpload} style={styles.imageForm}>
          <label style={styles.label}>
            Imagen
            <input
              type="file"
              accept="image/jpeg,image/png,image/webp"
              onChange={(event) =>
                updateFormField(
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
                value={form.title}
                onChange={(event) =>
                  updateFormField("title", event.target.value)
                }
                style={styles.input}
                placeholder="Fachada principal"
              />
            </label>

            <label style={styles.label}>
              Tipo
              <select
                value={form.image_type}
                onChange={(event) =>
                  updateFormField("image_type", event.target.value)
                }
                style={styles.input}
              >
                <option value="photo">Foto</option>
                <option value="entrance">Entrada</option>
                <option value="map">Mapa</option>
                <option value="floorplan">Plano</option>
              </select>
            </label>

            <label style={styles.label}>
              Orden
              <input
                value={form.sort_order}
                onChange={(event) =>
                  updateFormField("sort_order", event.target.value)
                }
                style={styles.input}
                placeholder="0"
              />
            </label>

            <label style={styles.checkboxLabel}>
              <input
                type="checkbox"
                checked={form.is_cover}
                onChange={(event) =>
                  updateFormField("is_cover", event.target.checked)
                }
              />
              Marcar como portada
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
                minHeight: "70px",
                resize: "vertical",
              }}
              placeholder="Descripción breve de la imagen"
            />
          </label>

          <button
            type="submit"
            disabled={uploading}
            style={styles.primaryButton}
          >
            {uploading ? "Subiendo..." : "Subir imagen"}
          </button>
        </form>

        <div style={styles.imageListHeader}>
          <h3 style={styles.sectionTitle}>Imágenes registradas</h3>
          <button
            type="button"
            onClick={loadImages}
            disabled={loading}
            style={styles.secondaryButton}
          >
            {loading ? "Cargando..." : "Recargar fotos"}
          </button>
        </div>

        {loading ? (
          <p style={styles.text}>Cargando imágenes...</p>
        ) : images.length === 0 ? (
          <div style={styles.emptyImages}>
            No hay imágenes registradas para este edificio.
          </div>
        ) : (
          <div style={styles.imageGrid}>
            {images.map((image) => {
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

                      {image.is_cover ? (
                        <span style={styles.coverBadge}>Portada</span>
                      ) : null}
                    </div>

                    <div style={styles.actions}>
                      <button
                        type="button"
                        onClick={() => handleToggleStatus(image)}
                        disabled={actionLoadingId === image.id}
                        style={styles.smallButton}
                      >
                        {isImageActive ? "Desactivar" : "Activar"}
                      </button>

                      <button
                        type="button"
                        onClick={() => handleDelete(image)}
                        disabled={actionLoadingId === image.id}
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
  );
}

const styles: Record<string, React.CSSProperties> = {
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
  imageForm: {
    border: "1px solid #e2e8f0",
    borderRadius: "18px",
    padding: "18px",
    marginBottom: "22px",
    background: "#f8fafc",
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
  grid: {
    display: "grid",
    gridTemplateColumns: "1fr 1fr",
    gap: "14px",
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
  sectionTitle: {
    margin: "0 0 10px",
    fontSize: "20px",
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
  actions: {
    display: "flex",
    gap: "8px",
    flexWrap: "wrap",
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
};
