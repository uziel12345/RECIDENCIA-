-- ============================================================
-- SEED CANÓNICO — Mapa 3D ITO
-- Generado: 2026-06-23
-- Migrado a PostgreSQL: 2026-07-23
-- Consolida: seed original + todas las migraciones de edificios
--            hasta 2026-06-18.
-- Nota (2026-07-22): se quitó el grafo de navegación (nodos/aristas/
-- entradas) al eliminar el módulo de ruteo por grafo — ver
-- docs/migration-remove-navigation-graph-20260722.sql.
--
-- Prerequisito: schema.sql ya ejecutado (incluye las categorías).
--
-- Uso:
--   psql -U <usuario> -d mapa_ito -f docs/seed.sql
--
-- IMPORTANTE — Contraseña del superadmin:
--   El hash de abajo es un MARCADOR (no corresponde a ninguna
--   contraseña real). Para generar un hash real, ejecuta:
--     node -e "require('bcryptjs').hash('TuContraseña@123', 12).then(h => console.log(h))"
--   Luego reemplaza el campo password_hash con el resultado.
-- ============================================================

-- ============================================================
-- 1. USUARIO SUPERADMIN
-- ============================================================
INSERT INTO admin_users
  (id, username, full_name, email, password_hash, role, is_active,
   failed_login_attempts, locked_until, token_version)
VALUES (
  gen_random_uuid(),
  'superadmin',
  'Super Administrador ITO',
  'admin@ito.edu.mx',
  '$2b$12$AAAAAAAAAAAAAAAAAAAAAA.AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA',
  'superadmin',
  TRUE, 0, NULL, 1
)
ON CONFLICT (username) DO NOTHING;

-- ============================================================
-- 2. EDIFICIOS CON ENTRADA DE NAVEGACIÓN (38)
--    Nombre histórico de la sección: originalmente estos slugs también
--    alimentaban building_entrances (grafo de navegación, ya eliminado).
-- ============================================================

-- ── Administrativo ───────────────────────────────────────────
INSERT INTO buildings
  (id, category_id, code, name, slug, description, model_node_name, x, y, z, is_active, is_priority)
SELECT gen_random_uuid(), bc.id, 'DIR', 'DIRECCIÓN', 'direccion',
  'Edificio de Dirección General del ITO.',
  'Direccion, Depto de servicios escolares, Div de estudios profecionales ',
  -78, 0, 60, TRUE, TRUE
FROM building_categories bc WHERE bc.code = 'administrativo'
  AND NOT EXISTS (SELECT 1 FROM buildings b WHERE b.code = 'DIR')
ON CONFLICT (code) DO NOTHING;

INSERT INTO buildings
  (id, category_id, code, name, slug, description, model_node_name, x, y, z, is_active, is_priority)
SELECT gen_random_uuid(), bc.id, 'ASE', 'ASESORÍAS', 'asesorias',
  NULL, 'Asesorias', 12, 0, -4, TRUE, FALSE
FROM building_categories bc WHERE bc.code = 'administrativo'
  AND NOT EXISTS (SELECT 1 FROM buildings b WHERE b.code = 'ASE')
ON CONFLICT (code) DO NOTHING;

INSERT INTO buildings
  (id, category_id, code, name, slug, description, model_node_name, x, y, z, is_active, is_priority)
SELECT gen_random_uuid(), bc.id, 'SAL', 'Sala de Titulación', 'sala-titulacion',
  NULL, 'Sala de titulacion- aula de dibujo- Lab de microscopia -aula de dibujo ',
  -94, 0, -44, TRUE, FALSE
FROM building_categories bc WHERE bc.code = 'administrativo'
  AND NOT EXISTS (SELECT 1 FROM buildings b WHERE b.code = 'SAL')
ON CONFLICT (code) DO NOTHING;

INSERT INTO buildings
  (id, category_id, code, name, slug, description, model_node_name, x, y, z, is_active, is_priority)
SELECT gen_random_uuid(), bc.id, 'POS', 'Posgrado', 'postgrado',
  NULL, 'Edificio de Postgrado.001', -78, 0, -92, TRUE, FALSE
FROM building_categories bc WHERE bc.code = 'administrativo'
  AND NOT EXISTS (SELECT 1 FROM buildings b WHERE b.code = 'POS')
ON CONFLICT (code) DO NOTHING;

INSERT INTO buildings
  (id, category_id, code, name, slug, description, model_node_name, x, y, z, is_active, is_priority)
SELECT gen_random_uuid(), bc.id, 'DQB', 'Dpto. Química y Bioquímica', 'depto-quimica-bioquimica',
  NULL, 'DEPARTAMENTO\nDE\nINGENIERÍA\nQUÍMICA Y\nBIOQUÍMICA',
  26, 0, -127, TRUE, FALSE
FROM building_categories bc WHERE bc.code = 'administrativo'
  AND NOT EXISTS (SELECT 1 FROM buildings b WHERE b.code = 'DQB')
ON CONFLICT (code) DO NOTHING;

INSERT INTO buildings
  (id, category_id, code, name, slug, description, model_node_name, x, y, z, is_active, is_priority)
SELECT gen_random_uuid(), bc.id, 'CUB-DOC', 'Cubículos de Doctorado', 'cubiculos-doctorado',
  NULL, 'Cubiculos de Doctorado.001', 32, 0, -124, TRUE, FALSE
FROM building_categories bc WHERE bc.code = 'administrativo'
  AND NOT EXISTS (SELECT 1 FROM buildings b WHERE b.code = 'CUB-DOC')
ON CONFLICT (code) DO NOTHING;

INSERT INTO buildings
  (id, category_id, code, name, slug, description, model_node_name, x, y, z, is_active, is_priority)
