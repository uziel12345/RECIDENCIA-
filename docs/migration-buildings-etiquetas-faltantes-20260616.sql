-- ============================================================
-- Agrega model_node_name a edificios que no tenían etiqueta 3D.
-- También corrige model_node_name rotos (valores que no existen en el GLB actual).
-- Fecha: 2026-06-16
--
-- Uso:
--   mysql -u <usuario> -p mapa_ito < docs/migration-buildings-etiquetas-faltantes-20260616.sql
-- ============================================================

SET NAMES utf8mb4;

-- El GLB actual tiene casos donde varios registros lógicos comparten el mismo
-- mesh físico. Por eso model_node_name no puede ser UNIQUE.
SET @unique_model_node_index := (
  SELECT INDEX_NAME
  FROM INFORMATION_SCHEMA.STATISTICS
  WHERE TABLE_SCHEMA = DATABASE()
    AND TABLE_NAME = 'buildings'
    AND COLUMN_NAME = 'model_node_name'
    AND NON_UNIQUE = 0
  LIMIT 1
);
SET @drop_model_node_unique := IF(
  @unique_model_node_index IS NULL,
  'SELECT 1',
  CONCAT('ALTER TABLE buildings DROP INDEX `', @unique_model_node_index, '`')
);
PREPARE stmt FROM @drop_model_node_unique;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

ALTER TABLE buildings MODIFY model_node_name VARCHAR(255) NULL;

SET @has_model_node_index := (
  SELECT COUNT(*)
  FROM INFORMATION_SCHEMA.STATISTICS
  WHERE TABLE_SCHEMA = DATABASE()
    AND TABLE_NAME = 'buildings'
    AND INDEX_NAME = 'idx_buildings_model_node_name'
);
SET @add_model_node_index := IF(
  @has_model_node_index > 0,
  'SELECT 1',
  'ALTER TABLE buildings ADD INDEX idx_buildings_model_node_name (model_node_name)'
);
PREPARE stmt FROM @add_model_node_index;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

START TRANSACTION;

-- ── Edificios de aulas individuales ───────────────────────────────────────

-- Edificio A (antes sin mesh)
UPDATE buildings SET model_node_name = 'Edificio A '
WHERE code = 'A' AND (model_node_name IS NULL OR model_node_name = '');

-- Edificio B (alias viejo 'Edificio_B' no existe en GLB nuevo)
UPDATE buildings SET model_node_name = 'Edificio B'
WHERE code = 'B';

-- Edificio D (antes sin mesh)
UPDATE buildings SET model_node_name = 'Aulas D '
WHERE code = 'D' AND (model_node_name IS NULL OR model_node_name = '');

-- Edificio F (alias viejo 'Edificio_F' no existe en GLB nuevo)
UPDATE buildings SET model_node_name = 'Edificio F'
WHERE code = 'F';

-- Edificio H (alias viejo 'Edificio_H' no existe en GLB nuevo)
UPDATE buildings SET model_node_name = 'Edificio H_Edifucui H'
WHERE code = 'H';

-- Edificio I (alias viejo 'Edificio_I' no existe en GLB nuevo)
UPDATE buildings SET model_node_name = 'Edificio I'
WHERE code = 'I';

-- Edificio J (alias viejo 'Edificio_J' no existe en GLB nuevo)
UPDATE buildings SET model_node_name = 'Edificio J'
WHERE code = 'J';

-- Edificio K (alias viejo 'Edificio_K' no existe en GLB nuevo)
UPDATE buildings SET model_node_name = 'Edificio K'
WHERE code = 'K';

-- Edificio S / Aulas S
UPDATE buildings SET model_node_name = 'Aulas S.'
WHERE code IN ('S', 'AUL-S') AND (model_node_name IS NULL OR model_node_name = '');

-- Aulas P
UPDATE buildings SET model_node_name = 'Aulas P '
WHERE code = 'AUL-P' AND (model_node_name IS NULL OR model_node_name = '');

-- ── Aulas especiales ──────────────────────────────────────────────────────

-- Aulas K
UPDATE buildings SET model_node_name = 'Aulas K'
WHERE code = 'AUL-K';

