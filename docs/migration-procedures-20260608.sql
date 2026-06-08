-- ============================================================
-- MIGRACIÓN: Trámites y servicios por edificio
-- Fecha: 2026-06-08
-- Tablas: procedures, procedure_requirements, building_procedures
-- ============================================================

CREATE TABLE IF NOT EXISTS procedures (
  id           VARCHAR(36)   NOT NULL,
  name         VARCHAR(255)  NOT NULL,
  slug         VARCHAR(255)  NOT NULL,
  description  TEXT          NULL,
  kind         ENUM('tramite','servicio') NOT NULL,
  is_active    TINYINT(1)    NOT NULL DEFAULT 1,
  created_at   DATETIME      NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at   DATETIME      NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  deleted_at   DATETIME      NULL DEFAULT NULL
    COMMENT 'Timestamp del soft delete; NULL = registro activo',

  PRIMARY KEY (id),
  UNIQUE KEY uq_procedure_slug  (slug),
  KEY idx_procedures_kind       (kind),
  KEY idx_procedures_active     (is_active)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS procedure_requirements (
  id             VARCHAR(36)  NOT NULL,
  procedure_id   VARCHAR(36)  NOT NULL,
  description    TEXT         NOT NULL,
  is_mandatory   TINYINT(1)   NOT NULL DEFAULT 1,
  display_order  INT          NOT NULL DEFAULT 0,
  created_at     DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at     DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

  PRIMARY KEY (id),
  KEY idx_req_procedure (procedure_id),
  KEY idx_req_order     (procedure_id, display_order),
  CONSTRAINT fk_req_procedure
    FOREIGN KEY (procedure_id) REFERENCES procedures (id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS building_procedures (
  building_id   VARCHAR(36)   NOT NULL,
  procedure_id  VARCHAR(36)   NOT NULL,
  notes         VARCHAR(500)  NULL,
  created_at    DATETIME      NOT NULL DEFAULT CURRENT_TIMESTAMP,

  PRIMARY KEY (building_id, procedure_id),
  KEY idx_bp_procedure (procedure_id),
  CONSTRAINT fk_bp_building
    FOREIGN KEY (building_id) REFERENCES buildings (id),
  CONSTRAINT fk_bp_procedure
    FOREIGN KEY (procedure_id) REFERENCES procedures (id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
