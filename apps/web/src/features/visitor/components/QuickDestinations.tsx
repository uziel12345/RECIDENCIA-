import { useBuildingStore } from "../../../store/building-store";
import { useAdminAuthStore } from "../../../store/admin-auth-store";
import { getBuildings } from "../../../services/buildings.service";
import { useEffect, useState } from "react";
import type { Building } from "../../buildings/types/building";
import { 
  BookOpenIcon, 
  CoffeeIcon, 
  InfoIcon, 
  NavigationIcon,
  BuildingIcon,
  GraduationCapIcon 
} from "../../shared/Icons";

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
    description: "Informes y tramites de ingreso",
    icon: <GraduationCapIcon size={20} />,
    buildingCodes: ["DIR"],
    color: "#2563eb",
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
  const setSelectedBuilding = useBuildingStore((s) => s.setSelectedBuilding);
  const setRouteDestination = useBuildingStore((s) => s.setRouteDestination);
  const canUseRoutes = useAdminAuthStore(
    (state) => state.isAuthenticated && state.user?.role === "superadmin"
  );

  useEffect(() => {
    getBuildings().then(setBuildings);
  }, []);

  const handleDestinationClick = (dest: QuickDestination) => {
    const building = buildings.find((b) => 
      dest.buildingCodes.includes(b.code)
    );
    
    if (building) {
      setSelectedBuilding(building);
      if (canUseRoutes) {
        setRouteDestination(building);
      }
      onSelect?.();
    }
  };

  return (
    <div className={`quick-destinations ${compact ? "quick-destinations--compact" : ""}`}>
      {quickDestinations.map((dest) => (
        <button
          key={dest.id}
          className="quick-destination"
          onClick={() => handleDestinationClick(dest)}
          style={{
            "--dest-color": dest.color,
            "--dest-bg": dest.bgColor,
          } as React.CSSProperties}
        >
          <div className="quick-destination__icon">{dest.icon}</div>
          <div className="quick-destination__content">
            <span className="quick-destination__name">{dest.name}</span>
            {!compact && (
              <span className="quick-destination__desc">{dest.description}</span>
            )}
          </div>
          <div className="quick-destination__arrow">
            <NavigationIcon size={16} />
          </div>
        </button>
      ))}
    </div>
  );
}