SELECT gen_random_uuid(), bc.id, 'DEL', 'DPTO. ING. ELECTRÓNICA', 'depto-electronica',
  NULL, 'DEPARTAMENTO DE\nINGENIERÍA\nELECTRÓNICA', 54, 0, -50, TRUE, FALSE
FROM building_categories bc WHERE bc.code = 'administrativo'
  AND NOT EXISTS (SELECT 1 FROM buildings b WHERE b.code = 'DEL')
ON CONFLICT (code) DO NOTHING;

-- ── Biblioteca ───────────────────────────────────────────────
INSERT INTO buildings
  (id, category_id, code, name, slug, description, model_node_name, x, y, z, is_active, is_priority)
SELECT gen_random_uuid(), bc.id, 'BIB', 'CENTRO DE INFORMACIÓN (BIBLIOTECA)', 'biblioteca',
  'Biblioteca del Instituto Tecnológico de Oaxaca.',
  'Biblioteca_', 8, 0, 0, TRUE, TRUE
FROM building_categories bc WHERE bc.code = 'biblioteca'
  AND NOT EXISTS (SELECT 1 FROM buildings b WHERE b.code = 'BIB')
ON CONFLICT (code) DO NOTHING;

-- ── Aulas con entrada de navegación ─────────────────────────
INSERT INTO buildings
  (id, category_id, code, name, slug, description, model_node_name, x, y, z, is_active, is_priority)
SELECT gen_random_uuid(), bc.id, 'E', 'EDIF. E', 'edificio-e', NULL, NULL, 10, 0, 86, TRUE, FALSE
FROM building_categories bc WHERE bc.code = 'aulas'
  AND NOT EXISTS (SELECT 1 FROM buildings b WHERE b.code = 'E')
ON CONFLICT (code) DO NOTHING;

INSERT INTO buildings
  (id, category_id, code, name, slug, description, model_node_name, x, y, z, is_active, is_priority)
SELECT gen_random_uuid(), bc.id, 'F', 'EDIF. F', 'edificio-f', NULL, 'Edificio F', 8, 0, 118, TRUE, FALSE
FROM building_categories bc WHERE bc.code = 'aulas'
  AND NOT EXISTS (SELECT 1 FROM buildings b WHERE b.code = 'F')
ON CONFLICT (code) DO NOTHING;

INSERT INTO buildings
  (id, category_id, code, name, slug, description, model_node_name, x, y, z, is_active, is_priority)
SELECT gen_random_uuid(), bc.id, 'G', 'EDIF. G', 'edificio-g', NULL, NULL, 8, 0, 148, TRUE, FALSE
FROM building_categories bc WHERE bc.code = 'aulas'
  AND NOT EXISTS (SELECT 1 FROM buildings b WHERE b.code = 'G')
ON CONFLICT (code) DO NOTHING;

INSERT INTO buildings
  (id, category_id, code, name, slug, description, model_node_name, x, y, z, is_active, is_priority)
SELECT gen_random_uuid(), bc.id, 'H', 'EDIF. H', 'edificio-h', NULL, 'Edificio H_Edifucui H', -38, 0, 108, TRUE, FALSE
FROM building_categories bc WHERE bc.code = 'aulas'
  AND NOT EXISTS (SELECT 1 FROM buildings b WHERE b.code = 'H')
ON CONFLICT (code) DO NOTHING;

INSERT INTO buildings
  (id, category_id, code, name, slug, description, model_node_name, x, y, z, is_active, is_priority)
SELECT gen_random_uuid(), bc.id, 'I', 'EDIF. I', 'edificio-i', NULL, 'Edificio I', -54, 0, 162, TRUE, FALSE
FROM building_categories bc WHERE bc.code = 'aulas'
  AND NOT EXISTS (SELECT 1 FROM buildings b WHERE b.code = 'I')
ON CONFLICT (code) DO NOTHING;

INSERT INTO buildings
  (id, category_id, code, name, slug, description, model_node_name, x, y, z, is_active, is_priority)
SELECT gen_random_uuid(), bc.id, 'J', 'Edificio J', 'edificio-j', NULL, 'Edificio J', -35, 0, 162, TRUE, FALSE
FROM building_categories bc WHERE bc.code = 'aulas'
  AND NOT EXISTS (SELECT 1 FROM buildings b WHERE b.code = 'J')
ON CONFLICT (code) DO NOTHING;

INSERT INTO buildings
  (id, category_id, code, name, slug, description, model_node_name, x, y, z, is_active, is_priority)
SELECT gen_random_uuid(), bc.id, 'K', 'EDIF. K - BAÑOS', 'edificio-k', NULL, 'Edificio K', 46, 0, 148, TRUE, FALSE
FROM building_categories bc WHERE bc.code = 'aulas'
  AND NOT EXISTS (SELECT 1 FROM buildings b WHERE b.code = 'K')
ON CONFLICT (code) DO NOTHING;

INSERT INTO buildings
  (id, category_id, code, name, slug, description, model_node_name, x, y, z, is_active, is_priority)
SELECT gen_random_uuid(), bc.id, 'Q', 'Edificio Q', 'edificio-q', NULL, NULL, 58, 0, 74, TRUE, FALSE
FROM building_categories bc WHERE bc.code = 'aulas'
  AND NOT EXISTS (SELECT 1 FROM buildings b WHERE b.code = 'Q')
ON CONFLICT (code) DO NOTHING;

INSERT INTO buildings
  (id, category_id, code, name, slug, description, model_node_name, x, y, z, is_active, is_priority)
SELECT gen_random_uuid(), bc.id, 'AUL-S', 'EDIF. S', 'aulas-s', NULL, 'Aulas S.', 62, 0, 160, TRUE, FALSE
FROM building_categories bc WHERE bc.code = 'aulas'
  AND NOT EXISTS (SELECT 1 FROM buildings b WHERE b.code = 'AUL-S')
