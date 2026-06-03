-- ============================================================
-- Edificios faltantes — Croquis ITO 2019
-- Fecha: 2026-05-28
-- Fuente: "RUTAS DE EVACUACIÓN Y PUNTOS DE REUNIÓN" ITO 2019
--
-- Incluye:
--   • Los 7 edificios "estimados" del GLB (model_node_name conocido)
--   • Otros edificios del croquis claramente ausentes de la BD
--
-- Usa NOT EXISTS en cada row para evitar duplicados.
-- Aplica con MySQL Workbench o CLI: mysql -u user -p db < este_archivo.sql
-- ============================================================

START TRANSACTION;

-- ── 1. LOS 7 ESTIMADOS (model_node_name exacto del GLB) ──────────────────────

-- Maestría en Administración
INSERT INTO buildings (id, code, name, slug, description, model_node_name,
  x, y, z, latitude, longitude, is_active, is_priority, deleted_at,
  category_id, created_at, updated_at)
SELECT UUID(), 'MAE-ADM', 'Maestría en Administración', 'maestria-administracion',
  NULL, 'Maestria_Administracion',
  NULL, 0, NULL, NULL, NULL, 1, 0, NULL, bc.id, NOW(), NOW()
FROM building_categories bc
WHERE bc.code = 'administrativo'
  AND NOT EXISTS (SELECT 1 FROM buildings b WHERE b.code = 'MAE-ADM');

-- Maestría en Construcción
INSERT INTO buildings (id, code, name, slug, description, model_node_name,
  x, y, z, latitude, longitude, is_active, is_priority, deleted_at,
  category_id, created_at, updated_at)
SELECT UUID(), 'MAE-CON', 'Maestría en Construcción', 'maestria-construccion',
  NULL, 'Maestria_En_Construccion',
  NULL, 0, NULL, NULL, NULL, 1, 0, NULL, bc.id, NOW(), NOW()
FROM building_categories bc
WHERE bc.code = 'administrativo'
  AND NOT EXISTS (SELECT 1 FROM buildings b WHERE b.code = 'MAE-CON');

-- Depto. Ciencias Básicas
INSERT INTO buildings (id, code, name, slug, description, model_node_name,
  x, y, z, latitude, longitude, is_active, is_priority, deleted_at,
  category_id, created_at, updated_at)
SELECT UUID(), 'CB', 'Depto. Ciencias Básicas', 'depto-ciencias-basicas',
  NULL, 'Departamento_Ciencias_Basicas',
  NULL, 0, NULL, NULL, NULL, 1, 0, NULL, bc.id, NOW(), NOW()
FROM building_categories bc
WHERE bc.code = 'administrativo'
  AND NOT EXISTS (SELECT 1 FROM buildings b WHERE b.code = 'CB');

-- Depto. Desarrollo Académico
INSERT INTO buildings (id, code, name, slug, description, model_node_name,
  x, y, z, latitude, longitude, is_active, is_priority, deleted_at,
  category_id, created_at, updated_at)
SELECT UUID(), 'DA', 'Depto. Desarrollo Académico', 'depto-desarrollo-academico',
  NULL, 'Departamento_Desarrollo_Academico',
  NULL, 0, NULL, NULL, NULL, 1, 0, NULL, bc.id, NOW(), NOW()
FROM building_categories bc
WHERE bc.code = 'administrativo'
  AND NOT EXISTS (SELECT 1 FROM buildings b WHERE b.code = 'DA');

-- Depto. Ciencias Económico-Administrativas
INSERT INTO buildings (id, code, name, slug, description, model_node_name,
  x, y, z, latitude, longitude, is_active, is_priority, deleted_at,
  category_id, created_at, updated_at)
SELECT UUID(), 'CEA', 'Depto. Ciencias Económico-Administrativas',
  'depto-ciencias-economico-administrativas',
  NULL, 'Departamento_Ciencias_Economico_Administrativas',
  NULL, 0, NULL, NULL, NULL, 1, 0, NULL, bc.id, NOW(), NOW()
FROM building_categories bc
WHERE bc.code = 'administrativo'
  AND NOT EXISTS (SELECT 1 FROM buildings b WHERE b.code = 'CEA');

