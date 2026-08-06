import { Box3, Matrix4, Vector3, type Object3D } from "three";

/**
 * Calcula la traslación del grupo que deja el contenido centrado en X/Z y
 * apoyado sobre Y=0. Box3 entrega límites en coordenadas de mundo; antes de
 * aplicar la rotación del campus hay que devolverlos al espacio del padre.
 * De lo contrario, el centro se rota dos veces y un GLB con origen desplazado
 * termina cientos de unidades fuera de la cámara.
 */
export function getCenteredObjectPosition(
  scene: Object3D,
  rotationY: number,
  fallback = new Vector3(),
): Vector3 {
  scene.updateWorldMatrix(true, true);
  const worldBox = new Box3().setFromObject(scene);
  if (worldBox.isEmpty()) return fallback.clone();

  const parentInverse = scene.parent
    ? scene.parent.matrixWorld.clone().invert()
    : new Matrix4();
  const parentBox = worldBox.clone().applyMatrix4(parentInverse);
  const center = parentBox.getCenter(new Vector3());
  const cos = Math.cos(rotationY);
  const sin = Math.sin(rotationY);

  return new Vector3(
    -(center.x * cos + center.z * sin),
    -parentBox.min.y,
    -(-center.x * sin + center.z * cos),
  );
}
