# Operación segura, despliegue y recuperación

Este documento contiene pasos para revisión. No autoriza ejecutar cambios en producción sin respaldo, ventana aprobada y responsable de rollback.

## Preflight de release

```bash
pnpm install --frozen-lockfile
pnpm typecheck
pnpm lint
pnpm --filter api test
pnpm --filter web test
pnpm build
pnpm security:audit:prod
```

Confirmar además que `.env`, backups, uploads y llaves no aparecen en `git status`; revisar el diff; registrar commit, responsable y ventana. El release que incorpora `JWT_ISSUER`, `JWT_AUDIENCE`, Argon2id y nuevos límites debe validar primero las variables de `apps/api/.env.example` en staging.

## Despliegue atómico recomendado

1. Crear un backup consistente de PostgreSQL, uploads y configuración; calcular SHA-256.
2. Crear un directorio de release nuevo, propiedad del usuario de servicio sin privilegios.
3. Instalar con lockfile congelado y compilar como usuario de servicio.
4. Probar el binario contra staging/healthcheck local.
5. Cambiar un symlink `current` de forma atómica, recargar systemd y verificar desde loopback.
6. Validar HTTPS, cabeceras, login, 401/403 y mapa con una prueba de humo no destructiva.

No editar el release activo ni copiar `node_modules` desde una laptop. Nginx y systemd tienen plantillas versionadas en `deploy/`; antes de aplicar una edición usar `nginx -t` o `systemd-analyze verify` sobre una copia y guardar la versión anterior.

## Rollback

Si healthcheck, logs o pruebas de humo fallan:

1. apuntar `current` al release anterior;
2. reiniciar únicamente el servicio de aplicación;
3. verificar loopback y HTTPS;
4. restaurar base de datos solo si hubo una migración no compatible, usando el respaldo verificado;
5. conservar evidencia y no eliminar el release fallido hasta completar el análisis.

No usar `git reset --hard`, no borrar directorios amplios y no restaurar encima de la única copia disponible.

## PostgreSQL

- Aplicación con rol sin `SUPERUSER`, `CREATEDB`, `CREATEROLE` ni permisos sobre otras bases.
- Propietario de migraciones separado del usuario runtime cuando sea posible.
- `pg_hba.conf` restringido a loopback/identidad local; TLS si se mueve fuera del host.
- Pool máximo 10 por defecto, timeout de conexión 5 s, statement 15 s y query 20 s, configurables con límites validados.
- Backups con `pg_dump` y restauración ensayada. Nunca registrar SQL con valores personales.

## Secretos y acceso del operador

- Generar JWT y CSRF independientes con al menos 32 bytes aleatorios; en producción la aplicación falla si falta CSRF o coincide con JWT.
- Rotar cualquier contraseña o token compartido por chat, correo o terminal grabada.
- Instalar llaves SSH personales, retirar claves temporales, deshabilitar login root por contraseña después de comprobar un acceso alternativo.
- Implementar MFA para el panel o un proveedor de identidad delante del área administrativa.

## Backups y objetivos

- Backup diario cifrado y una copia fuera del servidor; retención sugerida: 14 diarios, 8 semanales y 12 mensuales.
- Objetivo inicial propuesto: RPO 24 h, RTO 4 h. Debe aprobarlo el dueño del sistema.
- Prueba de restauración trimestral en un entorno aislado, verificando recuentos, constraints, archivos y acceso con cuenta temporal.
- El backup local actual protege errores lógicos, no pérdida total del disco; la copia externa sigue pendiente.

## Monitoreo y respuesta

Alertar por tasas anómalas de 401/403/429/5xx, fallos de auditoría, reinicios, disco >80 %, backup fallido y expiración TLS. Los logs JSON incluyen `request_id`, ruta normalizada y usuario, pero no query, cookies ni cuerpo. Aplicar rotación y acceso restringido.

Ante incidente: contener sin destruir evidencia, revocar sesiones/credenciales, preservar logs y snapshot, determinar alcance, recuperar desde copia verificada y documentar causa/acciones. No hacer contraataques.

## Controles externos pendientes

Un WAF/CDN y mitigación DDoS administrada requieren dominio propio y aprobación de infraestructura. El túnel actual publica el servicio, pero no sustituye ese control. ZAP se reserva para staging autorizado; nunca para producción.