-- Cubículos de Maestros
INSERT INTO buildings (id, code, name, slug, description, model_node_name,
  x, y, z, latitude, longitude, is_active, is_priority, deleted_at,
  category_id, created_at, updated_at)
SELECT UUID(), 'CUB-MAE', 'Cubículos de Maestros', 'cubiculos-maestros',
  NULL, 'Cubiculo_Maestros',
  NULL, 0, NULL, NULL, NULL, 1, 0, NULL, bc.id, NOW(), NOW()
FROM building_categories bc
WHERE bc.code = 'administrativo'
  AND NOT EXISTS (SELECT 1 FROM buildings b WHERE b.code = 'CUB-MAE');

-- Mantenimiento y Servicios Generales / Ing. Eléctrica
INSERT INTO buildings (id, code, name, slug, description, model_node_name,
  x, y, z, latitude, longitude, is_active, is_priority, deleted_at,
  category_id, created_at, updated_at)
SELECT UUID(), 'MTO', 'Mantenimiento y Servicios Generales', 'mantenimiento-servicios-generales',
  NULL, 'Mantenimiento_Servicios_Generales_Ing_Electrica',
  NULL, 0, NULL, NULL, NULL, 1, 0, NULL, bc.id, NOW(), NOW()
FROM building_categories bc
WHERE bc.code = 'servicio'
  AND NOT EXISTS (SELECT 1 FROM buildings b WHERE b.code = 'MTO');


-- ── 2. OTROS EDIFICIOS DEL CROQUIS ───────────────────────────────────────────

-- Edificio K  (croquis: entre H y cafetería)
INSERT INTO buildings (id, code, name, slug, description, model_node_name,
  x, y, z, latitude, longitude, is_active, is_priority, deleted_at,
  category_id, created_at, updated_at)
SELECT UUID(), 'K', 'Edificio K', 'edificio-k',
  NULL, 'Edificio_K',
  NULL, 0, NULL, NULL, NULL, 1, 0, NULL, bc.id, NOW(), NOW()
FROM building_categories bc
WHERE bc.code = 'aulas'
  AND NOT EXISTS (SELECT 1 FROM buildings b WHERE b.code = 'K');

-- D.E.P.I. (Departamento de Estudios de Posgrado e Investigación)
INSERT INTO buildings (id, code, name, slug, description, model_node_name,
  x, y, z, latitude, longitude, is_active, is_priority, deleted_at,
  category_id, created_at, updated_at)
SELECT UUID(), 'DEPI', 'D.E.P.I.', 'depi',
  'Departamento de Estudios de Posgrado e Investigación',
  'Depi',
  NULL, 0, NULL, NULL, NULL, 1, 0, NULL, bc.id, NOW(), NOW()
FROM building_categories bc
WHERE bc.code = 'administrativo'
  AND NOT EXISTS (SELECT 1 FROM buildings b WHERE b.code = 'DEPI');

-- CONACYT
INSERT INTO buildings (id, code, name, slug, description, model_node_name,
  x, y, z, latitude, longitude, is_active, is_priority, deleted_at,
  category_id, created_at, updated_at)
SELECT UUID(), 'CON', 'CONACYT', 'conacyt',
  NULL, 'Conacyt',
  NULL, 0, NULL, NULL, NULL, 1, 0, NULL, bc.id, NOW(), NOW()
FROM building_categories bc
WHERE bc.code = 'administrativo'
  AND NOT EXISTS (SELECT 1 FROM buildings b WHERE b.code = 'CON');

