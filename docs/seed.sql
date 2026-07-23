-- ============================================================
-- SEED CANÓNICO — Mapa 3D ITO
-- Generado: 2026-06-23
-- Consolida: seed original + todas las migraciones de edificios
--            hasta 2026-06-18.
-- Nota (2026-07-22): se quitó el grafo de navegación (nodos/aristas/
-- entradas) al eliminar el módulo de ruteo por grafo — ver
-- docs/migration-remove-navigation-graph-20260722.sql.
--
-- Prerequisito: schema.sql ya ejecutado (incluye las categorías).
--
-- Uso:
--   mysql -u <usuario> -p mapa_ito < docs/seed.sql
--
-- IMPORTANTE — Contraseña del superadmin:
--   El hash de abajo es un MARCADOR (no corresponde a ninguna
--   contraseña real). Para generar un hash real, ejecuta:
--     node -e "require('bcryptjs').hash('TuContraseña@123', 12).then(h => console.log(h))"
--   Luego reemplaza el campo password_hash con el resultado.
-- ============================================================

SET NAMES utf8mb4;

-- ============================================================
-- 1. USUARIO SUPERADMIN
-- ============================================================
INSERT IGNORE INTO admin_users
  (id, username, full_name, email, password_hash, role, is_active,
   failed_login_attempts, locked_until, token_version)
VALUES (
  UUID(),
  'superadmin',
  'Super Administrador ITO',
  'admin@ito.edu.mx',
  '$2b$12$AAAAAAAAAAAAAAAAAAAAAA.AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA',
  'superadmin',
  1, 0, NULL, 1
);

-- ============================================================
-- 2. EDIFICIOS CON ENTRADA DE NAVEGACIÓN (38)
--    Nombre histórico de la sección: originalmente estos slugs también
--    alimentaban building_entrances (grafo de navegación, ya eliminado).
-- ============================================================

-- ── Administrativo ───────────────────────────────────────────
INSERT IGNORE INTO buildings
  (id, category_id, code, name, slug, description, model_node_name, x, y, z, is_active, is_priority)
SELECT UUID(), bc.id, 'DIR', 'DIRECCIÓN', 'direccion',
  'Edificio de Dirección General del ITO.',
  'Direccion, Depto de servicios escolares, Div de estudios profecionales ',
  -78, 0, 60, 1, 1
FROM building_categories bc WHERE bc.code = 'administrativo'
  AND NOT EXISTS (SELECT 1 FROM buildings b WHERE b.code = 'DIR');

INSERT IGNORE INTO buildings
  (id, category_id, code, name, slug, description, model_node_name, x, y, z, is_active, is_priority)
SELECT UUID(), bc.id, 'ASE', 'ASESORÍAS', 'asesorias',
  NULL, 'Asesorias', 12, 0, -4, 1, 0
FROM building_categories bc WHERE bc.code = 'administrativo'
  AND NOT EXISTS (SELECT 1 FROM buildings b WHERE b.code = 'ASE');

INSERT IGNORE INTO buildings
  (id, category_id, code, name, slug, description, model_node_name, x, y, z, is_active, is_priority)
SELECT UUID(), bc.id, 'SAL', 'Sala de Titulación', 'sala-titulacion',
  NULL, 'Sala de titulacion- aula de dibujo- Lab de microscopia -aula de dibujo ',
  -94, 0, -44, 1, 0
FROM building_categories bc WHERE bc.code = 'administrativo'
  AND NOT EXISTS (SELECT 1 FROM buildings b WHERE b.code = 'SAL');

INSERT IGNORE INTO buildings
  (id, category_id, code, name, slug, description, model_node_name, x, y, z, is_active, is_priority)
SELECT UUID(), bc.id, 'POS', 'Posgrado', 'postgrado',
  NULL, 'Edificio de Postgrado.001', -78, 0, -92, 1, 0
FROM building_categories bc WHERE bc.code = 'administrativo'
  AND NOT EXISTS (SELECT 1 FROM buildings b WHERE b.code = 'POS');

INSERT IGNORE INTO buildings
  (id, category_id, code, name, slug, description, model_node_name, x, y, z, is_active, is_priority)
SELECT UUID(), bc.id, 'DQB', 'Dpto. Química y Bioquímica', 'depto-quimica-bioquimica',
  NULL, 'DEPARTAMENTO\nDE\nINGENIERÍA\nQUÍMICA Y\nBIOQUÍMICA',
  26, 0, -127, 1, 0
FROM building_categories bc WHERE bc.code = 'administrativo'
  AND NOT EXISTS (SELECT 1 FROM buildings b WHERE b.code = 'DQB');

INSERT IGNORE INTO buildings
  (id, category_id, code, name, slug, description, model_node_name, x, y, z, is_active, is_priority)
SELECT UUID(), bc.id, 'CUB-DOC', 'Cubículos de Doctorado', 'cubiculos-doctorado',
  NULL, 'Cubiculos de Doctorado.001', 32, 0, -124, 1, 0
FROM building_categories bc WHERE bc.code = 'administrativo'
  AND NOT EXISTS (SELECT 1 FROM buildings b WHERE b.code = 'CUB-DOC');

