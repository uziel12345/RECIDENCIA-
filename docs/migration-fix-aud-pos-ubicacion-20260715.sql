-- ============================================================
-- Fix: "Audiovisual de Posgrado" (AUD-POS) apuntaba al nodo 3D
-- equivocado y a coordenadas sin relación con su ubicación real.
--
-- Causa: migration-nuevo-glb-model-node-names-20260630.sql fusionó
-- por error los alias de nodo de AUD-POS ('Audiovisual_de_Postgrado.001',
-- 'Audiovisual_Posgrado', etc.) con el nodo de 'AUD-ING' (Audiovisual
-- de Ingeniería) — mismo nombre parecido, edificio real distinto.
-- El usuario confirmó: el Audiovisual de Posgrado está físicamente
-- dentro del edificio "Maestría en Docencia" (MAE-DOC), no junto a
-- Ingeniería. El GLB actual no tiene un nodo separado para el espacio
-- (el edificio MAE-DOC es un único nodo fusionado
-- 'Matria_Docencia_Sala_Educacion_distancia'), así que AUD-POS se
-- reubica sobre el mismo nodo/coordenadas de MAE-DOC.
--
-- Fecha: 2026-07-15
-- Uso:
--   mysql -u <usuario> -p mapa_ito < docs/migration-fix-aud-pos-ubicacion-20260715.sql
-- ============================================================

SET NAMES utf8mb4;
START TRANSACTION;

UPDATE buildings AS aud_pos
JOIN buildings AS mae_doc ON mae_doc.code = 'MAE-DOC'
SET
  aud_pos.model_node_name = mae_doc.model_node_name,
  aud_pos.x = mae_doc.x,
  aud_pos.y = mae_doc.y,
  aud_pos.z = mae_doc.z
WHERE aud_pos.code = 'AUD-POS';

SELECT code, name, model_node_name, x, y, z FROM buildings WHERE code IN ('AUD-POS', 'MAE-DOC');

COMMIT;