ON CONFLICT (code) DO NOTHING;

INSERT INTO buildings
  (id, category_id, code, name, slug, description, model_node_name, x, y, z, is_active, is_priority)
SELECT gen_random_uuid(), bc.id, 'L', 'Edificio L', 'edificio-l', NULL, 'Edificio  L ', 22, 0, -18, TRUE, FALSE
FROM building_categories bc WHERE bc.code = 'aulas'
  AND NOT EXISTS (SELECT 1 FROM buildings b WHERE b.code = 'L')
ON CONFLICT (code) DO NOTHING;

INSERT INTO buildings
  (id, category_id, code, name, slug, description, model_node_name, x, y, z, is_active, is_priority)
SELECT gen_random_uuid(), bc.id, 'X', 'Edificio X', 'edificiox', NULL, NULL, 46, 0, -14, TRUE, FALSE
FROM building_categories bc WHERE bc.code = 'aulas'
  AND NOT EXISTS (SELECT 1 FROM buildings b WHERE b.code = 'X')
ON CONFLICT (code) DO NOTHING;

INSERT INTO buildings
  (id, category_id, code, name, slug, description, model_node_name, x, y, z, is_active, is_priority)
SELECT gen_random_uuid(), bc.id, 'X001', 'Edificio X001', 'edificiox001', NULL, NULL, 8, 0, -54, TRUE, FALSE
FROM building_categories bc WHERE bc.code = 'aulas'
  AND NOT EXISTS (SELECT 1 FROM buildings b WHERE b.code = 'X001')
ON CONFLICT (code) DO NOTHING;

INSERT INTO buildings
  (id, category_id, code, name, slug, description, model_node_name, x, y, z, is_active, is_priority)
SELECT gen_random_uuid(), bc.id, 'C', 'EDIF. C', 'edificio-c', NULL, 'Eduficio C', -58, 0, -14, TRUE, FALSE
FROM building_categories bc WHERE bc.code = 'aulas'
  AND NOT EXISTS (SELECT 1 FROM buildings b WHERE b.code = 'C')
ON CONFLICT (code) DO NOTHING;

INSERT INTO buildings
  (id, category_id, code, name, slug, description, model_node_name, x, y, z, is_active, is_priority)
SELECT gen_random_uuid(), bc.id, 'B', 'EDIF. B', 'edificio-b', NULL, 'Edificio B', -52, 0, -48, TRUE, FALSE
FROM building_categories bc WHERE bc.code = 'aulas'
  AND NOT EXISTS (SELECT 1 FROM buildings b WHERE b.code = 'B')
ON CONFLICT (code) DO NOTHING;

INSERT INTO buildings
  (id, category_id, code, name, slug, description, model_node_name, x, y, z, is_active, is_priority)
SELECT gen_random_uuid(), bc.id, '1007', 'Aula 1007', '1007', NULL, 'Edificio 3D 1.007', -128, 0, -8, TRUE, FALSE
FROM building_categories bc WHERE bc.code = 'aulas'
  AND NOT EXISTS (SELECT 1 FROM buildings b WHERE b.code = '1007')
ON CONFLICT (code) DO NOTHING;

INSERT INTO buildings
  (id, category_id, code, name, slug, description, model_node_name, x, y, z, is_active, is_priority)
SELECT gen_random_uuid(), bc.id, '1008', 'Aula 1008', '1008', NULL, 'Edificio 3D 1.008', -158, 0, -44, TRUE, FALSE
FROM building_categories bc WHERE bc.code = 'aulas'
  AND NOT EXISTS (SELECT 1 FROM buildings b WHERE b.code = '1008')
ON CONFLICT (code) DO NOTHING;

INSERT INTO buildings
  (id, category_id, code, name, slug, description, model_node_name, x, y, z, is_active, is_priority)
SELECT gen_random_uuid(), bc.id, '1009', 'Aula 1009', '1009', NULL, 'Edificio 3D 1.009', -114, 0, -90, TRUE, FALSE
FROM building_categories bc WHERE bc.code = 'aulas'
  AND NOT EXISTS (SELECT 1 FROM buildings b WHERE b.code = '1009')
ON CONFLICT (code) DO NOTHING;

INSERT INTO buildings
  (id, category_id, code, name, slug, description, model_node_name, x, y, z, is_active, is_priority)
SELECT gen_random_uuid(), bc.id, 'ENIE', 'Aulas ENIE', 'aulas-enie', NULL, NULL, 54, 0, -107, TRUE, FALSE
FROM building_categories bc WHERE bc.code = 'aulas'
  AND NOT EXISTS (SELECT 1 FROM buildings b WHERE b.code = 'ENIE')
ON CONFLICT (code) DO NOTHING;

INSERT INTO buildings
  (id, category_id, code, name, slug, description, model_node_name, x, y, z, is_active, is_priority)
SELECT gen_random_uuid(), bc.id, 'NEW', 'Edificio Nuevo', 'edificio-nuevo', NULL, 'Edificio Nuevo', -58, 0, 150, TRUE, FALSE
FROM building_categories bc WHERE bc.code = 'aulas'
  AND NOT EXISTS (SELECT 1 FROM buildings b WHERE b.code = 'NEW')
ON CONFLICT (code) DO NOTHING;

-- ── Laboratorio con entrada de navegación ────────────────────
INSERT INTO buildings
  (id, category_id, code, name, slug, description, model_node_name, x, y, z, is_active, is_priority)
SELECT gen_random_uuid(), bc.id, 'CC', 'CENTRO DE CÓMPUTO', 'centro-computo',
  'Centro de Cómputo y Sistemas del ITO.',
  'Centro de Computo', 2, 0, -112, TRUE, TRUE
