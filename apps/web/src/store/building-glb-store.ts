import { create } from "zustand";

export type GlbPos = { x: number; z: number };

interface BuildingGlbStore {
  positions: Record<string, GlbPos>;
  setPositions: (positions: Record<string, GlbPos>) => void;
  getPosition: (buildingId: string) => GlbPos | null;
}

export const useBuildingGlbStore = create<BuildingGlbStore>((set, get) => ({
  positions: {},
  setPositions: (positions) => set({ positions }),
  getPosition: (buildingId) => get().positions[buildingId] ?? null,
}));
