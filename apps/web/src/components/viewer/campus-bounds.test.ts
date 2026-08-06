import { Box3, BoxGeometry, Group, Mesh, MeshBasicMaterial, Vector3 } from "three";
import { describe, expect, it } from "vitest";
import { getCenteredObjectPosition } from "./campus-bounds";

const ROTATION_Y = Math.PI / 2;

function createOffsetCampus(centerX: number, centerZ: number) {
  const campus = new Group();
  const geometry = new BoxGeometry(284, 10, 320);
  const material = new MeshBasicMaterial();
  const mesh = new Mesh(geometry, material);
  mesh.position.set(centerX, 5, centerZ);
  campus.add(mesh);

  const parent = new Group();
  parent.rotation.y = ROTATION_Y;
  parent.add(campus);

  return { campus, parent, geometry, material };
}

describe("campus bounds", () => {
  it("elimina la transformación del padre antes de calcular el centro", () => {
    const { campus, parent, geometry, material } = createOffsetCampus(434, -100);
    const position = getCenteredObjectPosition(campus, ROTATION_Y);
    parent.position.copy(position);
    parent.updateWorldMatrix(true, true);

    const centered = new Box3().setFromObject(campus);
    const center = centered.getCenter(new Vector3());
    expect(center.x).toBeCloseTo(0, 5);
    expect(center.z).toBeCloseTo(0, 5);
    expect(centered.min.y).toBeCloseTo(0, 5);

    geometry.dispose();
    material.dispose();
  });

  it("produce el mismo encuadre aunque el GLB tenga otro origen interno", () => {
    const local = createOffsetCampus(10, 18);
    const production = createOffsetCampus(434, -100);

    local.parent.position.copy(getCenteredObjectPosition(local.campus, ROTATION_Y));
    production.parent.position.copy(
      getCenteredObjectPosition(production.campus, ROTATION_Y),
    );
    local.parent.updateWorldMatrix(true, true);
    production.parent.updateWorldMatrix(true, true);

    const localBox = new Box3().setFromObject(local.campus);
    const productionBox = new Box3().setFromObject(production.campus);
    for (const axis of ["x", "y", "z"] as const) {
      expect(productionBox.min[axis]).toBeCloseTo(localBox.min[axis], 5);
      expect(productionBox.max[axis]).toBeCloseTo(localBox.max[axis], 5);
    }

    local.geometry.dispose();
    local.material.dispose();
    production.geometry.dispose();
    production.material.dispose();
  });
});
