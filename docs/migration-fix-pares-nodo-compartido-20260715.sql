-- ============================================================
-- Fix: mismo patrón detectado hoy en AUD-POS y CUB-DOC — pares de
-- edificios que comparten un solo nodo 3D (model_node_name) donde
-- solo uno "gana" el nodo en BuildingLabels/nodeWinner
-- (CampusViewer.tsx, por orden alfabético de nombre) y por lo
-- tanto es el único cuya posición se calcula en vivo contra el
-- modelo 3D. El que "pierde" cae a su x/z crudo de BD, que puede
-- estar sin calibrar y lejos de la posición real — su pin/beacon
-- de selección aparece en el lugar equivocado aunque el resaltado
-- de color sí funcione bien (ese usa el nodo por nombre
-- directamente, no depende de quién ganó).
--
-- Se iguala x/y/z del edificio perdedor al del ganador (misma
-- estructura física, mismo nodo 3D):
--   LAB-QUI  -> FQ        (Laboratorio_Fisico_Quimica)
--   SAL      -> LAB-MICR  (Lab_Microscopia_Sala_Titulacion_Aula_Dibujo)
--   DQI-DII  -> DQB       (Depto_Quimica_Bioquimica_Depto_Ing_Industrial)
--
-- No se tocó DIR/SERV-ESC (mismo patrón, pero ya casi alineados,
-- diferencia mínima) ni LAB-MEC/LAB-QP (ya coincidían exactamente).
--
-- Fecha: 2026-07-15
-- Uso:
--   mysql -u <usuario> -p mapa_ito < docs/migration-fix-pares-nodo-compartido-20260715.sql
-- ============================================================

SET NAMES utf8mb4;
START TRANSACTION;

UPDATE buildings AS loser
JOIN buildings AS winner ON winner.code = 'FQ'
SET loser.x = winner.x, loser.y = winner.y, loser.z = winner.z
WHERE loser.code = 'LAB-QUI';

UPDATE buildings AS loser
JOIN buildings AS winner ON winner.code = 'LAB-MICR'
SET loser.x = winner.x, loser.y = winner.y, loser.z = winner.z
WHERE loser.code = 'SAL';

UPDATE buildings AS loser
JOIN buildings AS winner ON winner.code = 'DQB'
SET loser.x = winner.x, loser.y = winner.y, loser.z = winner.z
WHERE loser.code = 'DQI-DII';

SELECT code, name, model_node_name, x, y, z
FROM buildings
WHERE code IN ('LAB-QUI', 'FQ', 'SAL', 'LAB-MICR', 'DQI-DII', 'DQB')
ORDER BY model_node_name;

COMMIT;
