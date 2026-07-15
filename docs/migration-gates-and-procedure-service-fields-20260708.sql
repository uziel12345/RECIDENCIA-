-- Puertas del campus + campos de "servicio" en procedures (departamento
-- responsable, ubicación interna, horario).
-- Aplicar con: mysql -u root -p mapa_ito < docs/migration-gates-and-procedure-service-fields-20260708.sql
-- Todo aditivo, seguro sobre datos existentes.

SET NAMES utf8mb4;
SET foreign_key_checks = 0;

-- ============================================================
-- gates (puertas / accesos del campus)
-- Coordenadas crudas x/y/z (igual que navigation_nodes) — no son
-- objetos nombrados del modelo 3D, así que no llevan model_node_name.
-- future: podrán vincularse a navigation_nodes para usarse como
-- puntos de inicio de ruta (no implementado todavía).
-- ============================================================
CREATE TABLE IF NOT EXISTS gates (
  id          VARCHAR(36)   NOT NULL,
  name        VARCHAR(255)  NOT NULL,
  description TEXT          NULL,
  access_type ENUM('peatonal','vehicular','mixto') NOT NULL DEFAULT 'peatonal',
  status      ENUM('abierta','cerrada','solo_entrada','solo_salida') NOT NULL DEFAULT 'abierta',
  x           FLOAT         NOT NULL,
  y           FLOAT         NOT NULL DEFAULT 0,
  z           FLOAT         NOT NULL,
  is_active   TINYINT(1)    NOT NULL DEFAULT 1,
  created_at  DATETIME      NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at  DATETIME      NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  deleted_at  DATETIME      NULL DEFAULT NULL
    COMMENT 'Timestamp del soft delete; NULL = registro activo',

  PRIMARY KEY (id),
  KEY idx_gates_active (is_active)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================
-- procedures: campos de "servicio" (departamento responsable,
-- ubicación interna, horario de atención)
-- ============================================================
ALTER TABLE procedures
  ADD COLUMN department_id VARCHAR(36) NULL AFTER kind,
  ADD COLUMN internal_location VARCHAR(255) NULL,
  ADD COLUMN schedule_text VARCHAR(255) NULL,
  ADD KEY idx_procedures_department (department_id),
  ADD CONSTRAINT fk_procedures_department
    FOREIGN KEY (department_id) REFERENCES departments (id) ON DELETE SET NULL;

SET foreign_key_checks = 1;
