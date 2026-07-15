-- ============================================================
-- Fix: la categoría "Aulas" (building_categories.code='aulas')
-- tenía color_hex = '#4B5563' (gris oscuro), casi idéntico a los
-- grises neutros que ya usa la UI (bordes, texto, fondos) — por
-- eso los edificios de esta categoría no se distinguían bien en
-- leyenda/badges/pines. Se cambia a ámbar, confirmado con el
-- usuario (consciente de que queda cerca del naranja de
-- 'Servicio' #EA580C, pero prefirió ese tono).
--
-- Fecha: 2026-07-15
-- Uso:
--   mysql -u <usuario> -p mapa_ito < docs/migration-fix-color-categoria-aulas-20260715.sql
-- ============================================================

SET NAMES utf8mb4;
START TRANSACTION;

UPDATE building_categories SET color_hex = '#D97706' WHERE code = 'aulas';

SELECT code, name, color_hex FROM building_categories ORDER BY name;

COMMIT;