INSERT IGNORE INTO buildings
  (id, category_id, code, name, slug, description, model_node_name, x, y, z, is_active, is_priority)
SELECT UUID(), bc.id, 'DEL', 'DPTO. ING. ELECTRÓNICA', 'depto-electronica',
  NULL, 'DEPARTAMENTO DE\nINGENIERÍA\nELECTRÓNICA', 54, 0, -50, 1, 0
FROM building_categories bc WHERE bc.code = 'administrativo'
  AND NOT EXISTS (SELECT 1 FROM buildings b WHERE b.code = 'DEL');

-- ── Biblioteca ───────────────────────────────────────────────
INSERT IGNORE INTO buildings
  (id, category_id, code, name, slug, description, model_node_name, x, y, z, is_active, is_priority)
SELECT UUID(), bc.id, 'BIB', 'CENTRO DE INFORMACIÓN (BIBLIOTECA)', 'biblioteca',
  'Biblioteca del Instituto Tecnológico de Oaxaca.',
  'Biblioteca_', 8, 0, 0, 1, 1
FROM building_categories bc WHERE bc.code = 'biblioteca'
  AND NOT EXISTS (SELECT 1 FROM buildings b WHERE b.code = 'BIB');

-- ── Aulas con entrada de navegación ─────────────────────────
INSERT IGNORE INTO buildings
  (id, category_id, code, name, slug, description, model_node_name, x, y, z, is_active, is_priority)
SELECT UUID(), bc.id, 'E', 'EDIF. E', 'edificio-e', NULL, NULL, 10, 0, 86, 1, 0
FROM building_categories bc WHERE bc.code = 'aulas'
  AND NOT EXISTS (SELECT 1 FROM buildings b WHERE b.code = 'E');

INSERT IGNORE INTO buildings
  (id, category_id, code, name, slug, description, model_node_name, x, y, z, is_active, is_priority)
SELECT UUID(), bc.id, 'F', 'EDIF. F', 'edificio-f', NULL, 'Edificio F', 8, 0, 118, 1, 0
FROM building_categories bc WHERE bc.code = 'aulas'
  AND NOT EXISTS (SELECT 1 FROM buildings b WHERE b.code = 'F');

INSERT IGNORE INTO buildings
  (id, category_id, code, name, slug, description, model_node_name, x, y, z, is_active, is_priority)
SELECT UUID(), bc.id, 'G', 'EDIF. G', 'edificio-g', NULL, NULL, 8, 0, 148, 1, 0
FROM building_categories bc WHERE bc.code = 'aulas'
  AND NOT EXISTS (SELECT 1 FROM buildings b WHERE b.code = 'G');

INSERT IGNORE INTO buildings
  (id, category_id, code, name, slug, description, model_node_name, x, y, z, is_active, is_priority)
SELECT UUID(), bc.id, 'H', 'EDIF. H', 'edificio-h', NULL, 'Edificio H_Edifucui H', -38, 0, 108, 1, 0
FROM building_categories bc WHERE bc.code = 'aulas'
  AND NOT EXISTS (SELECT 1 FROM buildings b WHERE b.code = 'H');

INSERT IGNORE INTO buildings
  (id, category_id, code, name, slug, description, model_node_name, x, y, z, is_active, is_priority)
SELECT UUID(), bc.id, 'I', 'EDIF. I', 'edificio-i', NULL, 'Edificio I', -54, 0, 162, 1, 0
FROM building_categories bc WHERE bc.code = 'aulas'
  AND NOT EXISTS (SELECT 1 FROM buildings b WHERE b.code = 'I');

INSERT IGNORE INTO buildings
  (id, category_id, code, name, slug, description, model_node_name, x, y, z, is_active, is_priority)
SELECT UUID(), bc.id, 'J', 'Edificio J', 'edificio-j', NULL, 'Edificio J', -35, 0, 162, 1, 0
FROM building_categories bc WHERE bc.code = 'aulas'
  AND NOT EXISTS (SELECT 1 FROM buildings b WHERE b.code = 'J');

INSERT IGNORE INTO buildings
  (id, category_id, code, name, slug, description, model_node_name, x, y, z, is_active, is_priority)
SELECT UUID(), bc.id, 'K', 'EDIF. K - BAÑOS', 'edificio-k', NULL, 'Edificio K', 46, 0, 148, 1, 0
FROM building_categories bc WHERE bc.code = 'aulas'
  AND NOT EXISTS (SELECT 1 FROM buildings b WHERE b.code = 'K');

INSERT IGNORE INTO buildings
  (id, category_id, code, name, slug, description, model_node_name, x, y, z, is_active, is_priority)
SELECT UUID(), bc.id, 'Q', 'Edificio Q', 'edificio-q', NULL, NULL, 58, 0, 74, 1, 0
FROM building_categories bc WHERE bc.code = 'aulas'
  AND NOT EXISTS (SELECT 1 FROM buildings b WHERE b.code = 'Q');

INSERT IGNORE INTO buildings
  (id, category_id, code, name, slug, description, model_node_name, x, y, z, is_active, is_priority)