-- Aulas de Doctorado
UPDATE buildings SET model_node_name = 'Aulas y Cubiculos de Doctorado'
WHERE code = 'AUL-DOC' AND (model_node_name IS NULL OR model_node_name = '');

-- ── Servicios ─────────────────────────────────────────────────────────────

-- Cafetería
UPDATE buildings SET model_node_name = 'Cafeteria'
WHERE code = 'CAF' AND (model_node_name IS NULL OR model_node_name = '');

-- Caldera
UPDATE buildings SET model_node_name = 'Caldera '
WHERE code = 'CAL' AND (model_node_name IS NULL OR model_node_name = '');

-- Extraescolares (código EXTRA o EXT)
UPDATE buildings SET model_node_name = 'Extra escolares '
WHERE code IN ('EXTRA', 'EXT') AND (model_node_name IS NULL OR model_node_name = 'Servicios_Extra_Escolares');

-- Servicios Escolares (comparte mesh con Dirección)
UPDATE buildings SET model_node_name = 'Direccion, Depto de servicios escolares, Div de estudios profecionales '
WHERE code = 'SERV-ESC' AND (model_node_name IS NULL OR model_node_name = '');

-- Ludoteca Sección 61
UPDATE buildings SET model_node_name = 'seccion 61'
WHERE code = 'LUD' AND (model_node_name IS NULL OR model_node_name = '');

-- ── Laboratorios ──────────────────────────────────────────────────────────

-- Lab. Mecánica (comparte mesh con Lab. Química Pesada)
UPDATE buildings SET model_node_name = 'Laboratorio de Ing. Quimica Pesada, Depto de Ing de Mecanica '
WHERE code = 'LAB-MEC';

-- Lab. Química Pesada
UPDATE buildings SET model_node_name = 'Laboratorio de Ing. Quimica Pesada, Depto de Ing de Mecanica '
WHERE code = 'LAB-QP';

-- Lab. de Simulación
UPDATE buildings SET model_node_name = 'Lab de Simulacion '
WHERE code = 'LAB-SIM' AND (model_node_name IS NULL OR model_node_name = '');

-- Lab. Microscopía / Aula Dibujo (comparte mesh con SAL)
UPDATE buildings SET model_node_name = 'Sala de titulacion- aula de dibujo- Lab de microscopia -aula de dibujo '
WHERE code = 'LAB-MICR' AND (model_node_name IS NULL OR model_node_name = '');

-- ── Departamentos ─────────────────────────────────────────────────────────

-- D.E.P.I.
UPDATE buildings SET model_node_name = 'D.E.P.I.'
WHERE code = 'DEPI';

-- CONACYT (código CONACYT o CON)
UPDATE buildings SET model_node_name = 'Edificio CONACYT'
WHERE code IN ('CONACYT', 'CON');

-- Dpto. Ciencias de la Tierra
UPDATE buildings SET model_node_name = 'Depto de ceiencias de la Tierra '
WHERE code = 'CTIER';

-- Desarrollo Académico
UPDATE buildings SET model_node_name = 'DEPTO, de desarrolo academico '
WHERE code = 'DA';

-- Dpto. Ing. Electrónica (DIE — comparte mesh con DEL)
UPDATE buildings SET model_node_name = 'DEPARTAMENTO DE\nINGENIERÍA\nELECTRÓNICA'
WHERE code = 'DIE' AND (model_node_name IS NULL OR model_node_name = '');

-- Dpto. Ing. Química + Industrial (mesh distinto al de DQB)
UPDATE buildings SET model_node_name = 'DEPARTAMENTO\nDE\nINGENIERÍA\nQUÍMICA Y\nBIOQUÍMICA. DEPTO. de  ing Industrial '
WHERE code = 'DQI-DII' AND (model_node_name IS NULL OR model_node_name = '');

-- Ciencias Económico-Administrativas (mesh cerca del Edificio J)
UPDATE buildings SET model_node_name = 'Aulas J. Dep de Economico Administravita '
WHERE code = 'CEA';

-- ── Maestrías ─────────────────────────────────────────────────────────────

