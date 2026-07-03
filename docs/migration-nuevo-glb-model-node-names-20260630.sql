-- ============================================================
-- MIGRACIÓN: Actualizar model_node_name al nuevo campus.glb
-- Fecha: 2026-06-30
--
-- Contexto: Se reemplazó el archivo campus.glb (221 KB → 26 MB).
-- El nuevo GLB usa nombres de nodos limpios en snake_case.
-- Esta migración:
--   1. Corrige 4 bugs de datos (code vs model_node_name incorrectos)
--   2. Actualiza todos los model_node_name al formato del nuevo GLB
--   3. Inserta edificios nuevos presentes en el GLB pero ausentes en BD
--
-- NOTA: Ejecutar DESPUÉS de haber reemplazado public/models/campus.glb
-- ============================================================

SET NAMES utf8mb4;

-- ── DIAGNÓSTICO INICIAL ───────────────────────────────────────────────────────
SELECT '=== model_node_name ANTES DE MIGRACIÓN ===' AS info;
SELECT code, name, model_node_name, x, z FROM buildings WHERE is_active = 1 ORDER BY code;


-- ============================================================
-- PARTE 0: Casos específicos del estado actual de la BD en vivo
--          (formatos que no estaban en el seed pero sí en BD real)
-- ============================================================

-- Centro / Biblioteca_ → Centro_informacion (Biblioteca no existe en nuevo GLB)
UPDATE buildings SET model_node_name = 'Centro_informacion'
WHERE model_node_name = 'Biblioteca_';

-- AUL-S tiene model_node_name = 'Aulas_S' → Edificio_S
UPDATE buildings SET model_node_name = 'Edificio_S'
WHERE model_node_name = 'Aulas_S';

-- GIM trailing underscore → Gimnacio
UPDATE buildings SET model_node_name = 'Gimnacio'
WHERE model_node_name = 'Gimnacio_';

-- Edificio_E, Edificio_G, Edificio_Q ya están bien en BD en vivo (no tocar)

-- X / X001 → deactivate (EdificioX no existe en nuevo GLB)
UPDATE buildings SET is_active = 0
WHERE code IN ('X', 'X001') AND model_node_name LIKE 'Edificio_X%';


-- ============================================================
-- PARTE 1: Corregir bugs de datos (code vs model_node_name no coinciden)
-- ============================================================

-- Bug 1: Edificio E apunta a "Edificio F" (debería ser E)
UPDATE buildings
SET model_node_name = 'Edificio_E'
WHERE code = 'E';

-- Bug 2: Edificio G apunta a "Edificio H_Edifucui H" (debería ser G)
UPDATE buildings
SET model_node_name = 'Edificio_G'
WHERE code = 'G';

-- Bug 3: code Q apunta a "Aulas S." (debería ser Edificio Q)
UPDATE buildings
SET model_node_name = 'Edificio_Q'
WHERE code = 'Q';

-- Bug 4: GIM (Gimnasio) apunta a "Audiovisual de Postgrado.001" (debería ser Gimnacio)
UPDATE buildings
SET model_node_name = 'Gimnacio'
WHERE code = 'GIM';


-- ============================================================
-- PARTE 2: Actualizar model_node_name al formato limpio del nuevo GLB
--          (para todos los que usan el formato antiguo con espacios/typos)
-- ============================================================

-- Dirección / Servicios Escolares
UPDATE buildings
SET model_node_name = 'Depto_servico_escolares_Div_estudios_profecionales_Direccion'
WHERE model_node_name LIKE 'Direccion, Depto de servicios escolares%';

-- Sala de Titulación / Lab Microscopía / Aula Dibujo
UPDATE buildings
SET model_node_name = 'Lab_Microscopia_Sala_Titulacion_Aula_Dibujo'
WHERE model_node_name LIKE 'Sala de titulacion-%'
   OR model_node_name LIKE 'Sala_Titulacion%';

