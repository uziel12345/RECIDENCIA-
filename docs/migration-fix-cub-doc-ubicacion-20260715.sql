-- ============================================================
-- Fix: "Cubículos Doctorado" (CUB-DOC) y "Aulas de Doctorado"
-- (AUL-DOC) comparten el mismo nodo 3D (model_node_name =
-- 'Aulas_Cubiculos_de_Doctorado', misma estructura física), pero
-- solo AUL-DOC "gana" ese nodo en el sistema de etiquetas de
-- CampusViewer.tsx (BuildingLabels -> nodeWinner, por orden
-- alfabético de nombre) — es el único cuya posición se calcula en
-- vivo contra el modelo 3D y se cachea en useBuildingGlbStore.
--
-- CUB-DOC nunca gana ese nodo, así que su pin/beacon de selección
-- siempre cae al fallback building.x/z guardado en BD, que resultó
-- estar muy lejos de la posición real (confirmado inspeccionando
-- la posición mundial real del nodo en campus.glb con
-- @gltf-transform/core). Mismo patrón que el fix de AUD-POS de
-- hoy: se iguala el x/y/z de CUB-DOC al de AUL-DOC, ya que ambos
-- representan la misma estructura física.
--
-- Fecha: 2026-07-15
-- Uso:
--   mysql -u <usuario> -p mapa_ito < docs/migration-fix-cub-doc-ubicacion-20260715.sql
-- ============================================================

SET NAMES utf8mb4;
START TRANSACTION;

UPDATE buildings AS cub_doc
JOIN buildings AS aul_doc ON aul_doc.code = 'AUL-DOC'
SET
  cub_doc.x = aul_doc.x,
  cub_doc.y = aul_doc.y,
  cub_doc.z = aul_doc.z
WHERE cub_doc.code = 'CUB-DOC';

SELECT code, name, model_node_name, x, y, z FROM buildings WHERE code IN ('AUL-DOC', 'CUB-DOC');

COMMIT;
