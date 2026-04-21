import { create } from "zustand";
import type { Building } from "../features/buildings/types/building";

type BuildingStore = {
  selectedBuilding: Building | null;

  routeOrigin: Building | null;
  routeDestination: Building | null;

  searchTerm: string;

  setSelectedBuilding: (building: Building | null) => void;

  setRouteOrigin: (building: Building | null) => void;
  setRouteDestination: (building: Building | null) => void;

  setSearchTerm: (value: string) => void;

  clearRoute: () => void;
};

export const useBuildingStore = create<BuildingStore>((set) => ({
  selectedBuilding: null,

  routeOrigin: null,
  routeDestination: null,

  searchTerm: "",

  setSelectedBuilding: (building) =>
    set({
      selectedBuilding: building,
    }),

  setRouteOrigin: (building) =>
    set({
      routeOrigin: building,
    }),

  setRouteDestination: (building) =>
    set({
      routeDestination: building,
    }),

  setSearchTerm: (value) =>
    set({
      searchTerm: value,
    }),

  clearRoute: () =>
    set({
      routeOrigin: null,
      routeDestination: null,
    }),
}));