-- ============================================================
-- FASE 4: Auditoría y corrección de model_node_name
-- Fecha: 2026-06-18
--
-- Problema: algunos edificios tienen model_node_name que no
-- coincide con ningún nodo del GLB (NULL, erróneo o en formato
-- que el resolver no encuentra).
--
-- Los cambios de código en glb-utils.ts y CampusViewer.tsx ya
-- manejan: trailing spaces, doble espacio, saltos de línea.
-- Este SQL solo corrige los casos que el código NO puede resolver:
--   • model_node_name = NULL cuando el GLB sí tiene un mesh
--   • alias que quedaron desactualizados respecto al GLB real
-- ============================================================

-- ── DIAGNÓSTICO INICIAL ───────────────────────────────────────────────────────
SELECT '=== EDIFICIOS CON model_node_name NULL ===' AS info;
SELECT code, name, model_node_name
FROM buildings
WHERE model_node_name IS NULL OR model_node_name = ''
ORDER BY code;

SELECT '=== TODOS LOS model_node_name ACTUALES ===' AS info;
SELECT code, name, model_node_name
FROM buildings
WHERE is_active = 1
ORDER BY code;


-- ── GRUPO 1: Edificios con NULL que SÍ tienen mesh en el GLB ─────────────────
-- Verificar primero que estos nombres existan en el GLB antes de correr.

-- Edificio S (Aulas S) → mesh 'Aulas S.' en el GLB
UPDATE buildings
SET model_node_name = 'Aulas S.'
WHERE code = 'S' AND (model_node_name IS NULL OR model_node_name = '');

-- ── GRUPO 2: Aliases rotos (DB_TO_GLB_NAME key ya no coincide) ───────────────

-- Edificio H: migración anterior lo puede haber dejado con nombre del GLB directo
-- en lugar del alias 'Edificio_H'. Verificar estado actual:
SELECT code, model_node_name FROM buildings WHERE code = 'H';
-- Si es 'Edificio H_Edifucui H' (nombre GLB directo con typo), es correcto.
-- Si es 'Edificio_H' (alias), también es correcto via DB_TO_GLB_NAME.
-- NO cambiar — ambas formas funcionan.

-- Edificio C: migración 20260616 lo puso como 'Eduficio C' (typo del GLB).
-- El alias 'Edificio_C' → 'Eduficio C' también funciona via glb-utils.
-- El valor directo 'Eduficio C' funciona por fallback en resolveGlbName.
-- NO cambiar.


-- ── GRUPO 3: Edificios que comparten mesh → solo UNO debe tener is_priority ──
-- Los siguientes pares/grupos apuntan al mismo nodo del GLB.
-- En BuildingLabels (CampusViewer.tsx) solo se muestra el is_priority=1.
-- Verificar que exactamente uno por mesh tenga is_priority = 1.

SELECT '=== EDIFICIOS QUE COMPARTEN MESH (verificar is_priority) ===' AS info;

-- Mesh: "Sala de titulacion- aula de dibujo- Lab de microscopia -aula de dibujo "
SELECT code, name, model_node_name, is_priority
FROM buildings
WHERE model_node_name LIKE 'Sala de titulacion%'
   OR model_node_name LIKE 'Sala_Titulacion%'
   OR code IN ('SAL', 'LAB-MICR', 'AUL-DIB')
ORDER BY is_priority DESC;

-- Mesh: "Laboratorio de Ing. Quimica Pesada, Depto de Ing de Mecanica "
SELECT code, name, model_node_name, is_priority
FROM buildings
WHERE model_node_name LIKE 'Laboratorio de Ing. Quimica Pesada%'
   OR code IN ('LAB-MEC', 'LAB-QP')
ORDER BY is_priority DESC;

-- Mesh: "Extra escolares "
SELECT code, name, model_node_name, is_priority
FROM buildings
WHERE model_node_name LIKE 'Extra escolares%'
   OR code IN ('EXTRA', 'EXT', 'SERV-ESC')
ORDER BY is_priority DESC;

-- Mesh: "Direccion, Depto de servicios escolares, Div de estudios profecionales "
SELECT code, name, model_node_name, is_priority
FROM buildings
WHERE model_node_name LIKE 'Direccion, Depto de servicios%'
   OR code IN ('DIR', 'SERV-ESC')
ORDER BY is_priority DESC;

-- Mesh compartido DQB/DQI-DII (si aplica):
SELECT code, name, model_node_name, is_priority
FROM buildings
WHERE code IN ('DQB', 'DQI-DII')
ORDER BY is_priority DESC;


-- ── GRUPO 4: Corregir is_priority para meshes compartidos ────────────────────
-- Asegura que solo 1 edificio por mesh tenga etiqueta visible.
-- Ajustar según el edificio que DEBE mostrar la etiqueta principal.

-- Para Sala/Lab-Micr: la etiqueta debe ser "SAL" (Sala de Titulación)
UPDATE buildings SET is_priority = 0
WHERE code IN ('LAB-MICR', 'AUL-DIB')
  AND model_node_name LIKE 'Sala de titulacion%';

UPDATE buildings SET is_priority = 1
WHERE code = 'SAL'
  AND model_node_name LIKE 'Sala de titulacion%';

-- Para Lab-Mec / Lab-QP: etiqueta principal = LAB-MEC (Mecánica)
UPDATE buildings SET is_priority = 0
WHERE code = 'LAB-QP'
  AND model_node_name LIKE 'Laboratorio de Ing. Quimica Pesada%';

UPDATE buildings SET is_priority = 1
WHERE code = 'LAB-MEC'
  AND model_node_name LIKE 'Laboratorio de Ing. Quimica Pesada%';

-- Para Extra-escolares: etiqueta principal = EXTRA
UPDATE buildings SET is_priority = 0
WHERE code IN ('EXT', 'SERV-ESC')
  AND model_node_name LIKE 'Extra escolares%';

UPDATE buildings SET is_priority = 1
WHERE code = 'EXTRA'
  AND model_node_name LIKE 'Extra escolares%';

-- Para DIR / SERV-ESC: etiqueta principal = DIR
UPDATE buildings SET is_priority = 0
WHERE code = 'SERV-ESC'
  AND model_node_name LIKE 'Direccion, Depto de servicios%';

UPDATE buildings SET is_priority = 1
WHERE code = 'DIR'
  AND model_node_name LIKE 'Direccion, Depto de servicios%';

-- Para DQB / DQI-DII si comparten mesh:
-- (verificar result del SELECT anterior, ajustar si necesario)


-- ── VERIFICACIÓN FINAL ────────────────────────────────────────────────────────
SELECT '=== ESTADO FINAL model_node_name ===' AS info;
SELECT code, name, model_node_name,
  CASE
    WHEN model_node_name IS NULL OR model_node_name = '' THEN '❌ NULL — sin etiqueta'
    ELSE '✅ con nombre'
  END AS estado
FROM buildings
WHERE is_active = 1
ORDER BY
  CASE WHEN model_node_name IS NULL OR model_node_name = '' THEN 0 ELSE 1 END,
  code;

SELECT '=== MESHES COMPARTIDOS — verificar is_priority ===' AS info;
SELECT model_node_name, GROUP_CONCAT(code ORDER BY is_priority DESC) AS edificios,
  SUM(is_priority) AS total_priority
FROM buildings
WHERE is_active = 1 AND model_node_name IS NOT NULL AND model_node_name != ''
GROUP BY model_node_name
HAVING COUNT(*) > 1
ORDER BY model_node_name;
-- Columna total_priority debe ser 1 en todos los grupos (exactamente un is_priority=1 por mesh)
