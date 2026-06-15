-- ============================================================
-- Edificios del croquis ITO 2019 — nombres oficiales y model_node_name
-- Fecha: 2026-06-10
-- Fuente: "RUTAS DE EVACUACIÓN Y PUNTOS DE REUNIÓN" ITO 2019 (croquis)
--         cruzado con lista real de meshes de campus.glb
--
-- Estrategia:
--   1. INSERT ... NOT EXISTS  →  agrega el edificio solo si no existe por código.
--   2. UPDATE ...             →  corrige model_node_name si está NULL o vacío
--                                para edificios que ya existían ("17 existentes").
--
-- Prerequisito: migration-buildings-glb-unlinked-20260610.sql ya aplicada
--               (agrega AUL-K, Q, EDIF-NUEVO).
--
-- Aplica con:
--   mysql -u <usuario> -p mapa_ito < docs/migration-buildings-nombres-croquis-20260610.sql
-- ============================================================

START TRANSACTION;

-- ════════════════════════════════════════════════════════════════
-- BLOQUE 1 — AULAS (edificios de salones numerados / con letra)
-- ════════════════════════════════════════════════════════════════

-- Edificio E  (croquis #29, GLB: "Edificio E_Edificio E")
INSERT INTO buildings (id, code, name, slug, description, model_node_name,
  x, y, z, latitude, longitude, is_active, is_priority, deleted_at,
  category_id, created_at, updated_at)
SELECT UUID(), 'E', 'Edificio E', 'edificio-e',
  NULL, 'Edificio_E',
  NULL, 0, NULL, NULL, NULL, 1, 0, NULL, bc.id, NOW(), NOW()
FROM building_categories bc
WHERE bc.code = 'aulas'
  AND NOT EXISTS (SELECT 1 FROM buildings b WHERE b.code = 'E');

UPDATE buildings SET model_node_name = 'Edificio_E'
WHERE code = 'E' AND (model_node_name IS NULL OR model_node_name = '');

-- Edificio F  (croquis #31, GLB: "Edificio F")
INSERT INTO buildings (id, code, name, slug, description, model_node_name,
  x, y, z, latitude, longitude, is_active, is_priority, deleted_at,
  category_id, created_at, updated_at)
SELECT UUID(), 'F', 'Edificio F', 'edificio-f',
  NULL, 'Edificio_F',
  NULL, 0, NULL, NULL, NULL, 1, 0, NULL, bc.id, NOW(), NOW()
FROM building_categories bc
WHERE bc.code = 'aulas'
  AND NOT EXISTS (SELECT 1 FROM buildings b WHERE b.code = 'F');

UPDATE buildings SET model_node_name = 'Edificio_F'
WHERE code = 'F' AND (model_node_name IS NULL OR model_node_name = '');

-- Edificio G  (croquis — visible en mapa, GLB: "Edificio G_Edificio G")
INSERT INTO buildings (id, code, name, slug, description, model_node_name,
  x, y, z, latitude, longitude, is_active, is_priority, deleted_at,
  category_id, created_at, updated_at)
SELECT UUID(), 'G', 'Edificio G', 'edificio-g',
  NULL, 'Edificio_G',
  NULL, 0, NULL, NULL, NULL, 1, 0, NULL, bc.id, NOW(), NOW()
FROM building_categories bc
WHERE bc.code = 'aulas'
  AND NOT EXISTS (SELECT 1 FROM buildings b WHERE b.code = 'G');

UPDATE buildings SET model_node_name = 'Edificio_G'
WHERE code = 'G' AND (model_node_name IS NULL OR model_node_name = '');

-- Edificio H  (croquis — "EDIFICIO H", GLB: "Edificio H_Edifucui H")
INSERT INTO buildings (id, code, name, slug, description, model_node_name,
  x, y, z, latitude, longitude, is_active, is_priority, deleted_at,
  category_id, created_at, updated_at)
SELECT UUID(), 'H', 'Edificio H', 'edificio-h',
  NULL, 'Edificio_H',
  NULL, 0, NULL, NULL, NULL, 1, 0, NULL, bc.id, NOW(), NOW()
FROM building_categories bc
WHERE bc.code = 'aulas'
  AND NOT EXISTS (SELECT 1 FROM buildings b WHERE b.code = 'H');

UPDATE buildings SET model_node_name = 'Edificio_H'
WHERE code = 'H' AND (model_node_name IS NULL OR model_node_name = '');

-- Edificio I  (croquis — "EDIFICIO I", GLB: "Edificio I.001")
INSERT INTO buildings (id, code, name, slug, description, model_node_name,
  x, y, z, latitude, longitude, is_active, is_priority, deleted_at,
  category_id, created_at, updated_at)
SELECT UUID(), 'I', 'Edificio I', 'edificio-i',
  NULL, 'Edificio_I',
  NULL, 0, NULL, NULL, NULL, 1, 0, NULL, bc.id, NOW(), NOW()
FROM building_categories bc
WHERE bc.code = 'aulas'
  AND NOT EXISTS (SELECT 1 FROM buildings b WHERE b.code = 'I');

UPDATE buildings SET model_node_name = 'Edificio_I'
WHERE code = 'I' AND (model_node_name IS NULL OR model_node_name = '');

-- Edificio J  (GLB: "Edificio J" — no numerado en croquis 2019, edificio nuevo)
INSERT INTO buildings (id, code, name, slug, description, model_node_name,
  x, y, z, latitude, longitude, is_active, is_priority, deleted_at,
  category_id, created_at, updated_at)
SELECT UUID(), 'J', 'Edificio J', 'edificio-j',
  NULL, 'Edificio_J',
  NULL, 0, NULL, NULL, NULL, 1, 0, NULL, bc.id, NOW(), NOW()
FROM building_categories bc
WHERE bc.code = 'aulas'
  AND NOT EXISTS (SELECT 1 FROM buildings b WHERE b.code = 'J');

UPDATE buildings SET model_node_name = 'Edificio_J'
WHERE code = 'J' AND (model_node_name IS NULL OR model_node_name = '');

-- Edificio D  (croquis #39 "EDIF. D" — "EDIFICIO D" visible en mapa)
-- Sin mesh propio en GLB — se deja model_node_name para cuando se modele
INSERT INTO buildings (id, code, name, slug, description, model_node_name,
  x, y, z, latitude, longitude, is_active, is_priority, deleted_at,
  category_id, created_at, updated_at)
SELECT UUID(), 'D', 'Edificio D', 'edificio-d',
  NULL, NULL,
  NULL, 0, NULL, NULL, NULL, 1, 0, NULL, bc.id, NOW(), NOW()
FROM building_categories bc
WHERE bc.code = 'aulas'
  AND NOT EXISTS (SELECT 1 FROM buildings b WHERE b.code = 'D');

-- Edificio S  (croquis — "EDIFICIO S" visible en mapa, sin mesh GLB)
INSERT INTO buildings (id, code, name, slug, description, model_node_name,
  x, y, z, latitude, longitude, is_active, is_priority, deleted_at,
  category_id, created_at, updated_at)
SELECT UUID(), 'S', 'Edificio S', 'edificio-s',
  NULL, NULL,
  NULL, 0, NULL, NULL, NULL, 1, 0, NULL, bc.id, NOW(), NOW()
FROM building_categories bc
WHERE bc.code = 'aulas'
  AND NOT EXISTS (SELECT 1 FROM buildings b WHERE b.code = 'S');

-- Aulas Ñ  (croquis #2, GLB: "Aulas Ñ")
-- Asegura que el code ENIE tenga el nombre oficial con acento
UPDATE buildings SET name = 'Aulas Ñ'
WHERE code = 'ENIE' AND name IN ('Aulas ENIE', 'AULAS ENIE');

UPDATE buildings SET model_node_name = 'Aulas_ENIE'
WHERE code = 'ENIE' AND (model_node_name IS NULL OR model_node_name = '');

-- ════════════════════════════════════════════════════════════════
-- BLOQUE 2 — SERVICIOS
-- ════════════════════════════════════════════════════════════════

-- Gimnasio  (croquis #33, GLB: "Gimnasio_Gimnasio")
INSERT INTO buildings (id, code, name, slug, description, model_node_name,
  x, y, z, latitude, longitude, is_active, is_priority, deleted_at,
  category_id, created_at, updated_at)
SELECT UUID(), 'GIM', 'Gimnasio', 'gimnasio',
  NULL, 'Gimnasio',
  NULL, 0, NULL, NULL, NULL, 1, 0, NULL, bc.id, NOW(), NOW()
FROM building_categories bc
WHERE bc.code = 'servicio'
  AND NOT EXISTS (SELECT 1 FROM buildings b WHERE b.code = 'GIM');

UPDATE buildings SET model_node_name = 'Gimnasio'
WHERE code = 'GIM' AND (model_node_name IS NULL OR model_node_name = '');

-- Cafetería  (croquis #37, sin mesh GLB)
INSERT INTO buildings (id, code, name, slug, description, model_node_name,
  x, y, z, latitude, longitude, is_active, is_priority, deleted_at,
  category_id, created_at, updated_at)
SELECT UUID(), 'CAF', 'Cafetería', 'cafeteria',
  NULL, NULL,
  NULL, 0, NULL, NULL, NULL, 1, 0, NULL, bc.id, NOW(), NOW()
FROM building_categories bc
WHERE bc.code = 'servicio'
  AND NOT EXISTS (SELECT 1 FROM buildings b WHERE b.code = 'CAF');

-- ════════════════════════════════════════════════════════════════
-- BLOQUE 3 — CORRECCIONES DE NOMBRE (acentos y nombre oficial)
-- ════════════════════════════════════════════════════════════════

-- Biblioteca → nombre en croquis es "Centro de Información"
-- Se conserva "Biblioteca" por ser el nombre común. Sin cambio.

-- Asesorías (asegurar acento)
UPDATE buildings SET name = 'Asesorías'
WHERE code = 'ASE' AND name = 'Asesorias';

-- Físico-Química
UPDATE buildings SET name = 'Físico-Química'
WHERE code = 'FQ' AND name IN ('Fisico-Quimica', 'Físico-Quimica');

-- Cubículos de Doctorado
UPDATE buildings SET name = 'Cubículos de Doctorado'
WHERE code = 'CUB-DOC' AND name IN ('Cubiculos Doctorado', 'Cubiculos de Doctorado');

-- Cubículos de Maestros
UPDATE buildings SET name = 'Cubículos de Maestros'
WHERE code = 'CUB-MAE' AND name = 'Cubiculos de Maestros';

-- Maestría en Administración
UPDATE buildings SET name = 'Maestría en Administración'
WHERE code = 'MAE-ADM' AND name IN ('Maestria en Administracion', 'Maestría en Administracion');

-- Posgrado → nombre oficial croquis: "Edificio de Posgrado"
UPDATE buildings SET name = 'Edificio de Posgrado'
WHERE code = 'POS' AND name = 'Posgrado';

-- Depto. Química y Bioquímica → nombre oficial croquis
UPDATE buildings SET name = 'Depto. Ing. Química y Bioquímica'
WHERE code = 'DQB' AND name IN ('Depto. Química y Bioquímica', 'Depto. Quimica y Bioquimica');

-- Depto. Electrónica
UPDATE buildings SET name = 'Depto. Ing. Electrónica'
WHERE code = 'DEL' AND name IN ('Depto. Electronica', 'Depto. Electrónica');

-- Lab. Civil
UPDATE buildings SET name = 'Lab. Ingeniería Civil'
WHERE code = 'LAB-CIV' AND name = 'Laboratorio Civil';

-- Lab. Química
UPDATE buildings SET name = 'Lab. Ingeniería Química'
WHERE code = 'LAB-QUI' AND name = 'Laboratorio de Química';

-- Lab. Industrial
UPDATE buildings SET name = 'Lab. Ingeniería Industrial'
WHERE code = 'LAB-IND' AND name IN ('Lab. Ingeniería Industrial', 'Laboratorio Industrial');

-- Audiovisual Posgrado
UPDATE buildings SET name = 'Audiovisual de Posgrado'
WHERE code = 'AUD-POS' AND name = 'Audiovisual Posgrado';

COMMIT;

-- ============================================================
-- VERIFICACIÓN  (ejecutar después del commit):
-- SELECT code, name, model_node_name, is_active
-- FROM buildings
-- WHERE code IN ('E','F','G','H','I','J','D','S','GIM','CAF',
--                'ENIE','ASE','FQ','CUB-DOC','CUB-MAE',
--                'MAE-ADM','POS','DQB','DEL','LAB-CIV',
--                'LAB-QUI','LAB-IND','AUD-POS')
-- ORDER BY code;
-- ============================================================