-- Dpto. Química y Bioquímica (ambas formas con \n real)
UPDATE buildings
SET model_node_name = 'Depto_Quimica_Bioquimica_Depto_Ing_Industrial'
WHERE model_node_name LIKE 'DEPARTAMENTO%INGENIERÍA%QUÍMICA%'
   OR model_node_name LIKE 'Depto_Quimica_Bioquimica%';

-- Cubículos de Doctorado
UPDATE buildings
SET model_node_name = 'Aulas_Cubiculos_de_Doctorado'
WHERE model_node_name LIKE 'Cubiculos de Doctorado%'
   OR model_node_name LIKE 'Aulas y Cubiculos de Doctorado%'
   OR model_node_name = 'Cubiculos_de_Doctorado001'
   OR model_node_name = 'Cubiculos_Doctorado'
   OR model_node_name LIKE 'Aulas_Doctorado%';

-- Dpto. Ingeniería Electrónica
UPDATE buildings
SET model_node_name = 'Edif y Depto de Ing. Electronica'
WHERE model_node_name LIKE 'DEPARTAMENTO DE%INGENIERÍA%ELECTRÓNICA%'
   OR model_node_name = 'Depto_Electronica';

-- Edificio A
UPDATE buildings
SET model_node_name = 'Edificio_A'
WHERE model_node_name LIKE 'Edificio A%'
   OR model_node_name = 'Edificio_A';

-- Edificio B
UPDATE buildings
SET model_node_name = 'Edificio_B'
WHERE model_node_name = 'Edificio B'
   OR model_node_name = 'Edificio_B';

-- Edificio C
UPDATE buildings
SET model_node_name = 'Edificio_C'
WHERE model_node_name IN ('Eduficio C', 'Edificio C', 'Eduficio_C', 'Edificio_C');

-- Edificio F
UPDATE buildings
SET model_node_name = 'Edificio_F'
WHERE model_node_name = 'Edificio F';

-- Edificio H → ahora incluye Servicio Médico
UPDATE buildings
SET model_node_name = 'Edificio_H_Servicio_Medico'
WHERE model_node_name IN ('Edificio H', 'Edificio H_Edifucui H', 'Edificio_H');

-- Edificio I
UPDATE buildings
SET model_node_name = 'Edificio_I'
WHERE model_node_name = 'Edificio I';

-- Edificio K
UPDATE buildings
SET model_node_name = 'Edificio_K'
WHERE model_node_name = 'Edificio K';

-- Edificio L
UPDATE buildings
SET model_node_name = 'Edificio_L'
WHERE model_node_name LIKE 'Edificio  L%'
   OR model_node_name = 'Edificio L'
   OR model_node_name = 'Edificio__L_';

-- Edificio Nuevo
UPDATE buildings
SET model_node_name = 'Edificio_Nuevo'
WHERE model_node_name = 'Edificio Nuevo';

-- CONACYT
UPDATE buildings
SET model_node_name = 'Edificio_Conacyt'
WHERE model_node_name = 'Edificio CONACYT';

-- DEPI / D.P.I
UPDATE buildings
SET model_node_name = 'D.P.I'
WHERE model_node_name = 'D.E.P.I.'
   OR model_node_name = 'Depi';

-- Aulas Ñ
UPDATE buildings
SET model_node_name = 'Aula_Ñ'
WHERE model_node_name IN ('Aulas Ñ', 'Aulas Ñ.001', 'Aulas_ENIE', 'Aulas_N', 'aula-n', 'Aulas_Ñ');

-- Aulas P
UPDATE buildings
SET model_node_name = 'Aula_P'
WHERE model_node_name LIKE 'Aulas P%'
   OR model_node_name = 'Aulas_P';

-- Cubículos de Maestros
UPDATE buildings
SET model_node_name = 'Cubiculos_Maestros'
WHERE model_node_name LIKE 'Cubiculo%Maestros%'
   OR model_node_name = 'cubiculo-maestros';