SELECT UUID(), bc.id, 'AUL-S', 'EDIF. S', 'aulas-s', NULL, 'Aulas S.', 62, 0, 160, 1, 0
FROM building_categories bc WHERE bc.code = 'aulas'
  AND NOT EXISTS (SELECT 1 FROM buildings b WHERE b.code = 'AUL-S');

INSERT IGNORE INTO buildings
  (id, category_id, code, name, slug, description, model_node_name, x, y, z, is_active, is_priority)
SELECT UUID(), bc.id, 'L', 'Edificio L', 'edificio-l', NULL, 'Edificio  L ', 22, 0, -18, 1, 0
FROM building_categories bc WHERE bc.code = 'aulas'
  AND NOT EXISTS (SELECT 1 FROM buildings b WHERE b.code = 'L');

INSERT IGNORE INTO buildings
  (id, category_id, code, name, slug, description, model_node_name, x, y, z, is_active, is_priority)
SELECT UUID(), bc.id, 'X', 'Edificio X', 'edificiox', NULL, NULL, 46, 0, -14, 1, 0
FROM building_categories bc WHERE bc.code = 'aulas'
  AND NOT EXISTS (SELECT 1 FROM buildings b WHERE b.code = 'X');

INSERT IGNORE INTO buildings
  (id, category_id, code, name, slug, description, model_node_name, x, y, z, is_active, is_priority)
SELECT UUID(), bc.id, 'X001', 'Edificio X001', 'edificiox001', NULL, NULL, 8, 0, -54, 1, 0
FROM building_categories bc WHERE bc.code = 'aulas'
  AND NOT EXISTS (SELECT 1 FROM buildings b WHERE b.code = 'X001');

INSERT IGNORE INTO buildings
  (id, category_id, code, name, slug, description, model_node_name, x, y, z, is_active, is_priority)
SELECT UUID(), bc.id, 'C', 'EDIF. C', 'edificio-c', NULL, 'Eduficio C', -58, 0, -14, 1, 0
FROM building_categories bc WHERE bc.code = 'aulas'
  AND NOT EXISTS (SELECT 1 FROM buildings b WHERE b.code = 'C');

INSERT IGNORE INTO buildings
  (id, category_id, code, name, slug, description, model_node_name, x, y, z, is_active, is_priority)
SELECT UUID(), bc.id, 'B', 'EDIF. B', 'edificio-b', NULL, 'Edificio B', -52, 0, -48, 1, 0
FROM building_categories bc WHERE bc.code = 'aulas'
  AND NOT EXISTS (SELECT 1 FROM buildings b WHERE b.code = 'B');

INSERT IGNORE INTO buildings
  (id, category_id, code, name, slug, description, model_node_name, x, y, z, is_active, is_priority)
SELECT UUID(), bc.id, '1007', 'Aula 1007', '1007', NULL, 'Edificio 3D 1.007', -128, 0, -8, 1, 0
FROM building_categories bc WHERE bc.code = 'aulas'
  AND NOT EXISTS (SELECT 1 FROM buildings b WHERE b.code = '1007');

INSERT IGNORE INTO buildings
  (id, category_id, code, name, slug, description, model_node_name, x, y, z, is_active, is_priority)
SELECT UUID(), bc.id, '1008', 'Aula 1008', '1008', NULL, 'Edificio 3D 1.008', -158, 0, -44, 1, 0
FROM building_categories bc WHERE bc.code = 'aulas'
  AND NOT EXISTS (SELECT 1 FROM buildings b WHERE b.code = '1008');

INSERT IGNORE INTO buildings
  (id, category_id, code, name, slug, description, model_node_name, x, y, z, is_active, is_priority)
SELECT UUID(), bc.id, '1009', 'Aula 1009', '1009', NULL, 'Edificio 3D 1.009', -114, 0, -90, 1, 0
FROM building_categories bc WHERE bc.code = 'aulas'
  AND NOT EXISTS (SELECT 1 FROM buildings b WHERE b.code = '1009');

INSERT IGNORE INTO buildings
  (id, category_id, code, name, slug, description, model_node_name, x, y, z, is_active, is_priority)
SELECT UUID(), bc.id, 'ENIE', 'Aulas ENIE', 'aulas-enie', NULL, NULL, 54, 0, -107, 1, 0
FROM building_categories bc WHERE bc.code = 'aulas'
  AND NOT EXISTS (SELECT 1 FROM buildings b WHERE b.code = 'ENIE');

INSERT IGNORE INTO buildings
  (id, category_id, code, name, slug, description, model_node_name, x, y, z, is_active, is_priority)
SELECT UUID(), bc.id, 'NEW', 'Edificio Nuevo', 'edificio-nuevo', NULL, 'Edificio Nuevo', -58, 0, 150, 1, 0
FROM building_categories bc WHERE bc.code = 'aulas'
  AND NOT EXISTS (SELECT 1 FROM buildings b WHERE b.code = 'NEW');

-- ── Laboratorio con entrada de navegación ────────────────────
INSERT IGNORE INTO buildings
  (id, category_id, code, name, slug, description, model_node_name, x, y, z, is_active, is_priority)
SELECT UUID(), bc.id, 'CC', 'CENTRO DE CÓMPUTO', 'centro-computo',
  'Centro de Cómputo y Sistemas del ITO.',
  'Centro de Computo', 2, 0, -112, 1, 1