FROM building_categories bc WHERE bc.code = 'laboratorio'
  AND NOT EXISTS (SELECT 1 FROM buildings b WHERE b.code = 'CC')
ON CONFLICT (code) DO NOTHING;

INSERT INTO buildings
  (id, category_id, code, name, slug, description, model_node_name, x, y, z, is_active, is_priority)
SELECT gen_random_uuid(), bc.id, 'FQ', 'LAB. DE FÍSICO QUÍMICA', 'fisico-quimica',
  NULL, 'Laboratorio de Fisico-quimica ', -22, 0, -18, TRUE, FALSE
FROM building_categories bc WHERE bc.code = 'laboratorio'
  AND NOT EXISTS (SELECT 1 FROM buildings b WHERE b.code = 'FQ')
ON CONFLICT (code) DO NOTHING;

INSERT INTO buildings
  (id, category_id, code, name, slug, description, model_node_name, x, y, z, is_active, is_priority)
SELECT gen_random_uuid(), bc.id, 'GEO', 'Geolocalización', 'geolocalizacion',
  NULL, 'Contenido de geolocalización', -148, 0, -62, TRUE, FALSE
FROM building_categories bc WHERE bc.code = 'laboratorio'
  AND NOT EXISTS (SELECT 1 FROM buildings b WHERE b.code = 'GEO')
ON CONFLICT (code) DO NOTHING;

INSERT INTO buildings
  (id, category_id, code, name, slug, description, model_node_name, x, y, z, is_active, is_priority)
SELECT gen_random_uuid(), bc.id, 'LAB-QUI', 'Lab. de Química', 'lab-quimica',
  NULL, 'Laboratorio de ing.  Quimica', -44, 0, -82, TRUE, FALSE
FROM building_categories bc WHERE bc.code = 'laboratorio'
  AND NOT EXISTS (SELECT 1 FROM buildings b WHERE b.code = 'LAB-QUI')
ON CONFLICT (code) DO NOTHING;

INSERT INTO buildings
  (id, category_id, code, name, slug, description, model_node_name, x, y, z, is_active, is_priority)
SELECT gen_random_uuid(), bc.id, 'LAB-ELE', 'LAB. ING. ELÉCTRICA', 'lab-electrica',
  NULL, 'Edificios 3D 12 en emplazamiento plano', -72, 0, -116, TRUE, FALSE
FROM building_categories bc WHERE bc.code = 'laboratorio'
  AND NOT EXISTS (SELECT 1 FROM buildings b WHERE b.code = 'LAB-ELE')
ON CONFLICT (code) DO NOTHING;

INSERT INTO buildings
  (id, category_id, code, name, slug, description, model_node_name, x, y, z, is_active, is_priority)
SELECT gen_random_uuid(), bc.id, 'LAB-IND', 'LAB. ING. INDUSTRIAL', 'laboratorio-ingenieria-industrial',
  NULL, 'Laboratorio de Ing. Idustrial', 72, 0, 112, TRUE, FALSE
FROM building_categories bc WHERE bc.code = 'laboratorio'
  AND NOT EXISTS (SELECT 1 FROM buildings b WHERE b.code = 'LAB-IND')
ON CONFLICT (code) DO NOTHING;

INSERT INTO buildings
  (id, category_id, code, name, slug, description, model_node_name, x, y, z, is_active, is_priority)
SELECT gen_random_uuid(), bc.id, 'LAB-CIV', 'LAB. ING. CIVIL', 'lab-civil',
  NULL, 'Laboratorio de Ing. Civil', 20, 0, -95, TRUE, FALSE
FROM building_categories bc WHERE bc.code = 'laboratorio'
  AND NOT EXISTS (SELECT 1 FROM buildings b WHERE b.code = 'LAB-CIV')
ON CONFLICT (code) DO NOTHING;

-- ── Servicio con entrada de navegación ───────────────────────
INSERT INTO buildings
  (id, category_id, code, name, slug, description, model_node_name, x, y, z, is_active, is_priority)
SELECT gen_random_uuid(), bc.id, 'AUD-LIC', 'AUDIOVISUAL DE LICENCIATURA', 'audiovisual-licenciatura',
  NULL, 'Audiovisual de\nLicenciatura', -40, 0, 5, TRUE, FALSE
FROM building_categories bc WHERE bc.code = 'servicio'
  AND NOT EXISTS (SELECT 1 FROM buildings b WHERE b.code = 'AUD-LIC')
ON CONFLICT (code) DO NOTHING;

INSERT INTO buildings
  (id, category_id, code, name, slug, description, model_node_name, x, y, z, is_active, is_priority)
SELECT gen_random_uuid(), bc.id, 'CAF', 'CAFETERÍA', 'cafeteria',
  NULL, 'Cafeteria', 22, 0, 58, TRUE, TRUE
FROM building_categories bc WHERE bc.code = 'servicio'
  AND NOT EXISTS (SELECT 1 FROM buildings b WHERE b.code = 'CAF')
ON CONFLICT (code) DO NOTHING;

INSERT INTO buildings
  (id, category_id, code, name, slug, description, model_node_name, x, y, z, is_active, is_priority)
SELECT gen_random_uuid(), bc.id, 'GIM', 'GIMNASIO', 'gimnasio',
  NULL, NULL, 56, 0, 18, TRUE, FALSE
FROM building_categories bc WHERE bc.code = 'servicio'
  AND NOT EXISTS (SELECT 1 FROM buildings b WHERE b.code = 'GIM')
ON CONFLICT (code) DO NOTHING;

INSERT INTO buildings
  (id, category_id, code, name, slug, description, model_node_name, x, y, z, is_active, is_priority)
