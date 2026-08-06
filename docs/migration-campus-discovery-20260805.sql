-- Descubrimiento del campus: búsqueda por relevancia, cargos, calles y consultas rápidas.
BEGIN;

ALTER TABLE procedures
  ADD COLUMN IF NOT EXISTS validation_status VARCHAR(24) NOT NULL DEFAULT 'confirmed';
ALTER TABLE procedures DROP CONSTRAINT IF EXISTS chk_procedures_validation_status;
ALTER TABLE procedures ADD CONSTRAINT chk_procedures_validation_status
  CHECK (validation_status IN ('confirmed','pending_validation'));

CREATE TABLE IF NOT EXISTS institutional_positions (
  id VARCHAR(36) PRIMARY KEY,
  title VARCHAR(255) NOT NULL,
  person_name VARCHAR(255) NULL,
  department_id VARCHAR(36) NULL REFERENCES departments(id) ON DELETE SET NULL,
  building_id VARCHAR(36) NULL REFERENCES buildings(id) ON DELETE SET NULL,
  office_name VARCHAR(255) NULL,
  search_keywords TEXT[] NOT NULL DEFAULT '{}',
  is_public BOOLEAN NOT NULL DEFAULT TRUE,
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  deleted_at TIMESTAMP NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS idx_positions_building ON institutional_positions(building_id);
CREATE INDEX IF NOT EXISTS idx_positions_department ON institutional_positions(department_id);
CREATE INDEX IF NOT EXISTS idx_positions_public_active ON institutional_positions(is_public,is_active);
DROP TRIGGER IF EXISTS trg_institutional_positions_updated_at ON institutional_positions;
CREATE TRIGGER trg_institutional_positions_updated_at BEFORE UPDATE ON institutional_positions
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

CREATE TABLE IF NOT EXISTS campus_streets (
  id VARCHAR(36) PRIMARY KEY,
  name VARCHAR(255) NOT NULL UNIQUE,
  description TEXT NULL,
  x DOUBLE PRECISION NOT NULL,
  y DOUBLE PRECISION NOT NULL DEFAULT 1,
  z DOUBLE PRECISION NOT NULL,
  rotation DOUBLE PRECISION NULL,
  display_order INTEGER NOT NULL DEFAULT 0,
  is_visible BOOLEAN NOT NULL DEFAULT TRUE,
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS idx_campus_streets_visible ON campus_streets(is_active,is_visible);
DROP TRIGGER IF EXISTS trg_campus_streets_updated_at ON campus_streets;
CREATE TRIGGER trg_campus_streets_updated_at BEFORE UPDATE ON campus_streets
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

CREATE TABLE IF NOT EXISTS quick_queries (
  id VARCHAR(36) PRIMARY KEY,
  label VARCHAR(255) NOT NULL,
  query VARCHAR(255) NOT NULL,
  category VARCHAR(24) NOT NULL CHECK (
    category IN ('building','department','service','procedure','person','position','classroom')
  ),
  icon VARCHAR(64) NULL,
  priority INTEGER NOT NULL DEFAULT 0,
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS idx_quick_queries_priority ON quick_queries(is_active,priority DESC);
DROP TRIGGER IF EXISTS trg_quick_queries_updated_at ON quick_queries;
CREATE TRIGGER trg_quick_queries_updated_at BEFORE UPDATE ON quick_queries
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

CREATE TABLE IF NOT EXISTS search_aliases (
  id VARCHAR(36) PRIMARY KEY,
  entity_type VARCHAR(24) NOT NULL CHECK (
    entity_type IN ('building','classroom','procedure','department','cubicle','headquarters','gate','position','street')
  ),
  entity_id VARCHAR(36) NOT NULL,
  alias VARCHAR(255) NOT NULL,
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(entity_type,entity_id,alias)
);
CREATE INDEX IF NOT EXISTS idx_search_aliases_entity ON search_aliases(entity_type,entity_id,is_active);
CREATE INDEX IF NOT EXISTS idx_search_aliases_text ON search_aliases(LOWER(alias));

COMMIT;
