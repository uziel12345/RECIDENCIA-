-- ============================================================
-- BUILDING ENTRANCES - AUTO-MATCH AL NODO MÁS CERCANO
-- Fecha: 2026-05-27
-- Descripción: Para cada edificio activo con coordenadas, busca
--   el navigation_node activo más cercano y crea el building_entrance.
-- Pre-requisitos:
--   - navigation_nodes: 70 nodos activos (trazados manualmente)
--   - buildings: todos los edificios con x, z poblados
--   - building_entrances: vacía (0 registros)
-- ============================================================

-- VERIFICACIÓN previa (descomentar para revisar antes de insertar)
-- SELECT b.id, b.name, b.slug, b.x, b.z,
--        (SELECT n.code FROM navigation_nodes n
--         WHERE n.is_active = 1
--         ORDER BY POW(n.x - b.x, 2) + POW(n.z - b.z, 2) LIMIT 1) AS nearest_node_code,
--        (SELECT SQRT(POW(n.x - b.x, 2) + POW(n.z - b.z, 2)) FROM navigation_nodes n
--         WHERE n.is_active = 1
--         ORDER BY POW(n.x - b.x, 2) + POW(n.z - b.z, 2) LIMIT 1) AS distance
-- FROM buildings b
-- WHERE b.is_active = 1 AND b.x IS NOT NULL AND b.z IS NOT NULL
-- ORDER BY distance DESC;

-- ============================================================
-- INSERT PRINCIPAL
-- ============================================================
INSERT INTO building_entrances
  (id, building_id, node_id, entrance_name, entrance_type, is_primary, is_accessible)
SELECT
  UUID(),
  b.id,
  (SELECT n.id
   FROM navigation_nodes n
   WHERE n.is_active = 1
   ORDER BY POW(n.x - b.x, 2) + POW(n.z - b.z, 2)
   LIMIT 1),
  CONCAT('Acceso ', b.name),
  'main',
  1,
  1
FROM buildings b
WHERE b.is_active = 1
  AND b.x IS NOT NULL
  AND b.z IS NOT NULL
  AND NOT EXISTS (
    SELECT 1 FROM building_entrances be WHERE be.building_id = b.id
  );

-- ============================================================
-- VERIFICACIÓN post-inserción
-- ============================================================
-- Cuántos edificios quedaron sin entrance (no deberían ser > 0):
-- SELECT COUNT(*) AS sin_entrance
-- FROM buildings b
-- WHERE b.is_active = 1 AND b.x IS NOT NULL AND b.z IS NOT NULL
--   AND NOT EXISTS (SELECT 1 FROM building_entrances be WHERE be.building_id = b.id);

-- Ver todos los entrances creados con su distancia al nodo:
-- SELECT b.name AS edificio, b.slug, n.code AS nodo, n.name AS nodo_nombre,
--        ROUND(SQRT(POW(n.x - b.x, 2) + POW(n.z - b.z, 2)), 1) AS distancia_unidades,
--        be.entrance_type, be.is_primary
-- FROM building_entrances be
-- JOIN buildings b ON b.id = be.building_id
-- JOIN navigation_nodes n ON n.id = be.node_id
-- ORDER BY distancia_unidades DESC;