SELECT gen_random_uuid(), bc.id, 'AUD-POS', 'Audiovisual de Posgrado', 'audiovisual-postgrado',
  NULL, 'Audiovisual de Postgrado.001', 70, 0, -116, TRUE, FALSE
FROM building_categories bc WHERE bc.code = 'servicio'
  AND NOT EXISTS (SELECT 1 FROM buildings b WHERE b.code = 'AUD-POS')
ON CONFLICT (code) DO NOTHING;

-- ============================================================
-- 3. EDIFICIOS SIN ENTRADA DE NAVEGACIÓN
-- ============================================================

-- ── Administrativo ───────────────────────────────────────────
INSERT INTO buildings
  (id, category_id, code, name, slug, description, model_node_name, x, y, z, is_active, is_priority)
SELECT gen_random_uuid(), bc.id, 'DQI-DII', 'DPTO. DE ING. QUÍMICA - DPTO. ING. INDUSTRIAL',
  'depto-ing-quimica-industrial', NULL,
  'DEPARTAMENTO\nDE\nINGENIERÍA\nQUÍMICA Y\nBIOQUÍMICA. DEPTO. de  ing Industrial ',
  NULL, 0, NULL, TRUE, FALSE
FROM building_categories bc WHERE bc.code = 'administrativo'
  AND NOT EXISTS (SELECT 1 FROM buildings b WHERE b.code = 'DQI-DII')
ON CONFLICT (code) DO NOTHING;

INSERT INTO buildings
  (id, category_id, code, name, slug, description, model_node_name, x, y, z, is_active, is_priority)
SELECT gen_random_uuid(), bc.id, 'DEPI', 'D.E.P.I.', 'depi', NULL, 'D.E.P.I.', NULL, 0, NULL, TRUE, FALSE
FROM building_categories bc WHERE bc.code = 'administrativo'
  AND NOT EXISTS (SELECT 1 FROM buildings b WHERE b.code = 'DEPI')
ON CONFLICT (code) DO NOTHING;

INSERT INTO buildings
  (id, category_id, code, name, slug, description, model_node_name, x, y, z, is_active, is_priority)
SELECT gen_random_uuid(), bc.id, 'CONACYT', 'CONACYT', 'conacyt', NULL, 'Edificio CONACYT', NULL, 0, NULL, TRUE, FALSE
FROM building_categories bc WHERE bc.code = 'administrativo'
  AND NOT EXISTS (SELECT 1 FROM buildings b WHERE b.code = 'CONACYT')
ON CONFLICT (code) DO NOTHING;

INSERT INTO buildings
  (id, category_id, code, name, slug, description, model_node_name, x, y, z, is_active, is_priority)
SELECT gen_random_uuid(), bc.id, 'MAE-CON', 'MAESTRÍA EN CONSTRUCCIÓN', 'maestria-construccion',
  NULL, 'Maestria en construccion', NULL, 0, NULL, TRUE, FALSE
FROM building_categories bc WHERE bc.code = 'administrativo'
  AND NOT EXISTS (SELECT 1 FROM buildings b WHERE b.code = 'MAE-CON')
ON CONFLICT (code) DO NOTHING;

INSERT INTO buildings
  (id, category_id, code, name, slug, description, model_node_name, x, y, z, is_active, is_priority)
SELECT gen_random_uuid(), bc.id, 'DIE', 'DPTO. DE ING. ELECTRÓNICA', 'depto-ing-electronica',
  NULL, 'Depto.Ing Electrica', NULL, 0, NULL, TRUE, FALSE
FROM building_categories bc WHERE bc.code = 'administrativo'
  AND NOT EXISTS (SELECT 1 FROM buildings b WHERE b.code = 'DIE')
ON CONFLICT (code) DO NOTHING;

INSERT INTO buildings
  (id, category_id, code, name, slug, description, model_node_name, x, y, z, is_active, is_priority)
SELECT gen_random_uuid(), bc.id, 'MAE-DOC', 'MAESTRÍA EN DOCENCIA', 'maestria-docencia',
  NULL, 'Maestri en docencia y sala de educacion a distancia ', NULL, 0, NULL, TRUE, FALSE
FROM building_categories bc WHERE bc.code = 'administrativo'
  AND NOT EXISTS (SELECT 1 FROM buildings b WHERE b.code = 'MAE-DOC')
ON CONFLICT (code) DO NOTHING;

INSERT INTO buildings
  (id, category_id, code, name, slug, description, model_node_name, x, y, z, is_active, is_priority)
SELECT gen_random_uuid(), bc.id, 'CTIER', 'DPTO. CIENCIAS DE LA TIERRA', 'depto-ciencias-tierra',
  NULL, 'Depto de ceiencias de la Tierra ', NULL, 0, NULL, TRUE, FALSE
FROM building_categories bc WHERE bc.code = 'administrativo'
  AND NOT EXISTS (SELECT 1 FROM buildings b WHERE b.code = 'CTIER')
ON CONFLICT (code) DO NOTHING;

INSERT INTO buildings
  (id, category_id, code, name, slug, description, model_node_name, x, y, z, is_active, is_priority)
SELECT gen_random_uuid(), bc.id, 'DA', 'DESARROLLO ACADÉMICO', 'desarrollo-academico',
  NULL, 'DEPTO, de desarrolo academico ', NULL, 0, NULL, TRUE, FALSE
FROM building_categories bc WHERE bc.code = 'administrativo'
  AND NOT EXISTS (SELECT 1 FROM buildings b WHERE b.code = 'DA')
ON CONFLICT (code) DO NOTHING;

INSERT INTO buildings
  (id, category_id, code, name, slug, description, model_node_name, x, y, z, is_active, is_priority)
