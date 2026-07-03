import { describe, expect, it } from "vitest";
import type { Building } from "../../buildings/types/building";
import { resolveCurrentBuilding } from "./location-resolver";

function building(input: Partial<Building> & Pick<Building, "id" | "name">): Building {
  return {
    id: input.id,
    code: input.code ?? input.name.slice(0, 3).toUpperCase(),
    name: input.name,
    slug: input.slug ?? input.name.toLowerCase().replace(/\s+/g, "-"),
    description: null,
    model_node_name: input.model_node_name ?? input.name,
    x: input.x ?? null,
    y: input.y ?? 0,
    z: input.z ?? null,
    latitude: input.latitude ?? null,
    longitude: input.longitude ?? null,
    is_active: input.is_active ?? true,
    is_priority: input.is_priority ?? false,
    category_code: input.category_code ?? "aulas",
    category_name: input.category_name ?? "Aulas",
    category_color: input.category_color ?? "#2563eb",
    cover_image_url: null,
  };
}

describe("resolveCurrentBuilding", () => {
  it("returns a high confidence match when GPS and model position agree", () => {
    const result = resolveCurrentBuilding(
      [
        building({
          id: "a",
          name: "Edificio A",
          latitude: 17.0776,
          longitude: -96.7441,
          x: 10,
          z: 20,
        }),
        building({
          id: "b",
          name: "Edificio B",
          latitude: 17.0782,
          longitude: -96.7435,
          x: 70,
          z: 80,
        }),
      ],
      { latitude: 17.077601, longitude: -96.744101, accuracy: 8 },
      { x: 11, y: 2, z: 21 },
    );

    expect(result?.buildingId).toBe("a");
    expect(result?.confidence).toBe("high");
    expect(result?.method).toBe("gps_and_model");
  });

  it("does not resolve a building when browser accuracy is too poor", () => {
    const result = resolveCurrentBuilding(
      [
        building({
          id: "a",
          name: "Edificio A",
          latitude: 17.0776,
          longitude: -96.7441,
          x: 10,
          z: 20,
        }),
      ],
      { latitude: 17.077601, longitude: -96.744101, accuracy: 120 },
      { x: 11, y: 2, z: 21 },
    );

    expect(result).toBeNull();
  });

  it("marks close competing buildings as low confidence", () => {
    const result = resolveCurrentBuilding(
      [
        building({
          id: "a",
          name: "Edificio A",
          latitude: 17.0776,
          longitude: -96.7441,
          x: 10,
          z: 20,
        }),
        building({
          id: "b",
          name: "Edificio B",
          latitude: 17.07762,
          longitude: -96.74412,
          x: 14,
          z: 23,
        }),
      ],
      { latitude: 17.077601, longitude: -96.744101, accuracy: 8 },
      { x: 11, y: 2, z: 21 },
    );

    expect(result).not.toBeNull();
    expect(result?.confidence).toBe("low");
  });

  it("prefers a geofence match over nearest model distance", () => {
    const result = resolveCurrentBuilding(
      [
        building({ id: "a", name: "Edificio A", x: 100, z: 100 }),
        building({ id: "cc", name: "Centro de Computo", x: 0, z: -120 }),
      ],
      { latitude: 17.079, longitude: -96.7442, accuracy: 8 },
      { x: 100, y: 2, z: 100 },
      [
        {
          id: "gf-cc",
          building_id: "cc",
          building_name: "Centro de Computo",
          building_code: "CC",
          name: "CC",
          priority: 10,
          is_active: true,
          created_at: "",
          updated_at: "",
          polygon: [
            { lat: 17.0792, lng: -96.7444 },
            { lat: 17.0792, lng: -96.7440 },
            { lat: 17.0788, lng: -96.7440 },
            { lat: 17.0788, lng: -96.7444 },
          ],
        },
      ],
    );

    expect(result?.buildingId).toBe("cc");
    expect(result?.confidence).toBe("high");
    expect(result?.method).toBe("geofence");
  });
});
