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
import { resolveBuildingImageUrl } from "../../../utils/resolve-api-asset-url";
import { useIsMobile } from "../../../hooks/useIsMobile";
import { normalizeDisplayText } from "../../../utils/text";

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

function parseNumber(value: string): number {
  const parsed = Number(value);

  if (Number.isFinite(parsed)) {
    return parsed;
  }

  return 0;
}

function safeText(value: unknown): string {
  return normalizeDisplayText(value);
}

type BuildingImagesModalProps = {
  building: Building;
  onClose: () => void;
};

export function BuildingImagesModal({
  building,
  onClose,
}: BuildingImagesModalProps) {
  const isMobile = useIsMobile();
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
    <div style={{ ...styles.modalOverlay, ...(isMobile ? styles.modalOverlayMobile : {}) }}>
      <section style={{ ...styles.modalCard, ...(isMobile ? styles.modalCardMobile : {}) }}>
        <header style={{ ...styles.modalHeader, ...(isMobile ? styles.modalHeaderMobile : {}) }}>
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
            style={{ ...styles.cancelButton, ...(isMobile ? styles.cancelButtonMobile : {}) }}
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

        <form onSubmit={handleUpload} style={{ ...styles.imageForm, ...(isMobile ? styles.imageFormMobile : {}) }}>
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

          <div style={{ ...styles.grid, ...(isMobile ? styles.gridMobile : {}) }}>
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
            style={{ ...styles.primaryButton, ...(isMobile ? styles.primaryButtonMobile : {}) }}
          >
            {uploading ? "Subiendo..." : "Subir imagen"}
          </button>
        </form>

        <div style={{ ...styles.imageListHeader, ...(isMobile ? styles.imageListHeaderMobile : {}) }}>
          <h3 style={styles.sectionTitle}>Imágenes registradas</h3>
          <button
            type="button"
            onClick={loadImages}
            disabled={loading}
            style={{ ...styles.secondaryButton, ...(isMobile ? styles.secondaryButtonMobile : {}) }}
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
          <div style={{ ...styles.imageGrid, ...(isMobile ? styles.imageGridMobile : {}) }}>
            {images.map((image) => {
              const isImageActive = Boolean(image.is_active);
              const imageSrc = resolveBuildingImageUrl(safeText(image.image_url)) ?? "";

              return (
                <article
                  key={image.id}
                  style={
                    isImageActive
                      ? { ...styles.imageCard, ...(isMobile ? styles.imageCardMobile : {}) }
                      : {
                          ...styles.imageCard,
                          ...styles.inactiveImageCard,
                          ...(isMobile ? styles.imageCardMobile : {}),
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

                    <div style={{ ...styles.actions, ...(isMobile ? styles.actionsMobile : {}) }}>
                      <button
                        type="button"
                        onClick={() => handleToggleStatus(image)}
                        disabled={actionLoadingId === image.id}
                        style={{ ...styles.smallButton, ...(isMobile ? styles.smallButtonMobile : {}) }}
                      >
                        {isImageActive ? "Desactivar" : "Activar"}
                      </button>

                      <button
                        type="button"
                        onClick={() => handleDelete(image)}
                        disabled={actionLoadingId === image.id}
                        style={{ ...styles.dangerButton, ...(isMobile ? styles.smallButtonMobile : {}) }}
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
    background: "rgba(0,0,0,0.7)",
    backdropFilter: "blur(4px)",
    display: "grid",
    placeItems: "center",
    padding: "24px",
    zIndex: 1000,
  },
  modalOverlayMobile: {
    alignItems: "flex-end",
    placeItems: "stretch",
    padding: "8px",
  },
  modalCard: {
    width: "min(1080px, 100%)",
    maxHeight: "90vh",
    overflowY: "auto",
    background: "#1e293b",
    borderRadius: "20px",
    border: "1px solid #334155",
    padding: "24px",
    boxShadow: "0 24px 80px rgba(0, 0, 0, 0.6)",
  },
  modalCardMobile: {
    width: "100%",
    maxHeight: "calc(100dvh - 16px)",
    borderRadius: "22px 22px 12px 12px",
    padding: "14px",
  },
  modalHeader: {
    display: "flex",
    justifyContent: "space-between",
    gap: "18px",
    alignItems: "flex-start",
    marginBottom: "18px",
  },
  modalHeaderMobile: {
    flexDirection: "column",
    gap: "12px",
  },
  modalTitle: {
    margin: 0,
    fontSize: "22px",
    lineHeight: 1.2,
    fontWeight: 700,
    color: "#f1f5f9",
  },
  overline: {
    margin: "0 0 6px",
    color: "#f97316",
    fontWeight: 700,
    fontSize: "11px",
    textTransform: "uppercase",
    letterSpacing: "0.08em",
  },
  text: {
    margin: "0 0 8px",
    color: "#64748b",
    lineHeight: 1.5,
    fontSize: "13px",
  },
  cancelButton: {
    border: "1px solid #334155",
    borderRadius: "10px",
    padding: "8px 12px",
    background: "transparent",
    color: "#64748b",
    fontWeight: 600,
    cursor: "pointer",
    whiteSpace: "nowrap",
    fontSize: "13px",
  },
  cancelButtonMobile: {
    width: "100%",
    minHeight: "44px",
    color: "#e2e8f0",
  },
  errorBox: {
    marginBottom: "16px",
    padding: "12px 15px",
    borderRadius: "10px",
    background: "rgba(239,68,68,0.1)",
    border: "1px solid rgba(239,68,68,0.25)",
    color: "#fca5a5",
    fontWeight: 600,
    fontSize: "13.5px",
  },
  successBox: {
    marginBottom: "16px",
    padding: "12px 15px",
    borderRadius: "10px",
    background: "rgba(34,197,94,0.1)",
    border: "1px solid rgba(34,197,94,0.2)",
    color: "#86efac",
    fontWeight: 600,
    fontSize: "13.5px",
  },
  imageForm: {
    border: "1px solid #334155",
    borderRadius: "14px",
    padding: "18px",
    marginBottom: "22px",
    background: "rgba(15,23,42,0.5)",
  },
  imageFormMobile: {
    padding: "14px",
    borderRadius: "14px",
  },
  label: {
    display: "flex",
    flexDirection: "column",
    gap: "6px",
    marginBottom: "12px",
    color: "#94a3b8",
    fontWeight: 600,
    fontSize: "12px",
    textTransform: "uppercase",
    letterSpacing: "0.05em",
  },
  checkboxLabel: {
    display: "flex",
    alignItems: "center",
    gap: "10px",
    marginBottom: "18px",
    color: "#94a3b8",
    fontWeight: 600,
    fontSize: "13px",
  },
  input: {
    width: "100%",
    boxSizing: "border-box",
    border: "1px solid #334155",
    borderRadius: "10px",
    padding: "9px 13px",
    fontSize: "13.5px",
    outline: "none",
    background: "#0f172a",
    color: "#e2e8f0",
    fontWeight: 400,
    letterSpacing: "normal",
    textTransform: "none",
  },
  grid: {
    display: "grid",
    gridTemplateColumns: "1fr 1fr",
    gap: "14px",
  },
  gridMobile: {
    gridTemplateColumns: "1fr",
    gap: "10px",
  },
  primaryButton: {
    width: "100%",
    border: "1px solid rgba(234,88,12,0.4)",
    borderRadius: "10px",
    padding: "11px 16px",
    background: "#ea580c",
    color: "#ffffff",
    fontWeight: 700,
    cursor: "pointer",
    fontSize: "14px",
  },
  primaryButtonMobile: {
    minHeight: "48px",
    fontSize: "15px",
  },
  secondaryButton: {
    border: "1px solid #334155",
    borderRadius: "10px",
    padding: "9px 14px",
    background: "transparent",
    color: "#94a3b8",
    fontWeight: 600,
    cursor: "pointer",
    fontSize: "13px",
  },
  secondaryButtonMobile: {
    width: "100%",
    minHeight: "44px",
  },
  sectionTitle: {
    margin: "0 0 10px",
    fontSize: "17px",
    fontWeight: 700,
    color: "#f1f5f9",
  },
  imageListHeader: {
    display: "flex",
    justifyContent: "space-between",
    gap: "14px",
    alignItems: "center",
    marginBottom: "14px",
  },
  imageListHeaderMobile: {
    flexDirection: "column",
    alignItems: "stretch",
  },
  emptyImages: {
    border: "1px dashed #334155",
    borderRadius: "14px",
    padding: "24px",
    textAlign: "center",
    color: "#475569",
    background: "rgba(15,23,42,0.4)",
    fontSize: "13.5px",
  },
  imageGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fill, minmax(230px, 1fr))",
    gap: "16px",
  },
  imageGridMobile: {
    gridTemplateColumns: "1fr",
    gap: "12px",
  },
  imageCard: {
    border: "1px solid #334155",
    borderRadius: "14px",
    overflow: "hidden",
    background: "#0f172a",
    boxShadow: "0 4px 16px rgba(0,0,0,0.3)",
  },
  imageCardMobile: {
    borderRadius: "14px",
  },
  inactiveImageCard: {
    opacity: 0.55,
  },
  imagePreviewWrapper: {
    width: "100%",
    height: "150px",
    background: "#243347",
    overflow: "hidden",
  },
  imagePreview: {
    width: "100%",
    height: "100%",
    objectFit: "cover",
    display: "block",
  },
  imageInfo: {
    padding: "12px 14px",
  },
  imageTitle: {
    margin: "0 0 5px",
    fontSize: "14px",
    fontWeight: 600,
    color: "#e2e8f0",
  },
  imageDescription: {
    margin: "0 0 10px",
    fontSize: "12.5px",
    color: "#64748b",
    lineHeight: 1.45,
  },
  imageBadges: {
    display: "flex",
    gap: "6px",
    flexWrap: "wrap",
    marginBottom: "10px",
  },
  activeBadge: {
    display: "inline-flex",
    padding: "3px 8px",
    borderRadius: "999px",
    background: "rgba(34,197,94,0.12)",
    border: "1px solid rgba(34,197,94,0.25)",
    color: "#86efac",
    fontWeight: 700,
    fontSize: "11px",
  },
  inactiveBadge: {
    display: "inline-flex",
    padding: "3px 8px",
    borderRadius: "999px",
    background: "rgba(239,68,68,0.1)",
    border: "1px solid rgba(239,68,68,0.22)",
    color: "#fca5a5",
    fontWeight: 700,
    fontSize: "11px",
  },
  coverBadge: {
    display: "inline-flex",
    padding: "3px 8px",
    borderRadius: "999px",
    background: "rgba(234,88,12,0.12)",
    border: "1px solid rgba(234,88,12,0.25)",
    color: "#fdba74",
    fontWeight: 700,
    fontSize: "11px",
  },
  actions: {
    display: "flex",
    gap: "6px",
    flexWrap: "wrap",
  },
  actionsMobile: {
    display: "grid",
    gridTemplateColumns: "1fr 1fr",
  },
  smallButton: {
    border: "1px solid #334155",
    borderRadius: "8px",
    padding: "6px 10px",
    background: "transparent",
    color: "#94a3b8",
    fontWeight: 600,
    cursor: "pointer",
    fontSize: "12px",
  },
  smallButtonMobile: {
    minHeight: "40px",
    textAlign: "center",
  },
  dangerButton: {
    border: "1px solid rgba(239,68,68,0.3)",
    borderRadius: "8px",
    padding: "6px 10px",
    background: "rgba(239,68,68,0.08)",
    color: "#fca5a5",
    fontWeight: 600,
    cursor: "pointer",
    fontSize: "12px",
  },
};