FROM building_categories bc WHERE bc.code = 'laboratorio'
  AND NOT EXISTS (SELECT 1 FROM buildings b WHERE b.code = 'CC');

INSERT IGNORE INTO buildings
  (id, category_id, code, name, slug, description, model_node_name, x, y, z, is_active, is_priority)
SELECT UUID(), bc.id, 'FQ', 'LAB. DE FÍSICO QUÍMICA', 'fisico-quimica',
  NULL, 'Laboratorio de Fisico-quimica ', -22, 0, -18, 1, 0
FROM building_categories bc WHERE bc.code = 'laboratorio'
  AND NOT EXISTS (SELECT 1 FROM buildings b WHERE b.code = 'FQ');

INSERT IGNORE INTO buildings
  (id, category_id, code, name, slug, description, model_node_name, x, y, z, is_active, is_priority)
SELECT UUID(), bc.id, 'GEO', 'Geolocalización', 'geolocalizacion',
  NULL, 'Contenido de geolocalización', -148, 0, -62, 1, 0
FROM building_categories bc WHERE bc.code = 'laboratorio'
  AND NOT EXISTS (SELECT 1 FROM buildings b WHERE b.code = 'GEO');

INSERT IGNORE INTO buildings
  (id, category_id, code, name, slug, description, model_node_name, x, y, z, is_active, is_priority)
SELECT UUID(), bc.id, 'LAB-QUI', 'Lab. de Química', 'lab-quimica',
  NULL, 'Laboratorio de ing.  Quimica', -44, 0, -82, 1, 0
FROM building_categories bc WHERE bc.code = 'laboratorio'
  AND NOT EXISTS (SELECT 1 FROM buildings b WHERE b.code = 'LAB-QUI');

INSERT IGNORE INTO buildings
  (id, category_id, code, name, slug, description, model_node_name, x, y, z, is_active, is_priority)
SELECT UUID(), bc.id, 'LAB-ELE', 'LAB. ING. ELÉCTRICA', 'lab-electrica',
  NULL, 'Edificios 3D 12 en emplazamiento plano', -72, 0, -116, 1, 0
FROM building_categories bc WHERE bc.code = 'laboratorio'
  AND NOT EXISTS (SELECT 1 FROM buildings b WHERE b.code = 'LAB-ELE');

INSERT IGNORE INTO buildings
  (id, category_id, code, name, slug, description, model_node_name, x, y, z, is_active, is_priority)
SELECT UUID(), bc.id, 'LAB-IND', 'LAB. ING. INDUSTRIAL', 'laboratorio-ingenieria-industrial',
  NULL, 'Laboratorio de Ing. Idustrial', 72, 0, 112, 1, 0
FROM building_categories bc WHERE bc.code = 'laboratorio'
  AND NOT EXISTS (SELECT 1 FROM buildings b WHERE b.code = 'LAB-IND');

INSERT IGNORE INTO buildings
  (id, category_id, code, name, slug, description, model_node_name, x, y, z, is_active, is_priority)
SELECT UUID(), bc.id, 'LAB-CIV', 'LAB. ING. CIVIL', 'lab-civil',
  NULL, 'Laboratorio de Ing. Civil', 20, 0, -95, 1, 0
FROM building_categories bc WHERE bc.code = 'laboratorio'
  AND NOT EXISTS (SELECT 1 FROM buildings b WHERE b.code = 'LAB-CIV');

-- ── Servicio con entrada de navegación ───────────────────────
INSERT IGNORE INTO buildings
  (id, category_id, code, name, slug, description, model_node_name, x, y, z, is_active, is_priority)
SELECT UUID(), bc.id, 'AUD-LIC', 'AUDIOVISUAL DE LICENCIATURA', 'audiovisual-licenciatura',
  NULL, 'Audiovisual de\nLicenciatura', -40, 0, 5, 1, 0
FROM building_categories bc WHERE bc.code = 'servicio'
  AND NOT EXISTS (SELECT 1 FROM buildings b WHERE b.code = 'AUD-LIC');

INSERT IGNORE INTO buildings
  (id, category_id, code, name, slug, description, model_node_name, x, y, z, is_active, is_priority)
SELECT UUID(), bc.id, 'CAF', 'CAFETERÍA', 'cafeteria',
  NULL, 'Cafeteria', 22, 0, 58, 1, 1
FROM building_categories bc WHERE bc.code = 'servicio'
  AND NOT EXISTS (SELECT 1 FROM buildings b WHERE b.code = 'CAF');

INSERT IGNORE INTO buildings
  (id, category_id, code, name, slug, description, model_node_name, x, y, z, is_active, is_priority)
SELECT UUID(), bc.id, 'GIM', 'GIMNASIO', 'gimnasio',
  NULL, NULL, 56, 0, 18, 1, 0
FROM building_categories bc WHERE bc.code = 'servicio'
  AND NOT EXISTS (SELECT 1 FROM buildings b WHERE b.code = 'GIM');

INSERT IGNORE INTO buildings
  (id, category_id, code, name, slug, description, model_node_name, x, y, z, is_active, is_priority)