SELECT gen_random_uuid(), bc.id, 'CUB-MAE', 'CUBÍCULO DE MAESTROS', 'cubiculo-maestros',
  NULL, 'Cubiculo de Maestros', NULL, 0, NULL, TRUE, FALSE
FROM building_categories bc WHERE bc.code = 'administrativo'
  AND NOT EXISTS (SELECT 1 FROM buildings b WHERE b.code = 'CUB-MAE')
ON CONFLICT (code) DO NOTHING;

INSERT INTO buildings
  (id, category_id, code, name, slug, description, model_node_name, x, y, z, is_active, is_priority)
SELECT gen_random_uuid(), bc.id, 'SERV-ESC', 'SERV. ESCOLARES - DIV. EST. PROF.', 'serv-escolares-div-est-prof',
  NULL, 'Direccion, Depto de servicios escolares, Div de estudios profecionales ',
  NULL, 0, NULL, TRUE, FALSE
FROM building_categories bc WHERE bc.code = 'administrativo'
  AND NOT EXISTS (SELECT 1 FROM buildings b WHERE b.code = 'SERV-ESC')
ON CONFLICT (code) DO NOTHING;

INSERT INTO buildings
  (id, category_id, code, name, slug, description, model_node_name, x, y, z, is_active, is_priority)
SELECT gen_random_uuid(), bc.id, 'CEA', 'DPTO. CIENCIAS ECON.- ADMVAS.', 'depto-ciencias-economico-administrativas',
  NULL, 'Aulas J. Dep de Economico Administravita ', NULL, 0, NULL, TRUE, FALSE
FROM building_categories bc WHERE bc.code = 'administrativo'
  AND NOT EXISTS (SELECT 1 FROM buildings b WHERE b.code = 'CEA')
ON CONFLICT (code) DO NOTHING;

INSERT INTO buildings
  (id, category_id, code, name, slug, description, model_node_name, x, y, z, is_active, is_priority)
SELECT gen_random_uuid(), bc.id, 'MAE-ADM', 'M. ADMINISTRACIÓN', 'maestria-administracion',
  NULL, 'Maestria en Administracion', NULL, 0, NULL, TRUE, FALSE
FROM building_categories bc WHERE bc.code = 'administrativo'
  AND NOT EXISTS (SELECT 1 FROM buildings b WHERE b.code = 'MAE-ADM')
ON CONFLICT (code) DO NOTHING;

INSERT INTO buildings
  (id, category_id, code, name, slug, description, model_node_name, x, y, z, is_active, is_priority)
SELECT gen_random_uuid(), bc.id, 'SAL-MAE', 'TITULACIÓN DE M. EN ADMÓN.', 'titulacion-maestria-administracion',
  NULL, 'Maestria en Administracion.001', NULL, 0, NULL, TRUE, FALSE
FROM building_categories bc WHERE bc.code = 'administrativo'
  AND NOT EXISTS (SELECT 1 FROM buildings b WHERE b.code = 'SAL-MAE')
ON CONFLICT (code) DO NOTHING;

-- ── Aulas ────────────────────────────────────────────────────
INSERT INTO buildings
  (id, category_id, code, name, slug, description, model_node_name, x, y, z, is_active, is_priority)
SELECT gen_random_uuid(), bc.id, 'N', 'AULA Ñ', 'aula-n', NULL, 'Aulas Ñ', NULL, 0, NULL, TRUE, FALSE
FROM building_categories bc WHERE bc.code = 'aulas'
  AND NOT EXISTS (SELECT 1 FROM buildings b WHERE b.code = 'N')
ON CONFLICT (code) DO NOTHING;

INSERT INTO buildings
  (id, category_id, code, name, slug, description, model_node_name, x, y, z, is_active, is_priority)
SELECT gen_random_uuid(), bc.id, 'AUL-DOC', 'AULAS DE DOCTORADO', 'aulas-doctorado',
  NULL, 'Aulas y Cubiculos de Doctorado', NULL, 0, NULL, TRUE, FALSE
FROM building_categories bc WHERE bc.code = 'aulas'
  AND NOT EXISTS (SELECT 1 FROM buildings b WHERE b.code = 'AUL-DOC')
ON CONFLICT (code) DO NOTHING;

INSERT INTO buildings
  (id, category_id, code, name, slug, description, model_node_name, x, y, z, is_active, is_priority)
SELECT gen_random_uuid(), bc.id, 'AUL-AC', 'AULAS AC', 'aulas-ac', NULL, 'Aulas Ñ.001', NULL, 0, NULL, TRUE, FALSE
FROM building_categories bc WHERE bc.code = 'aulas'
  AND NOT EXISTS (SELECT 1 FROM buildings b WHERE b.code = 'AUL-AC')
ON CONFLICT (code) DO NOTHING;

INSERT INTO buildings
  (id, category_id, code, name, slug, description, model_node_name, x, y, z, is_active, is_priority)
SELECT gen_random_uuid(), bc.id, 'MC', 'EDIFICIO MULTICARRERA', 'edificio-multicarrera',
  NULL, 'Edificios 3D 16 en emplazamiento plano', NULL, 0, NULL, TRUE, FALSE
FROM building_categories bc WHERE bc.code = 'aulas'
  AND NOT EXISTS (SELECT 1 FROM buildings b WHERE b.code = 'MC')
ON CONFLICT (code) DO NOTHING;

INSERT INTO buildings
  (id, category_id, code, name, slug, description, model_node_name, x, y, z, is_active, is_priority)
SELECT gen_random_uuid(), bc.id, 'AUL-P', 'AULAS P', 'aulas-p', NULL, 'Aulas P ', NULL, 0, NULL, TRUE, FALSE
FROM building_categories bc WHERE bc.code = 'aulas'
  AND NOT EXISTS (SELECT 1 FROM buildings b WHERE b.code = 'AUL-P')