-- Depto. Ciencias de la Tierra  (#17 croquis)
INSERT INTO buildings (id, code, name, slug, description, model_node_name,
  x, y, z, latitude, longitude, is_active, is_priority, deleted_at,
  category_id, created_at, updated_at)
SELECT UUID(), 'CTIER', 'Depto. Ciencias de la Tierra', 'depto-ciencias-tierra',
  NULL, 'Depto_Ciencias_Tierra',
  NULL, 0, NULL, NULL, NULL, 1, 0, NULL, bc.id, NOW(), NOW()
FROM building_categories bc
WHERE bc.code = 'administrativo'
  AND NOT EXISTS (SELECT 1 FROM buildings b WHERE b.code = 'CTIER');

-- Lab. Ing. Mecánica / Taller de Maquinaria  (#14 croquis)
INSERT INTO buildings (id, code, name, slug, description, model_node_name,
  x, y, z, latitude, longitude, is_active, is_priority, deleted_at,
  category_id, created_at, updated_at)
SELECT UUID(), 'LAB-MEC', 'Lab. Ingeniería Mecánica', 'lab-ing-mecanica',
  NULL, 'Laboratorio_Mecanica',
  NULL, 0, NULL, NULL, NULL, 1, 0, NULL, bc.id, NOW(), NOW()
FROM building_categories bc
WHERE bc.code = 'laboratorio'
  AND NOT EXISTS (SELECT 1 FROM buildings b WHERE b.code = 'LAB-MEC');

-- Lab. Química Pesada  (#15 croquis)
INSERT INTO buildings (id, code, name, slug, description, model_node_name,
  x, y, z, latitude, longitude, is_active, is_priority, deleted_at,
  category_id, created_at, updated_at)
SELECT UUID(), 'LAB-QP', 'Lab. Química Pesada', 'lab-quimica-pesada',
  NULL, 'Laboratorio_Quimica_Pesada',
  NULL, 0, NULL, NULL, NULL, 1, 0, NULL, bc.id, NOW(), NOW()
FROM building_categories bc
WHERE bc.code = 'laboratorio'
  AND NOT EXISTS (SELECT 1 FROM buildings b WHERE b.code = 'LAB-QP');

-- Lab. Ingeniería Industrial  (#43 croquis)
INSERT INTO buildings (id, code, name, slug, description, model_node_name,
  x, y, z, latitude, longitude, is_active, is_priority, deleted_at,
  category_id, created_at, updated_at)
SELECT UUID(), 'LAB-IND', 'Lab. Ingeniería Industrial', 'lab-ing-industrial',
  NULL, 'Laboratorio_Industrial',
  NULL, 0, NULL, NULL, NULL, 1, 0, NULL, bc.id, NOW(), NOW()
FROM building_categories bc
WHERE bc.code = 'laboratorio'
  AND NOT EXISTS (SELECT 1 FROM buildings b WHERE b.code = 'LAB-IND');

-- Audiovisual de Ingeniería  (#28 croquis, distinto del Audiovisual Posgrado)
INSERT INTO buildings (id, code, name, slug, description, model_node_name,
  x, y, z, latitude, longitude, is_active, is_priority, deleted_at,
  category_id, created_at, updated_at)
SELECT UUID(), 'AUD-ING', 'Audiovisual de Ingeniería', 'audiovisual-ingenieria',
  NULL, 'Audiovisual_Ingenieria',
  NULL, 0, NULL, NULL, NULL, 1, 0, NULL, bc.id, NOW(), NOW()
FROM building_categories bc
WHERE bc.code = 'servicio'
  AND NOT EXISTS (SELECT 1 FROM buildings b WHERE b.code = 'AUD-ING');

-- Audiovisual de Licenciatura  (#46 croquis)
INSERT INTO buildings (id, code, name, slug, description, model_node_name,
  x, y, z, latitude, longitude, is_active, is_priority, deleted_at,
  category_id, created_at, updated_at)
SELECT UUID(), 'AUD-LIC', 'Audiovisual de Licenciatura', 'audiovisual-licenciatura',
  NULL, 'Audiovisual_Licenciatura',
  NULL, 0, NULL, NULL, NULL, 1, 0, NULL, bc.id, NOW(), NOW()
FROM building_categories bc
WHERE bc.code = 'servicio'
  AND NOT EXISTS (SELECT 1 FROM buildings b WHERE b.code = 'AUD-LIC');

-- COPISE  (#38 croquis)
INSERT INTO buildings (id, code, name, slug, description, model_node_name,
  x, y, z, latitude, longitude, is_active, is_priority, deleted_at,
  category_id, created_at, updated_at)
SELECT UUID(), 'COPISE', 'COPISE', 'copise',
  NULL, 'Copise',
  NULL, 0, NULL, NULL, NULL, 1, 0, NULL, bc.id, NOW(), NOW()
FROM building_categories bc
WHERE bc.code = 'servicio'
  AND NOT EXISTS (SELECT 1 FROM buildings b WHERE b.code = 'COPISE');

-- Aulas N  (#3 croquis, GLB: Aulas_N)
INSERT INTO buildings (id, code, name, slug, description, model_node_name,
  x, y, z, latitude, longitude, is_active, is_priority, deleted_at,
  category_id, created_at, updated_at)
SELECT UUID(), 'N', 'Aulas N', 'aulas-n',
  NULL, 'Aulas_N',
  NULL, 0, NULL, NULL, NULL, 1, 0, NULL, bc.id, NOW(), NOW()
FROM building_categories bc
WHERE bc.code = 'aulas'
  AND NOT EXISTS (SELECT 1 FROM buildings b WHERE b.code = 'N');

-- Maestría en Doctorado  (#13 croquis)
INSERT INTO buildings (id, code, name, slug, description, model_node_name,
  x, y, z, latitude, longitude, is_active, is_priority, deleted_at,
  category_id, created_at, updated_at)
SELECT UUID(), 'MAE-DOC', 'Maestría en Doctorado', 'maestria-doctorado',
  NULL, 'Maestria_Doctorado',
  NULL, 0, NULL, NULL, NULL, 1, 0, NULL, bc.id, NOW(), NOW()
FROM building_categories bc
WHERE bc.code = 'administrativo'
  AND NOT EXISTS (SELECT 1 FROM buildings b WHERE b.code = 'MAE-DOC');

-- Sala de Titulación de la Maestría en Administración  (#52 croquis)
INSERT INTO buildings (id, code, name, slug, description, model_node_name,
  x, y, z, latitude, longitude, is_active, is_priority, deleted_at,
  category_id, created_at, updated_at)
SELECT UUID(), 'SAL-MAE', 'Sala de Titulación Maestría Admón.', 'sala-titulacion-maestria',
  NULL, 'Sala_Titulacion_Maestria',
  NULL, 0, NULL, NULL, NULL, 1, 0, NULL, bc.id, NOW(), NOW()
FROM building_categories bc
WHERE bc.code = 'servicio'
  AND NOT EXISTS (SELECT 1 FROM buildings b WHERE b.code = 'SAL-MAE');

-- Servicios Extra Escolares / Div. Estudios Profesionales  (#35 croquis)
INSERT INTO buildings (id, code, name, slug, description, model_node_name,
  x, y, z, latitude, longitude, is_active, is_priority, deleted_at,
  category_id, created_at, updated_at)
SELECT UUID(), 'EXT', 'Servicios Extra Escolares', 'servicios-extra-escolares',
  NULL, 'Servicios_Extra_Escolares',
  NULL, 0, NULL, NULL, NULL, 1, 0, NULL, bc.id, NOW(), NOW()
FROM building_categories bc
WHERE bc.code = 'servicio'
  AND NOT EXISTS (SELECT 1 FROM buildings b WHERE b.code = 'EXT');

-- Caseta de Vigilancia  (S/N croquis)
INSERT INTO buildings (id, code, name, slug, description, model_node_name,
  x, y, z, latitude, longitude, is_active, is_priority, deleted_at,
  category_id, created_at, updated_at)
SELECT UUID(), 'VIG', 'Caseta de Vigilancia', 'caseta-vigilancia',
  NULL, 'Caseta_Vigilancia',
  NULL, 0, NULL, NULL, NULL, 1, 0, NULL, bc.id, NOW(), NOW()
FROM building_categories bc
WHERE bc.code = 'servicio'
  AND NOT EXISTS (SELECT 1 FROM buildings b WHERE b.code = 'VIG');


-- ── 3. ASEGURAR QUE TODOS LOS EXISTENTES ESTÉN ACTIVOS ───────────────────────
-- (por si alguno quedó inactivo y no aparecía en el selector)
UPDATE buildings SET is_active = 1, deleted_at = NULL
WHERE deleted_at IS NULL AND is_active = 0;


COMMIT;

-- ============================================================
-- VERIFICACIÓN (ejecutar después del commit):
-- SELECT code, name, model_node_name, is_active
-- FROM buildings ORDER BY name;
-- ============================================================
