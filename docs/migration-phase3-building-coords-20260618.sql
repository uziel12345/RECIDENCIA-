-- ============================================================
-- FASE 3: Establecer coordenadas x/z en edificios sin posición
-- Fecha: 2026-06-18
--
-- Problema: muchos edificios tienen x=NULL / z=NULL porque el script
-- de posicionamiento del GLB no los procesó. Sin coordenadas:
--   • El beacon naranja no aparece al seleccionar el edificio
--   • La detección GPS no funciona para esos edificios
--
-- Solución: tomar las coordenadas del nodo de entrada que ya existe
-- en navigation_nodes para cada edificio. Es una aproximación válida
-- porque el nodo de entrada se colocó justo en la puerta del edificio.
--
-- NOTA: Solo actualiza filas donde x IS NULL OR z IS NULL.
--       No sobreescribe coordenadas ya existentes.
-- ============================================================

-- ── DIAGNÓSTICO INICIAL ───────────────────────────────────────────────────────
SELECT '=== EDIFICIOS CON x/z NULL ===' AS info;
SELECT code, name, x, z, model_node_name
FROM buildings
WHERE (x IS NULL OR z IS NULL) AND is_active = 1
ORDER BY code;


-- ── GRUPO A: Edificios que YA tienen nodo de entrada en el grafo ──────────────
-- Se actualiza x/z tomándolo directamente del nodo de entrada correspondiente.
-- Solo afecta filas donde x IS NULL OR z IS NULL.

-- ┌─ Aulas y edificios alfabéticos ────────────────────────────────────────────┐

-- Edificio E  →  n-acceso-e  (10, 86)
UPDATE buildings b
  INNER JOIN navigation_nodes n ON n.code = 'n-acceso-e'
SET b.x = n.x, b.z = n.z
WHERE b.code = 'E' AND (b.x IS NULL OR b.z IS NULL);

-- Edificio F  →  n-acceso-f  (8, 118)
UPDATE buildings b
  INNER JOIN navigation_nodes n ON n.code = 'n-acceso-f'
SET b.x = n.x, b.z = n.z
WHERE b.code = 'F' AND (b.x IS NULL OR b.z IS NULL);

-- Edificio G  →  n-acceso-g  (8, 148)
UPDATE buildings b
  INNER JOIN navigation_nodes n ON n.code = 'n-acceso-g'
SET b.x = n.x, b.z = n.z
WHERE b.code = 'G' AND (b.x IS NULL OR b.z IS NULL);

-- Edificio H  →  n-acceso-h  (-38, 108)
UPDATE buildings b
  INNER JOIN navigation_nodes n ON n.code = 'n-acceso-h'
SET b.x = n.x, b.z = n.z
WHERE b.code = 'H' AND (b.x IS NULL OR b.z IS NULL);

-- Edificio I  →  n-acceso-i  (-54, 162)
UPDATE buildings b
  INNER JOIN navigation_nodes n ON n.code = 'n-acceso-i'
SET b.x = n.x, b.z = n.z
WHERE b.code = 'I' AND (b.x IS NULL OR b.z IS NULL);

-- Edificio J  →  n-acceso-j  (-35, 162)
UPDATE buildings b
  INNER JOIN navigation_nodes n ON n.code = 'n-acceso-j'
SET b.x = n.x, b.z = n.z
WHERE b.code = 'J' AND (b.x IS NULL OR b.z IS NULL);

-- Edificio K  →  n-acceso-k  (46, 148)
UPDATE buildings b
  INNER JOIN navigation_nodes n ON n.code = 'n-acceso-k'
SET b.x = n.x, b.z = n.z
WHERE b.code = 'K' AND (b.x IS NULL OR b.z IS NULL);

-- Edificio Q  →  n-acceso-q  (58, 74)
UPDATE buildings b
  INNER JOIN navigation_nodes n ON n.code = 'n-acceso-q'
SET b.x = n.x, b.z = n.z
WHERE b.code = 'Q' AND (b.x IS NULL OR b.z IS NULL);

-- Edificio S / Aulas S  →  n-acceso-aulas-s  (62, 160)
UPDATE buildings b
  INNER JOIN navigation_nodes n ON n.code = 'n-acceso-aulas-s'
SET b.x = n.x, b.z = n.z
WHERE b.code = 'S' AND (b.x IS NULL OR b.z IS NULL);

-- └───────────────────────────────────────────────────────────────────────────┘

-- ┌─ Servicios ────────────────────────────────────────────────────────────────┐

-- Gimnasio  →  n-acceso-gimnasio  (56, 18)
UPDATE buildings b
  INNER JOIN navigation_nodes n ON n.code = 'n-acceso-gimnasio'
SET b.x = n.x, b.z = n.z
WHERE b.code = 'GIM' AND (b.x IS NULL OR b.z IS NULL);

