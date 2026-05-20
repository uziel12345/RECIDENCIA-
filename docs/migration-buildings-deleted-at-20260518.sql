-- Migración: agregar deleted_at a buildings
-- Fecha: 2026-05-18
--
-- Problema (M-4): el soft delete sólo seteaba is_active = FALSE sin registrar
-- cuándo ocurrió la eliminación. Sin deleted_at no hay auditoría ni orden temporal.
--
-- Ejecutar una sola vez sobre la base de datos de producción/desarrollo.

ALTER TABLE buildings
  ADD COLUMN deleted_at DATETIME NULL DEFAULT NULL
    COMMENT 'Timestamp del soft delete; NULL = registro activo o no eliminado'
  AFTER is_priority;