-- Maestría en Construcción
UPDATE buildings SET model_node_name = 'Maestria en construccion'
WHERE code = 'MAE-CON';

-- Maestría en Docencia
UPDATE buildings SET model_node_name = 'Maestri en docencia y sala de educacion a distancia '
WHERE code = 'MAE-DOC';

-- ── Audiovisuales ─────────────────────────────────────────────────────────

-- Audiovisual de Ingeniería
UPDATE buildings SET model_node_name = 'Audiovisual de Ing '
WHERE code = 'AUD-ING';

-- Audiovisual de Licenciatura (el nombre del mesh tiene salto de línea)
UPDATE buildings SET model_node_name = 'Audiovisual de\nLicenciatura'
WHERE code = 'AUD-LIC';

-- Valores antiguos tipo slug / nombres de GLB anterior.
UPDATE buildings SET model_node_name = 'Edificio 3D 1.007'
WHERE code = '1007';

UPDATE buildings SET model_node_name = 'Edificio 3D 1.008'
WHERE code = '1008';

UPDATE buildings SET model_node_name = 'Edificio 3D 1.009'
WHERE code = '1009';

UPDATE buildings SET model_node_name = 'Edificio A '
WHERE code = 'A';

UPDATE buildings SET model_node_name = 'Aulas Ñ.001'
WHERE code = 'AUL-AC';

UPDATE buildings SET model_node_name = 'Aulas y Cubiculos de Doctorado'
WHERE code = 'AUL-DOC';

UPDATE buildings SET model_node_name = 'Aulas P '
WHERE code = 'AUL-P';

UPDATE buildings SET model_node_name = 'Caldera '
WHERE code = 'CAL';

UPDATE buildings SET model_node_name = 'Centro de Computo'
WHERE code = 'CC';

UPDATE buildings SET model_node_name = 'Sala de titulacion- aula de dibujo- Lab de microscopia -aula de dibujo '
WHERE code = 'COPIAS';

UPDATE buildings SET model_node_name = 'Aulas D '
WHERE code = 'D';

UPDATE buildings SET model_node_name = 'Depto.Ing Electrica'
WHERE code = 'DIE';

UPDATE buildings SET model_node_name = 'Direccion, Depto de servicios escolares, Div de estudios profecionales '
WHERE code = 'DIR';

UPDATE buildings SET model_node_name = 'DEPARTAMENTO\nDE\nINGENIERÍA\nQUÍMICA Y\nBIOQUÍMICA. DEPTO. de  ing Industrial '
WHERE code = 'DQI-DII';

UPDATE buildings SET model_node_name = 'Extra escolares '
WHERE code = 'EXTRA';

UPDATE buildings SET model_node_name = 'Contenido de geolocalización'
WHERE code = 'GEO';

UPDATE buildings SET model_node_name = 'Laboratorio de Ing. Idustrial'
WHERE code = 'LAB-IND';

UPDATE buildings SET model_node_name = 'Sala de titulacion- aula de dibujo- Lab de microscopia -aula de dibujo '
WHERE code = 'LAB-MICR';

UPDATE buildings SET model_node_name = 'Lab de Simulacion '
WHERE code = 'LAB-SIM';

UPDATE buildings SET model_node_name = 'seccion 61'
WHERE code = 'LUD';

UPDATE buildings SET model_node_name = 'Edificios 3D 16 en emplazamiento plano'
WHERE code = 'MC';

UPDATE buildings SET model_node_name = 'Edificio Nuevo'
WHERE code = 'NEW';

UPDATE buildings SET model_node_name = 'Edificios 3D 18 en emplazamiento plano'
WHERE code = 'O';

UPDATE buildings SET model_node_name = 'Edificios 3D 10 en emplazamiento plano'
WHERE code = 'PTR';

UPDATE buildings SET model_node_name = 'Maestria en Administracion.001'
WHERE code = 'SAL-MAE';

UPDATE buildings SET model_node_name = 'Direccion, Depto de servicios escolares, Div de estudios profecionales '
WHERE code = 'SERV-ESC';

UPDATE buildings SET model_node_name = 'seccion 61'
WHERE code = 'VIG';

COMMIT;