ON CONFLICT (code) DO NOTHING;

INSERT INTO buildings
  (id, category_id, code, name, slug, description, model_node_name, x, y, z, is_active, is_priority)
SELECT gen_random_uuid(), bc.id, 'A', 'EDIF. A', 'edif-a', NULL, 'Edificio A ', NULL, 0, NULL, TRUE, FALSE
FROM building_categories bc WHERE bc.code = 'aulas'
  AND NOT EXISTS (SELECT 1 FROM buildings b WHERE b.code = 'A')
ON CONFLICT (code) DO NOTHING;

INSERT INTO buildings
  (id, category_id, code, name, slug, description, model_node_name, x, y, z, is_active, is_priority)
SELECT gen_random_uuid(), bc.id, 'D', 'EDIF. D', 'edif-d', NULL, 'Aulas D ', NULL, 0, NULL, TRUE, FALSE
FROM building_categories bc WHERE bc.code = 'aulas'
  AND NOT EXISTS (SELECT 1 FROM buildings b WHERE b.code = 'D')
ON CONFLICT (code) DO NOTHING;

INSERT INTO buildings
  (id, category_id, code, name, slug, description, model_node_name, x, y, z, is_active, is_priority)
SELECT gen_random_uuid(), bc.id, 'O', 'AULA O', 'aula-o', NULL, 'Edificios 3D 18 en emplazamiento plano', NULL, 0, NULL, TRUE, FALSE
FROM building_categories bc WHERE bc.code = 'aulas'
  AND NOT EXISTS (SELECT 1 FROM buildings b WHERE b.code = 'O')
ON CONFLICT (code) DO NOTHING;

INSERT INTO buildings
  (id, category_id, code, name, slug, description, model_node_name, x, y, z, is_active, is_priority)
SELECT gen_random_uuid(), bc.id, 'CB', 'CIENCIAS BÁSICAS - BAÑOS', 'ciencias-basicas-banos',
  NULL, 'Departamento de Ciencias Basicas_Departamento de Ciencias Basicas', NULL, 0, NULL, TRUE, FALSE
FROM building_categories bc WHERE bc.code = 'aulas'
  AND NOT EXISTS (SELECT 1 FROM buildings b WHERE b.code = 'CB')
ON CONFLICT (code) DO NOTHING;

INSERT INTO buildings
  (id, category_id, code, name, slug, description, model_node_name, x, y, z, is_active, is_priority)
SELECT gen_random_uuid(), bc.id, 'AUL-K', 'Aulas K', 'aulas-k', NULL, 'Aulas K', NULL, 0, NULL, TRUE, FALSE
FROM building_categories bc WHERE bc.code = 'aulas'
  AND NOT EXISTS (SELECT 1 FROM buildings b WHERE b.code = 'AUL-K')
ON CONFLICT (code) DO NOTHING;

-- ── Laboratorio ──────────────────────────────────────────────
INSERT INTO buildings
  (id, category_id, code, name, slug, description, model_node_name, x, y, z, is_active, is_priority)
SELECT gen_random_uuid(), bc.id, 'LAB-SIM', 'LAB. DE SIMULACIÓN', 'lab-simulacion',
  NULL, 'Lab de Simulacion ', NULL, 0, NULL, TRUE, FALSE
FROM building_categories bc WHERE bc.code = 'laboratorio'
  AND NOT EXISTS (SELECT 1 FROM buildings b WHERE b.code = 'LAB-SIM')
ON CONFLICT (code) DO NOTHING;

INSERT INTO buildings
  (id, category_id, code, name, slug, description, model_node_name, x, y, z, is_active, is_priority)
SELECT gen_random_uuid(), bc.id, 'LAB-MEC', 'DPTO. LAB. ING. MECÁNICA', 'depto-lab-ing-mecanica',
  NULL, 'Laboratorio de Ing. Quimica Pesada, Depto de Ing de Mecanica ', NULL, 0, NULL, TRUE, FALSE
FROM building_categories bc WHERE bc.code = 'laboratorio'
  AND NOT EXISTS (SELECT 1 FROM buildings b WHERE b.code = 'LAB-MEC')
ON CONFLICT (code) DO NOTHING;

INSERT INTO buildings
  (id, category_id, code, name, slug, description, model_node_name, x, y, z, is_active, is_priority)
SELECT gen_random_uuid(), bc.id, 'LAB-QP', 'LAB. QUÍMICA PESADA', 'lab-quimica-pesada',
  NULL, 'Laboratorio de Ing. Quimica Pesada, Depto de Ing de Mecanica ', NULL, 0, NULL, TRUE, FALSE
FROM building_categories bc WHERE bc.code = 'laboratorio'
  AND NOT EXISTS (SELECT 1 FROM buildings b WHERE b.code = 'LAB-QP')
ON CONFLICT (code) DO NOTHING;

INSERT INTO buildings
  (id, category_id, code, name, slug, description, model_node_name, x, y, z, is_active, is_priority)
SELECT gen_random_uuid(), bc.id, 'LAB-MICR',
  'LAB. MICR.- TITULACIÓN - AULA DIBUJO - BAÑOS', 'lab-micr-titulacion-aula-dibujo-banos',
  NULL, 'Sala de titulacion- aula de dibujo- Lab de microscopia -aula de dibujo ',
  NULL, 0, NULL, TRUE, FALSE
FROM building_categories bc WHERE bc.code = 'laboratorio'
  AND NOT EXISTS (SELECT 1 FROM buildings b WHERE b.code = 'LAB-MICR')
ON CONFLICT (code) DO NOTHING;

