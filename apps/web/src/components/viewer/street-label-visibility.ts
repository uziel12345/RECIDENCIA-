import type { CampusStreet } from "@ito-map/shared";

const MAX_VISIBLE_MOBILE = 2;
const MAX_VISIBLE_DESKTOP = 10;

export function getVisibleCampusStreets(
  streets: CampusStreet[],
  isMobile: boolean,
  cameraPosition?: { x: number; z: number }
): CampusStreet[] {
  const visible = streets.filter((street) => street.isVisible);
  const limit = isMobile ? MAX_VISIBLE_MOBILE : MAX_VISIBLE_DESKTOP;
  if (visible.length <= limit) return visible;

  if (!cameraPosition) return visible.slice(0, limit);

  // Con más calles de las que caben en pantalla, se priorizan las más
  // cercanas a la cámara en vez de cortar por orden arbitrario de llegada.
  return [...visible]
    .sort((a, b) => {
      const da =
        (a.position.x - cameraPosition.x) ** 2 +
        (a.position.z - cameraPosition.z) ** 2;
      const db =
        (b.position.x - cameraPosition.x) ** 2 +
        (b.position.z - cameraPosition.z) ** 2;
      return da - db;
    })
    .slice(0, limit);
}
