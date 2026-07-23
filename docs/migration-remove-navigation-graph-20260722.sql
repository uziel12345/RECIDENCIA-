-- ============================================================
-- Elimina el grafo de navegación (nodos/aristas/entradas) y su respaldo
-- huérfano.
--
-- Contexto: el pathfinding por grafo (dijkstra) se eliminó del código el
-- 2026-07-03 ("cambio de mapa"); desde entonces navigation_nodes/
-- navigation_edges/building_entrances quedaron vacías (0 filas) sin que
-- nada las repoblara. El producto ya había decidido "solo localización,
-- no rutas" para estudiantes/visitantes (ronda 2026-07-14), y la función
-- "Cómo llegar" de superadmin dependía de este grafo vacío — es decir,
-- ya no funcionaba. Se retira el módulo completo (BD + API + UI) en vez
-- de dejarlo como código muerto.
--
-- navigation_edges_backup (tabla huérfana, datos de 2026-04-23, previa a
-- TODAS las migraciones de navegación) ya se eliminó por separado.
-- ============================================================

SET foreign_key_checks = 0;

DROP TABLE IF EXISTS building_entrances;
DROP TABLE IF EXISTS navigation_edges;
DROP TABLE IF EXISTS navigation_nodes;

SET foreign_key_checks = 1;