SELECT UUID(), bc.id, 'AUD-POS', 'Audiovisual de Posgrado', 'audiovisual-postgrado',
  NULL, 'Audiovisual de Postgrado.001', 70, 0, -116, 1, 0
FROM building_categories bc WHERE bc.code = 'servicio'
  AND NOT EXISTS (SELECT 1 FROM buildings b WHERE b.code = 'AUD-POS');

-- ============================================================
-- 3. EDIFICIOS SIN ENTRADA DE NAVEGACIÓN
-- ============================================================

-- ── Administrativo ───────────────────────────────────────────
INSERT IGNORE INTO buildings
  (id, category_id, code, name, slug, description, model_node_name, x, y, z, is_active, is_priority)
SELECT UUID(), bc.id, 'DQI-DII', 'DPTO. DE ING. QUÍMICA - DPTO. ING. INDUSTRIAL',
  'depto-ing-quimica-industrial', NULL,
  'DEPARTAMENTO\nDE\nINGENIERÍA\nQUÍMICA Y\nBIOQUÍMICA. DEPTO. de  ing Industrial ',
  NULL, 0, NULL, 1, 0
FROM building_categories bc WHERE bc.code = 'administrativo'
  AND NOT EXISTS (SELECT 1 FROM buildings b WHERE b.code = 'DQI-DII');

INSERT IGNORE INTO buildings
  (id, category_id, code, name, slug, description, model_node_name, x, y, z, is_active, is_priority)
SELECT UUID(), bc.id, 'DEPI', 'D.E.P.I.', 'depi', NULL, 'D.E.P.I.', NULL, 0, NULL, 1, 0
FROM building_categories bc WHERE bc.code = 'administrativo'
  AND NOT EXISTS (SELECT 1 FROM buildings b WHERE b.code = 'DEPI');

INSERT IGNORE INTO buildings
  (id, category_id, code, name, slug, description, model_node_name, x, y, z, is_active, is_priority)
SELECT UUID(), bc.id, 'CONACYT', 'CONACYT', 'conacyt', NULL, 'Edificio CONACYT', NULL, 0, NULL, 1, 0
FROM building_categories bc WHERE bc.code = 'administrativo'
  AND NOT EXISTS (SELECT 1 FROM buildings b WHERE b.code = 'CONACYT');

INSERT IGNORE INTO buildings
  (id, category_id, code, name, slug, description, model_node_name, x, y, z, is_active, is_priority)
SELECT UUID(), bc.id, 'MAE-CON', 'MAESTRÍA EN CONSTRUCCIÓN', 'maestria-construccion',
  NULL, 'Maestria en construccion', NULL, 0, NULL, 1, 0
FROM building_categories bc WHERE bc.code = 'administrativo'
  AND NOT EXISTS (SELECT 1 FROM buildings b WHERE b.code = 'MAE-CON');

INSERT IGNORE INTO buildings
  (id, category_id, code, name, slug, description, model_node_name, x, y, z, is_active, is_priority)
SELECT UUID(), bc.id, 'DIE', 'DPTO. DE ING. ELECTRÓNICA', 'depto-ing-electronica',
  NULL, 'Depto.Ing Electrica', NULL, 0, NULL, 1, 0
FROM building_categories bc WHERE bc.code = 'administrativo'
  AND NOT EXISTS (SELECT 1 FROM buildings b WHERE b.code = 'DIE');

INSERT IGNORE INTO buildings
  (id, category_id, code, name, slug, description, model_node_name, x, y, z, is_active, is_priority)
SELECT UUID(), bc.id, 'MAE-DOC', 'MAESTRÍA EN DOCENCIA', 'maestria-docencia',
  NULL, 'Maestri en docencia y sala de educacion a distancia ', NULL, 0, NULL, 1, 0
FROM building_categories bc WHERE bc.code = 'administrativo'
  AND NOT EXISTS (SELECT 1 FROM buildings b WHERE b.code = 'MAE-DOC');

INSERT IGNORE INTO buildings
  (id, category_id, code, name, slug, description, model_node_name, x, y, z, is_active, is_priority)
SELECT UUID(), bc.id, 'CTIER', 'DPTO. CIENCIAS DE LA TIERRA', 'depto-ciencias-tierra',
  NULL, 'Depto de ceiencias de la Tierra ', NULL, 0, NULL, 1, 0
FROM building_categories bc WHERE bc.code = 'administrativo'
  AND NOT EXISTS (SELECT 1 FROM buildings b WHERE b.code = 'CTIER');

INSERT IGNORE INTO buildings
  (id, category_id, code, name, slug, description, model_node_name, x, y, z, is_active, is_priority)
SELECT UUID(), bc.id, 'DA', 'DESARROLLO ACADÉMICO', 'desarrollo-academico',
  NULL, 'DEPTO, de desarrolo academico ', NULL, 0, NULL, 1, 0
FROM building_categories bc WHERE bc.code = 'administrativo'
  AND NOT EXISTS (SELECT 1 FROM buildings b WHERE b.code = 'DA');

INSERT IGNORE INTO buildings
  (id, category_id, code, name, slug, description, model_node_name, x, y, z, is_active, is_priority)
