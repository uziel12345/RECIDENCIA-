-- Tabla de auditoría de acciones administrativas
-- Aplicar con: mysql -u root -p mapa_ito < docs/migration-audit-logs-20260602.sql

CREATE TABLE audit_logs (
  id            INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  admin_user_id VARCHAR(36)  NULL,
  action        VARCHAR(64)  NOT NULL,
  resource_type VARCHAR(32)  NULL,
  resource_id   VARCHAR(36)  NULL,
  details       JSON         NULL,
  ip_address    VARCHAR(45)  NULL,
  created_at    DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,

  INDEX idx_admin_user (admin_user_id),
  INDEX idx_action     (action),
  INDEX idx_created_at (created_at)
);
