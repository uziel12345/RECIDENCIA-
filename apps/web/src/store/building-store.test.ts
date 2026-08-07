import { beforeEach, describe, expect, it } from "vitest";
import type { Building, SearchResult } from "@ito-map/shared";
import { useBuildingStore } from "./building-store";

const building = {
  id: "building-i",
  code: "I",
  name: "Edificio I",
  x: 10,
  y: 0,
  z: 20,
  is_active: true,
} as Building;

const classroomResult: SearchResult = {
  id: "classroom-i4",
  kind: "classroom",
  title: "Aula I-4",
  subtitle: "Edificio I",
  buildingId: building.id,
  buildingName: building.name,
  aliases: ["i4"],
  keywords: ["aula"],
  score: 100,
};

describe("building search selection", () => {
  beforeEach(() => useBuildingStore.getState().resetBuildingState());

  it("selects the related building and exposes the detail target", () => {
    useBuildingStore.getState().selectSearchResult(classroomResult, [building], []);
    expect(useBuildingStore.getState()).toMatchObject({
      selectedBuilding: { id: "building-i" },
      selectedSearchResult: { id: "classroom-i4" },
      highlightedSection: { section: "aulas", targetId: "classroom-i4" },
    });
  });

  it("keeps pending services visible without inventing a building", () => {
    useBuildingStore.getState().selectSearchResult(
      {
        ...classroomResult,
        id: "service-english",
        kind: "service",
        title: "Constancia de terminación de inglés",
        buildingId: null,
        buildingName: null,
        validationStatus: "pending_validation",
      },
      [building],
      []
    );
    expect(useBuildingStore.getState().selectedBuilding).toBeNull();
    expect(useBuildingStore.getState().selectedSearchResult?.validationStatus).toBe(
      "pending_validation"
    );
  });
});

describe("building panel visibility is independent from selection", () => {
  beforeEach(() => useBuildingStore.getState().resetBuildingState());

  it("opens the panel automatically when a building is selected", () => {
    useBuildingStore.getState().setSelectedBuilding(building);
    expect(useBuildingStore.getState().isBuildingPanelOpen).toBe(true);
  });

  it("closeBuildingPanel hides the panel but keeps the building selected (the pin/highlight stays)", () => {
    useBuildingStore.getState().setSelectedBuilding(building);
    useBuildingStore.getState().closeBuildingPanel();

    const state = useBuildingStore.getState();
    expect(state.selectedBuilding?.id).toBe("building-i");
    expect(state.isBuildingPanelOpen).toBe(false);
  });

  it("re-selecting the same building reopens the panel", () => {
    useBuildingStore.getState().setSelectedBuilding(building);
    useBuildingStore.getState().closeBuildingPanel();
    useBuildingStore.getState().setSelectedBuilding(building);

    expect(useBuildingStore.getState().isBuildingPanelOpen).toBe(true);
  });

  it("setSelectedBuilding(null) clears both the selection and the panel", () => {
    useBuildingStore.getState().setSelectedBuilding(building);
    useBuildingStore.getState().setSelectedBuilding(null);

    const state = useBuildingStore.getState();
    expect(state.selectedBuilding).toBeNull();
    expect(state.isBuildingPanelOpen).toBe(false);
  });

  it("selecting a building via search opens the panel", () => {
    useBuildingStore.getState().selectSearchResult(classroomResult, [building], []);
    expect(useBuildingStore.getState().isBuildingPanelOpen).toBe(true);
  });

  it("clearSelection resets the panel flag too", () => {
    useBuildingStore.getState().setSelectedBuilding(building);
    useBuildingStore.getState().clearSelection();
    expect(useBuildingStore.getState().isBuildingPanelOpen).toBe(false);
  });
});