SELECT UUID(), bc.id, 'CUB-MAE', 'CUBÍCULO DE MAESTROS', 'cubiculo-maestros',
  NULL, 'Cubiculo de Maestros', NULL, 0, NULL, 1, 0
FROM building_categories bc WHERE bc.code = 'administrativo'
  AND NOT EXISTS (SELECT 1 FROM buildings b WHERE b.code = 'CUB-MAE');

INSERT IGNORE INTO buildings
  (id, category_id, code, name, slug, description, model_node_name, x, y, z, is_active, is_priority)
SELECT UUID(), bc.id, 'SERV-ESC', 'SERV. ESCOLARES - DIV. EST. PROF.', 'serv-escolares-div-est-prof',
  NULL, 'Direccion, Depto de servicios escolares, Div de estudios profecionales ',
  NULL, 0, NULL, 1, 0
FROM building_categories bc WHERE bc.code = 'administrativo'
  AND NOT EXISTS (SELECT 1 FROM buildings b WHERE b.code = 'SERV-ESC');

INSERT IGNORE INTO buildings
  (id, category_id, code, name, slug, description, model_node_name, x, y, z, is_active, is_priority)
SELECT UUID(), bc.id, 'CEA', 'DPTO. CIENCIAS ECON.- ADMVAS.', 'depto-ciencias-economico-administrativas',
  NULL, 'Aulas J. Dep de Economico Administravita ', NULL, 0, NULL, 1, 0
FROM building_categories bc WHERE bc.code = 'administrativo'
  AND NOT EXISTS (SELECT 1 FROM buildings b WHERE b.code = 'CEA');

INSERT IGNORE INTO buildings
  (id, category_id, code, name, slug, description, model_node_name, x, y, z, is_active, is_priority)
SELECT UUID(), bc.id, 'MAE-ADM', 'M. ADMINISTRACIÓN', 'maestria-administracion',
  NULL, 'Maestria en Administracion', NULL, 0, NULL, 1, 0
FROM building_categories bc WHERE bc.code = 'administrativo'
  AND NOT EXISTS (SELECT 1 FROM buildings b WHERE b.code = 'MAE-ADM');

INSERT IGNORE INTO buildings
  (id, category_id, code, name, slug, description, model_node_name, x, y, z, is_active, is_priority)
SELECT UUID(), bc.id, 'SAL-MAE', 'TITULACIÓN DE M. EN ADMÓN.', 'titulacion-maestria-administracion',
  NULL, 'Maestria en Administracion.001', NULL, 0, NULL, 1, 0
FROM building_categories bc WHERE bc.code = 'administrativo'
  AND NOT EXISTS (SELECT 1 FROM buildings b WHERE b.code = 'SAL-MAE');

-- ── Aulas ────────────────────────────────────────────────────
INSERT IGNORE INTO buildings
  (id, category_id, code, name, slug, description, model_node_name, x, y, z, is_active, is_priority)
SELECT UUID(), bc.id, 'N', 'AULA Ñ', 'aula-n', NULL, 'Aulas Ñ', NULL, 0, NULL, 1, 0
FROM building_categories bc WHERE bc.code = 'aulas'
  AND NOT EXISTS (SELECT 1 FROM buildings b WHERE b.code = 'N');

INSERT IGNORE INTO buildings
  (id, category_id, code, name, slug, description, model_node_name, x, y, z, is_active, is_priority)
SELECT UUID(), bc.id, 'AUL-DOC', 'AULAS DE DOCTORADO', 'aulas-doctorado',
  NULL, 'Aulas y Cubiculos de Doctorado', NULL, 0, NULL, 1, 0
FROM building_categories bc WHERE bc.code = 'aulas'
  AND NOT EXISTS (SELECT 1 FROM buildings b WHERE b.code = 'AUL-DOC');

INSERT IGNORE INTO buildings
  (id, category_id, code, name, slug, description, model_node_name, x, y, z, is_active, is_priority)
SELECT UUID(), bc.id, 'AUL-AC', 'AULAS AC', 'aulas-ac', NULL, 'Aulas Ñ.001', NULL, 0, NULL, 1, 0
FROM building_categories bc WHERE bc.code = 'aulas'
  AND NOT EXISTS (SELECT 1 FROM buildings b WHERE b.code = 'AUL-AC');

INSERT IGNORE INTO buildings
  (id, category_id, code, name, slug, description, model_node_name, x, y, z, is_active, is_priority)
SELECT UUID(), bc.id, 'MC', 'EDIFICIO MULTICARRERA', 'edificio-multicarrera',
  NULL, 'Edificios 3D 16 en emplazamiento plano', NULL, 0, NULL, 1, 0
FROM building_categories bc WHERE bc.code = 'aulas'
  AND NOT EXISTS (SELECT 1 FROM buildings b WHERE b.code = 'MC');

INSERT IGNORE INTO buildings
  (id, category_id, code, name, slug, description, model_node_name, x, y, z, is_active, is_priority)
