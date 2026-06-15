-- ============================================================
-- Edificios con mesh en el GLB pero sin entrada en la BD
-- Fecha: 2026-06-10
-- Fuente: lista real de meshes de campus.glb cruzada con croquis ITO 2019
--
-- Agrega tres edificios cuyo modelo 3D existe en campus.glb
-- pero que carecen de registro en la tabla buildings:
--   • Aulas K       (GLB: "Aulas K")
--   • Edificio Q    (GLB: "Edificio Q_Edificio Q")
--   • Edificio Nuevo(GLB: "Edificio Nuevo")
--
-- Usa NOT EXISTS por código para evitar duplicados en re-ejecuciones.
-- Aplica con MySQL Workbench o CLI:
--   mysql -u <usuario> -p mapa_ito < docs/migration-buildings-glb-unlinked-20260610.sql
-- ============================================================

START TRANSACTION;

-- ── Aulas K ──────────────────────────────────────────────────────────────────
-- Bloque de aulas próximo al Edificio K, visible en el GLB.
-- model_node_name debe coincidir con glb-utils.ts → DB_TO_GLB_NAME["Aulas_K"] = "Aulas K"
INSERT INTO buildings (id, code, name, slug, description, model_node_name,
  x, y, z, latitude, longitude, is_active, is_priority, deleted_at,
  category_id, created_at, updated_at)
SELECT UUID(), 'AUL-K', 'Aulas K', 'aulas-k',
  NULL, 'Aulas_K',
  NULL, 0, NULL, NULL, NULL, 1, 0, NULL, bc.id, NOW(), NOW()
FROM building_categories bc
WHERE bc.code = 'aulas'
  AND NOT EXISTS (SELECT 1 FROM buildings b WHERE b.code = 'AUL-K');

-- ── Edificio Q ───────────────────────────────────────────────────────────────
-- Edificio nuevo no presente en el croquis 2019.
-- model_node_name → glb-utils.ts: DB_TO_GLB_NAME["Edificio_Q"] = "Edificio Q_Edificio Q"
INSERT INTO buildings (id, code, name, slug, description, model_node_name,
  x, y, z, latitude, longitude, is_active, is_priority, deleted_at,
  category_id, created_at, updated_at)
SELECT UUID(), 'Q', 'Edificio Q', 'edificio-q',
  NULL, 'Edificio_Q',
  NULL, 0, NULL, NULL, NULL, 1, 0, NULL, bc.id, NOW(), NOW()
FROM building_categories bc
WHERE bc.code = 'aulas'
  AND NOT EXISTS (SELECT 1 FROM buildings b WHERE b.code = 'Q');

-- ── Edificio Nuevo ───────────────────────────────────────────────────────────
-- Edificio de reciente construcción, visible en el GLB.
-- model_node_name → glb-utils.ts: DB_TO_GLB_NAME["Edificio_Nuevo"] = "Edificio Nuevo"
INSERT INTO buildings (id, code, name, slug, description, model_node_name,
  x, y, z, latitude, longitude, is_active, is_priority, deleted_at,
  category_id, created_at, updated_at)
SELECT UUID(), 'EDIF-NUEVO', 'Edificio Nuevo', 'edificio-nuevo',
  NULL, 'Edificio_Nuevo',
  NULL, 0, NULL, NULL, NULL, 1, 0, NULL, bc.id, NOW(), NOW()
FROM building_categories bc
WHERE bc.code = 'aulas'
  AND NOT EXISTS (SELECT 1 FROM buildings b WHERE b.code = 'EDIF-NUEVO');

COMMIT;

-- ============================================================
-- VERIFICACIÓN (ejecutar después del commit):
-- SELECT code, name, model_node_name, is_active
-- FROM buildings
-- WHERE code IN ('AUL-K', 'Q', 'EDIF-NUEVO')
-- ORDER BY code;
-- ============================================================
