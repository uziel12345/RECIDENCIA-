-- ============================================================
-- Edificio M (item 15 del croquis "EDIFICIOS: AULAS..."): no existía
-- como building en la BD. El GLB sí tiene el nodo "Aula_M" (ya mapeado
-- en apps/web/src/components/viewer/glb-utils.ts DB_TO_GLB_NAME, sin
-- necesidad de tocar ese archivo).
--
-- x/z: coordenadas aproximadas leídas directamente de la traslación del
-- nodo "Aula_M" en el GLB (no calibradas contra el mapa/GPS real —
-- mismo estado inicial que tuvieron en su momento L, X, X001, ENIE, etc.
-- en migration-buildings-missing-20260518.sql). El building se ve y se
-- selecciona correctamente en 3D de inmediato porque esa parte usa la
-- posición LIVE del nodo del GLB, no esta columna — x/z solo alimentan
-- geocerca GPS / "Cómo llegar", que si necesitan calibración fina vía
-- el panel de calibración del admin (CampusCalibrationPanel).
--
-- Fecha: 2026-07-13
-- Aplica con:
--   mysql -u <usuario> -p mapa_ito < docs/migration-edificio-m-20260713.sql
-- ============================================================

INSERT INTO buildings (id, code, name, slug, description, model_node_name, x, y, z, is_active, is_priority, category_id)
SELECT UUID(), 'M', 'Edificio M', 'edificio-m',
       'Edificio 15 del croquis institucional. Pendiente de ubicar con coordenadas exactas.',
       'Aula_M', 74, 0, 10, 1, 0, id
FROM building_categories WHERE code = 'aulas'
  AND NOT EXISTS (SELECT 1 FROM buildings WHERE code = 'M');

INSERT INTO classrooms (id, building_id, code, name, floor, type)
SELECT UUID(), b.id, x.code, x.name, 0, 'aula'
FROM buildings b
JOIN (
  SELECT 'M1' code,'M1' name UNION ALL SELECT 'M2','M2' UNION ALL SELECT 'M3','M3'
  UNION ALL SELECT 'M4','M4' UNION ALL SELECT 'M5','M5' UNION ALL SELECT 'M6','M6' UNION ALL SELECT 'M7','M7'
) x ON 1=1
WHERE b.code = 'M'
  AND NOT EXISTS (SELECT 1 FROM classrooms c WHERE c.building_id = b.id AND c.code = x.code);