-- Lab. Ingeniería Civil
UPDATE buildings
SET model_node_name = 'Lab_Ing_Civil'
WHERE model_node_name LIKE 'Laboratorio de Ing. Civil%'
   OR model_node_name IN ('Laboratorio_Civil', 'Laboratorio_de_Ing_Civil001');

-- Lab. Ingeniería Eléctrica
UPDATE buildings
SET model_node_name = 'Lab_Ing_Electrica'
WHERE model_node_name = 'Edificios 3D 12 en emplazamiento plano'
   OR model_node_name IN ('Laboratorio_Electrica', 'Laboratorio_Ing_Electrica', 'Edificios_3D_12_en_emplazamiento_plano');

-- Lab. Físico-Química
UPDATE buildings
SET model_node_name = 'Laboratorio_Fisico_Quimica'
WHERE model_node_name LIKE 'Laboratorio de Fisico-quimica%'
   OR model_node_name LIKE 'Laboratorio de ing.%Quimica%'
   OR model_node_name = 'Edificios 3D 3 en emplazamiento plano'
   OR model_node_name IN ('Fisico_Quimica', 'Laboratorio_Quimica', 'Edificios_3D_3_en_emplazamiento_plano');

-- Lab. Microscopía / Sala Titulación
UPDATE buildings
SET model_node_name = 'Lab_Microscopia_Sala_Titulacion_Aula_Dibujo'
WHERE model_node_name = 'Edificios 3D 6 en emplazamiento plano'
   OR model_node_name IN ('Laboratorio_Microscopia', 'Edificios_3D_6_en_emplazamiento_plano');

-- Lab. Industrial
UPDATE buildings
SET model_node_name = 'Laboratorio_Ing_Industrial'
WHERE model_node_name LIKE 'Laboratorio de Ing. I%ustrial%'
   OR model_node_name = 'Laboratorio_Industrial';

-- Lab. Mecánica / Química Pesada
UPDATE buildings
SET model_node_name = 'Lab_Depto_Ing_Mecanica_Lab_Quimaca_Pesada'
WHERE model_node_name LIKE 'Laboratorio de Ing. Quimica Pesada%'
   OR model_node_name IN ('Laboratorio_Mecanica', 'Laboratorio_Quimica_Pesada');

-- Lab. Simulación
UPDATE buildings
SET model_node_name = 'Lab_Simulacion'
WHERE model_node_name LIKE 'Lab de Simulacion%';

-- Dpto. Ciencias Básicas
UPDATE buildings
SET model_node_name = 'Depto_Ciencias_Basicas'
WHERE model_node_name LIKE 'Departamento de Ciencias Basicas%'
   OR model_node_name IN ('Departamento_Ciencias_Basicas', 'Departamento_de_Ciencias_Basicas_Departamento_de_Ciencias_Basicas');

-- Dpto. Desarrollo Académico
UPDATE buildings
SET model_node_name = 'Depto_desarrollo_academico'
WHERE model_node_name LIKE 'DEPTO, de desarrolo academico%'
   OR model_node_name = 'Departamento_Desarrollo_Academico';

-- Dpto. Ciencias Económico-Administrativas
UPDATE buildings
SET model_node_name = 'Depto_ciencias_Economico_Admin'
WHERE model_node_name LIKE 'Aulas J. Dep de Economico%'
   OR model_node_name = 'Departamento_Ciencias_Economico_Administrativas';

-- Dpto. Ciencias de la Tierra
UPDATE buildings
SET model_node_name = 'Depto_Ciencias_la_tierra'
WHERE model_node_name LIKE 'Depto de ceiencias de la Tierra%'
   OR model_node_name = 'Depto_Ciencias_Tierra';

-- Dpto. Ingeniería Eléctrica
UPDATE buildings
SET model_node_name = 'Depto_Ing_Electrica'
WHERE model_node_name = 'Depto.Ing Electrica';

