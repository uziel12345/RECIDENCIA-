-- ============================================================
-- Edificios faltantes — Captura de pantalla croquis ITO
-- Fecha: 2026-05-28
-- Complementa migration-buildings-from-croquis-20260528.sql
--
-- Agrega los edificios visibles en el screenshot del croquis
-- que NO estaban cubiertos por migraciones anteriores.
--
-- Usa NOT EXISTS por código para evitar duplicados.
-- ============================================================

START TRANSACTION;

-- #4 — Lab. de Simulación
INSERT INTO buildings (id, code, name, slug, description, model_node_name,
  x, y, z, latitude, longitude, is_active, is_priority, deleted_at,
  category_id, created_at, updated_at)
SELECT UUID(), 'LAB-SIM', 'Lab. de Simulación', 'lab-simulacion',
  NULL, NULL,
  NULL, 0, NULL, NULL, NULL, 1, 0, NULL, bc.id, NOW(), NOW()
FROM building_categories bc
WHERE bc.code = 'laboratorio'
  AND NOT EXISTS (SELECT 1 FROM buildings b WHERE b.code = 'LAB-SIM');

-- #5 — Caldera
INSERT INTO buildings (id, code, name, slug, description, model_node_name,
  x, y, z, latitude, longitude, is_active, is_priority, deleted_at,
  category_id, created_at, updated_at)
SELECT UUID(), 'CAL', 'Caldera', 'caldera',
  NULL, NULL,
  NULL, 0, NULL, NULL, NULL, 1, 0, NULL, bc.id, NOW(), NOW()
FROM building_categories bc
WHERE bc.code = 'servicio'
  AND NOT EXISTS (SELECT 1 FROM buildings b WHERE b.code = 'CAL');

-- #6 — Centro de Cómputo (puede ya existir en la BD)
INSERT INTO buildings (id, code, name, slug, description, model_node_name,
  x, y, z, latitude, longitude, is_active, is_priority, deleted_at,
  category_id, created_at, updated_at)
SELECT UUID(), 'CC', 'Centro de Cómputo', 'centro-computo',
  'Área destinada a actividades de cómputo.', 'Centro_de_Computo',
  NULL, 0, NULL, NULL, NULL, 1, 0, NULL, bc.id, NOW(), NOW()
FROM building_categories bc
WHERE bc.code = 'laboratorio'
  AND NOT EXISTS (SELECT 1 FROM buildings b WHERE b.code = 'CC');

-- #7 — Aulas de Doctorado (distinto de Cubículos de Doctorado CUB-DOC)
INSERT INTO buildings (id, code, name, slug, description, model_node_name,
  x, y, z, latitude, longitude, is_active, is_priority, deleted_at,
  category_id, created_at, updated_at)
SELECT UUID(), 'AUL-DOC', 'Aulas de Doctorado', 'aulas-doctorado',
  NULL, NULL,
  NULL, 0, NULL, NULL, NULL, 1, 0, NULL, bc.id, NOW(), NOW()
FROM building_categories bc
WHERE bc.code = 'aulas'
  AND NOT EXISTS (SELECT 1 FROM buildings b WHERE b.code = 'AUL-DOC');

-- #18 — Aula AC
INSERT INTO buildings (id, code, name, slug, description, model_node_name,
  x, y, z, latitude, longitude, is_active, is_priority, deleted_at,
  category_id, created_at, updated_at)
SELECT UUID(), 'AUL-AC', 'Aula AC', 'aula-ac',
  NULL, NULL,
  NULL, 0, NULL, NULL, NULL, 1, 0, NULL, bc.id, NOW(), NOW()
FROM building_categories bc
WHERE bc.code = 'aulas'
  AND NOT EXISTS (SELECT 1 FROM buildings b WHERE b.code = 'AUL-AC');

-- #20 — Ludoteca Sección 61
INSERT INTO buildings (id, code, name, slug, description, model_node_name,
  x, y, z, latitude, longitude, is_active, is_priority, deleted_at,
  category_id, created_at, updated_at)
