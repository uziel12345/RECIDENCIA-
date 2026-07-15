import { useBuildingStore } from "../../../store/building-store";
import { useAdminAuthStore } from "../../../store/admin-auth-store";
import { getBuildings } from "../../../services/buildings.service";
import { useEffect, useRef, useState } from "react";
import type { Building } from "../../buildings/types/building";
import { 
  BookOpenIcon, 
  CoffeeIcon, 
  InfoIcon, 
  NavigationIcon,
  BuildingIcon,
  GraduationCapIcon 
} from "../../../components/ui/Icons";

interface QuickDestination {
  id: string;
  name: string;
  description: string;
  icon: React.ReactNode;
  buildingCodes: string[];
  color: string;
  bgColor: string;
}

const quickDestinations: QuickDestination[] = [
  {
    id: "admissions",
    name: "Admisiones",
    description: "Informes y trámites de ingreso",
    icon: <GraduationCapIcon size={20} />,
    buildingCodes: ["ASE", "DIR"],
    color: "#ea580c",
    bgColor: "#eff6ff",
  },
  {
    id: "library",
    name: "Biblioteca",
    description: "Consulta y prestamo de libros",
    icon: <BookOpenIcon size={20} />,
    buildingCodes: ["BIB"],
    color: "#059669",
    bgColor: "#ecfdf5",
  },
  {
    id: "cafeteria",
    name: "Cafeteria",
    description: "Alimentos y bebidas",
    icon: <CoffeeIcon size={20} />,
    buildingCodes: ["CAF"],
    color: "#d97706",
    bgColor: "#fffbeb",
  },
  {
    id: "admin",
    name: "Direccion",
    description: "Oficinas administrativas",
    icon: <BuildingIcon size={20} />,
    buildingCodes: ["DIR"],
    color: "#7c3aed",
    bgColor: "#f5f3ff",
  },
  {
    id: "services",
    name: "Servicios Escolares",
    description: "Tramites y documentos",
    icon: <InfoIcon size={20} />,
    buildingCodes: ["DIR", "ASE"],
    color: "#dc2626",
    bgColor: "#fef2f2",
  },
];

interface QuickDestinationsProps {
  compact?: boolean;
  onSelect?: () => void;
}

export function QuickDestinations({ compact = false, onSelect }: QuickDestinationsProps) {
  const [buildings, setBuildings] = useState<Building[]>([]);
  const [failedId, setFailedId] = useState<string | null>(null);
  const failedTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const setSelectedBuilding = useBuildingStore((s) => s.setSelectedBuilding);
  const setRouteDestination = useBuildingStore((s) => s.setRouteDestination);
  // Solo se entrega localización, no ruteo — igual que RoutePanel/
  // BuildingInfoCard, trazar ruta se reserva a superadmin.
  const canUseRoutes = useAdminAuthStore(
    (state) => state.isAuthenticated && state.user?.role === "superadmin"
  );

  useEffect(() => {
    getBuildings().then(setBuildings);
  }, []);

  useEffect(() => {
    return () => {
      if (failedTimerRef.current !== null) clearTimeout(failedTimerRef.current);
    };
  }, []);

  const handleDestinationClick = (dest: QuickDestination) => {
    const building = buildings.find((b) => dest.buildingCodes.includes(b.code));

    if (!building) {
      if (failedTimerRef.current !== null) clearTimeout(failedTimerRef.current);
      setFailedId(dest.id);
      failedTimerRef.current = setTimeout(() => setFailedId(null), 2000);
      return;
    }

    setSelectedBuilding(building);
    if (canUseRoutes) setRouteDestination(building);
    onSelect?.();
  };

  return (
    <div className={`quick-destinations ${compact ? "quick-destinations--compact" : ""}`}>
      {quickDestinations.map((dest) => {
        const unavailable = failedId === dest.id;

        return (
          <button
            key={dest.id}
            className={`quick-destination${unavailable ? " quick-destination--unavailable" : ""}`}
            onClick={() => handleDestinationClick(dest)}
            style={
              unavailable
                ? ({ "--dest-color": "#dc2626", "--dest-bg": "#fef2f2" } as React.CSSProperties)
                : ({ "--dest-color": dest.color, "--dest-bg": dest.bgColor } as React.CSSProperties)
            }
          >
            <div className="quick-destination__icon" aria-hidden="true">
              {dest.icon}
            </div>
            <div className="quick-destination__content">
              <span className="quick-destination__name">
                {unavailable ? "No disponible" : dest.name}
              </span>
              {!compact && (
                <span className="quick-destination__desc">
                  {unavailable
                    ? "Este destino no está en el mapa aún"
                    : dest.description}
                </span>
              )}
            </div>
            <div className="quick-destination__arrow" aria-hidden="true">
              <NavigationIcon size={16} />
            </div>
          </button>
        );
      })}
    </div>
  );
}

