-- ============================================================
-- Actualiza model_node_name a los nombres reales del nuevo campus.glb
-- (el GLB fue reexportado con espacios en lugar de underscores y
--  nombres más descriptivos para varios edificios).
--
-- Prerequisito: schema.sql + seed.sql + migraciones anteriores ejecutadas.
-- Fecha: 2026-06-16
--
-- Uso:
--   mysql -u <usuario> -p mapa_ito < docs/migration-buildings-glb-nombres-actualizados-20260616.sql
-- ============================================================

SET NAMES utf8mb4;
START TRANSACTION;

-- Dirección (seed usaba 'Edificio_Direccion', ahora el mesh tiene nombre real)
UPDATE buildings SET model_node_name = 'Direccion, Depto de servicios escolares, Div de estudios profecionales '
WHERE code = 'DIR';

-- Biblioteca (sin cambio de mesh, pero alineamos por claridad)
-- 'Biblioteca_' sigue mapeando a 'Biblioteca_Biblioteca' via glb-utils — sin cambio.

-- Centro de Cómputo
UPDATE buildings SET model_node_name = 'Centro de Computo'
WHERE code = 'CC';

-- Aulas Ñ
UPDATE buildings SET model_node_name = 'Aulas Ñ'
WHERE code = 'N';

-- Audiovisual de Posgrado
UPDATE buildings SET model_node_name = 'Audiovisual de Postgrado.001'
WHERE code = 'AUD-POS';

-- Cubículo de Maestros
UPDATE buildings SET model_node_name = 'Cubiculo de Maestros'
WHERE code = 'CUB-MAE';

-- Cubículos de Doctorado
UPDATE buildings SET model_node_name = 'Cubiculos de Doctorado.001'
WHERE code = 'CUB-DOC';

-- Dpto. Química y Bioquímica (el mesh tiene saltos de línea en el nombre)
UPDATE buildings SET model_node_name = 'DEPARTAMENTO\nDE\nINGENIERÍA\nQUÍMICA Y\nBIOQUÍMICA'
WHERE code = 'DQB';

-- Dpto. Ingeniería Electrónica
UPDATE buildings SET model_node_name = 'DEPARTAMENTO DE\nINGENIERÍA\nELECTRÓNICA'
WHERE code = 'DEL';

-- Ciencias Básicas
UPDATE buildings SET model_node_name = 'Departamento de Ciencias Basicas_Departamento de Ciencias Basicas'
WHERE code = 'CB';

-- Edificio C (el GLB tiene un typo histórico "Eduficio")
UPDATE buildings SET model_node_name = 'Eduficio C'
WHERE code = 'C';

-- Edificio L
UPDATE buildings SET model_node_name = 'Edificio  L '
WHERE code = 'L';

-- Laboratorio de Ing. Civil
UPDATE buildings SET model_node_name = 'Laboratorio de Ing. Civil'
WHERE code = 'LAB-CIV';

-- Laboratorio de Ing. Eléctrica (mesh genérico)
UPDATE buildings SET model_node_name = 'Edificios 3D 12 en emplazamiento plano'
WHERE code = 'LAB-ELE';

-- Lab. Físico-Química (ahora tiene mesh con nombre propio)
UPDATE buildings SET model_node_name = 'Laboratorio de Fisico-quimica '
WHERE code = 'FQ';

-- Laboratorio de Ing. Química
UPDATE buildings SET model_node_name = 'Laboratorio de ing.  Quimica'
WHERE code = 'LAB-QUI';

-- Geolocalización
UPDATE buildings SET model_node_name = 'Contenido de geolocalización'
WHERE code = 'GEO';

-- Maestría en Administración
UPDATE buildings SET model_node_name = 'Maestria en Administracion'
WHERE code = 'MAE-ADM';

-- Edificio de Posgrado
UPDATE buildings SET model_node_name = 'Edificio de Postgrado.001'
WHERE code = 'POS';

-- Sala de Titulación (ahora tiene mesh con nombre propio)
UPDATE buildings SET model_node_name = 'Sala de titulacion- aula de dibujo- Lab de microscopia -aula de dibujo '
WHERE code = 'SAL';

-- Asesorías
UPDATE buildings SET model_node_name = 'Asesorias'
WHERE code = 'ASE';

COMMIT;