-- ── Servicio ─────────────────────────────────────────────────
INSERT INTO buildings
  (id, category_id, code, name, slug, description, model_node_name, x, y, z, is_active, is_priority)
SELECT gen_random_uuid(), bc.id, 'CAL', 'CALDERA', 'caldera', NULL, 'Caldera ', NULL, 0, NULL, TRUE, FALSE
FROM building_categories bc WHERE bc.code = 'servicio'
  AND NOT EXISTS (SELECT 1 FROM buildings b WHERE b.code = 'CAL')
ON CONFLICT (code) DO NOTHING;

INSERT INTO buildings
  (id, category_id, code, name, slug, description, model_node_name, x, y, z, is_active, is_priority)
SELECT gen_random_uuid(), bc.id, 'LUD', 'LUDOTECA SECCIÓN 61', 'ludoteca-seccion-61',
  NULL, 'seccion 61', NULL, 0, NULL, TRUE, FALSE
FROM building_categories bc WHERE bc.code = 'servicio'
  AND NOT EXISTS (SELECT 1 FROM buildings b WHERE b.code = 'LUD')
ON CONFLICT (code) DO NOTHING;

INSERT INTO buildings
  (id, category_id, code, name, slug, description, model_node_name, x, y, z, is_active, is_priority)
SELECT gen_random_uuid(), bc.id, 'AUD-ING', 'AUDIOVISUAL DE ING.- BAÑOS', 'audiovisual-ing-banos',
  NULL, 'Audiovisual de Ing ', NULL, 0, NULL, TRUE, FALSE
FROM building_categories bc WHERE bc.code = 'servicio'
  AND NOT EXISTS (SELECT 1 FROM buildings b WHERE b.code = 'AUD-ING')
ON CONFLICT (code) DO NOTHING;

INSERT INTO buildings
  (id, category_id, code, name, slug, description, model_node_name, x, y, z, is_active, is_priority)
SELECT gen_random_uuid(), bc.id, 'MTO', 'Mantenimiento', 'mantenimiento', NULL, NULL, NULL, 0, NULL, TRUE, FALSE
FROM building_categories bc WHERE bc.code = 'servicio'
  AND NOT EXISTS (SELECT 1 FROM buildings b WHERE b.code = 'MTO')
ON CONFLICT (code) DO NOTHING;

INSERT INTO buildings
  (id, category_id, code, name, slug, description, model_node_name, x, y, z, is_active, is_priority)
SELECT gen_random_uuid(), bc.id, 'COPISE', 'COPISE', 'copise', NULL, NULL, NULL, 0, NULL, TRUE, FALSE
FROM building_categories bc WHERE bc.code = 'servicio'
  AND NOT EXISTS (SELECT 1 FROM buildings b WHERE b.code = 'COPISE')
ON CONFLICT (code) DO NOTHING;

INSERT INTO buildings
  (id, category_id, code, name, slug, description, model_node_name, x, y, z, is_active, is_priority)
SELECT gen_random_uuid(), bc.id, 'EXT', 'Servicios Extra Escolares', 'servicios-extra-escolares',
  NULL, 'Extra escolares ', NULL, 0, NULL, TRUE, FALSE
FROM building_categories bc WHERE bc.code = 'servicio'
  AND NOT EXISTS (SELECT 1 FROM buildings b WHERE b.code = 'EXT')
ON CONFLICT (code) DO NOTHING;

INSERT INTO buildings
  (id, category_id, code, name, slug, description, model_node_name, x, y, z, is_active, is_priority)
SELECT gen_random_uuid(), bc.id, 'EXTRA', 'EXTRAESCOLARES', 'extraescolares',
  NULL, 'Extra escolares ', NULL, 0, NULL, TRUE, FALSE
FROM building_categories bc WHERE bc.code = 'servicio'
  AND NOT EXISTS (SELECT 1 FROM buildings b WHERE b.code = 'EXTRA')
ON CONFLICT (code) DO NOTHING;

INSERT INTO buildings
  (id, category_id, code, name, slug, description, model_node_name, x, y, z, is_active, is_priority)
SELECT gen_random_uuid(), bc.id, 'COPIAS', 'COPIAS', 'copias',
  NULL, 'Sala de titulacion- aula de dibujo- Lab de microscopia -aula de dibujo ',
  NULL, 0, NULL, TRUE, FALSE
FROM building_categories bc WHERE bc.code = 'servicio'
  AND NOT EXISTS (SELECT 1 FROM buildings b WHERE b.code = 'COPIAS')
ON CONFLICT (code) DO NOTHING;

INSERT INTO buildings
  (id, category_id, code, name, slug, description, model_node_name, x, y, z, is_active, is_priority)
SELECT gen_random_uuid(), bc.id, 'PTR', 'PLANTA DE TRATAM. DE AGUAS RESID.', 'planta-tratamiento-aguas-residuales',
  NULL, 'Edificios 3D 10 en emplazamiento plano', NULL, 0, NULL, TRUE, FALSE
FROM building_categories bc WHERE bc.code = 'servicio'
  AND NOT EXISTS (SELECT 1 FROM buildings b WHERE b.code = 'PTR')
ON CONFLICT (code) DO NOTHING;

INSERT INTO buildings
  (id, category_id, code, name, slug, description, model_node_name, x, y, z, is_active, is_priority)
SELECT gen_random_uuid(), bc.id, 'VIG', 'CASETA DE VIGILANCIA', 'caseta-vigilancia',
  NULL, 'seccion 61', NULL, 0, NULL, TRUE, FALSE
FROM building_categories bc WHERE bc.code = 'servicio'
  AND NOT EXISTS (SELECT 1 FROM buildings b WHERE b.code = 'VIG')
ON CONFLICT (code) DO NOTHING;