SELECT UUID(), bc.id, 'AUL-P', 'AULAS P', 'aulas-p', NULL, 'Aulas P ', NULL, 0, NULL, 1, 0
FROM building_categories bc WHERE bc.code = 'aulas'
  AND NOT EXISTS (SELECT 1 FROM buildings b WHERE b.code = 'AUL-P');

INSERT IGNORE INTO buildings
  (id, category_id, code, name, slug, description, model_node_name, x, y, z, is_active, is_priority)
SELECT UUID(), bc.id, 'A', 'EDIF. A', 'edif-a', NULL, 'Edificio A ', NULL, 0, NULL, 1, 0
FROM building_categories bc WHERE bc.code = 'aulas'
  AND NOT EXISTS (SELECT 1 FROM buildings b WHERE b.code = 'A');

INSERT IGNORE INTO buildings
  (id, category_id, code, name, slug, description, model_node_name, x, y, z, is_active, is_priority)
SELECT UUID(), bc.id, 'D', 'EDIF. D', 'edif-d', NULL, 'Aulas D ', NULL, 0, NULL, 1, 0
FROM building_categories bc WHERE bc.code = 'aulas'
  AND NOT EXISTS (SELECT 1 FROM buildings b WHERE b.code = 'D');

INSERT IGNORE INTO buildings
  (id, category_id, code, name, slug, description, model_node_name, x, y, z, is_active, is_priority)
SELECT UUID(), bc.id, 'O', 'AULA O', 'aula-o', NULL, 'Edificios 3D 18 en emplazamiento plano', NULL, 0, NULL, 1, 0
FROM building_categories bc WHERE bc.code = 'aulas'
  AND NOT EXISTS (SELECT 1 FROM buildings b WHERE b.code = 'O');

INSERT IGNORE INTO buildings
  (id, category_id, code, name, slug, description, model_node_name, x, y, z, is_active, is_priority)
SELECT UUID(), bc.id, 'CB', 'CIENCIAS BÁSICAS - BAÑOS', 'ciencias-basicas-banos',
  NULL, 'Departamento de Ciencias Basicas_Departamento de Ciencias Basicas', NULL, 0, NULL, 1, 0
FROM building_categories bc WHERE bc.code = 'aulas'
  AND NOT EXISTS (SELECT 1 FROM buildings b WHERE b.code = 'CB');

INSERT IGNORE INTO buildings
  (id, category_id, code, name, slug, description, model_node_name, x, y, z, is_active, is_priority)
SELECT UUID(), bc.id, 'AUL-K', 'Aulas K', 'aulas-k', NULL, 'Aulas K', NULL, 0, NULL, 1, 0
FROM building_categories bc WHERE bc.code = 'aulas'
  AND NOT EXISTS (SELECT 1 FROM buildings b WHERE b.code = 'AUL-K');

-- ── Laboratorio ──────────────────────────────────────────────
INSERT IGNORE INTO buildings
  (id, category_id, code, name, slug, description, model_node_name, x, y, z, is_active, is_priority)
SELECT UUID(), bc.id, 'LAB-SIM', 'LAB. DE SIMULACIÓN', 'lab-simulacion',
  NULL, 'Lab de Simulacion ', NULL, 0, NULL, 1, 0
FROM building_categories bc WHERE bc.code = 'laboratorio'
  AND NOT EXISTS (SELECT 1 FROM buildings b WHERE b.code = 'LAB-SIM');

INSERT IGNORE INTO buildings
  (id, category_id, code, name, slug, description, model_node_name, x, y, z, is_active, is_priority)
SELECT UUID(), bc.id, 'LAB-MEC', 'DPTO. LAB. ING. MECÁNICA', 'depto-lab-ing-mecanica',
  NULL, 'Laboratorio de Ing. Quimica Pesada, Depto de Ing de Mecanica ', NULL, 0, NULL, 1, 0
FROM building_categories bc WHERE bc.code = 'laboratorio'
  AND NOT EXISTS (SELECT 1 FROM buildings b WHERE b.code = 'LAB-MEC');

INSERT IGNORE INTO buildings
  (id, category_id, code, name, slug, description, model_node_name, x, y, z, is_active, is_priority)
SELECT UUID(), bc.id, 'LAB-QP', 'LAB. QUÍMICA PESADA', 'lab-quimica-pesada',
  NULL, 'Laboratorio de Ing. Quimica Pesada, Depto de Ing de Mecanica ', NULL, 0, NULL, 1, 0
FROM building_categories bc WHERE bc.code = 'laboratorio'
  AND NOT EXISTS (SELECT 1 FROM buildings b WHERE b.code = 'LAB-QP');

INSERT IGNORE INTO buildings
  (id, category_id, code, name, slug, description, model_node_name, x, y, z, is_active, is_priority)
SELECT UUID(), bc.id, 'LAB-MICR',
  'LAB. MICR.- TITULACIÓN - AULA DIBUJO - BAÑOS', 'lab-micr-titulacion-aula-dibujo-banos',
  NULL, 'Sala de titulacion- aula de dibujo- Lab de microscopia -aula de dibujo ',
  NULL, 0, NULL, 1, 0
FROM building_categories bc WHERE bc.code = 'laboratorio'
  AND NOT EXISTS (SELECT 1 FROM buildings b WHERE b.code = 'LAB-MICR');

