-- Bloqueo por intentos fallidos de login en admin_users
-- Aplicar con: mysql -u root -p mapa_ito < docs/migration-admin-lockout-20260602.sql

ALTER TABLE admin_users
  ADD COLUMN failed_login_attempts TINYINT UNSIGNED NOT NULL DEFAULT 0,
  ADD COLUMN locked_until DATETIME NULL DEFAULT NULL;