-- Audiovisual de Ingeniería
UPDATE buildings
SET model_node_name = 'Audiovisual_de_Ingeneria'
WHERE model_node_name LIKE 'Audiovisual de Ing%'
   OR model_node_name = 'Audiovisual de Postgrado.001'
   OR model_node_name IN ('Audiovisual_Ingenieria', 'Audiovisual_de_Postgrado001', 'Audiovisual_Posgrado');

-- Audiovisual de Licenciatura
UPDATE buildings
SET model_node_name = 'Audiovisual_de_Lic'
WHERE model_node_name LIKE 'Audiovisual de%Licenciatura%'
   OR model_node_name = 'Audiovisual_Licenciatura';

-- Maestría en Administración
UPDATE buildings
SET model_node_name = 'Maestria_Administracion'
WHERE model_node_name = 'Maestria en Administracion'
   OR model_node_name IN ('Maestria_en_Administracion', 'maestria-administracion');

-- Sala Titulación Maestría (antes "Maestria en Administracion.001")
UPDATE buildings
SET model_node_name = 'Sala_Titulacion_Maestria-Admon'
WHERE model_node_name = 'Maestria en Administracion.001';

-- Maestría en Construcción
UPDATE buildings
SET model_node_name = 'Maestria_cosntruccion'
WHERE model_node_name = 'Maestria en construccion'
   OR model_node_name = 'Maestria_En_Construccion';

-- Maestría en Docencia / Ed. a Distancia
UPDATE buildings
SET model_node_name = 'Matria_Docencia_Sala_Educacion_distancia'
WHERE model_node_name LIKE 'Maestri en docencia%'
   OR model_node_name = 'Maestria_Doctorado';

-- Centro de Cómputo
UPDATE buildings
SET model_node_name = 'Centro_computo_Sistemas_Computacionales'
WHERE model_node_name = 'Centro de Computo'
   OR model_node_name = 'Centro_Computo';

-- Cafetería (ya está bien, normalizar trailing spaces por si acaso)
UPDATE buildings
SET model_node_name = 'Cafeteria'
WHERE model_node_name LIKE 'Cafeteria%';

-- Caldera
UPDATE buildings
SET model_node_name = 'Caldera'
WHERE model_node_name LIKE 'Caldera%';

-- Extra Escolares
UPDATE buildings
SET model_node_name = 'Extra_escolares'
WHERE model_node_name LIKE 'Extra escolares%'
   OR model_node_name = 'Servicios_Extra_Escolares';

-- Gimnasio (ya corregido en Parte 1, normalizar aliases)
UPDATE buildings
SET model_node_name = 'Gimnacio'
WHERE model_node_name IN ('Gimnasio_Gimnasio', 'Gimnasio', 'Gimnacio_')
  AND code != 'GIM';  -- GIM ya corregido arriba

-- Sección 61 / Ludoteca / Vigilancia
UPDATE buildings
SET model_node_name = 'Seccion_61'
WHERE model_node_name = 'seccion 61'
   OR model_node_name IN ('Caseta_Vigilancia', 'Ludoteca');

-- Asesorías (ya está bien, solo normalizar)
UPDATE buildings
SET model_node_name = 'Asesorias'
WHERE model_node_name = 'Asesorias';


-- ============================================================
-- PARTE 3: Insertar edificios del nuevo GLB sin entrada en BD
-- (Solo los que tienen sentido como POI para el mapa)
-- ============================================================

-- Edificio S (distinto del code Q que ya fue corregido)
-- El nuevo GLB tiene Edificio_S como nodo separado.
-- Verificar si ya existe antes de insertar:
INSERT IGNORE INTO buildings (id, category_id, code, name, slug, description, model_node_name, x, y, z, is_active, is_priority)
SELECT UUID(), bc.id, 'S', 'EDIF. S', 'edificio-s',
  NULL, 'Edificio_S', NULL, 0, NULL, 1, 0
FROM building_categories bc WHERE bc.code = 'aulas'
  AND NOT EXISTS (SELECT 1 FROM buildings b WHERE b.code = 'S');

