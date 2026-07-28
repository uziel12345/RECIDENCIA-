import type { CSSProperties } from "react";
import {
  BuildingIcon,
  CalendarIcon,
  CoffeeIcon,
  CompassIcon,
  GraduationCapIcon,
  InfoIcon,
  MapIcon,
  SearchIcon,
  ShieldIcon,
  UsersIcon,
} from "../../../components/ui/Icons";
import { useBuildingStore } from "../../../store/building-store";

export type CampusService = {
  id: string;
  title: string;
  description: string;
  category: "administrative" | "student" | "academic" | "campus";
  locationHint: string;
  searchTerm: string;
  icon:
    | "building"
    | "calendar"
    | "coffee"
    | "compass"
    | "graduation-cap"
    | "info"
    | "map"
    | "search"
    | "shield"
    | "users";
};

type CampusServicesPanelProps = {
  compact?: boolean;
  onSelectService?: (service: CampusService) => void;
};

const SERVICES: CampusService[] = [
  {
    id: "control-escolar",
    title: "Control Escolar",
    description:
      "Inscripciones, constancias, kardex y trámites académicos.",
    category: "student",
    locationHint: "Servicios escolares",
    searchTerm: "servicios escolares",
    icon: "calendar",
  },
  {
    id: "aulas",
    title: "Aulas",
    description: "Localiza tu salón de clases dentro del campus.",
    category: "campus",
    locationHint: "Edificios de aulas",
    searchTerm: "aula",
    icon: "graduation-cap",
  },
  {
    id: "biblioteca",
    title: "Biblioteca",
    description: "Libros, recursos académicos y espacios de estudio.",
    category: "academic",
    locationHint: "Biblioteca",
    searchTerm: "biblioteca",
    icon: "search",
  },
  {
    id: "cafeteria",
    title: "Cafetería",
    description: "Servicio de alimentos dentro del campus.",
    category: "campus",
    locationHint: "Cafetería",
    searchTerm: "cafetería",
    icon: "coffee",
  },
  {
    id: "laboratorios",
    title: "Laboratorios",
    description: "Espacios de práctica, cómputo e investigación.",
    category: "campus",
    locationHint: "Edificios de laboratorio",
    searchTerm: "laboratorio",
    icon: "map",
  },
  {
    id: "becas",
    title: "Becas",
    description: "Información sobre apoyos, convocatorias y seguimiento.",
    category: "student",
    locationHint: "Área de becas o servicios escolares",
    searchTerm: "becas",
    icon: "info",
  },
  {
    id: "coordinacion",
    title: "Coordinación",
    description:
      "Apoyo académico, seguimiento de carrera y orientación estudiantil.",
    category: "academic",
    locationHint: "Coordinaciones académicas",
    searchTerm: "coordinacion",
    icon: "compass",
  },
  {
    id: "direccion",
    title: "Dirección",
    description: "Atención institucional, gestión directiva y asuntos generales.",
    category: "administrative",
    locationHint: "Edificio de dirección",
    searchTerm: "direccion",
    icon: "building",
  },
  {
    id: "finanzas",
    title: "Finanzas",
    description: "Pagos, comprobantes, cuotas y aclaraciones administrativas.",
    category: "administrative",
    locationHint: "Área administrativa",
    searchTerm: "finanzas",
    icon: "shield",
  },
];

const CATEGORY_LABELS: Record<CampusService["category"], string> = {
  administrative: "Administrativo",
  student: "Estudiantil",
  academic: "Académico",
  campus: "Campus",
};

const CATEGORY_STYLES: Record<CampusService["category"], CSSProperties> = {
  administrative: {
    background: "#e2e8f0",
    color: "#475569",
  },
  student: {
    background: "#ecfdf5",
    color: "#047857",
  },
  academic: {
    background: "#fef3c7",
    color: "#92400e",
  },
  campus: {
    background: "#f5f3ff",
    color: "#6d28d9",
  },
};

function ServiceIcon({ name }: { name: CampusService["icon"] }) {
  const props = { size: 20 };

  if (name === "building") return <BuildingIcon {...props} />;
  if (name === "calendar") return <CalendarIcon {...props} />;
  if (name === "coffee") return <CoffeeIcon {...props} />;
  if (name === "compass") return <CompassIcon {...props} />;
  if (name === "graduation-cap") return <GraduationCapIcon {...props} />;
  if (name === "info") return <InfoIcon {...props} />;
  if (name === "map") return <MapIcon {...props} />;
  if (name === "search") return <SearchIcon {...props} />;
  if (name === "shield") return <ShieldIcon {...props} />;

  return <UsersIcon {...props} />;
}