SELECT UUID(), 'LUD', 'Ludoteca Sección 61', 'ludoteca-seccion-61',
  NULL, NULL,
  NULL, 0, NULL, NULL, NULL, 1, 0, NULL, bc.id, NOW(), NOW()
FROM building_categories bc
WHERE bc.code = 'servicio'
  AND NOT EXISTS (SELECT 1 FROM buildings b WHERE b.code = 'LUD');

-- #24 — Edificio Multicarrera
INSERT INTO buildings (id, code, name, slug, description, model_node_name,
  x, y, z, latitude, longitude, is_active, is_priority, deleted_at,
  category_id, created_at, updated_at)
SELECT UUID(), 'MC', 'Edificio Multicarrera', 'edificio-multicarrera',
  NULL, NULL,
  NULL, 0, NULL, NULL, NULL, 1, 0, NULL, bc.id, NOW(), NOW()
FROM building_categories bc
WHERE bc.code = 'aulas'
  AND NOT EXISTS (SELECT 1 FROM buildings b WHERE b.code = 'MC');

-- #25 — Aula A
INSERT INTO buildings (id, code, name, slug, description, model_node_name,
  x, y, z, latitude, longitude, is_active, is_priority, deleted_at,
  category_id, created_at, updated_at)
SELECT UUID(), 'AUL-A', 'Aula A', 'aula-a',
  NULL, NULL,
  NULL, 0, NULL, NULL, NULL, 1, 0, NULL, bc.id, NOW(), NOW()
FROM building_categories bc
WHERE bc.code = 'aulas'
  AND NOT EXISTS (SELECT 1 FROM buildings b WHERE b.code = 'AUL-A');

-- #26 — Aula D
INSERT INTO buildings (id, code, name, slug, description, model_node_name,
  x, y, z, latitude, longitude, is_active, is_priority, deleted_at,
  category_id, created_at, updated_at)
SELECT UUID(), 'AUL-D', 'Aula D', 'aula-d',
  NULL, NULL,
  NULL, 0, NULL, NULL, NULL, 1, 0, NULL, bc.id, NOW(), NOW()
FROM building_categories bc
WHERE bc.code = 'aulas'
  AND NOT EXISTS (SELECT 1 FROM buildings b WHERE b.code = 'AUL-D');

-- #34 — Extraescolares (distinto de #35 Serv. Escolares / Div. Est. Prof.)
INSERT INTO buildings (id, code, name, slug, description, model_node_name,
  x, y, z, latitude, longitude, is_active, is_priority, deleted_at,
  category_id, created_at, updated_at)
SELECT UUID(), 'EXTRA', 'Extraescolares', 'extraescolares',
  NULL, NULL,
  NULL, 0, NULL, NULL, NULL, 1, 0, NULL, bc.id, NOW(), NOW()
FROM building_categories bc
WHERE bc.code = 'servicio'
  AND NOT EXISTS (SELECT 1 FROM buildings b WHERE b.code = 'EXTRA');

-- #39 — Planta de Tratamiento de Aguas Residuales
INSERT INTO buildings (id, code, name, slug, description, model_node_name,
  x, y, z, latitude, longitude, is_active, is_priority, deleted_at,
  category_id, created_at, updated_at)
SELECT UUID(), 'PTR', 'Planta de Tratamiento de Aguas Residuales', 'planta-tratamiento-aguas',
  NULL, NULL,
  NULL, 0, NULL, NULL, NULL, 1, 0, NULL, bc.id, NOW(), NOW()
FROM building_categories bc
WHERE bc.code = 'servicio'
  AND NOT EXISTS (SELECT 1 FROM buildings b WHERE b.code = 'PTR');

COMMIT;

-- ============================================================
-- VERIFICACIÓN (ejecutar después del commit):
-- SELECT code, name, is_active FROM buildings ORDER BY name;
-- ============================================================
