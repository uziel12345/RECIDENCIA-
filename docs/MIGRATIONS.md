# Migraciones y archivos SQL

Este documento clasifica los archivos de `docs/` por su uso operativo. No certifica el estado real de una base de datos específica; su objetivo es indicar qué ejecutar en una BD nueva y qué conservar solo como historial o referencia.

## Orden recomendado para BD nueva

1. Ejecutar `schema.sql`.
2. Ejecutar `seed.sql`.
3. No ejecutar `migration-*.sql` sobre una BD nueva, salvo que se esté reproduciendo o auditando un cambio histórico específico.

| Archivo | Descripción | Estado | Fecha |
|---------|-------------|--------|-------|
| `schema.sql` | Esquema base completo reconstruido desde las migraciones; define las tablas actuales, relaciones, índices y categorías iniciales. | Canónico — ejecutar en BD nueva | 2026-06 |
| `seed.sql` | Datos mínimos iniciales: superadmin placeholder, edificios de ejemplo y navegación de ejemplo. | Canónico — ejecutar después de `schema.sql` | 2026-06 |
| `migration-buildings-deleted-at-20260518.sql` | Agrega `deleted_at` a `buildings` para borrado lógico. | Aplicado histórico — incorporado en el esquema actual | 2026-05-18 |
| `migration-buildings-missing-20260518.sql` | Inserta edificios faltantes iniciales con coordenadas y nombres de modelo. | Aplicado histórico — carga histórica de edificios | 2026-05-18 |
| `migration-building-entrances-auto-20260527.sql` | Genera entradas automáticamente para edificios activos usando el nodo de navegación activo más cercano. | Referencia/backup — generación automática inicial de entradas | 2026-05-27 |
| `migration-building-entrances-fase1-20260527.sql` | Crea una primera fase de entradas para edificios cercanos a nodos de navegación. | Referencia/backup — fase intermedia de datos de navegación | 2026-05-27 |
| `migration-buildings-from-croquis-20260528.sql` | Agrega edificios faltantes tomados del croquis ITO 2019 y mallas GLB estimadas. | Aplicado histórico — carga inicial desde croquis | 2026-05-28 |
| `migration-buildings-screenshot-20260528.sql` | Complementa edificios visibles en screenshot que no estaban cubiertos por el croquis. | Aplicado histórico — complemento de carga de edificios | 2026-05-28 |
| `migration-admin-lockout-20260602.sql` | Agrega campos de intentos fallidos y bloqueo temporal a `admin_users`. | Aplicado histórico — incorporado en el esquema actual | 2026-06-02 |
| `migration-admin-token-version-20260602.sql` | Agrega `token_version` a `admin_users` para invalidación de tokens. | Aplicado histórico — incorporado en el esquema actual | 2026-06-02 |
| `migration-audit-logs-20260602.sql` | Crea la tabla `audit_logs` para registrar acciones administrativas. | Aplicado histórico — incorporado en el esquema actual | 2026-06-02 |
| `migration-classrooms-20260608.sql` | Crea la tabla `classrooms` y sus relaciones con edificios. | Aplicado histórico — incorporado en el esquema actual | 2026-06-08 |
| `migration-procedures-20260608.sql` | Crea tablas de trámites, requisitos y relación trámite-edificio. | Aplicado histórico — incorporado en el esquema actual | 2026-06-08 |
| `migration-croquis-buildings-entrance-placeholders-20260609.sql` | Inserta edificios del croquis y crea nodos placeholder de entrada cuando faltan coordenadas. | Aplicado histórico — carga de croquis con placeholders | 2026-06-09 |
| `migration-buildings-glb-unlinked-20260610.sql` | Agrega edificios detectados como mallas GLB sin registro enlazado. | Aplicado histórico — vinculación de edificios GLB faltantes | 2026-06-10 |
| `migration-buildings-nombres-croquis-20260610.sql` | Normaliza nombres oficiales y `model_node_name` usando el croquis 2019. | Aplicado histórico — normalización de nombres | 2026-06-10 |
| `migration-buildings-model-node-name-glb-20260612.sql` | Corrige `model_node_name` contra nombres reales de mallas en `campus.glb`. | Aplicado histórico — corrección de enlaces GLB | 2026-06-12 |
| `migration-buildings-nombres-extra-admin-20260612.sql` | Normaliza nombres de edificios administrativos extra y sus nodos de acceso. | Aplicado histórico — normalización adicional de edificios | 2026-06-12 |
| `migration-buildings-nombres-oficiales-croquis-20260612.sql` | Ajusta nombres oficiales de edificios según el listado del croquis y actualiza nodos relacionados. | Aplicado histórico — normalización oficial de edificios | 2026-06-12 |
| `migration-lab-quimica-route-20260612.sql` | Repara la ruta del Laboratorio de Química creando o reactivando nodo, aristas y entrada. | Aplicado histórico — hotfix de navegación | 2026-06-12 |
| `migration-navigation-reset-20260518.sql` | Reinicia nodos y aristas de navegación desde la versión anterior de `campusNodes.ts`. | Referencia/backup — navegación legacy reemplazada | 2026-05-18 |
| `migration-navigation-unified-20260526.sql` | Unifica nodos, aristas y entradas de navegación; reemplaza resets y migraciones parciales previas. | Aplicado histórico — baseline histórico de navegación | 2026-05-26 |
| `navigation-backup-before-unify-2026-05-26T21-41-21-984Z.json` | Backup JSON de nodos, aristas y entradas antes de la unificación de navegación. | Referencia/backup — respaldo previo a unificación | 2026-05-26 |
