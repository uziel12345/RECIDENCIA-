# Revision de seguridad de produccion - 2026-08-03

## Alcance

Revision defensiva y no destructiva de la aplicacion, Nginx, SSH, PostgreSQL,
servicios del sistema, dependencias, superficie de red, TLS, respaldos y
controles HTTP del servidor de produccion.

## Estado aplicado

- HTTPS publico mediante Tailscale Funnel; HTTP directo redirige con 308 al
  nombre HTTPS canonico.
- UFW activo con politica de entrada denegada. SSH y HTTP directo solo se
  permiten desde Tailscale o la red local `10.168.0.0/24`; el puerto UDP de
  Tailscale permanece permitido.
- Fail2ban activo para SSH, con 5 intentos en 10 minutos y bloqueo de 1 hora.
- SSH: 3 intentos maximos, 30 segundos para autenticar, X11 deshabilitado y
  sesiones inactivas cerradas.
- Node se ejecuta como el usuario sin privilegios `mapaito`, no como root.
- La unidad systemd de la aplicacion tiene filesystem protegido, capacidades
  vacias y restricciones de dispositivos, namespaces y syscalls. Resultado de
  `systemd-analyze security`: `1.6 OK`.
- Node escucha solo en `127.0.0.1:3001` y PostgreSQL solo en
  `127.0.0.1:5432`; ninguno es alcanzable directamente desde Tailscale.
- Archivos `.env` y `.git` reciben 404 en Nginx.
- Las respuestas de autenticacion usan `Cache-Control: no-store`.
- JSON malformado responde 400 y cuerpos mayores de 2 MB responden 413.
- Dependencias directas vulnerables actualizadas. La alerta restante de React
  Router corresponde exclusivamente al modo RSC, que esta SPA no usa, y no
  tiene aun una version corregida compatible publicada.
- Node, PostgreSQL 16 y Tailscale actualizados a sus revisiones disponibles.
  El metapaquete `postgresql` queda retenido para evitar un salto automatico
  no planificado de PostgreSQL 16 a 18.

## Pruebas verificadas

- SQL injection en login: 401 con respuesta generica, sin evasion.
- Acceso administrativo sin sesion: 401.
- Mutacion sin token CSRF: 403.
- Origen CORS no autorizado: sin cabecera de autorizacion.
- TRACE: 405.
- TLS 1.0 y 1.1 rechazados; TLS 1.2 y 1.3 aceptados.
- Limitador global: 118 solicitudes aceptadas y 7 bloqueadas con 429 durante
  una prueba local controlada; el proceso se reinicio despues para limpiar el
  contador de prueba.
- 556 pruebas de API y 28 pruebas web aprobadas, ademas de typecheck y build.
- Carga paralela: 8 de 8 descargas simultaneas del modelo de 6.4 MB terminaron
  con 200; maximo observado 1.479 s y carga del host 0.00 al terminar.

## Respaldos

- Timer `mapa-ito-backup.timer` activo, ejecucion diaria a partir de las 03:15
  UTC con retraso aleatorio de hasta 30 minutos.
- Conservacion local: 14 dias en `/var/backups/mapa-ito`, modo 0700; archivos
  de respaldo modo 0600.
- Incluye dump de PostgreSQL, uploads, entorno de produccion y Nginx, con
  sumas SHA-256.
- Recuperacion probada en una base temporal: 21 tablas y 78 edificios; la base
  temporal se elimino al finalizar.

## Pendientes que requieren una decision externa

1. Instalar una llave SSH permanente del administrador y despues deshabilitar
   por completo la autenticacion SSH de root mediante contrasena.
2. Incorporar 2FA al panel administrativo o protegerlo con un proveedor de
   identidad.
3. Para WAF/CDN administrado y mitigacion DDoS adicional, usar un dominio propio
   delante de Cloudflare u otro proveedor; el subdominio actual pertenece a
   Tailscale.
4. Copiar los respaldos cifrados a otra maquina o almacenamiento externo. Los
   respaldos locales no cubren una perdida completa del disco del servidor.

## Comprobaciones operativas

```bash
systemctl status mapa-ito nginx postgresql tailscaled fail2ban ufw
systemctl list-timers mapa-ito-backup.timer
fail2ban-client status sshd
ufw status verbose
```
