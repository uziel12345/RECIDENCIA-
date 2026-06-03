-- Revocación de JWT por token_version en admin_users
-- Aplicar con: mysql -u root -p mapa_ito < docs/migration-admin-token-version-20260602.sql

ALTER TABLE admin_users
  ADD COLUMN token_version INT UNSIGNED NOT NULL DEFAULT 1;
