import type { CSSProperties, FormEvent } from "react";
import { useEffect, useState } from "react";
import type { BuildingCategory, BuildingService } from "@ito-map/shared";
import { addBuildingServiceApi, deleteBuildingServiceApi, getBuildingServicesApi } from "@ito-map/shared";
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
      .then((data) => { if (!cancelled) setServices(data); })
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
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
    <div style={svcStyles.section}>
      <h3 style={svcStyles.title}>Servicios / Departamentos</h3>
      <p style={svcStyles.hint}>
        Agrega los departamentos o servicios que ofrece este edificio.
      </p>

      {loading ? (
        <p style={svcStyles.muted}>Cargando servicios...</p>
      ) : services.length === 0 ? (
        <p style={svcStyles.muted}>Sin servicios registrados.</p>
      ) : (
        <ul style={svcStyles.list}>
          {services.map((s) => (
            <li key={s.id} style={svcStyles.item}>
              <div style={svcStyles.itemText}>
                <span style={svcStyles.itemName}>{s.name}</span>
                {s.description ? (
                  <span style={svcStyles.itemDesc}>{s.description}</span>
                ) : null}
              </div>
              <button
                type="button"
                disabled={deletingId === s.id}
                onClick={() => handleDelete(s.id)}
                style={svcStyles.deleteBtn}
              >
                {deletingId === s.id ? "..." : "×"}
              </button>
            </li>
          ))}
        </ul>
      )}

      <div style={svcStyles.addRow}>
        <input
          value={newName}
          onChange={(e) => setNewName(e.target.value)}
          placeholder="Nombre del servicio"
          style={svcStyles.addInput}
          disabled={adding}
          onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); void handleAdd(); } }}
        />
        <input
          value={newDesc}
          onChange={(e) => setNewDesc(e.target.value)}
          placeholder="Descripción (opcional)"
          style={{ ...svcStyles.addInput, flex: 1.5 }}
          disabled={adding}
          onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); void handleAdd(); } }}
        />
        <button
          type="button"
          disabled={adding || !newName.trim()}
          onClick={() => void handleAdd()}
          style={svcStyles.addBtn}
        >
          {adding ? "..." : "Agregar"}
        </button>
      </div>
    </div>
  );
}

const FIELD_RULES: Record<FieldErrorKey, (v: string) => string> = {
  code: (v) => (!v.trim() ? "El código es obligatorio." : v.trim().length > 20 ? "Máximo 20 caracteres." : ""),
  name: (v) => (!v.trim() ? "El nombre es obligatorio." : ""),
  slug: (v) => (!v.trim() ? "El slug es obligatorio." : !/^[a-z0-9-]+$/.test(v.trim()) ? "Solo letras minúsculas, números y guiones." : ""),
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
  const [touched, setTouched] = useState<Partial<Record<FieldErrorKey, boolean>>>({});

  function touch(field: FieldErrorKey) {
    setTouched((prev) => ({ ...prev, [field]: true }));
  }

  function fieldError(field: FieldErrorKey): string {
    if (!touched[field]) return "";
    return FIELD_RULES[field](form[field] as string);
  }

  return (
    <form onSubmit={onSubmit} style={styles.formCard}>
      <div style={styles.formHeader}>
        <div>
          <h2 style={styles.sectionTitle}>
            {isEditing ? "Editar edificio" : "Crear edificio"}
          </h2>

          {isEditing ? (
            <p style={styles.text}>
              Editando: <strong>{editingBuildingName}</strong>
            </p>
          ) : (
            <p style={styles.text}>
              Registra un nuevo edificio para el mapa interactivo.
            </p>
          )}
        </div>

        {isEditing ? (
          <button type="button" onClick={onCancelEdit} style={styles.cancelButton}>
            Cancelar
          </button>
        ) : null}
      </div>

      <div style={styles.grid}>
        <label style={styles.label}>
          Código
          <input
            value={form.code}
            onChange={(event) => { onUpdateFormField("code", event.target.value); touch("code"); }}
            onBlur={() => touch("code")}
            required
            style={fieldError("code") ? { ...styles.input, ...styles.inputError } : styles.input}
            placeholder="EDIF-A"
            aria-describedby={fieldError("code") ? "err-code" : undefined}
          />
          {fieldError("code") ? <span id="err-code" style={styles.fieldErr}>{fieldError("code")}</span> : null}
        </label>

        <label style={styles.label}>
          Nombre
          <input
            value={form.name}
            onChange={(event) => { onNameChange(event.target.value); touch("name"); }}
            onBlur={() => touch("name")}
            required
            style={fieldError("name") ? { ...styles.input, ...styles.inputError } : styles.input}
            placeholder="Edificio A"
            aria-describedby={fieldError("name") ? "err-name" : undefined}
          />
          {fieldError("name") ? <span id="err-name" style={styles.fieldErr}>{fieldError("name")}</span> : null}
        </label>

        <label style={styles.label}>
          Slug
          <input
            value={form.slug}
            onChange={(event) => { onUpdateFormField("slug", event.target.value); touch("slug"); }}
            onBlur={() => touch("slug")}
            required
            style={fieldError("slug") ? { ...styles.input, ...styles.inputError } : styles.input}
            placeholder="edificio-a"
            aria-describedby={fieldError("slug") ? "err-slug" : undefined}
          />
          {fieldError("slug") ? <span id="err-slug" style={styles.fieldErr}>{fieldError("slug")}</span> : null}
        </label>

        <label style={styles.label}>
          Categoría
          <select
            value={form.category_code}
            onChange={(event) => { onUpdateFormField("category_code", event.target.value); touch("category_code"); }}
            onBlur={() => touch("category_code")}
            required
            style={fieldError("category_code") ? { ...styles.input, ...styles.inputError } : styles.input}
            aria-describedby={fieldError("category_code") ? "err-cat" : undefined}
          >
            <option value="">Seleccionar...</option>
            {categories
              .filter((category) => Boolean(category.is_active))
              .map((category) => (
                <option key={category.id} value={category.code}>
                  {category.name} ({category.code})
                </option>
              ))}
          </select>
          {fieldError("category_code") ? <span id="err-cat" style={styles.fieldErr}>{fieldError("category_code")}</span> : null}
        </label>

        <label style={styles.label}>
          Nodo del modelo 3D
          <input
            value={form.model_node_name}
            onChange={(event) => { onUpdateFormField("model_node_name", event.target.value); touch("model_node_name"); }}
            onBlur={() => touch("model_node_name")}
            required
            style={fieldError("model_node_name") ? { ...styles.input, ...styles.inputError } : styles.input}
            placeholder="Building_A"
            aria-describedby={fieldError("model_node_name") ? "err-node" : undefined}
          />
          {fieldError("model_node_name") ? <span id="err-node" style={styles.fieldErr}>{fieldError("model_node_name")}</span> : null}
        </label>
      </div>

      <label style={styles.label}>
        Descripción
        <textarea
          value={form.description}
          onChange={(event) =>
            onUpdateFormField("description", event.target.value)
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
            onUpdateFormField("is_priority", event.target.checked)
          }
        />
        Marcar como edificio prioritario
      </label>

      {buildingId ? <BuildingServicesSection buildingId={buildingId} /> : null}

      <button type="submit" disabled={saving} style={styles.primaryButton}>
        {saving
          ? "Guardando..."
          : isEditing
            ? "Guardar cambios"
            : "Crear edificio"}
      </button>
    </form>
  );
}