-- ── Servicio ─────────────────────────────────────────────────
INSERT IGNORE INTO buildings
  (id, category_id, code, name, slug, description, model_node_name, x, y, z, is_active, is_priority)
SELECT UUID(), bc.id, 'CAL', 'CALDERA', 'caldera', NULL, 'Caldera ', NULL, 0, NULL, 1, 0
FROM building_categories bc WHERE bc.code = 'servicio'
  AND NOT EXISTS (SELECT 1 FROM buildings b WHERE b.code = 'CAL');

INSERT IGNORE INTO buildings
  (id, category_id, code, name, slug, description, model_node_name, x, y, z, is_active, is_priority)
SELECT UUID(), bc.id, 'LUD', 'LUDOTECA SECCIÓN 61', 'ludoteca-seccion-61',
  NULL, 'seccion 61', NULL, 0, NULL, 1, 0
FROM building_categories bc WHERE bc.code = 'servicio'
  AND NOT EXISTS (SELECT 1 FROM buildings b WHERE b.code = 'LUD');

INSERT IGNORE INTO buildings
  (id, category_id, code, name, slug, description, model_node_name, x, y, z, is_active, is_priority)
SELECT UUID(), bc.id, 'AUD-ING', 'AUDIOVISUAL DE ING.- BAÑOS', 'audiovisual-ing-banos',
  NULL, 'Audiovisual de Ing ', NULL, 0, NULL, 1, 0
FROM building_categories bc WHERE bc.code = 'servicio'
  AND NOT EXISTS (SELECT 1 FROM buildings b WHERE b.code = 'AUD-ING');

INSERT IGNORE INTO buildings
  (id, category_id, code, name, slug, description, model_node_name, x, y, z, is_active, is_priority)
SELECT UUID(), bc.id, 'MTO', 'Mantenimiento', 'mantenimiento', NULL, NULL, NULL, 0, NULL, 1, 0
FROM building_categories bc WHERE bc.code = 'servicio'
  AND NOT EXISTS (SELECT 1 FROM buildings b WHERE b.code = 'MTO');

INSERT IGNORE INTO buildings
  (id, category_id, code, name, slug, description, model_node_name, x, y, z, is_active, is_priority)
SELECT UUID(), bc.id, 'COPISE', 'COPISE', 'copise', NULL, NULL, NULL, 0, NULL, 1, 0
FROM building_categories bc WHERE bc.code = 'servicio'
  AND NOT EXISTS (SELECT 1 FROM buildings b WHERE b.code = 'COPISE');

INSERT IGNORE INTO buildings
  (id, category_id, code, name, slug, description, model_node_name, x, y, z, is_active, is_priority)
SELECT UUID(), bc.id, 'EXT', 'Servicios Extra Escolares', 'servicios-extra-escolares',
  NULL, 'Extra escolares ', NULL, 0, NULL, 1, 0
FROM building_categories bc WHERE bc.code = 'servicio'
  AND NOT EXISTS (SELECT 1 FROM buildings b WHERE b.code = 'EXT');

INSERT IGNORE INTO buildings
  (id, category_id, code, name, slug, description, model_node_name, x, y, z, is_active, is_priority)
SELECT UUID(), bc.id, 'EXTRA', 'EXTRAESCOLARES', 'extraescolares',
  NULL, 'Extra escolares ', NULL, 0, NULL, 1, 0
FROM building_categories bc WHERE bc.code = 'servicio'
  AND NOT EXISTS (SELECT 1 FROM buildings b WHERE b.code = 'EXTRA');

INSERT IGNORE INTO buildings
  (id, category_id, code, name, slug, description, model_node_name, x, y, z, is_active, is_priority)
SELECT UUID(), bc.id, 'COPIAS', 'COPIAS', 'copias',
  NULL, 'Sala de titulacion- aula de dibujo- Lab de microscopia -aula de dibujo ',
  NULL, 0, NULL, 1, 0
FROM building_categories bc WHERE bc.code = 'servicio'
  AND NOT EXISTS (SELECT 1 FROM buildings b WHERE b.code = 'COPIAS');

INSERT IGNORE INTO buildings
  (id, category_id, code, name, slug, description, model_node_name, x, y, z, is_active, is_priority)
SELECT UUID(), bc.id, 'PTR', 'PLANTA DE TRATAM. DE AGUAS RESID.', 'planta-tratamiento-aguas-residuales',
  NULL, 'Edificios 3D 10 en emplazamiento plano', NULL, 0, NULL, 1, 0
FROM building_categories bc WHERE bc.code = 'servicio'
  AND NOT EXISTS (SELECT 1 FROM buildings b WHERE b.code = 'PTR');

INSERT IGNORE INTO buildings
  (id, category_id, code, name, slug, description, model_node_name, x, y, z, is_active, is_priority)
SELECT UUID(), bc.id, 'VIG', 'CASETA DE VIGILANCIA', 'caseta-vigilancia',
  NULL, 'seccion 61', NULL, 0, NULL, 1, 0
FROM building_categories bc WHERE bc.code = 'servicio'
  AND NOT EXISTS (SELECT 1 FROM buildings b WHERE b.code = 'VIG');

