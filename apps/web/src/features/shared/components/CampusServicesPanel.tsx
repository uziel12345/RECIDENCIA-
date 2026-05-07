import type { CSSProperties } from "react";
import {
  BuildingIcon,
  CalendarIcon,
  CompassIcon,
  InfoIcon,
  MapIcon,
  NavigationIcon,
  SearchIcon,
  ShieldIcon,
  UsersIcon,
} from "../Icons";

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
    | "compass"
    | "info"
    | "map"
    | "navigation"
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
      "Trámites académicos, constancias, kardex y seguimiento escolar.",
    category: "student",
    locationHint: "Servicios escolares o área administrativa",
    searchTerm: "servicios escolares",
    icon: "calendar",
  },
  {
    id: "servicios-escolares",
    title: "Servicios Escolares",
    description:
      "Atención a estudiantes, inscripciones, reinscripciones y documentación.",
    category: "student",
    locationHint: "Área de servicios escolares",
    searchTerm: "servicios escolares",
    icon: "users",
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
  {
    id: "direccion",
    title: "Dirección",
    description: "Atención institucional, gestión directiva y asuntos generales.",
    category: "administrative",
    locationHint: "Edificio de dirección",
    searchTerm: "dirección",
    icon: "building",
  },
  {
    id: "coordinacion",
    title: "Coordinación",
    description: "Apoyo académico, seguimiento de carrera y orientación estudiantil.",
    category: "academic",
    locationHint: "Coordinaciones académicas",
    searchTerm: "coordinación",
    icon: "compass",
  },
  {
    id: "becas",
    title: "Becas",
    description: "Información sobre apoyos, convocatorias y seguimiento de becas.",
    category: "student",
    locationHint: "Servicios escolares o área de becas",
    searchTerm: "becas",
    icon: "info",
  },
  {
    id: "biblioteca",
    title: "Biblioteca",
    description: "Consulta de libros, espacios de estudio y recursos académicos.",
    category: "academic",
    locationHint: "Biblioteca",
    searchTerm: "biblioteca",
    icon: "search",
  },
  {
    id: "laboratorios",
    title: "Laboratorios",
    description:
      "Espacios de práctica, cómputo, investigación y clases especializadas.",
    category: "campus",
    locationHint: "Edificios de laboratorio",
    searchTerm: "laboratorio",
    icon: "map",
  },
];

const CATEGORY_LABELS: Record<CampusService["category"], string> = {
  administrative: "Administrativo",
  student: "Servicios estudiantiles",
  academic: "Académico",
  campus: "Campus",
};

function ServiceIcon({ name }: { name: CampusService["icon"] }) {
  const props = { size: 20 };

  if (name === "building") return <BuildingIcon {...props} />;
  if (name === "calendar") return <CalendarIcon {...props} />;
  if (name === "compass") return <CompassIcon {...props} />;
  if (name === "info") return <InfoIcon {...props} />;
  if (name === "map") return <MapIcon {...props} />;
  if (name === "navigation") return <NavigationIcon {...props} />;
  if (name === "search") return <SearchIcon {...props} />;
  if (name === "shield") return <ShieldIcon {...props} />;

  return <UsersIcon {...props} />;
}

export function CampusServicesPanel({
  compact = false,
  onSelectService,
}: CampusServicesPanelProps) {
  const visibleServices = compact ? SERVICES.slice(0, 6) : SERVICES;

  return (
    <section style={compact ? styles.compactPanel : styles.panel}>
      <div style={styles.header}>
        <div>
          <p style={styles.overline}>Servicios del campus</p>
          <h2 style={styles.title}>¿Qué necesitas encontrar?</h2>
        </div>

        <span style={styles.counter}>{visibleServices.length}</span>
      </div>

      <div style={compact ? styles.compactGrid : styles.grid}>
        {visibleServices.map((service) => (
          <button
            key={service.id}
            type="button"
            style={styles.card}
            onClick={() => onSelectService?.(service)}
          >
            <span style={styles.iconBox}>
              <ServiceIcon name={service.icon} />
            </span>

            <span style={styles.cardContent}>
              <span style={styles.cardTitle}>{service.title}</span>
              <span style={styles.cardDescription}>{service.description}</span>
              <span style={styles.metaRow}>
                <span style={styles.badge}>
                  {CATEGORY_LABELS[service.category]}
                </span>
                <span style={styles.location}>{service.locationHint}</span>
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
    background: "#ffffff",
    borderRadius: "24px",
    border: "1px solid #e2e8f0",
    padding: "18px",
    boxShadow: "0 18px 45px rgba(15, 23, 42, 0.10)",
  },
  compactPanel: {
    background: "#ffffff",
    borderRadius: "20px",
    border: "1px solid #e2e8f0",
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
    color: "#2563eb",
    fontSize: "12px",
    fontWeight: 800,
    textTransform: "uppercase",
    letterSpacing: "0.06em",
  },
  title: {
    margin: 0,
    color: "#0f172a",
    fontSize: "18px",
    lineHeight: 1.2,
  },
  counter: {
    minWidth: "34px",
    height: "34px",
    borderRadius: "999px",
    background: "#eff6ff",
    color: "#1d4ed8",
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    fontWeight: 900,
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
    display: "flex",
    alignItems: "flex-start",
    gap: "12px",
    border: "1px solid #e2e8f0",
    borderRadius: "18px",
    padding: "13px",
    background: "#f8fafc",
    color: "#0f172a",
    textAlign: "left",
    cursor: "pointer",
  },
  iconBox: {
    width: "42px",
    height: "42px",
    borderRadius: "14px",
    background: "#dbeafe",
    color: "#1d4ed8",
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
  },
  cardContent: {
    display: "grid",
    gap: "5px",
  },
  cardTitle: {
    fontWeight: 900,
    fontSize: "15px",
  },
  cardDescription: {
    color: "#475569",
    fontSize: "13px",
    lineHeight: 1.35,
  },
  metaRow: {
    display: "flex",
    flexWrap: "wrap",
    gap: "6px",
    alignItems: "center",
  },
  badge: {
    borderRadius: "999px",
    background: "#e0f2fe",
    color: "#0369a1",
    padding: "4px 8px",
    fontSize: "11px",
    fontWeight: 800,
  },
  location: {
    color: "#64748b",
    fontSize: "11px",
    fontWeight: 700,
  },
};