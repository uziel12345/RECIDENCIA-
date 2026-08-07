import { describe, expect, it } from "vitest";
import { Object3D } from "three";
import type { Building } from "../../features/buildings/types/building";
import {
  BUILDING_HIT_TARGET_KEY,
  buildNameToBuildingMap,
  findBuildingForObject,
  findExactBuildingFromIntersections,
  groupActiveBuildingsByModelNode,
  pickPrimaryBuilding,
  shouldClearHoverOnPointerOut,
  shouldHideBuildingLabel,
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

  it("conserva todas las etiquetas cuando varios edificios comparten nodo", () => {
    const first = building({ id: "first", model_node_name: "Edificio_A" });
    const second = building({ id: "second", model_node_name: "Edificio_A" });
    const inactive = building({
      id: "inactive",
      model_node_name: "Edificio_A",
      is_active: false,
    });

    const groups = groupActiveBuildingsByModelNode([first, second, inactive]);

    expect([...groups.values()]).toEqual([[first, second]]);
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

  it("el ganador del hover 3D es siempre el mismo que el de la etiqueta 2D, sin importar el orden de llegada", () => {
    // Bug real: seleccionabas un edificio tocando su malla y la etiqueta
    // visible mostraba el nombre del OTRO edificio que comparte el mismo
    // nodo — buildNameToBuildingMap elegía "el primero del arreglo" cuando
    // ninguno era prioritario, mientras la etiqueta 2D siempre eligió por
    // código alfabético. Con datos reales el orden de la API no coincide
    // con el alfabético, así que discrepaban. Aquí "zzz-later" llega
    // primero en el arreglo pero "aaa-first" debe ganar en ambos lugares.
    const later = building({ id: "later", code: "zzz-later", model_node_name: "Nodo_Compartido" });
    const first = building({ id: "first", code: "aaa-first", model_node_name: "Nodo_Compartido" });

    const group = [later, first];
    const hoverIndex = buildNameToBuildingMap(group);
    const mesh = new Object3D();
    mesh.name = "Nodo_Compartido";

    expect(pickPrimaryBuilding(group)).toBe(first);
    expect(findBuildingForObject(mesh, hoverIndex)).toBe(first);
  });

  it("no limpia el hover nuevo cuando sale una caja vecina solapada", () => {
    expect(shouldClearHoverOnPointerOut("a", "b")).toBe(false);
    expect(shouldClearHoverOnPointerOut("a", "a")).toBe(true);
    expect(shouldClearHoverOnPointerOut("b", null)).toBe(false);
  });

  it("muestra inmediatamente la etiqueta activa aunque el layout anterior la ocultara", () => {
    expect(shouldHideBuildingLabel(true, true, false)).toBe(false);
    expect(shouldHideBuildingLabel(true, false, true)).toBe(false);
    expect(shouldHideBuildingLabel(false, true, false)).toBe(true);
    expect(shouldHideBuildingLabel(false, false, true)).toBe(true);
    expect(shouldHideBuildingLabel(false, false, false)).toBe(false);
  });

  it("mantiene fija una etiqueta aunque exista colisión u overlay", () => {
    expect(shouldHideBuildingLabel(false, true, false, true)).toBe(false);
    expect(shouldHideBuildingLabel(false, false, true, true)).toBe(false);
    expect(shouldHideBuildingLabel(false, true, true, true)).toBe(false);
  });
});