-- Cafetería  →  n-acceso-cafeteria  (22, 58)
UPDATE buildings b
  INNER JOIN navigation_nodes n ON n.code = 'n-acceso-cafeteria'
SET b.x = n.x, b.z = n.z
WHERE b.code = 'CAF' AND (b.x IS NULL OR b.z IS NULL);

-- Audiovisual de Licenciatura  →  n-acceso-audiovisual  (-40, 5)
UPDATE buildings b
  INNER JOIN navigation_nodes n ON n.code = 'n-acceso-audiovisual'
SET b.x = n.x, b.z = n.z
WHERE b.code = 'AUD-LIC' AND (b.x IS NULL OR b.z IS NULL);

-- └───────────────────────────────────────────────────────────────────────────┘

-- ┌─ Laboratorios ─────────────────────────────────────────────────────────────┐

-- Lab. Ingeniería Industrial  →  n-acceso-lab-industrial  (72, 112)
UPDATE buildings b
  INNER JOIN navigation_nodes n ON n.code = 'n-acceso-lab-industrial'
SET b.x = n.x, b.z = n.z
WHERE b.code = 'LAB-IND' AND (b.x IS NULL OR b.z IS NULL);

-- └───────────────────────────────────────────────────────────────────────────┘

-- ┌─ Otros con nodo ───────────────────────────────────────────────────────────┐

-- Edificio Nuevo  →  n-acceso-edificio-nuevo  (-58, 150)
UPDATE buildings b
  INNER JOIN navigation_nodes n ON n.code = 'n-acceso-edificio-nuevo'
SET b.x = n.x, b.z = n.z
WHERE b.code = 'EDIF-NUEVO' AND (b.x IS NULL OR b.z IS NULL);

-- └───────────────────────────────────────────────────────────────────────────┘


-- ── VERIFICACIÓN GRUPO A ─────────────────────────────────────────────────────
SELECT '=== COORDENADAS ASIGNADAS ===' AS info;
SELECT code, name, x, z
FROM buildings
WHERE code IN ('E','F','G','H','I','J','K','Q','S',
               'GIM','CAF','AUD-LIC','LAB-IND','EDIF-NUEVO')
ORDER BY code;


-- ── GRUPO B: Edificios SIN nodo en el grafo (requieren acción manual) ─────────
-- Estos edificios NO tienen un nodo de entrada en navigation_nodes todavía.
-- El administrador deberá:
--   1. Abrir Admin → Navegación → modo edición
--   2. Crear un nodo tipo "entrance" justo en la puerta de cada edificio
--   3. Conectar ese nodo al camino más cercano con un edge
--   4. Ir a Admin → Edificios → Editar → asignar ese nodo como entrada del edificio

SELECT '=== EDIFICIOS QUE AÚN NECESITAN NODO MANUAL ===' AS info;
SELECT code, name, x, z,
  CASE
    WHEN x IS NULL OR z IS NULL THEN 'SIN coordenadas — crear nodo primero'
    ELSE 'Tiene coordenadas — solo falta el nodo de entrada'
  END AS accion_requerida
FROM buildings
WHERE code IN (
  'MAE-ADM',  -- Maestría en Administración
  'MAE-CON',  -- Maestría en Construcción
  'CB',       -- Depto. Ciencias Básicas
  'DA',       -- Depto. Desarrollo Académico
  'CEA',      -- Depto. Ciencias Económico-Administrativas
  'CUB-MAE',  -- Cubículos de Maestros
  'MTO',      -- Mantenimiento y Servicios Generales
  'LAB-MEC',  -- Lab. Ingeniería Mecánica
  'LAB-QP',   -- Lab. Química Pesada
  'AUD-ING',  -- Audiovisual de Ingeniería
  'AUL-K',    -- Aulas K
  'DEPI',     -- D.E.P.I.
  'CON',      -- CONACYT
  'CTIER',    -- Depto. Ciencias de la Tierra
  'D',        -- Edificio D
  'COPISE'    -- COPISE
) AND is_active = 1
ORDER BY code;


-- ── DIAGNÓSTICO FINAL: ¿Quedó algún NULL inesperado? ─────────────────────────
SELECT '=== TODAVÍA NULL (fuera del Grupo B) ===' AS info;
SELECT code, name, x, z
FROM buildings
WHERE (x IS NULL OR z IS NULL)
  AND is_active = 1
  AND code NOT IN (
    'MAE-ADM','MAE-CON','CB','DA','CEA','CUB-MAE','MTO',
    'LAB-MEC','LAB-QP','AUD-ING','AUL-K','DEPI','CON',
    'CTIER','D','COPISE'
  )
ORDER BY code;
-- Si esta consulta devuelve filas, avisa para agregar sus nodos al grafo.
