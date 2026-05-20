-- Agregar 21 edificios faltantes a la tabla buildings
-- Fecha: 2026-05-18
-- Usa INSERT...SELECT para evitar problemas con variables en MySQL Workbench

INSERT IGNORE INTO buildings (id, code, name, slug, description, model_node_name, x, y, z, latitude, longitude, is_active, is_priority, deleted_at, category_id, created_at, updated_at)

-- ── AULAS ────────────────────────────────────────────────────────────────
SELECT UUID(), 'L', 'Edificio L', 'edificio-l', NULL, 'Edificio_L', 22, 0, -18, NULL, NULL, 1, 0, NULL, id, NOW(), NOW()
FROM building_categories WHERE code = 'aulas'
UNION ALL
SELECT UUID(), 'X', 'Edificio X', 'edificiox', NULL, 'Edificio_X', 46, 0, -14, NULL, NULL, 1, 0, NULL, id, NOW(), NOW()
FROM building_categories WHERE code = 'aulas'
UNION ALL
SELECT UUID(), 'X001', 'Edificio X001', 'edificiox001', NULL, 'Edificio_X001', 8, 0, -54, NULL, NULL, 1, 0, NULL, id, NOW(), NOW()
FROM building_categories WHERE code = 'aulas'
UNION ALL
SELECT UUID(), 'C', 'Edificio C', 'edificio-c', NULL, 'Edificio_C', -58, 0, -14, NULL, NULL, 1, 0, NULL, id, NOW(), NOW()
FROM building_categories WHERE code = 'aulas'
UNION ALL
SELECT UUID(), 'B', 'Edificio B', 'edificio-b', NULL, 'Edificio_B', -52, 0, -48, NULL, NULL, 1, 0, NULL, id, NOW(), NOW()
FROM building_categories WHERE code = 'aulas'
UNION ALL
SELECT UUID(), '1007', 'Aula 1007', '1007', NULL, 'Aula_1007', -128, 0, -8, NULL, NULL, 1, 0, NULL, id, NOW(), NOW()
FROM building_categories WHERE code = 'aulas'
UNION ALL
SELECT UUID(), '1008', 'Aula 1008', '1008', NULL, 'Aula_1008', -158, 0, -44, NULL, NULL, 1, 0, NULL, id, NOW(), NOW()
FROM building_categories WHERE code = 'aulas'
UNION ALL
SELECT UUID(), '1009', 'Aula 1009', '1009', NULL, 'Aula_1009', -114, 0, -90, NULL, NULL, 1, 0, NULL, id, NOW(), NOW()
FROM building_categories WHERE code = 'aulas'
UNION ALL
SELECT UUID(), 'ENIE', 'Aulas ENIE', 'aulas-enie', NULL, 'Aulas_ENIE', 54, 0, -107, NULL, NULL, 1, 0, NULL, id, NOW(), NOW()
FROM building_categories WHERE code = 'aulas'

-- ── LABORATORIOS ─────────────────────────────────────────────────────────
UNION ALL
SELECT UUID(), 'FQ', 'Físico-Química', 'fisico-quimica', NULL, 'Fisico_Quimica', -22, 0, -18, NULL, NULL, 1, 0, NULL, id, NOW(), NOW()
FROM building_categories WHERE code = 'laboratorio'
UNION ALL
SELECT UUID(), 'GEO', 'Geolocalización', 'geolocalizacion', NULL, 'Geolocalizacion', -148, 0, -62, NULL, NULL, 1, 0, NULL, id, NOW(), NOW()
FROM building_categories WHERE code = 'laboratorio'
UNION ALL
SELECT UUID(), 'LAB-QUI', 'Laboratorio de Química', 'lab-quimica', NULL, 'Laboratorio_Quimica', -44, 0, -82, NULL, NULL, 1, 0, NULL, id, NOW(), NOW()
FROM building_categories WHERE code = 'laboratorio'
UNION ALL
SELECT UUID(), 'LAB-ELE', 'Laboratorio de Eléctrica', 'lab-electrica', NULL, 'Laboratorio_Electrica', -72, 0, -116, NULL, NULL, 1, 0, NULL, id, NOW(), NOW()
FROM building_categories WHERE code = 'laboratorio'
UNION ALL
SELECT UUID(), 'LAB-CIV', 'Laboratorio Civil', 'lab-civil', NULL, 'Laboratorio_Civil', 20, 0, -95, NULL, NULL, 1, 0, NULL, id, NOW(), NOW()
FROM building_categories WHERE code = 'laboratorio'

-- ── ADMINISTRATIVO ───────────────────────────────────────────────────────
UNION ALL
SELECT UUID(), 'SAL', 'Sala de Titulación', 'sala-titulacion', NULL, 'Sala_Titulacion', -94, 0, -44, NULL, NULL, 1, 0, NULL, id, NOW(), NOW()
FROM building_categories WHERE code = 'administrativo'
UNION ALL
SELECT UUID(), 'POS', 'Posgrado', 'postgrado', NULL, 'Posgrado', -78, 0, -92, NULL, NULL, 1, 0, NULL, id, NOW(), NOW()
FROM building_categories WHERE code = 'administrativo'
UNION ALL
SELECT UUID(), 'DQB', 'Depto. Química y Bioquímica', 'depto-quimica-bioquimica', NULL, 'Depto_Quimica_Bioquimica', 26, 0, -127, NULL, NULL, 1, 0, NULL, id, NOW(), NOW()
FROM building_categories WHERE code = 'administrativo'
UNION ALL
SELECT UUID(), 'CUB-DOC', 'Cubículos Doctorado', 'cubiculos-doctorado', NULL, 'Cubiculos_Doctorado', 32, 0, -124, NULL, NULL, 1, 0, NULL, id, NOW(), NOW()
FROM building_categories WHERE code = 'administrativo'
UNION ALL
SELECT UUID(), 'DEL', 'Depto. Electrónica', 'depto-electronica', NULL, 'Depto_Electronica', 54, 0, -50, NULL, NULL, 1, 0, NULL, id, NOW(), NOW()
FROM building_categories WHERE code = 'administrativo'

-- ── SERVICIOS ────────────────────────────────────────────────────────────
UNION ALL
SELECT UUID(), 'ASE', 'Asesorías', 'asesorias', NULL, 'Asesorias', 12, 0, -4, NULL, NULL, 1, 0, NULL, id, NOW(), NOW()
FROM building_categories WHERE code = 'servicio'
UNION ALL
SELECT UUID(), 'AUD-POS', 'Audiovisual Posgrado', 'audiovisual-postgrado', NULL, 'Audiovisual_Posgrado', 70, 0, -116, NULL, NULL, 1, 0, NULL, id, NOW(), NOW()
FROM building_categories WHERE code = 'servicio';

-- ============================================================
-- VERIFICACIÓN
-- ============================================================
-- SELECT COUNT(*) FROM buildings WHERE slug NOT LIKE 'edificio-temporal%';
-- Esperado: 38 (17 existentes + 21 nuevos)
