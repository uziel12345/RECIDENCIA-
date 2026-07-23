import { describe, expect, it } from "vitest";
import { Object3D } from "three";
import type { Building } from "../../features/buildings/types/building";
import {
  BUILDING_HIT_TARGET_KEY,
  buildNameToBuildingMap,
  findBuildingForObject,
  findExactBuildingFromIntersections,
  shouldClearHoverOnPointerOut,
} from "./building-picking";

function building(input: Partial<Building> & Pick<Building, "id" | "model_node_name">): Building {
  return {
    code: input.id,
    name: input.id,
    slug: input.id,
    description: null,
    x: null,
    y: null,
    z: null,
    latitude: null,
    longitude: null,
    is_active: true,
    is_priority: false,
    category_code: "test",
    category_name: "Test",
    category_color: null,
    cover_image_url: null,
    ...input,
    id: input.id,
    model_node_name: input.model_node_name,
  };
}

describe("building picking", () => {
  it("resuelve una malla hija mediante el nombre normalizado de su ancestro", () => {
    const dpi = building({ id: "dpi", model_node_name: "D.P.I" });
    const index = buildNameToBuildingMap([dpi]);
    const node = new Object3D();
    node.name = "DPI";
    const mesh = new Object3D();
    node.add(mesh);

    expect(findBuildingForObject(mesh, index)).toBe(dpi);
  });

  it("usa el registro prioritario cuando dos edificios comparten nodo", () => {
    const secondary = building({ id: "secondary", model_node_name: "Edificio_A" });
    const priority = building({
      id: "priority",
      model_node_name: "Edificio_A",
      is_priority: true,
    });
    const index = buildNameToBuildingMap([secondary, priority]);
    const mesh = new Object3D();
    mesh.name = "Edificio_A";

    expect(findBuildingForObject(mesh, index)).toBe(priority);
  });

  it("prefiere la geometría real aunque una ayuda táctil aparezca primero", () => {
    const intended = building({ id: "intended", model_node_name: "Edificio_B" });
    const index = buildNameToBuildingMap([intended]);
    const overlappingHitTarget = new Object3D();
    overlappingHitTarget.userData[BUILDING_HIT_TARGET_KEY] = "neighbor";
    const visibleMesh = new Object3D();
    visibleMesh.name = "Edificio_B";

    expect(
      findExactBuildingFromIntersections(
        [{ object: overlappingHitTarget }, { object: visibleMesh }],
        index,
      ),
    ).toBe(intended);
  });

  it("no limpia el hover nuevo cuando sale una caja vecina solapada", () => {
    expect(shouldClearHoverOnPointerOut("a", "a", "b")).toBe(false);
    expect(shouldClearHoverOnPointerOut("a", "a", null)).toBe(true);
    expect(shouldClearHoverOnPointerOut("b", "a", "b")).toBe(true);
  });
});
