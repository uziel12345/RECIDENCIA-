-- ============================================================
-- BUILDING ENTRANCES — FASE 1 (edificios con nodo cercano ≤ 50 unidades)
-- Fecha: 2026-05-27
-- Edificios incluidos: 27  |  Excluidos (zona sin caminos): 10
--
-- Excluidos para Fase 2 (necesitan nodos nuevos en el editor):
--   Edificio Q (51), Edificio F (67), Edificio H (75),
--   Lab Industrial (83), Audiovisual Lic (93), Edificio G (99),
--   Edificio K (101), Edificio Nuevo (103), Aulas S (119),
--   Edificio I (122), Edificio J (124)
-- ============================================================

START TRANSACTION;

INSERT INTO building_entrances
  (id, building_id, node_id, entrance_name, entrance_type, is_primary, is_accessible)
SELECT UUID(), sub.building_id, sub.node_id, sub.entrance_name, 'main', 1, 1
FROM (
  SELECT
    b.id   AS building_id,
    (SELECT n.id
     FROM navigation_nodes n
     WHERE n.is_active = 1
     ORDER BY POW(n.x - b.x, 2) + POW(n.z - b.z, 2)
     LIMIT 1) AS node_id,
    CONCAT('Acceso ', b.name) AS entrance_name,
    SQRT((SELECT POW(n.x - b.x, 2) + POW(n.z - b.z, 2)
          FROM navigation_nodes n
          WHERE n.is_active = 1
          ORDER BY POW(n.x - b.x, 2) + POW(n.z - b.z, 2)
          LIMIT 1)) AS distance
  FROM buildings b
  WHERE b.is_active = 1
    AND b.x IS NOT NULL
    AND b.z IS NOT NULL
    AND NOT EXISTS (
      SELECT 1 FROM building_entrances be WHERE be.building_id = b.id
    )
) sub
WHERE sub.distance <= 50;

COMMIT;

-- ============================================================
-- VERIFICACIÓN (ejecutar después del COMMIT)
-- ============================================================
-- Cuántos entrances quedaron insertados:
-- SELECT COUNT(*) AS total FROM building_entrances;   -- esperado: ~27

-- Ver el detalle de lo insertado:
-- SELECT b.name AS edificio, b.slug,
--        n.code AS nodo,
--        ROUND(SQRT(POW(n.x - b.x, 2) + POW(n.z - b.z, 2)), 1) AS distancia
-- FROM building_entrances be
-- JOIN buildings b ON b.id = be.building_id
-- JOIN navigation_nodes n ON n.id = be.node_id
-- ORDER BY distancia DESC;

-- Edificios que quedaron SIN entrance (los de Fase 2):
-- SELECT b.name, b.slug
-- FROM buildings b
-- WHERE b.is_active = 1 AND b.x IS NOT NULL AND b.z IS NOT NULL
--   AND NOT EXISTS (SELECT 1 FROM building_entrances be WHERE be.building_id = b.id)
-- ORDER BY b.name;
