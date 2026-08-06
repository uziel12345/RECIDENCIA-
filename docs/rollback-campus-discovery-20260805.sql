-- Reversión de migration-campus-discovery-20260805.sql.
-- Ejecutar sólo después de respaldar: elimina catálogos y alias agregados.
BEGIN;
DROP TABLE IF EXISTS search_aliases;
DROP TABLE IF EXISTS quick_queries;
DROP TABLE IF EXISTS campus_streets;
DROP TABLE IF EXISTS institutional_positions;
ALTER TABLE procedures DROP CONSTRAINT IF EXISTS chk_procedures_validation_status;
ALTER TABLE procedures DROP COLUMN IF EXISTS validation_status;
COMMIT;