export function CampusServicesPanel({
  compact = false,
  onSelectService,
}: CampusServicesPanelProps) {
  const setSearchTerm = useBuildingStore((state) => state.setSearchTerm);
  const visibleServices = compact ? SERVICES.slice(0, 6) : SERVICES;

  function handleSelectService(service: CampusService) {
    setSearchTerm(service.searchTerm);
    onSelectService?.(service);
  }

  return (
    <section style={compact ? styles.compactPanel : styles.panel}>
      <div style={styles.header}>
        <div>
          <p style={styles.overline}>Servicios del campus</p>
          <h2 style={styles.title}>
            {compact ? "Accesos rápidos" : "¿Qué necesitas encontrar?"}
          </h2>
          {!compact && (
            <p style={styles.subtitle}>
              Busca por servicio aunque no conozcas el nombre del edificio.
            </p>
          )}
        </div>

        <span style={styles.counter}>{visibleServices.length}</span>
      </div>

      <div style={compact ? styles.compactGrid : styles.grid}>
        {visibleServices.map((service) => (
          <button
            key={service.id}
            type="button"
            style={compact ? styles.compactCard : styles.card}
            onClick={() => handleSelectService(service)}
          >
            <span
              style={{ ...styles.iconBox, ...CATEGORY_STYLES[service.category] }}
            >
              <ServiceIcon name={service.icon} />
            </span>

            <span style={styles.cardContent}>
              <span style={styles.topRow}>
                <span style={styles.cardTitle}>{service.title}</span>
                <span
                  style={{
                    ...styles.badge,
                    ...CATEGORY_STYLES[service.category],
                  }}
                >
                  {CATEGORY_LABELS[service.category]}
                </span>
              </span>

              <span style={styles.cardDescription}>{service.description}</span>

              <span style={styles.footerRow}>
                <span style={styles.location}>{service.locationHint}</span>
                <span style={styles.actionText}>Buscar</span>
              </span>
            </span>
          </button>
        ))}
      </div>
    </section>
  );
}

const styles: Record<string, CSSProperties> = {
  panel: {
    background: "var(--color-surface)",
    borderRadius: "26px",
    border: "1px solid var(--color-border)",
    padding: "18px",
    boxShadow: "var(--shadow-lg)",
  },
  compactPanel: {
    background: "var(--color-surface)",
    borderRadius: "22px",
    border: "1px solid var(--color-border)",
    padding: "14px",
  },
  header: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "flex-start",
    gap: "14px",
    marginBottom: "14px",
  },
  overline: {
    margin: "0 0 4px",
    color: "#a8442e",
    fontSize: "11px",
    fontWeight: 900,
    textTransform: "uppercase",
    letterSpacing: "0.08em",
  },
  title: {
    margin: 0,
    color: "var(--color-text)",
    fontSize: "18px",
    lineHeight: 1.2,
    letterSpacing: "-0.02em",
  },
  subtitle: {
    margin: "6px 0 0",
    color: "var(--color-text-muted)",
    fontSize: "13px",
    lineHeight: 1.35,
  },
  counter: {
    minWidth: "34px",
    height: "34px",
    borderRadius: "999px",
    background: "var(--color-brand-50)",
    color: "var(--color-brand-700)",
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    fontWeight: 900,
    flexShrink: 0,
  },
  grid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(230px, 1fr))",
    gap: "12px",
  },
  compactGrid: {
    display: "grid",
    gap: "10px",
  },
  card: {
    width: "100%",
    minHeight: "118px",
    display: "flex",
    alignItems: "flex-start",
    gap: "12px",
    border: "1px solid var(--color-border)",
    borderRadius: "20px",
    padding: "14px",
    background: "var(--gradient-surface)",
    color: "var(--color-text)",
    textAlign: "left",
    cursor: "pointer",
    boxShadow: "var(--shadow-xs)",
  },
  compactCard: {
    width: "100%",
    display: "flex",
    alignItems: "flex-start",
    gap: "11px",
    border: "1px solid var(--color-border)",
    borderRadius: "18px",
    padding: "12px",
    background: "var(--color-surface-muted)",
    color: "var(--color-text)",
    textAlign: "left",
    cursor: "pointer",
  },
  iconBox: {
    width: "42px",
    height: "42px",
    borderRadius: "15px",
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
    boxShadow: "inset 0 0 0 1px rgba(15, 23, 42, 0.06)",
  },
  cardContent: {
    minWidth: 0,
    display: "grid",
    gap: "7px",
    flex: 1,
  },
  topRow: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    gap: "8px",
  },
  cardTitle: {
    minWidth: 0,
    color: "var(--color-text)",
    fontWeight: 900,
    fontSize: "15px",
    lineHeight: 1.2,
  },
  cardDescription: {
    color: "var(--color-text-muted)",
    fontSize: "13px",
    lineHeight: 1.35,
  },
  footerRow: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    gap: "8px",
    marginTop: "2px",
  },
  badge: {
    borderRadius: "999px",
    padding: "4px 8px",
    fontSize: "10px",
    fontWeight: 900,
    whiteSpace: "nowrap",
  },
  location: {
    minWidth: 0,
    color: "var(--color-text-muted)",
    fontSize: "11px",
    fontWeight: 700,
    overflow: "hidden",
    textOverflow: "ellipsis",
    whiteSpace: "nowrap",
  },
  actionText: {
    flexShrink: 0,
    color: "#a8442e",
    fontSize: "11px",
    fontWeight: 900,
    textTransform: "uppercase",
    letterSpacing: "0.04em",
  },
};