-- Centro de Información (distinto de Centro de Cómputo)
INSERT IGNORE INTO buildings (id, category_id, code, name, slug, description, model_node_name, x, y, z, is_active, is_priority)
SELECT UUID(), bc.id, 'CI', 'CENTRO DE INFORMACIÓN', 'centro-informacion',
  'Centro de información del campus.', 'Centro_informacion', NULL, 0, NULL, 1, 0
FROM building_categories bc WHERE bc.code = 'biblioteca'
  AND NOT EXISTS (SELECT 1 FROM buildings b WHERE b.code = 'CI');

-- Dpto. Ingeniería Eléctrica (nodo independiente en nuevo GLB)
-- Verificar si ya existe bajo otro code:
INSERT IGNORE INTO buildings (id, category_id, code, name, slug, description, model_node_name, x, y, z, is_active, is_priority)
SELECT UUID(), bc.id, 'DIE', 'DPTO. ING. ELÉCTRICA', 'depto-ing-electrica',
  NULL, 'Depto_Ing_Electrica', NULL, 0, NULL, 1, 0
FROM building_categories bc WHERE bc.code = 'administrativo'
  AND NOT EXISTS (SELECT 1 FROM buildings b WHERE b.code = 'DIE');

-- Bodega 1 y 2 (nuevo en GLB, probablemente no es POI público — desactivadas)
INSERT IGNORE INTO buildings (id, category_id, code, name, slug, description, model_node_name, x, y, z, is_active, is_priority)
SELECT UUID(), bc.id, 'BOD1', 'BODEGA 1', 'bodega-1',
  NULL, 'Bodega_1', NULL, 0, NULL, 0, 0
FROM building_categories bc WHERE bc.code = 'administrativo'
  AND NOT EXISTS (SELECT 1 FROM buildings b WHERE b.code = 'BOD1');

INSERT IGNORE INTO buildings (id, category_id, code, name, slug, description, model_node_name, x, y, z, is_active, is_priority)
SELECT UUID(), bc.id, 'BOD2', 'BODEGA 2', 'bodega-2',
  NULL, 'Bodega_2', NULL, 0, NULL, 0, 0
FROM building_categories bc WHERE bc.code = 'administrativo'
  AND NOT EXISTS (SELECT 1 FROM buildings b WHERE b.code = 'BOD2');


-- ============================================================
-- PARTE 4: Marcar como inactivos edificios sin equivalente en nuevo GLB
--          (siguen en BD pero no aparecen en el mapa)
-- ============================================================

-- Edificio J (no existe en nuevo GLB)
UPDATE buildings SET is_active = 0
WHERE code = 'J' AND model_node_name = 'Edificio J';

-- Posgrado (no existe en nuevo GLB)
UPDATE buildings SET is_active = 0
WHERE code = 'POS';

-- Geolocalización (nodo auxiliar, no edificio real)
UPDATE buildings SET is_active = 0
WHERE code = 'GEO';

-- Edificios 3D genéricos (nunca fueron reales)
UPDATE buildings SET is_active = 0
WHERE code IN ('1007', '1008', '1009', 'X', 'MC', 'O', 'PTR', 'MTO');


-- ============================================================
-- VERIFICACIÓN FINAL
-- ============================================================

SELECT '=== model_node_name DESPUÉS DE MIGRACIÓN ===' AS info;
SELECT code, name, model_node_name, x, z, is_active
FROM buildings
ORDER BY is_active DESC, code;

SELECT '=== EDIFICIOS CON model_node_name NULL O VACÍO (activos) ===' AS info;
SELECT code, name, model_node_name
FROM buildings
WHERE is_active = 1 AND (model_node_name IS NULL OR model_node_name = '')
ORDER BY code;

SELECT '=== EDIFICIOS SIN COORDENADAS (activos) ===' AS info;
SELECT code, name, model_node_name, x, z
FROM buildings
WHERE is_active = 1 AND (x IS NULL OR z IS NULL)
ORDER BY code;