const svcStyles: Record<string, CSSProperties> = {
  section: {
    marginBottom: "18px",
    padding: "16px",
    background: "#0f172a",
    border: "1px solid #334155",
    borderRadius: "12px",
  },
  title: {
    margin: "0 0 4px",
    fontSize: "13px",
    fontWeight: 700,
    color: "#f1f5f9",
    textTransform: "uppercase",
    letterSpacing: "0.06em",
  },
  hint: {
    margin: "0 0 12px",
    fontSize: "12px",
    color: "#64748b",
  },
  muted: {
    margin: "0 0 12px",
    fontSize: "12.5px",
    color: "#475569",
    fontStyle: "italic",
  },
  list: {
    listStyle: "none",
    margin: "0 0 12px",
    padding: 0,
    display: "flex",
    flexDirection: "column",
    gap: "6px",
  },
  item: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    gap: "10px",
    padding: "8px 10px",
    background: "#1e293b",
    border: "1px solid #334155",
    borderRadius: "8px",
  },
  itemText: {
    display: "flex",
    flexDirection: "column",
    gap: "2px",
    minWidth: 0,
  },
  itemName: {
    fontSize: "13px",
    fontWeight: 600,
    color: "#e2e8f0",
    overflow: "hidden",
    textOverflow: "ellipsis",
    whiteSpace: "nowrap",
  },
  itemDesc: {
    fontSize: "11.5px",
    color: "#64748b",
    overflow: "hidden",
    textOverflow: "ellipsis",
    whiteSpace: "nowrap",
  },
  deleteBtn: {
    flexShrink: 0,
    border: "1px solid #ef444440",
    borderRadius: "6px",
    padding: "3px 8px",
    background: "transparent",
    color: "#ef4444",
    fontWeight: 700,
    fontSize: "14px",
    cursor: "pointer",
    lineHeight: 1,
  },
  addRow: {
    display: "flex",
    gap: "8px",
    alignItems: "center",
  },
  addInput: {
    flex: 1,
    border: "1px solid #334155",
    borderRadius: "8px",
    padding: "8px 10px",
    fontSize: "13px",
    background: "#1e293b",
    color: "#e2e8f0",
    outline: "none",
  },
  addBtn: {
    flexShrink: 0,
    border: "1px solid rgba(234,88,12,0.4)",
    borderRadius: "8px",
    padding: "8px 14px",
    background: "#ea580c",
    color: "#fff",
    fontWeight: 700,
    fontSize: "13px",
    cursor: "pointer",
  },
};

const styles: Record<string, CSSProperties> = {
  formCard: {
    background: "#1e293b",
    border: "1px solid #334155",
    borderRadius: "18px",
    padding: "22px",
    boxShadow: "0 4px 24px rgba(0,0,0,0.3)",
  },
  formHeader: {
    display: "flex",
    justifyContent: "space-between",
    gap: "14px",
    alignItems: "flex-start",
    marginBottom: "14px",
  },
  sectionTitle: {
    margin: "0 0 6px",
    fontSize: "17px",
    fontWeight: 700,
    color: "#f1f5f9",
  },
  text: {
    margin: "0 0 8px",
    color: "#64748b",
    lineHeight: 1.5,
    fontSize: "13px",
  },
  grid: {
    display: "grid",
    gridTemplateColumns: "1fr 1fr",
    gap: "14px",
  },
  label: {
    display: "flex",
    flexDirection: "column",
    gap: "6px",
    marginBottom: "12px",
    color: "#94a3b8",
    fontWeight: 600,
    fontSize: "12.5px",
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
  inputError: {
    borderColor: "#ef4444",
    boxShadow: "0 0 0 3px rgba(239,68,68,0.12)",
  },
  fieldErr: {
    display: "block",
    marginTop: 4,
    fontSize: 11.5,
    fontWeight: 500,
    color: "#f87171",
    textTransform: "none",
    letterSpacing: "normal",
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
};


